import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ContextAwareGuard } from '../guards/context-aware.guard';

export const CONTEXT_OPTIONS_KEY = 'security_context_options';

/**
 * Time restriction options
 */
export interface TimeRestriction {
  startHour: number; // 0-23
  endHour: number; // 0-23
  timezone?: string; // e.g., 'UTC', 'America/New_York'
}

/**
 * IP restriction options
 */
export interface IpRestrictions {
  allowedIps?: string[]; // List of allowed IPs
  blockedIps?: string[]; // List of blocked IPs
}

/**
 * Security context options
 */
export interface SecurityContextOptions {
  // Resource ownership
  checkResourceOwnership?: boolean;
  resourceType?: string; // 'WORKSPACE', 'SCAN', 'REPOSITORY', etc.
  resourceIdParam?: string; // Parameter name containing resource ID
  
  // Workspace membership
  checkWorkspaceMembership?: boolean;
  
  // Time-based restrictions
  timeRestriction?: TimeRestriction;
  
  // IP-based restrictions
  ipRestrictions?: IpRestrictions;
  
  // General options
  errorMessage?: string;
  allowSuper?: boolean;
  failClosed?: boolean; // If true, deny access on error; if false, allow access on error
}

/**
 * Decorator for adding security context checks
 * @param options Security context options
 */
export const SecurityContext = (options: SecurityContextOptions) => {
  const securityOptions: SecurityContextOptions = {
    allowSuper: true,
    failClosed: true, // Default to fail closed for security
    ...options,
  };

  return applyDecorators(
    SetMetadata(CONTEXT_OPTIONS_KEY, securityOptions),
    UseGuards(ContextAwareGuard)
  );
};

/**
 * Shorthand decorator for resource ownership check
 * @param resourceType Type of resource to check
 * @param resourceIdParam Name of parameter containing resource ID
 * @param options Additional security options
 */
export const RequiresResourceOwnership = (
  resourceType: string,
  resourceIdParam: string,
  options?: Omit<SecurityContextOptions, 'checkResourceOwnership' | 'resourceType' | 'resourceIdParam'>
) => {
  return SecurityContext({
    checkResourceOwnership: true,
    resourceType,
    resourceIdParam,
    ...options,
  });
};

/**
 * Shorthand decorator for workspace membership check
 * @param options Additional security options
 */
export const RequiresWorkspaceMembership = (
  options?: Omit<SecurityContextOptions, 'checkWorkspaceMembership'>
) => {
  return SecurityContext({
    checkWorkspaceMembership: true,
    ...options,
  });
};

/**
 * Shorthand decorator for time-restricted operations
 * @param startHour Start hour (0-23)
 * @param endHour End hour (0-23)
 * @param timezone Optional timezone
 * @param options Additional security options
 */
export const TimeRestricted = (
  startHour: number,
  endHour: number,
  timezone?: string,
  options?: Omit<SecurityContextOptions, 'timeRestriction'>
) => {
  return SecurityContext({
    timeRestriction: {
      startHour,
      endHour,
      timezone,
    },
    ...options,
  });
};

/**
 * Shorthand decorator for IP-restricted operations
 * @param allowedIps List of allowed IPs
 * @param options Additional security options
 */
export const RestrictToIps = (
  allowedIps: string[],
  options?: Omit<SecurityContextOptions, 'ipRestrictions'>
) => {
  return SecurityContext({
    ipRestrictions: {
      allowedIps,
    },
    ...options,
  });
};

/**
 * Shorthand decorator for blocking specific IPs
 * @param blockedIps List of blocked IPs
 * @param options Additional security options
 */
export const BlockIps = (
  blockedIps: string[],
  options?: Omit<SecurityContextOptions, 'ipRestrictions'>
) => {
  return SecurityContext({
    ipRestrictions: {
      blockedIps,
    },
    ...options,
  });
};
