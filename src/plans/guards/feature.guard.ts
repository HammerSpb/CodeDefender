import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlansService } from '../plans.service';
import {
  FEATURE_KEY,
  FEATURE_OPTIONS_KEY,
  FeatureOptions,
  LIMIT_KEY,
  LIMIT_OPTIONS_KEY,
  LimitOptions,
} from '../decorators/requires-feature.decorator';
import { Feature, PLAN_UPGRADE_MESSAGES, LimitType } from '../constants/plan-features';

@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);

  constructor(
    private reflector: Reflector,
    private plansService: PlansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<Feature[]>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limitCheck = this.reflector.getAllAndOverride<LimitType>(
      LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If neither features nor limits are specified, allow access
    if ((!requiredFeatures || requiredFeatures.length === 0) && !limitCheck) {
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

    // Handle feature check if required
    if (requiredFeatures && requiredFeatures.length > 0) {
      const options = this.reflector.getAllAndOverride<FeatureOptions>(
        FEATURE_OPTIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) || {};

      // Skip check for SUPER users if allowed
      if (isSuper && options.allowSuper) {
        // Continue to limit check if needed
      } else {
        try {
          // Check if user's plan has the required features
          const hasFeatures = await this.plansService.userHasFeatures(
            userId,
            requiredFeatures,
            options.requireAll,
          );

          if (!hasFeatures) {
            // Generate appropriate error message
            let errorMessage = options.errorMessage;
            
            if (!errorMessage && options.showUpgradePrompt) {
              // Use first feature's upgrade message if multiple features
              const feature = requiredFeatures[0];
              errorMessage = PLAN_UPGRADE_MESSAGES[feature] || 
                          'Your current plan does not include this feature. Please upgrade to access it.';
            }
            
            throw new ForbiddenException(errorMessage || 'Feature not available in your plan');
          }
        } catch (error) {
          if (error instanceof ForbiddenException) {
            throw error;
          }
          
          this.logger.error(`Error checking plan features: ${error.message}`, error.stack);
          return false;
        }
      }
    }

    // Handle limit check if required
    if (limitCheck) {
      const options = this.reflector.getAllAndOverride<LimitOptions>(
        LIMIT_OPTIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) || {};

      // Skip check for SUPER users if allowed
      if (isSuper && options.allowSuper) {
        return true;
      }

      try {
        // Get workspace ID if specified in options
        let workspaceId: string | undefined = undefined;
        
        if (options.workspaceIdParam) {
          workspaceId = this.extractParamFromRequest(request, options.workspaceIdParam);
        }

        // Check if user is within their limit
        const { allowed, current, limit, percentage } = 
          await this.plansService.checkUsageLimit(userId, limitCheck, workspaceId);

        if (!allowed) {
          // Generate appropriate error message
          let errorMessage = options.errorMessage;
          
          if (!errorMessage && options.showUpgradePrompt) {
            errorMessage = PLAN_UPGRADE_MESSAGES[limitCheck] || 
                         `You have reached your limit (${current}/${limit}). Please upgrade your plan.`;
          }
          
          throw new ForbiddenException(
            errorMessage || 
            `Usage limit reached: ${current}/${limit} (${percentage}%)`
          );
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        
        this.logger.error(`Error checking usage limits: ${error.message}`, error.stack);
        // Default to allowing in case of error
        return true;
      }
    }

    // If we made it this far, the user has access
    return true;
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
   * Extract parameter from request (params, query, or body)
   */
  private extractParamFromRequest(request: any, paramName: string): string | undefined {
    // Try to get from route params
    if (request.params && request.params[paramName]) {
      return request.params[paramName];
    }
    
    // Try to get from query params
    if (request.query && request.query[paramName]) {
      return request.query[paramName];
    }
    
    // Try to get from body
    if (request.body && request.body[paramName]) {
      return request.body[paramName];
    }
    
    return undefined;
  }
}
