import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequiresPolicy } from '../plans/decorators/requires-policy.decorator';
import { RequiresFeature } from '../plans/decorators/requires-feature.decorator';
import { CheckLimit } from '../plans/decorators/requires-feature.decorator';
import { Feature, LimitType, ResourceType } from '../plans/constants/plan-features';
import { PERMISSION_CODES } from '../permissions/constants/permission-codes';
import { UsageService } from '../plans/usage.service';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(
    private usageService: UsageService,
  ) {}

  // Basic scan functionality - available on all plans
  @Post()
  @RequiresPolicy({
    permissionCode: PERMISSION_CODES.SCAN_CREATE,
    limitType: LimitType.SCANS_PER_DAY,
  })
  async createScan(@Req() req, @Body() createScanDto: any) {
    // Track scan creation
    await this.usageService.trackUsage(
      req.user.id,
      ResourceType.SCAN,
      'CREATE',
      createScanDto.workspaceId
    );
    
    return { message: 'Scan created successfully' };
  }

  // Advanced scan - requires PRO plan or higher
  @Post('advanced')
  @RequiresPolicy({
    permissionCode: PERMISSION_CODES.SCAN_CREATE,
    requiredFeatures: [Feature.ADVANCED_SCAN],
    limitType: LimitType.SCANS_PER_DAY,
  })
  async createAdvancedScan(@Req() req, @Body() createScanDto: any) {
    // Track advanced scan creation
    await this.usageService.trackUsage(
      req.user.id,
      ResourceType.SCAN,
      'CREATE_ADVANCED',
      createScanDto.workspaceId
    );
    
    return { message: 'Advanced scan created successfully' };
  }

  // Historical scan - requires PRO plan or higher
  @Post('historical')
  @RequiresFeature(Feature.HISTORICAL_SCAN, {
    errorMessage: 'Historical scanning requires a Pro plan or higher',
  })
  @CheckLimit(LimitType.SCANS_PER_DAY)
  async createHistoricalScan(@Req() req, @Body() createScanDto: any) {
    // Track historical scan creation
    await this.usageService.trackUsage(
      req.user.id,
      ResourceType.SCAN,
      'CREATE_HISTORICAL',
      createScanDto.workspaceId
    );
    
    return { message: 'Historical scan created successfully' };
  }

  // Scheduled scan - requires PRO plan or higher
  @Post('schedule')
  @RequiresFeature(Feature.SCHEDULED_SCANS)
  async scheduleScan(@Req() req, @Body() scheduleDto: any) {
    // Track schedule creation
    await this.usageService.trackUsage(
      req.user.id,
      ResourceType.SCHEDULE,
      'CREATE',
      scheduleDto.workspaceId
    );
    
    return { message: 'Scan scheduled successfully' };
  }

  // Custom rules - requires BUSINESS plan or higher
  @Post('rules')
  @RequiresFeature(Feature.CUSTOM_RULES, {
    errorMessage: 'Custom rules require a Business plan or higher',
    showUpgradePrompt: true,
  })
  async createCustomRule(@Req() req, @Body() ruleDto: any) {
    // Logic to create custom rule
    return { message: 'Custom rule created successfully' };
  }

  // Get usage stats - show plan utilization
  @Get('usage')
  async getUsageStats(@Req() req, @Query('workspaceId') workspaceId: string) {
    try {
      // Get scan usage statistics
      const usage = await this.usageService.getUserUsageStats(
        req.user.id,
        ResourceType.SCAN
      );
      
      return { usage };
    } catch (error) {
      throw new ForbiddenException('Could not retrieve usage stats');
    }
  }
}
