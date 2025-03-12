import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PlansService } from '../../plans/plans.service';
import { PrismaService } from '../../prisma/prisma.service';

import { PERMISSION_KEY, PERMISSION_OPTIONS_KEY, PermissionOptions } from '../decorators/requires-permission.decorator';
import { CONTEXT_OPTIONS_KEY, SecurityContextOptions } from '../decorators/security-context.decorator';
import { POLICY_OPTIONS_KEY, PolicyOptions } from '../../plans/types/policy-types';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => PermissionsService))
    private permissionsService: PermissionsService,
    @Inject(forwardRef(() => PlansService))
    private plansService: PlansService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get all security metadata
    const permissionOptions = this.reflector.getAllAndOverride<PermissionOptions>(
      PERMISSION_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const securityContextOptions = this.reflector.getAllAndOverride<SecurityContextOptions>(
      CONTEXT_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const policyOptions = this.reflector.getAllAndOverride<PolicyOptions>(
      POLICY_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no security metadata is defined, allow access
    if (!requiredPermissions && !securityContextOptions && !policyOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Check if user is SUPER and should bypass checks
      const isSuper = await this.isSuperUser(userId);
      const allowSuper = this.shouldAllowSuper(permissionOptions, securityContextOptions, policyOptions);

      if (isSuper && allowSuper) {
        return true;
      }

      // Extract workspace context
      const workspaceId = this.extractWorkspaceId(request);

      // 1. Check permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        await this.checkPermissions(userId, requiredPermissions, workspaceId, permissionOptions, context);
      }

      // 2. Check plan-based policy
      if (policyOptions) {
        await this.checkPlanPolicy(userId, policyOptions, workspaceId, context);
      }

      // 3. Check security context
      if (securityContextOptions) {
        await this.checkSecurityContext(userId, securityContextOptions, request, context);
      }

      // All checks passed
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Error during unified authorization check: ${error.message}`, error.stack);
      throw new ForbiddenException('Authorization check failed');
    }
  }

  /**
   * Check if user has required permissions
   */
  private async checkPermissions(
    userId: string,
    requiredPermissions: string[],
    workspaceId: string | undefined,
    options: PermissionOptions | undefined,
    context: ExecutionContext,
  ): Promise<void> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return; // No permissions to check
    }

    const requireAll = options?.requireAll ?? false;

    if (requireAll) {
      // AND logic - all permissions must be satisfied
      const hasAllPermissions = await this.permissionsService.userHasAllPermissions(
        userId,
        requiredPermissions,
        workspaceId,
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          options?.errorMessage || 
          `You need all required permissions to perform this action: ${requiredPermissions.join(', ')}`,
        );
      }
    } else {
      // OR logic - any permission is sufficient
      const hasAnyPermission = await this.permissionsService.userHasAnyPermission(
        userId,
        requiredPermissions,
        workspaceId,
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          options?.errorMessage || 
          `You need at least one of these permissions to perform this action: ${requiredPermissions.join(', ')}`,
        );
      }
    }
  }

  /**
   * Check plan-based policy
   */
  private async checkPlanPolicy(
    userId: string,
    options: PolicyOptions,
    workspaceId: string | undefined,
    context: ExecutionContext,
  ): Promise<void> {
    // Check permission if specified
    if (options.permissionCode) {
      const [hasRolePermission, hasPlanPermission] = await Promise.all([
        this.permissionsService.userHasPermission(userId, options.permissionCode, workspaceId),
        this.plansService.userHasPermissionInPlan(userId, options.permissionCode),
      ]);

      // Both checks must pass
      if (!hasRolePermission || !hasPlanPermission) {
        // If user has the role permission but not the plan permission, show upgrade message
        if (hasRolePermission && !hasPlanPermission) {
          const userPlan = await this.plansService.getUserPlan(userId);
          const upgradeMessage = this.plansService.getPermissionUpgradeMessage(
            options.permissionCode, 
            userPlan
          );
          
          throw new ForbiddenException(
            upgradeMessage || 'Your current plan does not include this permission. Please upgrade to access it.'
          );
        }
        
        throw new ForbiddenException(
          options.errorMessage || 'You do not have permission to perform this action'
        );
      }
    }

    // Check features if specified
    if (options.requiredFeatures && options.requiredFeatures.length > 0) {
      const hasFeatures = await this.plansService.userHasFeatures(
        userId,
        options.requiredFeatures,
        options.requireAll,
      );

      if (!hasFeatures) {
        throw new ForbiddenException(
          options.errorMessage || 'Feature not available in your plan'
        );
      }
    }

    // Check limits if specified
    if (options.limitType) {
      const { allowed, current, limit } = await this.plansService.checkUsageLimit(
        userId,
        options.limitType,
        workspaceId,
      );

      if (!allowed) {
        throw new ForbiddenException(
          options.errorMessage || 
          `Usage limit reached: ${current}/${limit}. Please upgrade your plan for higher limits.`
        );
      }
    }
  }

  /**
   * Check security context constraints
   */
  private async checkSecurityContext(
    userId: string,
    options: SecurityContextOptions,
    request: any,
    context: ExecutionContext,
  ): Promise<void> {
    // Check resource ownership
    if (options.checkResourceOwnership) {
      const resourceId = this.extractResourceId(request, options);
      const resourceType = options.resourceType;
      
      if (!resourceId || !resourceType) {
        throw new ForbiddenException('Resource information missing for ownership check');
      }
      
      const isOwner = await this.checkResourceOwnership(userId, resourceType, resourceId);
      if (!isOwner) {
        throw new ForbiddenException(
          options.errorMessage || 
          `You don't have ownership permissions for this ${resourceType.toLowerCase()}`
        );
      }
    }

    // Check workspace membership
    if (options.checkWorkspaceMembership) {
      const workspaceId = this.extractWorkspaceId(request);
      
      if (!workspaceId) {
        throw new ForbiddenException('Workspace ID missing for membership check');
      }
      
      const isMember = await this.checkWorkspaceMembership(userId, workspaceId);
      if (!isMember) {
        throw new ForbiddenException(
          options.errorMessage || 
          'You are not a member of this workspace'
        );
      }
    }

    // Check time-based restrictions
    if (options.timeRestriction) {
      const { startHour, endHour, timezone } = options.timeRestriction;
      const isWithinTimeWindow = this.checkTimeRestriction(startHour, endHour, timezone);
      
      if (!isWithinTimeWindow) {
        throw new ForbiddenException(
          options.errorMessage || 
          `This operation is only available between ${startHour}:00 and ${endHour}:00 ${timezone || ''}`
        );
      }
    }

    // Check IP restrictions
    if (options.ipRestrictions) {
      const clientIp = request.ip || request.headers['x-forwarded-for'];
      const isAllowed = this.checkIpRestriction(clientIp, options.ipRestrictions);
      
      if (!isAllowed) {
        throw new ForbiddenException(
          options.errorMessage || 
          'Your current IP address is not allowed to perform this operation'
        );
      }
    }
  }

  /**
   * Extract resource ID from request
   */
  private extractResourceId(request: any, options: SecurityContextOptions): string | undefined {
    const { resourceIdParam } = options;
    
    if (!resourceIdParam) {
      return undefined;
    }
    
    // Try to get from URL parameters
    if (request.params && (request.params[resourceIdParam] || request.params[`${resourceIdParam}_id`])) {
      return request.params[resourceIdParam] || request.params[`${resourceIdParam}_id`];
    }
    
    // Try to get from body
    if (request.body && (request.body[resourceIdParam] || request.body[`${resourceIdParam}_id`])) {
      return request.body[resourceIdParam] || request.body[`${resourceIdParam}_id`];
    }
    
    // Try to get from query parameters
    if (request.query && (request.query[resourceIdParam] || request.query[`${resourceIdParam}_id`])) {
      return request.query[resourceIdParam] || request.query[`${resourceIdParam}_id`];
    }
    
    return undefined;
  }

  /**
   * Extract workspace ID from request
   */
  private extractWorkspaceId(request: any): string | undefined {
    // Try to get from URL parameters
    if (request.params && (request.params.workspace_id || request.params.workspaceId)) {
      return request.params.workspace_id || request.params.workspaceId;
    }
    
    // Try to get from body
    if (request.body && (request.body.workspace_id || request.body.workspaceId)) {
      return request.body.workspace_id || request.body.workspaceId;
    }
    
    // Try to get from query parameters
    if (request.query && (request.query.workspace_id || request.query.workspaceId)) {
      return request.query.workspace_id || request.query.workspaceId;
    }
    
    return undefined;
  }

  /**
   * Check if a user owns a specific resource
   */
  private async checkResourceOwnership(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    try {
      switch (resourceType.toUpperCase()) {
        case 'WORKSPACE':
          const workspace = await this.prisma.workspace.findUnique({
            where: { id: resourceId },
            select: { ownerId: true },
          });
          return workspace?.ownerId === userId;
          
        case 'SCAN':
          const scan = await this.prisma.scan.findUnique({
            where: { id: resourceId },
            include: { workspace: true },
          });
          return scan?.workspace.ownerId === userId;
          
        case 'REPOSITORY':
          const repository = await this.prisma.repository.findUnique({
            where: { id: resourceId },
            select: { ownerId: true },
          });
          return repository?.ownerId === userId;
          
        case 'SCHEDULE':
          const schedule = await this.prisma.schedule.findUnique({
            where: { id: resourceId },
            include: { workspace: true },
          });
          return schedule?.workspace.ownerId === userId;
          
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking resource ownership: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check if a user is a member of a workspace
   */
  private async checkWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    try {
      // Check if user is the workspace owner
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { ownerId: true },
      });
      
      if (workspace?.ownerId === userId) {
        return true;
      }
      
      // Check if user is a member of the workspace
      const userWorkspace = await this.prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });
      
      return !!userWorkspace;
    } catch (error) {
      this.logger.error(`Error checking workspace membership: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check if operation is within allowed time window
   */
  private checkTimeRestriction(
    startHour: number,
    endHour: number,
    timezone?: string,
  ): boolean {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Simple hour-based check
      if (startHour <= endHour) {
        // Normal time window (e.g., 9-17)
        return currentHour >= startHour && currentHour < endHour;
      } else {
        // Overnight time window (e.g., 22-6)
        return currentHour >= startHour || currentHour < endHour;
      }
    } catch (error) {
      this.logger.error(`Error checking time restriction: ${error.message}`, error.stack);
      return true; // Fail open for time checks
    }
  }

  /**
   * Check if IP is allowed
   */
  private checkIpRestriction(
    clientIp: string,
    restrictions: { allowedIps?: string[]; blockedIps?: string[] },
  ): boolean {
    if (!clientIp) {
      return true; // Cannot determine IP, fail open
    }
    
    try {
      const { allowedIps, blockedIps } = restrictions;
      
      // If IP is in blocked list, deny access
      if (blockedIps && blockedIps.length > 0) {
        if (blockedIps.includes(clientIp)) {
          return false;
        }
      }
      
      // If allowed list exists and IP is not in it, deny access
      if (allowedIps && allowedIps.length > 0) {
        return allowedIps.includes(clientIp);
      }
      
      // No specific restrictions
      return true;
    } catch (error) {
      this.logger.error(`Error checking IP restriction: ${error.message}`, error.stack);
      return false; // Fail closed for IP checks
    }
  }

  /**
   * Check if user is a SUPER user
   */
  private async isSuperUser(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role === 'SUPER';
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine if SUPER users should bypass checks
   */
  private shouldAllowSuper(
    permissionOptions?: PermissionOptions,
    securityContextOptions?: SecurityContextOptions,
    policyOptions?: PolicyOptions,
  ): boolean {
    // Default to true if not specified otherwise
    if (permissionOptions?.allowSuper === false) {
      return false;
    }
    
    if (securityContextOptions?.allowSuper === false) {
      return false;
    }
    
    if (policyOptions?.allowSuper === false) {
      return false;
    }
    
    return true;
  }
}
