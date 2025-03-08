import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ScansService } from '@/scans/scans.service';
import { InjectQueue } from '@nestjs/bull';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Schedule, UserRole } from '@prisma/client';
import { Queue } from 'bull';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private prismaService: PrismaService,
    private auditLogsService: AuditLogsService,
    private scansService: ScansService,
    @InjectQueue('schedules') private schedulesQueue: Queue,
  ) {}

  async create(createScheduleDto: CreateScheduleDto, userId: string): Promise<Schedule> {
    // Check if the user has access to the workspace
    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: createScheduleDto.workspaceId },
      include: {
        userWorkspaces: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (
      user?.role !== UserRole.SUPER &&
      workspace.ownerId !== userId &&
      (workspace.userWorkspaces.length === 0 || workspace.userWorkspaces[0].role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only workspace owners and admins can create schedules');
    }

    // Create the schedule
    const schedule = await this.prismaService.schedule.create({
      data: {
        repositoryId: createScheduleDto.repositoryId,
        workspaceId: createScheduleDto.workspaceId,
        branch: createScheduleDto.branch,
        cronExpression: createScheduleDto.cronExpression,
        historical: createScheduleDto.historical || false,
        fileExclusions: createScheduleDto.fileExclusions || [],
        active: createScheduleDto.active !== undefined ? createScheduleDto.active : true,
      },
    });

    // Add job to the queue if active
    if (schedule.active) {
      await this.addScheduleToQueue(schedule, userId);
    }

    // Create audit log
    await this.auditLogsService.create({
      userId,
      workspaceId: createScheduleDto.workspaceId,
      action: 'CREATE_SCHEDULE',
      details: {
        scheduleId: schedule.id,
        repositoryId: createScheduleDto.repositoryId,
        branch: createScheduleDto.branch,
        cronExpression: createScheduleDto.cronExpression,
      },
    });

    return schedule;
  }

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Schedule[]> {
    // Check if the user has access to the workspace
    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        userWorkspaces: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (user?.role !== UserRole.SUPER && workspace.ownerId !== userId && workspace.userWorkspaces.length === 0) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Get all schedules for the workspace
    return this.prismaService.schedule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Schedule> {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            userWorkspaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Check permissions
    if (
      user?.role !== UserRole.SUPER &&
      schedule.workspace.ownerId !== userId &&
      schedule.workspace.userWorkspaces.length === 0
    ) {
      throw new ForbiddenException('You do not have access to this schedule');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, userId: string): Promise<Schedule> {
    // Get schedule with workspace included
    const scheduleWithWorkspace = await this.prismaService.schedule.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            userWorkspaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!scheduleWithWorkspace) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Only owners and admins can update schedules
    if (
      user?.role !== UserRole.SUPER &&
      scheduleWithWorkspace.workspace.ownerId !== userId &&
      (scheduleWithWorkspace.workspace.userWorkspaces.length === 0 ||
        scheduleWithWorkspace.workspace.userWorkspaces[0].role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only workspace owners and admins can update schedules');
    }

    // Remove existing queue job if changing active status or cron expression
    if (scheduleWithWorkspace.active && (updateScheduleDto.active === false || updateScheduleDto.cronExpression)) {
      await this.removeScheduleFromQueue(scheduleWithWorkspace);
    }

    // Update schedule
    const updatedSchedule = await this.prismaService.schedule.update({
      where: { id },
      data: updateScheduleDto,
    });

    // Add to queue if active
    if (updatedSchedule.active && (!scheduleWithWorkspace.active || updateScheduleDto.cronExpression)) {
      await this.addScheduleToQueue(updatedSchedule, userId);
    }

    // Create audit log
    await this.auditLogsService.create({
      userId,
      workspaceId: scheduleWithWorkspace.workspaceId,
      action: 'UPDATE_SCHEDULE',
      details: {
        scheduleId: scheduleWithWorkspace.id,
      },
    });

    return updatedSchedule;
  }

  // Apply the same pattern to the remove method
  async remove(id: string, userId: string): Promise<Schedule> {
    // Get schedule with workspace included
    const scheduleWithWorkspace = await this.prismaService.schedule.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            userWorkspaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!scheduleWithWorkspace) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Only owners and admins can delete schedules
    if (
      user?.role !== UserRole.SUPER &&
      scheduleWithWorkspace.workspace.ownerId !== userId &&
      (scheduleWithWorkspace.workspace.userWorkspaces.length === 0 ||
        scheduleWithWorkspace.workspace.userWorkspaces[0].role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only workspace owners and admins can delete schedules');
    }

    // Remove from queue if active
    if (scheduleWithWorkspace.active) {
      await this.removeScheduleFromQueue(scheduleWithWorkspace);
    }

    // Delete schedule
    const deletedSchedule = await this.prismaService.schedule.delete({
      where: { id },
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      workspaceId: scheduleWithWorkspace.workspaceId,
      action: 'DELETE_SCHEDULE',
      details: {
        scheduleId: scheduleWithWorkspace.id,
      },
    });

    return deletedSchedule;
  }

  private async addScheduleToQueue(schedule: Schedule, userId: string) {
    // Add repeatable job based on cron expression
    await this.schedulesQueue.add(
      'trigger-scan',
      {
        scheduleId: schedule.id,
        userId,
      },
      {
        repeat: {
          cron: schedule.cronExpression,
        },
        jobId: `schedule-${schedule.id}`,
      },
    );
  }

  private async removeScheduleFromQueue(schedule: Schedule) {
    // Remove repeatable job
    const repeatableJobs = await this.schedulesQueue.getRepeatableJobs();
    const job = repeatableJobs.find(j => j.id === `schedule-${schedule.id}`);

    if (job) {
      await this.schedulesQueue.removeRepeatableByKey(job.key);
    }
  }

  async triggerScan(scheduleId: string, userId: string) {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    // Create a scan based on the schedule
    return this.scansService.create(
      {
        repositoryId: schedule.repositoryId,
        workspaceId: schedule.workspaceId,
        branch: schedule.branch,
        historical: schedule.historical,
        fileExclusions: schedule.fileExclusions,
      },
      userId,
    );
  }
}
