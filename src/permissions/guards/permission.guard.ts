import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { 
  PERMISSION_KEY, 
  PERMISSION_OPTIONS_KEY, 
  PermissionOptions 
} from '../decorators/requires-permission.decorator';
import { 
  extractGuardContext, 
  getOptions, 
  handleGuardResult 
} from '../../common/utils/guard.utils';
import { extractResourceId } from '../../common/utils/request.utils';

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

    // Get options with defaults
    const options = getOptions<PermissionOptions>(
      this.reflector,
      context,
      PERMISSION_OPTIONS_KEY,
      { 
        requireAll: false, 
        allowSuper: true, 
        requireWorkspace: false 
      }
    );

    // Extract context data
    const { 
      userId, 
      workspaceId, 
      isSuper 
    } = await extractGuardContext(
      context, 
      this.permissionsService['prisma'], 
      {
        allowSuper: options.allowSuper,
        requireWorkspace: options.requireWorkspace,
        workspaceIdParam: 'workspaceId'
      }
    );

    // Short-circuit for super users if allowed
    if (options.allowSuper && isSuper) {
      return true;
    }

    // Check permissions based on requireAll option
    if (options.requireAll) {
      // AND logic - all permissions must be satisfied
      const hasAllPermissions = await this.permissionsService.userHasAllPermissions(
        userId,
        requiredPermissions,
        workspaceId,
      );

      handleGuardResult(
        hasAllPermissions,
        `You need all required permissions to perform this action: ${requiredPermissions.join(', ')}`,
        options
      );

      return true;
    } else {
      // OR logic - any permission is sufficient
      const hasAnyPermission = await this.permissionsService.userHasAnyPermission(
        userId,
        requiredPermissions,
        workspaceId,
      );

      handleGuardResult(
        hasAnyPermission,
        `You need at least one of these permissions to perform this action: ${requiredPermissions.join(', ')}`,
        options
      );

      return true;
    }
  }
}
