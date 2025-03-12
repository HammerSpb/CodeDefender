import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { 
  PLANS, 
  Feature, 
  ResourceType, 
  LimitType, 
  PLAN_FEATURES, 
  PLAN_LIMITS 
} from './constants/plan-features';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check if a plan has a specific feature
   * @param plan User's plan
   * @param feature Feature to check
   */
  planHasFeature(plan: Plan, feature: Feature): boolean {
    return PLAN_FEATURES[plan]?.[feature] || false;
  }

  /**
   * Get a user's current plan
   * @param userId User ID
   */
  async getUserPlan(userId: string): Promise<Plan> {
    const cacheKey = `user-plan:${userId}`;
    const cachedPlan = await this.cacheManager.get<Plan>(cacheKey);
    
    if (cachedPlan) {
      return cachedPlan;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = user?.plan || Plan.STARTER;
    await this.cacheManager.set(cacheKey, plan, this.CACHE_TTL);
    return plan;
  }

  /**
   * Check if a user's plan includes a specific feature
   * @param userId User ID
   * @param feature Feature to check
   */
  async userHasFeature(userId: string, feature: Feature): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return this.planHasFeature(plan, feature);
  }

  /**
   * Check if a user has multiple features
   * @param userId User ID
   * @param features Features to check
   * @param requireAll If true, all features must be available
   */
  async userHasFeatures(
    userId: string, 
    features: Feature[], 
    requireAll = true
  ): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    
    if (requireAll) {
      // All features must be available
      return features.every(feature => this.planHasFeature(plan, feature));
    } else {
      // At least one feature must be available
      return features.some(feature => this.planHasFeature(plan, feature));
    }
  }

  /**
   * Check if a user has reached a specific limit
   * @param userId User ID 
   * @param limitType Type of limit to check
   * @param workspaceId Optional workspace context for certain limits
   */
  async checkUsageLimit(
    userId: string,
    limitType: LimitType,
    workspaceId?: string,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = PLAN_LIMITS[plan];
      const limit = limits[limitType];

      // Calculate current usage based on the limit type
      const current = await this.getCurrentUsage(userId, limitType, workspaceId);
      
      // Calculate percentage used
      const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;

      return {
        allowed: current < limit,
        current,
        limit,
        percentage,
      };
    } catch (error) {
      this.logger.error(`Error checking usage limit: ${error.message}`, error.stack);
      // Default to allowing in case of error, but log it
      return {
        allowed: true,
        current: 0,
        limit: 0,
        percentage: 0,
      };
    }
  }

  /**
   * Track usage of a feature or resource
   * @param userId User ID
   * @param resourceType Type of resource being used
   * @param action Action being performed
   * @param count Optional count (default: 1)
   */
  async trackUsage(
    userId: string,
    resourceType: ResourceType,
    action: string,
    count = 1,
  ): Promise<void> {
    try {
      // Create or update a usage log
      await this.prisma.usageLog.create({
        data: {
          userId,
          resourceType,
          action,
          count,
        },
      });
    } catch (error) {
      this.logger.error(`Error tracking usage: ${error.message}`, error.stack);
    }
  }

  /**
   * Get the complete plan details for a user
   * @param userId User ID
   */
  async getUserPlanDetails(userId: string): Promise<{
    plan: Plan;
    features: Record<string, boolean>;
    limits: Record<string, number>;
    usage: Record<string, { current: number; limit: number; percentage: number }>;
  }> {
    const plan = await this.getUserPlan(userId);
    const planDefinition = PLANS[plan];
    
    // Get actual usage for each limit type
    const usagePromises = Object.keys(PLAN_LIMITS[plan]).map(async limitKey => {
      const limitType = limitKey as LimitType;
      const { current, limit, percentage } = await this.checkUsageLimit(userId, limitType);
      return { limitType, current, limit, percentage };
    });
    
    const usageResults = await Promise.all(usagePromises);
    
    // Convert to object
    const usageObject = usageResults.reduce((acc, { limitType, current, limit, percentage }) => {
      acc[limitType] = { current, limit, percentage };
      return acc;
    }, {} as Record<string, { current: number; limit: number; percentage: number }>);
    
    return {
      plan,
      features: planDefinition as unknown as Record<string, boolean>,
      limits: planDefinition.limits as unknown as Record<string, number>,
      usage: usageObject,
    };
  }

  /**
   * Get current usage for a specific limit type
   * @private
   */
  private async getCurrentUsage(
    userId: string, 
    limitType: LimitType, 
    workspaceId?: string
  ): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (limitType) {
      case LimitType.SCANS_PER_DAY:
        return this.prisma.scan.count({
          where: {
            workspace: {
              ownerId: userId,
            },
            createdAt: { gte: startOfDay },
          },
        });

      case LimitType.SCANS_PER_MONTH:
        return this.prisma.scan.count({
          where: {
            workspace: {
              ownerId: userId,
            },
            createdAt: { gte: startOfMonth },
          },
        });

      case LimitType.MAX_WORKSPACES:
        return this.prisma.workspace.count({
          where: {
            ownerId: userId,
          },
        });

      case LimitType.MAX_REPOSITORIES:
        return this.prisma.repository.count({
          where: {
            ownerId: userId,
          },
        });

      case LimitType.USERS_PER_WORKSPACE: {
        if (workspaceId) {
          // Count users in specific workspace
          return this.prisma.userWorkspace.count({
            where: {
              workspaceId,
            },
          });
        } else {
          // Count max users across all workspaces
          const workspaces = await this.prisma.workspace.findMany({
            where: {
              ownerId: userId,
            },
            include: {
              _count: {
                select: {
                  userWorkspaces: true,
                },
              },
            },
          });

          // Return the maximum number of users in any workspace
          if (workspaces.length === 0) {
            return 0;
          }

          return Math.max(...workspaces.map((w) => w._count.userWorkspaces));
        }
      }

      case LimitType.MAX_ALERTS:
        // Could be implemented based on alert model, here using a placeholder count
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Clear plan cache for a user
   */
  async clearUserPlanCache(userId: string): Promise<void> {
    const cacheKey = `user-plan:${userId}`;
    await this.cacheManager.del(cacheKey);
  }
}
