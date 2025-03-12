import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PlansService } from '@/plans/plans.service';
import { UsageService } from '@/plans/usage.service';
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { Plan } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private plansService: PlansService,
    private auditLogsService: AuditLogsService,
    private configService: ConfigService,
  ) {}

  /**
   * Get details of a user's current plan
   * @param userId User ID
   */
  async getUserPlanDetails(userId: string) {
    return this.plansService.getUserPlanDetails(userId);
  }

  /**
   * Update a user's plan
   * @param userId User ID
   * @param plan New plan
   * @param requesterId ID of the user making the request (for auditing)
   */
  async updateUserPlan(userId: string, plan: Plan, requesterId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if requester is authorized to update plan
    // Only SUPER users can change plans, or the user can upgrade their own plan
    if (requesterId !== userId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
      });

      if (!requester || requester.role !== 'SUPER') {
        throw new ForbiddenException('Only administrators can change other users\' plans');
      }
    }

    // Check if plan is valid
    if (!Object.values(Plan).includes(plan)) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    try {
      // Update user's plan
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { plan },
        select: {
          id: true,
          email: true,
          plan: true,
        },
      });

      // Clear plan cache
      await this.plansService.clearUserPlanCache(userId);

      // Log the plan update
      await this.auditLogsService.create({
        userId: requesterId,
        action: 'UPDATE_PLAN',
        details: {
          targetUserId: userId,
          oldPlan: user.plan,
          newPlan: plan,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        message: 'Plan updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Error updating plan: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update plan');
    }
  }

  /**
   * Get available billing plans with features
   */
  async getAvailablePlans() {
    const plans = Object.values(Plan).map(planType => {
      const planDetails = this.plansService['PLANS'][planType];
      return {
        type: planType,
        name: this.getPlanDisplayName(planType),
        description: this.getPlanDescription(planType),
        price: this.getPlanPrice(planType),
        features: planDetails,
        limits: planDetails.limits,
      };
    });

    return {
      plans,
      currentPlanPrices: {
        [Plan.STARTER]: this.getPlanPrice(Plan.STARTER),
        [Plan.PRO]: this.getPlanPrice(Plan.PRO),
        [Plan.BUSINESS]: this.getPlanPrice(Plan.BUSINESS),
        [Plan.ENTERPRISE]: this.getPlanPrice(Plan.ENTERPRISE),
      },
    };
  }

  /**
   * Compare features between plans
   * @param planA First plan to compare
   * @param planB Second plan to compare
   */
  async comparePlans(planA: Plan, planB: Plan) {
    const planADetails = this.plansService['PLANS'][planA];
    const planBDetails = this.plansService['PLANS'][planB];

    // Get unique features from both plans
    const allFeatures = new Set([
      ...Object.keys(planADetails),
      ...Object.keys(planBDetails),
    ]);

    // Create comparison object
    const comparison = {};
    
    allFeatures.forEach(feature => {
      if (feature === 'limits') {
        // Handle limits separately
        comparison['limits'] = {};
        
        const allLimits = new Set([
          ...Object.keys(planADetails.limits || {}),
          ...Object.keys(planBDetails.limits || {}),
        ]);
        
        allLimits.forEach(limit => {
          comparison['limits'][limit] = {
            [planA]: planADetails.limits?.[limit] || 0,
            [planB]: planBDetails.limits?.[limit] || 0,
            difference: (planBDetails.limits?.[limit] || 0) - (planADetails.limits?.[limit] || 0),
          };
        });
      } else if (feature !== 'name' && feature !== 'description') {
        // Compare regular features
        comparison[feature] = {
          [planA]: planADetails[feature] || false,
          [planB]: planBDetails[feature] || false,
        };
      }
    });

    return {
      planA: {
        type: planA,
        name: this.getPlanDisplayName(planA),
        price: this.getPlanPrice(planA),
      },
      planB: {
        type: planB,
        name: this.getPlanDisplayName(planB),
        price: this.getPlanPrice(planB),
      },
      comparison,
    };
  }

  /**
   * Get price for a plan
   * @private
   */
  private getPlanPrice(plan: Plan): number {
    // Get prices from config service or use defaults
    const priceMap = {
      [Plan.STARTER]: Number(this.configService.get('PLAN_PRICE_STARTER', 0)),
      [Plan.PRO]: Number(this.configService.get('PLAN_PRICE_PRO', 49)),
      [Plan.BUSINESS]: Number(this.configService.get('PLAN_PRICE_BUSINESS', 99)),
      [Plan.ENTERPRISE]: Number(this.configService.get('PLAN_PRICE_ENTERPRISE', 299)),
    };

    return priceMap[plan] || 0;
  }

  /**
   * Get display name for a plan
   * @private
   */
  private getPlanDisplayName(plan: Plan): string {
    const nameMap = {
      [Plan.STARTER]: 'Starter',
      [Plan.PRO]: 'Professional',
      [Plan.BUSINESS]: 'Business',
      [Plan.ENTERPRISE]: 'Enterprise',
    };

    return nameMap[plan] || plan;
  }

  /**
   * Get description for a plan
   * @private
   */
  private getPlanDescription(plan: Plan): string {
    const descriptionMap = {
      [Plan.STARTER]: 'Basic security scanning for individual developers',
      [Plan.PRO]: 'Advanced security features for professional teams',
      [Plan.BUSINESS]: 'Comprehensive security platform for businesses',
      [Plan.ENTERPRISE]: 'Full-featured security platform with custom support',
    };

    return descriptionMap[plan] || '';
  }
}
