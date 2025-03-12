import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Feature, LimitType } from '../../plans/constants/plan-features';
import { UnifiedAuthGuard } from '../guards/unified-auth.guard';
import { SecurityContextOptions, CONTEXT_OPTIONS_KEY } from './security-context.decorator';
import { PermissionOptions, PERMISSION_KEY, PERMISSION_OPTIONS_KEY } from './requires-permission.decorator';
import { POLICY_OPTIONS_KEY, PolicyOptions } from '../../plans/types/policy-types';

/**
 * Unified authorization options
 */
export interface UnifiedAuthOptions {
  // Permission options
  permissions?: string[];
  requireAllPermissions?: boolean;
  
  // Plan-based policy options
  permissionCode?: string;
  features?: Feature[];
  requireAllFeatures?: boolean;
  limitType?: LimitType;
  
  // Security context options
  checkResourceOwnership?: boolean;
  resourceType?: string;
  resourceIdParam?: string;
  checkWorkspaceMembership?: boolean;
  
  // Time-based restrictions
  timeRestriction?: {
    startHour: number;
    endHour: number;
    timezone?: string;
  };
  
  // IP-based restrictions
  ipRestrictions?: {
    allowedIps?: string[];
    blockedIps?: string[];
  };
  
  // General options
  errorMessage?: string;
  allowSuper?: boolean;
  failClosed?: boolean;
}

/**
 * Unified authorization decorator that combines permissions, plan features, and security context
 * @param options Authorization options
 */
export const Authorize = (options: UnifiedAuthOptions) => {
  const decorators = [UseGuards(UnifiedAuthGuard)];
  
  // Set up permission metadata if needed
  if (options.permissions && options.permissions.length > 0) {
    const permissionOptions: PermissionOptions = {
      requireAll: options.requireAllPermissions ?? false,
      allowSuper: options.allowSuper ?? true,
      errorMessage: options.errorMessage,
    };
    
    decorators.push(SetMetadata(PERMISSION_KEY, options.permissions));
    decorators.push(SetMetadata(PERMISSION_OPTIONS_KEY, permissionOptions));
  }
  
  // Set up plan policy metadata if needed
  if (options.permissionCode || options.features || options.limitType) {
    const policyOptions: PolicyOptions = {
      permissionCode: options.permissionCode,
      requiredFeatures: options.features,
      requireAll: options.requireAllFeatures,
      limitType: options.limitType,
      allowSuper: options.allowSuper ?? true,
      errorMessage: options.errorMessage,
    };
    
    decorators.push(SetMetadata(POLICY_OPTIONS_KEY, policyOptions));
  }
  
  // Set up security context metadata if needed
  if (
    options.checkResourceOwnership || 
    options.checkWorkspaceMembership || 
    options.timeRestriction || 
    options.ipRestrictions
  ) {
    const securityOptions: SecurityContextOptions = {
      checkResourceOwnership: options.checkResourceOwnership,
      resourceType: options.resourceType,
      resourceIdParam: options.resourceIdParam,
      checkWorkspaceMembership: options.checkWorkspaceMembership,
      timeRestriction: options.timeRestriction,
      ipRestrictions: options.ipRestrictions,
      allowSuper: options.allowSuper ?? true,
      failClosed: options.failClosed ?? true,
      errorMessage: options.errorMessage,
    };
    
    decorators.push(SetMetadata(CONTEXT_OPTIONS_KEY, securityOptions));
  }
  
  return applyDecorators(...decorators);
};

/**
 * Shorthand decorator for general resource authorization
 * Checks permissions, plan features, and resource ownership in one decorator
 */
export const AuthorizeResource = (
  resourceType: string,
  resourceIdParam: string,
  permissions: string[],
  features?: Feature[],
  options?: Omit<UnifiedAuthOptions, 'resourceType' | 'resourceIdParam' | 'permissions' | 'features' | 'checkResourceOwnership'>
) => {
  return Authorize({
    resourceType,
    resourceIdParam,
    permissions,
    features,
    checkResourceOwnership: true,
    ...options,
  });
};

/**
 * Shorthand decorator for workspace operations
 * Checks workspace permissions and membership
 */
export const AuthorizeWorkspace = (
  permissions: string[],
  features?: Feature[],
  options?: Omit<UnifiedAuthOptions, 'permissions' | 'features' | 'checkWorkspaceMembership'>
) => {
  return Authorize({
    permissions,
    features,
    checkWorkspaceMembership: true,
    ...options,
  });
};

/**
 * Shorthand decorator for admin operations
 * Typically used for operations that should only be available to admins during business hours
 */
export const AuthorizeAdmin = (
  permissions: string[],
  options?: Omit<UnifiedAuthOptions, 'permissions' | 'timeRestriction'>
) => {
  return Authorize({
    permissions,
    timeRestriction: {
      startHour: 9,
      endHour: 17,
      timezone: 'UTC',
    },
    ...options,
  });
};

/**
 * Shorthand decorator for API operations
 * Checks API access feature and permissions
 */
export const AuthorizeApi = (
  permissions: string[],
  options?: Omit<UnifiedAuthOptions, 'permissions' | 'features'>
) => {
  return Authorize({
    permissions,
    features: [Feature.API_ACCESS],
    ...options,
  });
};
