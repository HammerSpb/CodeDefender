import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlansService } from '../plans.service';
import { USAGE_LIMIT_KEY } from '../decorators/check-usage-limit.decorator';
import { LimitType, ResourceType } from '../constants/plan-features';
import { Plan, UserRole } from '@prisma/client';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private plansService: PlansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.getAllAndOverride<string>(
      USAGE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!limitType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // System roles bypass usage limits
    if (user.role === 'SUPER' || user.role === 'SUPPORT') {
      return true;
    }

    const { allowed, current, limit } = await this.plansService.checkUsageLimit(
      user.id,
      limitType as LimitType,
    );

    if (!allowed) {
      const plan = await this.plansService.getUserPlan(user.id);

      throw new ForbiddenException(
        `You've reached your ${limitType} limit (${current}/${limit}) on the ${plan} plan. Please upgrade for higher limits.`,
      );
    }

    // Extract resource type and action for tracking
    const resourceName = context.getClass().name.replace('Controller', '').toUpperCase();
    const action = context.getHandler().name.toUpperCase();

    // Track usage (cast to ResourceType or use a default)
    const resourceType = Object.values(ResourceType).includes(resourceName as ResourceType) 
      ? resourceName as ResourceType 
      : ResourceType.SCAN; // Default to SCAN if not a recognized resource

    // Track usage
    await this.plansService.trackUsage(user.id, resourceType, action);

    return true;
  }
}
