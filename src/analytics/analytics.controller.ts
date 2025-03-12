import { 
  Controller, Get, Query, UseGuards, 
  Request, HttpStatus, Param
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RequiresPermission } from '@/permissions/decorators/requires-permission.decorator';

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('my-usage')
  @ApiOperation({ summary: 'Get current user\'s usage statistics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns usage statistics' })
  async getMyUsage(@Request() req, @Query('period') period: string = 'month') {
    return this.analyticsService.getUserUsageStats(req.user.userId, period);
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get workspace usage statistics' })
  @ApiParam({ name: 'workspaceId', description: 'ID of the workspace' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'], description: 'Time period for stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns workspace usage statistics' })
  @RequiresPermission('WORKSPACE:VIEW_ANALYTICS')
  async getWorkspaceUsage(
    @Param('workspaceId') workspaceId: string,
    @Query('period') period: string = 'month'
  ) {
    return this.analyticsService.getWorkspaceUsageStats(workspaceId, period);
  }
}
