import { 
  Controller, Get, Post, Body, Param, UseGuards, 
  Request, HttpStatus, HttpCode
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ComparePlansDto } from './dto/compare-plans.dto';
import { RequiresPermission } from '@/permissions/decorators/requires-permission.decorator';

@ApiTags('billing')
@Controller('billing/plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get available plans' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all plans' })
  async getAvailablePlans() {
    return this.billingService.getAvailablePlans();
  }

  @Get('my-plan')
  @ApiOperation({ summary: 'Get current user\'s plan details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns plan details' })
  async getMyPlan(@Request() req) {
    return this.billingService.getUserPlanDetails(req.user.userId);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare features between two plans' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns plan comparison' })
  async comparePlans(@Body() comparePlansDto: ComparePlansDto) {
    return this.billingService.comparePlans(
      comparePlansDto.planA,
      comparePlansDto.planB
    );
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade current user\'s plan' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plan upgraded successfully' })
  async upgradePlan(@Request() req, @Body() updatePlanDto: UpdatePlanDto) {
    return this.billingService.updateUserPlan(
      req.user.userId,
      updatePlanDto.plan,
      req.user.userId
    );
  }

  @Post('user/:userId')
  @ApiOperation({ summary: 'Update a user\'s plan (admin only)' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plan updated successfully' })
  @RequiresPermission('USER:MANAGE_PLAN')
  async updateUserPlan(
    @Request() req,
    @Param('userId') userId: string,
    @Body() updatePlanDto: UpdatePlanDto
  ) {
    return this.billingService.updateUserPlan(
      userId,
      updatePlanDto.plan,
      req.user.userId
    );
  }
}
