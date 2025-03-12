import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CONTEXT_OPTIONS_KEY, 
  SecurityContextOptions,
} from '../decorators/security-context.decorator';

@Injectable()
export class ContextAwareGuard implements CanActivate {
  private readonly logger = new Logger(ContextAwareGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get security context options
    const options = this.reflector.getAllAndOverride<SecurityContextOptions>(
      CONTEXT_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true; // No context options, allow access
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Check if user is SUPER and should bypass checks
      if (options.allowSuper) {
        const userRole = await this.getUserRole(userId);
        if (userRole === 'SUPER') {
          return true;
        }
      }

      // Perform context-specific checks
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

      // All checks passed
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Error during context security check: ${error.message}`, error.stack);
      
      if (options.failClosed) {
        // Fail closed for security-critical operations
        throw new ForbiddenException('Security check failed');
      } else {
        // Fail open for non-critical operations
        return true;
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
   * Get user role directly from database
   */
  private async getUserRole(userId: string): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role || null;
    } catch (error) {
      return null;
    }
  }
}
