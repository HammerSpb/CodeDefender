import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@Controller('workspaces/:workspace_id/schedules')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  create(@Param('workspace_id') workspaceId: string, @Body() createScheduleDto: CreateScheduleDto, @Request() req) {
    // Set the workspace ID from the URL parameter
    createScheduleDto.workspaceId = workspaceId;
    return this.schedulesService.create(createScheduleDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all schedules for a workspace' })
  @ApiResponse({ status: 200, description: 'Return all schedules for a workspace' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findAll(@Param('workspace_id') workspaceId: string, @Request() req) {
    return this.schedulesService.findAllByWorkspace(workspaceId, req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiResponse({ status: 200, description: 'Return the schedule' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.schedulesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto, @Request() req) {
    return this.schedulesService.update(id, updateScheduleDto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.schedulesService.remove(id, req.user.sub);
  }

  @Post(':id/trigger')
  @Roles(UserRole.SUPER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger a scheduled scan' })
  @ApiResponse({ status: 201, description: 'Scan triggered successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  trigger(@Param('id') id: string, @Request() req) {
    return this.schedulesService.triggerScan(id, req.user.sub);
  }
}
