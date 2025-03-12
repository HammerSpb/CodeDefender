import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ResourceType } from '@/plans/constants/plan-features';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's usage statistics
   * @param userId User ID
   * @param period Time period for stats ('day', 'week', 'month', 'year')
   */
  async getUserUsageStats(userId: string, period: string = 'month') {
    const startDate = this.getStartDateForPeriod(period);
    
    try {
      // Get usage logs for the period
      const usageLogs = await this.prisma.usageLog.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by resource type
      const resourceStats = {};
      
      usageLogs.forEach((log) => {
        if (!resourceStats[log.resourceType]) {
          resourceStats[log.resourceType] = {
            total: 0,
            byAction: {},
          };
        }
        
        resourceStats[log.resourceType].total += log.count;
        
        if (!resourceStats[log.resourceType].byAction[log.action]) {
          resourceStats[log.resourceType].byAction[log.action] = 0;
        }
        
        resourceStats[log.resourceType].byAction[log.action] += log.count;
      });

      // Get time series data for visualizations
      const timeSeriesData = this.getTimeSeriesData(usageLogs, period);

      return {
        period,
        totalUsage: usageLogs.reduce((sum, log) => sum + log.count, 0),
        resourceStats,
        timeSeriesData,
      };
    } catch (error) {
      this.logger.error(`Error getting usage stats: ${error.message}`, error.stack);
      return {
        period,
        totalUsage: 0,
        resourceStats: {},
        timeSeriesData: [],
      };
    }
  }

  /**
   * Get workspace usage statistics
   * @param workspaceId Workspace ID
   * @param period Time period for stats ('day', 'week', 'month', 'year')
   */
  async getWorkspaceUsageStats(workspaceId: string, period: string = 'month') {
    const startDate = this.getStartDateForPeriod(period);
    
    try {
      // Get all workspace users
      const workspaceUsers = await this.prisma.userWorkspace.findMany({
        where: { workspaceId },
        select: { userId: true },
      });
      
      const userIds = workspaceUsers.map(wu => wu.userId);
      
      // Get usage logs for all workspace users
      const usageLogs = await this.prisma.usageLog.findMany({
        where: {
          userId: { in: userIds },
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by resource type
      const resourceStats = {};
      
      // Group by user
      const userStats = {};
      
      usageLogs.forEach((log) => {
        // Add to resource stats
        if (!resourceStats[log.resourceType]) {
          resourceStats[log.resourceType] = {
            total: 0,
            byAction: {},
          };
        }
        
        resourceStats[log.resourceType].total += log.count;
        
        if (!resourceStats[log.resourceType].byAction[log.action]) {
          resourceStats[log.resourceType].byAction[log.action] = 0;
        }
        
        resourceStats[log.resourceType].byAction[log.action] += log.count;
        
        // Add to user stats
        if (!userStats[log.userId]) {
          userStats[log.userId] = {
            user: log.user,
            total: 0,
            byResource: {},
          };
        }
        
        userStats[log.userId].total += log.count;
        
        if (!userStats[log.userId].byResource[log.resourceType]) {
          userStats[log.userId].byResource[log.resourceType] = 0;
        }
        
        userStats[log.userId].byResource[log.resourceType] += log.count;
      });

      // Get time series data for visualizations
      const timeSeriesData = this.getTimeSeriesData(usageLogs, period);

      return {
        period,
        totalUsage: usageLogs.reduce((sum, log) => sum + log.count, 0),
        resourceStats,
        userStats,
        timeSeriesData,
      };
    } catch (error) {
      this.logger.error(`Error getting workspace usage stats: ${error.message}`, error.stack);
      return {
        period,
        totalUsage: 0,
        resourceStats: {},
        userStats: {},
        timeSeriesData: [],
      };
    }
  }

  /**
   * Track usage of a resource
   * @param userId User ID
   * @param resourceType Type of resource
   * @param action Action performed
   * @param count Number of operations (default: 1)
   */
  async trackUsage(
    userId: string,
    resourceType: ResourceType,
    action: string,
    count = 1,
  ): Promise<void> {
    try {
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
   * Get start date based on period
   * @private
   */
  private getStartDateForPeriod(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const day = now.getDay();
        return new Date(now.setDate(now.getDate() - day));
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1); // Default to month
    }
  }

  /**
   * Convert usage logs to time series data
   * @private
   */
  private getTimeSeriesData(usageLogs: any[], period: string): any[] {
    if (usageLogs.length === 0) {
      return [];
    }

    const timeFormat = this.getTimeFormatForPeriod(period);
    const timeSeriesMap = new Map();
    
    usageLogs.forEach((log) => {
      const date = new Date(log.createdAt);
      const timeKey = this.formatDateByPeriod(date, period);
      
      if (!timeSeriesMap.has(timeKey)) {
        timeSeriesMap.set(timeKey, {
          time: timeKey,
          total: 0,
          resources: {},
        });
      }
      
      const entry = timeSeriesMap.get(timeKey);
      entry.total += log.count;
      
      if (!entry.resources[log.resourceType]) {
        entry.resources[log.resourceType] = 0;
      }
      
      entry.resources[log.resourceType] += log.count;
    });
    
    // Convert map to sorted array
    return Array.from(timeSeriesMap.values()).sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });
  }

  /**
   * Get time format based on period
   * @private
   */
  private getTimeFormatForPeriod(period: string): string {
    switch (period) {
      case 'day':
        return 'HH:00'; // Hour of day
      case 'week':
        return 'ddd'; // Day of week
      case 'month':
        return 'DD'; // Day of month
      case 'year':
        return 'MMM'; // Month of year
      default:
        return 'DD'; // Default to day of month
    }
  }

  /**
   * Format date based on period
   * @private
   */
  private formatDateByPeriod(date: Date, period: string): string {
    switch (period) {
      case 'day':
        return `${date.getHours()}:00`;
      case 'week':
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      case 'month':
        return date.getDate().toString().padStart(2, '0');
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
      default:
        return date.getDate().toString().padStart(2, '0'); // Default to day of month
    }
  }
}
