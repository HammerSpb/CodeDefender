import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceType } from '../constants/plan-features';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track usage of a feature or resource
   * @param userId User ID
   * @param resourceType Type of resource being used
   * @param action Action being performed
   * @param workspaceId Optional workspace context
   * @param resourceId Optional specific resource ID
   * @param count Optional count (default: 1)
   */
  async trackUsage(
    userId: string,
    resourceType: ResourceType,
    action: string,
    workspaceId?: string,
    resourceId?: string,
    count = 1,
  ): Promise<void> {
    try {
      // Create usage log entry
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
   * Get usage statistics for a user
   * @param userId User ID
   * @param resourceType Optional resource type filter
   * @param startDate Optional start date for the period
   * @param endDate Optional end date for the period
   */
  async getUserUsageStats(
    userId: string,
    resourceType?: ResourceType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    [key: string]: {
      total: number;
      byAction: { [action: string]: number };
    };
  }> {
    try {
      // Build where clause
      const where: any = { userId };
      
      if (resourceType) {
        where.resourceType = resourceType;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }
      
      // Get all usage logs for the user
      const usageLogs = await this.prisma.usageLog.findMany({ where });
      
      // Process usage data
      const usage: {
        [resourceType: string]: {
          total: number;
          byAction: { [action: string]: number };
        };
      } = {};
      
      // Group and summarize usage
      for (const log of usageLogs) {
        if (!usage[log.resourceType]) {
          usage[log.resourceType] = {
            total: 0,
            byAction: {},
          };
        }
        
        // Add to total
        usage[log.resourceType].total += log.count;
        
        // Add to action count
        if (!usage[log.resourceType].byAction[log.action]) {
          usage[log.resourceType].byAction[log.action] = 0;
        }
        
        usage[log.resourceType].byAction[log.action] += log.count;
      }
      
      return usage;
    } catch (error) {
      this.logger.error(`Error getting usage stats: ${error.message}`, error.stack);
      return {};
    }
  }

  /**
   * Get current day's usage for a specific resource type
   * @param userId User ID
   * @param resourceType Resource type
   */
  async getDailyUsage(
    userId: string,
    resourceType: ResourceType,
  ): Promise<number> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      // Get sum of usage count for today
      const result = await this.prisma.usageLog.aggregate({
        where: {
          userId,
          resourceType,
          createdAt: {
            gte: startOfDay,
          },
        },
        _sum: {
          count: true,
        },
      });
      
      return result._sum.count || 0;
    } catch (error) {
      this.logger.error(`Error getting daily usage: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Get current month's usage for a specific resource type
   * @param userId User ID
   * @param resourceType Resource type
   */
  async getMonthlyUsage(
    userId: string,
    resourceType: ResourceType,
  ): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get sum of usage count for this month
      const result = await this.prisma.usageLog.aggregate({
        where: {
          userId,
          resourceType,
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          count: true,
        },
      });
      
      return result._sum.count || 0;
    } catch (error) {
      this.logger.error(`Error getting monthly usage: ${error.message}`, error.stack);
      return 0;
    }
  }
}
