import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { FeatureGuard } from '../../plans/guards/feature.guard';
import { LimitGuard } from '../../plans/guards/limit.guard';

/**
 * Unified Policy Guard that combines permission and feature checks
 * Will check both permissions and features, allowing access only if both pass
 */
@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(
    private permissionGuard: PermissionGuard,
    private featureGuard: FeatureGuard,
    private limitGuard: LimitGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // First check permissions
      const hasPermission = await this.permissionGuard.canActivate(context);
      if (!hasPermission) {
        return false;
      }

      // Then check features
      const hasFeature = await this.featureGuard.canActivate(context);
      if (!hasFeature) {
        return false;
      }

      // Finally check limits
      const withinLimits = await this.limitGuard.canActivate(context);
      return withinLimits;
    } catch (error) {
      // Let the exception propagate up for proper error handling
      throw error;
    }
  }
}
