import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlansService } from '../plans.service';
import { PLAN_PERMISSION_KEY } from '../decorators/requires-plan-permission.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class PlanPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private plansService: PlansService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PLAN_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // System roles bypass plan restrictions
    if (user.role === 'SUPER' || user.role === 'SUPPORT') {
      return true;
    }

    // Check if the user's plan allows this feature (convert string to Feature enum)
    const planAllows = await this.plansService.userHasFeature(
      user.id,
      requiredPermission as any,  // Convert string to Feature enum
    );

    if (!planAllows) {
      // Get user's current plan
      const plan = await this.plansService.getUserPlan(user.id);
      
      throw new ForbiddenException(
        `Your current plan (${plan}) does not include this feature. Please upgrade to access ${requiredPermission}.`,
      );
    }

    return true;
  }
}
