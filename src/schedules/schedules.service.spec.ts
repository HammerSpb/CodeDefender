import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulesService } from './schedules.service';

// Mock user roles
const UserRole = {
  SUPER: 'SUPER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  SUPPORT: 'SUPPORT',
};

describe('SchedulesService', () => {
  let service: SchedulesService;

  // Create mock dependencies
  const mockPrismaService = {
    schedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userWorkspace: {
      findMany: vi.fn(),
    },
  };

  const mockAuditLogsService = {
    create: vi.fn(),
  };

  const mockScansService = {
    create: vi.fn(),
  };

  const mockQueue = {
    add: vi.fn(),
    getRepeatableJobs: vi.fn(),
    removeRepeatableByKey: vi.fn(),
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new SchedulesService(
      mockPrismaService as any,
      mockAuditLogsService as any,
      mockScansService as any,
      mockQueue as any,
    );

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createScheduleDto = {
      repositoryId: 'repo-id',
      workspaceId: 'workspace-id',
      branch: 'main',
      cronExpression: '0 0 * * *',
      historical: false,
      fileExclusions: ['node_modules'],
      active: true,
    };

    const userId = 'user-id';

    const mockWorkspace = {
      id: 'workspace-id',
      ownerId: userId,
      userWorkspaces: [{ userId, role: 'ADMIN' }],
    };

    const mockSchedule = {
      id: 'schedule-id',
      ...createScheduleDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a schedule when user is workspace owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      // Act
      const result = await service.create(createScheduleDto, userId);

      // Assert
      expect(mockPrismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: createScheduleDto.workspaceId },
        include: {
          userWorkspaces: {
            where: { userId },
          },
        },
      });
      expect(mockPrismaService.schedule.create).toHaveBeenCalledWith({
        data: createScheduleDto,
      });
      expect(mockAuditLogsService.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should create a schedule when user is workspace admin', async () => {
      // Arrange
      const adminUserId = 'admin-id';
      const workspaceWithAdmin = {
        ...mockWorkspace,
        ownerId: 'other-owner-id',
        userWorkspaces: [{ userId: adminUserId, role: 'ADMIN' }],
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithAdmin);
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      // Act
      const result = await service.create(createScheduleDto, adminUserId);

      // Assert
      expect(mockPrismaService.schedule.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should create a schedule when user is SUPER', async () => {
      // Arrange
      const superUserId = 'super-id';
      mockPrismaService.user.findUnique.mockResolvedValue({ id: superUserId, role: UserRole.SUPER });
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
        userWorkspaces: [],
      });
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      // Act
      const result = await service.create(createScheduleDto, superUserId);

      // Assert
      expect(mockPrismaService.schedule.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createScheduleDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have permission', async () => {
      // Arrange
      const memberUserId = 'member-id';
      const workspaceWithMember = {
        ...mockWorkspace,
        ownerId: 'other-owner-id',
        userWorkspaces: [{ userId: memberUserId, role: 'MEMBER' }],
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithMember);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: memberUserId, role: UserRole.MEMBER });

      // Act & Assert
      await expect(service.create(createScheduleDto, memberUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByWorkspace', () => {
    const workspaceId = 'workspace-id';
    const userId = 'user-id';

    const mockWorkspace = {
      id: workspaceId,
      ownerId: userId,
      userWorkspaces: [{ userId, role: 'ADMIN' }],
    };

    const mockSchedules = [
      { id: 'schedule-1', workspaceId },
      { id: 'schedule-2', workspaceId },
    ];

    it('should return all schedules for a workspace when user has access', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      // Act
      const result = await service.findAllByWorkspace(workspaceId, userId);

      // Assert
      expect(mockPrismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: {
          userWorkspaces: {
            where: { userId },
          },
        },
      });
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSchedules);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const noAccessUserId = 'no-access-id';
      mockPrismaService.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
        userWorkspaces: [],
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: noAccessUserId, role: UserRole.MEMBER });

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, noAccessUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    const scheduleId = 'schedule-id';
    const userId = 'user-id';

    const mockSchedule = {
      id: scheduleId,
      workspaceId: 'workspace-id',
      workspace: {
        ownerId: userId,
        userWorkspaces: [{ userId, role: 'ADMIN' }],
      },
    };

    it('should return a schedule by id when user has access', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      // Act
      const result = await service.findOne(scheduleId, userId);

      // Assert
      expect(mockPrismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: scheduleId },
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
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const noAccessUserId = 'no-access-id';
      const scheduleWithoutAccess = {
        ...mockSchedule,
        workspace: {
          ownerId: 'other-owner-id',
          userWorkspaces: [],
        },
      };
      mockPrismaService.schedule.findUnique.mockResolvedValue(scheduleWithoutAccess);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: noAccessUserId, role: UserRole.MEMBER });

      // Act & Assert
      await expect(service.findOne(scheduleId, noAccessUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const scheduleId = 'schedule-id';
    const userId = 'user-id';

    const updateScheduleDto = {
      cronExpression: '0 0 1 * *',
      active: false,
    };

    const mockSchedule = {
      id: scheduleId,
      workspaceId: 'workspace-id',
      cronExpression: '0 0 * * *',
      active: true,
      workspace: {
        ownerId: userId,
        userWorkspaces: [{ userId, role: 'ADMIN' }],
      },
    };

    const updatedSchedule = {
      ...mockSchedule,
      cronExpression: '0 0 1 * *',
      active: false,
    };

    it('should update a schedule when user is workspace owner or admin', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.update.mockResolvedValue(updatedSchedule);
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.getRepeatableJobs.mockResolvedValue([{ id: `schedule-${scheduleId}`, key: 'mock-key' }]);
      mockQueue.removeRepeatableByKey.mockResolvedValue(true);
      mockQueue.add.mockResolvedValue({});

      // Act
      const result = await service.update(scheduleId, updateScheduleDto, userId);

      // Assert
      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: updateScheduleDto,
      });
      expect(mockAuditLogsService.create).toHaveBeenCalled();

      // Should remove old job and add new one if cron expression changes
      expect(mockQueue.removeRepeatableByKey).toHaveBeenCalled();
      expect(result).toEqual(updatedSchedule);
    });

    it('should disable schedule job when setting active to false', async () => {
      // Arrange
      const updateInactiveDto = { active: false };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.update.mockResolvedValue({ ...mockSchedule, active: false });
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.getRepeatableJobs.mockResolvedValue([{ id: `schedule-${scheduleId}`, key: 'mock-key' }]);
      mockQueue.removeRepeatableByKey.mockResolvedValue(true);

      // Act
      const result = await service.update(scheduleId, updateInactiveDto, userId);

      // Assert
      expect(mockQueue.removeRepeatableByKey).toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(result.active).toBe(false);
    });

    it('should enable schedule job when setting active to true', async () => {
      // Arrange
      const inactiveSchedule = { ...mockSchedule, active: false };
      const updateActiveDto = { active: true };

      mockPrismaService.schedule.findUnique.mockResolvedValue(inactiveSchedule);
      mockPrismaService.schedule.update.mockResolvedValue({ ...inactiveSchedule, active: true });
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.add.mockResolvedValue({});

      // Act
      const result = await service.update(scheduleId, updateActiveDto, userId);

      // Assert
      expect(mockQueue.add).toHaveBeenCalled();
      expect(result.active).toBe(true);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(scheduleId, updateScheduleDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have permission', async () => {
      // Arrange
      const memberUserId = 'member-id';
      const scheduleWithMember = {
        ...mockSchedule,
        workspace: {
          ownerId: 'other-owner-id',
          userWorkspaces: [{ userId: memberUserId, role: 'MEMBER' }],
        },
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(scheduleWithMember);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: memberUserId, role: UserRole.MEMBER });

      // Act & Assert
      await expect(service.update(scheduleId, updateScheduleDto, memberUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const scheduleId = 'schedule-id';
    const userId = 'user-id';

    const mockSchedule = {
      id: scheduleId,
      workspaceId: 'workspace-id',
      active: true,
      workspace: {
        ownerId: userId,
        userWorkspaces: [{ userId, role: 'ADMIN' }],
      },
    };

    it('should remove a schedule when user is workspace owner or admin', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.delete.mockResolvedValue(mockSchedule);
      mockAuditLogsService.create.mockResolvedValue({});
      mockQueue.getRepeatableJobs.mockResolvedValue([{ id: `schedule-${scheduleId}`, key: 'mock-key' }]);
      mockQueue.removeRepeatableByKey.mockResolvedValue(true);

      // Act
      const result = await service.remove(scheduleId, userId);

      // Assert
      expect(mockPrismaService.schedule.delete).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
      expect(mockAuditLogsService.create).toHaveBeenCalled();
      expect(mockQueue.removeRepeatableByKey).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have permission', async () => {
      // Arrange
      const memberUserId = 'member-id';
      const scheduleWithMember = {
        ...mockSchedule,
        workspace: {
          ownerId: 'other-owner-id',
          userWorkspaces: [{ userId: memberUserId, role: 'MEMBER' }],
        },
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(scheduleWithMember);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: memberUserId, role: UserRole.MEMBER });

      // Act & Assert
      await expect(service.remove(scheduleId, memberUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('triggerScan', () => {
    const scheduleId = 'schedule-id';
    const userId = 'user-id';

    const mockSchedule = {
      id: scheduleId,
      repositoryId: 'repo-id',
      workspaceId: 'workspace-id',
      branch: 'main',
      historical: false,
      fileExclusions: ['node_modules'],
    };

    const mockScan = {
      id: 'scan-id',
      repositoryId: 'repo-id',
      workspaceId: 'workspace-id',
      branch: 'main',
      status: 'QUEUED',
    };

    it('should trigger a scan based on schedule', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockScansService.create.mockResolvedValue(mockScan);

      // Act
      const result = await service.triggerScan(scheduleId, userId);

      // Assert
      expect(mockPrismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
      expect(mockScansService.create).toHaveBeenCalledWith(
        {
          repositoryId: mockSchedule.repositoryId,
          workspaceId: mockSchedule.workspaceId,
          branch: mockSchedule.branch,
          historical: mockSchedule.historical,
          fileExclusions: mockSchedule.fileExclusions,
        },
        userId,
      );
      expect(result).toEqual(mockScan);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.triggerScan(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
