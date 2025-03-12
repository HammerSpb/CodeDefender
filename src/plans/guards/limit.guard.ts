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
  LIMIT_KEY,
  LIMIT_OPTIONS_KEY,
  LimitOptions,
} from '../decorators/requires-feature.decorator';
import { LimitType, PLAN_UPGRADE_MESSAGES } from '../constants/plan-features';

@Injectable()
export class LimitGuard implements CanActivate {
  private readonly logger = new Logger(LimitGuard.name);

  constructor(
    private reflector: Reflector,
    private plansService: PlansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.getAllAndOverride<LimitType>(
      LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!limitType) {
      return true; // No limit check required
    }

    const options = this.reflector.getAllAndOverride<LimitOptions>(
      LIMIT_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    ) || {};

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user is SUPER user
    if (options.allowSuper) {
      const userRole = await this.getUserRole(userId);
      if (userRole === 'SUPER') {
        return true;
      }
    }

    try {
      // Get workspace ID if specified in options
      let workspaceId: string | undefined = undefined;
      
      if (options.workspaceIdParam) {
        workspaceId = this.extractParamFromRequest(request, options.workspaceIdParam);
      }

      // Check if user is within their limit
      const { allowed, current, limit, percentage } = 
        await this.plansService.checkUsageLimit(userId, limitType, workspaceId);

      if (!allowed) {
        // Generate appropriate error message
        let errorMessage = options.errorMessage;
        
        if (!errorMessage && options.showUpgradePrompt) {
          errorMessage = PLAN_UPGRADE_MESSAGES[limitType] || 
                       `You have reached your limit (${current}/${limit}). Please upgrade your plan.`;
        }
        
        throw new ForbiddenException(
          errorMessage || 
          `Usage limit reached: ${current}/${limit} (${percentage}%)`
        );
      }

      // If within limit, allow access
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error checking usage limits: ${error.message}`, error.stack);
      // Default to allowing in case of error
      return true;
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
