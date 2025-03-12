import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlansService } from '../../plans/plans.service';
import { UsageService } from '../../plans/services/usage.service';
import { Feature, LimitType, ResourceType } from '../../plans/constants/plan-features';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private prisma: PrismaService,
    private plansService: PlansService,
    private usageService: UsageService,
  ) {}

  /**
   * Create a new scan
   */
  async createScan(userId: string, data: any) {
    try {
      // Create the scan
      const scan = await this.prisma.scan.create({
        data: {
          repositoryId: data.repositoryId,
          workspaceId: data.workspaceId,
          branch: data.branch,
          status: 'QUEUED',
          fileExclusions: data.fileExclusions || [],
          historical: !!data.historical,
        },
      });

      // Track usage
      await this.usageService.trackUsage(
        userId,
        ResourceType.SCAN,
        'CREATE',
        data.workspaceId,
        scan.id,
      );

      return scan;
    } catch (error) {
      this.logger.error(`Error creating scan: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create an advanced scan with more options
   */
  async createAdvancedScan(userId: string, data: any) {
    try {
      // Check if user's plan has advanced scan feature
      const hasFeature = await this.plansService.userHasFeature(
        userId,
        Feature.ADVANCED_SCAN,
      );

      if (!hasFeature) {
        throw new ForbiddenException(
          'Advanced scanning requires a Pro plan or higher',
        );
      }

      // Check if user has reached their daily scan limit
      const { allowed } = await this.plansService.checkUsageLimit(
        userId,
        LimitType.SCANS_PER_DAY,
      );

      if (!allowed) {
        throw new ForbiddenException(
          'You have reached your daily scan limit. Upgrade your plan for more scans per day.',
        );
      }

      // Create the advanced scan
      const scan = await this.prisma.scan.create({
        data: {
          repositoryId: data.repositoryId,
          workspaceId: data.workspaceId,
          branch: data.branch,
          status: 'QUEUED',
          fileExclusions: data.fileExclusions || [],
          historical: !!data.historical,
          // Advanced scan specific options would go here
        },
      });

      // Track usage
      await this.usageService.trackUsage(
        userId,
        ResourceType.SCAN,
        'CREATE_ADVANCED',
        data.workspaceId,
        scan.id,
      );

      return scan;
    } catch (error) {
      this.logger.error(`Error creating advanced scan: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get usage statistics for scans
   */
  async getScanUsageStats(userId: string) {
    try {
      // Get user's plan
      const plan = await this.plansService.getUserPlan(userId);
      
      // Get usage statistics
      const dailyUsage = await this.usageService.getDailyUsage(
        userId,
        ResourceType.SCAN,
      );
      
      const monthlyUsage = await this.usageService.getMonthlyUsage(
        userId,
        ResourceType.SCAN,
      );
      
      // Get plan limits
      const dailyLimit = this.plansService['PLAN_LIMITS'][plan].scansPerDay;
      const monthlyLimit = this.plansService['PLAN_LIMITS'][plan].scansPerMonth;
      
      return {
        plan,
        daily: {
          used: dailyUsage,
          limit: dailyLimit,
          percentage: Math.round((dailyUsage / dailyLimit) * 100),
        },
        monthly: {
          used: monthlyUsage,
          limit: monthlyLimit,
          percentage: Math.round((monthlyUsage / monthlyLimit) * 100),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting scan usage stats: ${error.message}`, error.stack);
      throw error;
    }
  }
}
