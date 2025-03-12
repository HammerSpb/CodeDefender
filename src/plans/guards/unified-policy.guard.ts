import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { Feature, LimitType, PLAN_UPGRADE_MESSAGES } from '../constants/plan-features';
import { PlansService } from '../plans.service';

export interface PolicyOptions {
  permissionCode?: string;
  requiredFeatures?: Feature[];
  limitType?: LimitType;
  requireAll?: boolean;
  errorMessage?: string;
  showUpgradePrompt?: boolean;
  allowSuper?: boolean;
}

export const POLICY_OPTIONS_KEY = 'policy_options';

@Injectable()
export class UnifiedPolicyGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedPolicyGuard.name);

  constructor(
    private reflector: Reflector,
    private plansService: PlansService,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the policy options
    const options = this.reflector.getAllAndOverride<PolicyOptions>(POLICY_OPTIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no policy options are specified, allow access
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user is SUPER user
    const userRole = await this.getUserRole(userId);
    const isSuper = userRole === 'SUPER';

    // Skip checks for SUPER users if allowed
    if (isSuper && options.allowSuper) {
      return true;
    }

    try {
      // 1. Permission Check
      if (options.permissionCode) {
        // Get workspace ID if it's in the request
        const workspaceId = this.extractWorkspaceId(request);

        // Check permission using both roles and plan
        const [hasRolePermission, hasPlanPermission] = await Promise.all([
          this.permissionsService.userHasPermission(userId, options.permissionCode, workspaceId),
          this.plansService.userHasPermissionInPlan(userId, options.permissionCode),
        ]);

        // Both checks must pass
        if (!hasRolePermission || !hasPlanPermission) {
          // If user has the role permission but not the plan permission, show upgrade message
          if (hasRolePermission && !hasPlanPermission) {
            const userPlan = await this.plansService.getUserPlan(userId);
            const upgradeMessage = this.plansService.getPermissionUpgradeMessage(options.permissionCode, userPlan);

            throw new ForbiddenException(
              upgradeMessage || 'Your current plan does not include this permission. Please upgrade to access it.',
            );
          }

          throw new ForbiddenException(options.errorMessage || 'You do not have permission to perform this action');
        }
      }

      // 2. Feature Check
      if (options.requiredFeatures && options.requiredFeatures.length > 0) {
        const hasFeatures = await this.plansService.userHasFeatures(
          userId,
          options.requiredFeatures,
          options.requireAll,
        );

        if (!hasFeatures) {
          // Generate appropriate error message
          let errorMessage = options.errorMessage;

          if (!errorMessage && options.showUpgradePrompt) {
            // Use first feature's upgrade message if multiple features
            const feature = options.requiredFeatures[0];
            errorMessage =
              PLAN_UPGRADE_MESSAGES[feature] ||
              'Your current plan does not include this feature. Please upgrade to access it.';
          }

          throw new ForbiddenException(errorMessage || 'Feature not available in your plan');
        }
      }

      // 3. Limit Check
      if (options.limitType) {
        // Get workspace ID if it's in the request
        const workspaceId = this.extractWorkspaceId(request);

        // Check if user is within their limit
        const { allowed, current, limit, percentage } = await this.plansService.checkUsageLimit(
          userId,
          options.limitType,
          workspaceId,
        );

        if (!allowed) {
          // Generate appropriate error message
          let errorMessage = options.errorMessage;

          if (!errorMessage && options.showUpgradePrompt) {
            errorMessage =
              PLAN_UPGRADE_MESSAGES[options.limitType] ||
              `You have reached your limit (${current}/${limit}). Please upgrade your plan.`;
          }

          throw new ForbiddenException(errorMessage || `Usage limit reached: ${current}/${limit} (${percentage}%)`);
        }
      }

      // If we made it this far, the user has access
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error in policy check: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get user role directly from database
   */
  private async getUserRole(userId: string): Promise<string | null> {
    try {
      const user = await this.plansService['prisma'].user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract workspace ID from request
   */
  private extractWorkspaceId(request: any): string | undefined {
    // Try to get from route params
    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }

    // Try to get from query params
    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    // Try to get from body
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    return undefined;
  }
}
