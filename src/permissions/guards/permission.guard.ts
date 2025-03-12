import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { 
  PERMISSION_KEY, 
  PERMISSION_OPTIONS_KEY, 
  PermissionOptions 
} from '../decorators/requires-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const options = this.reflector.getAllAndOverride<PermissionOptions>(
      PERMISSION_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    ) || {};

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract workspaceId from request parameters, body, or query
    const workspaceId = this.extractWorkspaceId(request);

    // Check if workspace is required but not provided
    if (options.requireWorkspace && !workspaceId) {
      throw new ForbiddenException('Workspace ID is required for this operation');
    }

    // Check if user is SUPER and if we should short-circuit for super users
    if (options.allowSuper) {
      const userRole = await this.getUserRole(userId);
      if (userRole === 'SUPER') {
        return true;
      }
    }

    // Check permissions based on requireAll option
    if (options.requireAll) {
      // AND logic - all permissions must be satisfied
      const hasAllPermissions = await this.permissionsService.userHasAllPermissions(
        userId,
        requiredPermissions,
        workspaceId,
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          options.errorMessage || 
          `You need all required permissions to perform this action: ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    } else {
      // OR logic - any permission is sufficient
      const hasAnyPermission = await this.permissionsService.userHasAnyPermission(
        userId,
        requiredPermissions,
        workspaceId,
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          options.errorMessage || 
          `You need at least one of these permissions to perform this action: ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    }
  }

  /**
   * Extract workspace ID from request
   */
  private extractWorkspaceId(request: any): string | undefined {
    // Try to get from params (URL parameters)
    const paramsWorkspaceId = request.params?.workspace_id || request.params?.workspaceId;
    if (paramsWorkspaceId) return paramsWorkspaceId;
    
    // Try to get from body
    const bodyWorkspaceId = request.body?.workspace_id || request.body?.workspaceId;
    if (bodyWorkspaceId) return bodyWorkspaceId;
    
    // Try to get from query parameters
    const queryWorkspaceId = request.query?.workspace_id || request.query?.workspaceId;
    if (queryWorkspaceId) return queryWorkspaceId;
    
    return undefined;
  }
  
  /**
   * Get user role directly from database
   */
  private async getUserRole(userId: string): Promise<string | null> {
    try {
      const user = await this.permissionsService['prisma'].user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role || null;
    } catch (error) {
      return null;
    }
  }
}
