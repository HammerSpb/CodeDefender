import {  AuditLogsService } from '@/audit-logs/audit-logs.service';
import { Plan,  PrismaService } from '@/prisma/prisma.service';
import { Plan,  ScansService } from '@/scans/scans.service';
import { Plan,  Test, TestingModule } from '@nestjs/testing';
import { Plan,  ForbiddenException, NotFoundException } from '@nestjs/common';
import { Plan,  getQueueToken } from '@nestjs/bull';
import { Plan,  UserRole, WorkspaceRole } from '@prisma/client';
import { Plan,  CreateScheduleDto } from './dto/create-schedule.dto';
import { Plan,  UpdateScheduleDto } from './dto/update-schedule.dto';
import { Plan,  SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let prismaService: PrismaService;
  let auditLogsService: AuditLogsService;
  let scansService: ScansService;
  let schedulesQueue: any;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
    provider: null,
    providerId: null,
    orgName: null,
    plan: Plan.PRO, firstName: null, lastName: null, mfaSecret: null, mfaEnabled: false,
    ownerId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-id',
    role: UserRole.ADMIN,
    mfaSecret: null,
    mfaEnabled: false,
  };

  const mockWorkspace = {
    id: 'workspace-id',
    name: 'Test Workspace',
    ownerId: mockUser.id,
    repositoryId: 'repo-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockWorkspaceWithUserWorkspaces = {
    ...mockWorkspace,
    userWorkspaces: [
      {
        id: 'user-workspace-id',
        userId: mockAdminUser.id,
        workspaceId: mockWorkspace.id,
        role: WorkspaceRole.ADMIN,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    ],
  };

  const mockSchedule = {
    id: 'schedule-id',
    repositoryId: 'repo-id',
    workspaceId: mockWorkspace.id,
    branch: 'main',
    cronExpression: '0 0 * * *',
    historical: false,
    fileExclusions: [],
    active: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockScheduleWithWorkspace = {
    ...mockSchedule,
    workspace: {
      ...mockWorkspace,
      userWorkspaces: [],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: PrismaService,
          useValue: {
            workspace: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            schedule: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: ScansService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getQueueToken('schedules'),
          useValue: {
            add: jest.fn(),
            getRepeatableJobs: jest.fn(),
            removeRepeatableByKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
    scansService = module.get<ScansService>(ScansService);
    schedulesQueue = module.get(getQueueToken('schedules'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateScheduleDto = {
      repositoryId: 'repo-id',
      branch: 'main',
      workspaceId: mockWorkspace.id,
      cronExpression: '0 0 * * *',
      historical: false,
      fileExclusions: [],
      active: true,
    };
    const userId = mockUser.id;

    it('should create a schedule successfully as workspace owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.schedule, 'create').mockResolvedValue(mockSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.workspaceId },
        include: {
          userWorkspaces: {
            where: { userId },
          },
        },
      });
      expect(prismaService.schedule.create).toHaveBeenCalledWith({
        data: {
          repositoryId: createDto.repositoryId,
          workspaceId: createDto.workspaceId,
          branch: createDto.branch,
          cronExpression: createDto.cronExpression,
          historical: createDto.historical,
          fileExclusions: createDto.fileExclusions,
          active: createDto.active,
        },
      });
      expect(schedulesQueue.add).toHaveBeenCalledWith(
        'trigger-scan',
        {
          scheduleId: mockSchedule.id,
          userId,
        },
        {
          repeat: {
            cron: mockSchedule.cronExpression,
          },
          jobId: `schedule-${mockSchedule.id}`,
        },
      );
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should create a schedule successfully as workspace admin', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspaceWithUserWorkspaces);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(prismaService.schedule, 'create').mockResolvedValue(mockSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, mockAdminUser.id);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.workspaceId },
        include: {
          userWorkspaces: {
            where: { userId: mockAdminUser.id },
          },
        },
      });
      expect(prismaService.schedule.create).toHaveBeenCalled();
      expect(schedulesQueue.add).toHaveBeenCalled();
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should create a schedule successfully as super admin', async () => {
      // Arrange
      const superAdmin = { ...mockUser, id: 'super-id',
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(superAdmin);
      jest.spyOn(prismaService.schedule, 'create').mockResolvedValue(mockSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, superAdmin.id);

      // Assert
      expect(prismaService.schedule.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id',
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.create(createDto, regularUser.id)).rejects.toThrow(ForbiddenException);
    });

    it('should not add to queue if schedule is inactive', async () => {
      // Arrange
      const inactiveCreateDto = { ...createDto, active: false };
      const inactiveSchedule = { ...mockSchedule, active: false };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.schedule, 'create').mockResolvedValue(inactiveSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      await service.create(inactiveCreateDto, userId);

      // Assert
      expect(schedulesQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('findAllByWorkspace', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;

    it('should return all schedules for a workspace', async () => {
      // Arrange
      const schedules = [mockSchedule];
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.schedule, 'findMany').mockResolvedValue(schedules);

      // Act
      const result = await service.findAllByWorkspace(workspaceId, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: {
          userWorkspaces: {
            where: { userId },
          },
        },
      });
      expect(prismaService.schedule.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(schedules);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access to workspace', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id',
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    const scheduleId = mockSchedule.id;
    const userId = mockUser.id;

    it('should return a schedule by ID', async () => {
      // Arrange
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(mockScheduleWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(scheduleId, userId);

      // Assert
      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockScheduleWithWorkspace);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access to workspace', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id',
      const scheduleWithDifferentOwner = {
        ...mockScheduleWithWorkspace,
        workspace: {
          ...mockScheduleWithWorkspace.workspace,
          ownerId: 'other-owner-id',
        },
      };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(scheduleWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.findOne(scheduleId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const scheduleId = mockSchedule.id;
    const userId = mockUser.id;
    const updateDto: UpdateScheduleDto = {
      branch: 'develop',
      cronExpression: '0 12 * * *',
    };

    it('should update a schedule successfully as workspace owner', async () => {
      // Arrange
      // Create an updated schedule with concrete values (not references to updateDto)
      const updatedSchedule = {
        ...mockSchedule,
        branch: 'develop',
        cronExpression: '0 12 * * *',
      };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(mockScheduleWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(schedulesQueue, 'getRepeatableJobs').mockResolvedValue([
        { id: `schedule-${scheduleId}`, key: 'some-key' },
      ]);
      jest.spyOn(schedulesQueue, 'removeRepeatableByKey').mockResolvedValue({});
      jest.spyOn(prismaService.schedule, 'update').mockResolvedValue(updatedSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.update(scheduleId, updateDto, userId);

      // Assert
      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
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
      expect(schedulesQueue.removeRepeatableByKey).toHaveBeenCalledWith('some-key');
      expect(prismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: updateDto,
      });
      expect(schedulesQueue.add).toHaveBeenCalled();
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(updatedSchedule);
    });

    it('should update a schedule successfully as workspace admin', async () => {
      // Arrange
      // Create an updated schedule with concrete values (not references to updateDto)
      const updatedSchedule = {
        ...mockSchedule,
        branch: 'develop',
        cronExpression: '0 12 * * *',
      };
      
      const scheduleWithAdminAccess = {
        ...mockScheduleWithWorkspace,
        workspace: {
          ...mockScheduleWithWorkspace.workspace,
          userWorkspaces: [
            {
              userId: mockAdminUser.id,
              workspaceId: mockWorkspace.id,
              role: WorkspaceRole.ADMIN,
            },
          ],
        },
      };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(scheduleWithAdminAccess);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(schedulesQueue, 'getRepeatableJobs').mockResolvedValue([
        { id: `schedule-${scheduleId}`, key: 'some-key' },
      ]);
      jest.spyOn(schedulesQueue, 'removeRepeatableByKey').mockResolvedValue({});
      jest.spyOn(prismaService.schedule, 'update').mockResolvedValue(updatedSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.update(scheduleId, updateDto, mockAdminUser.id);

      // Assert
      expect(prismaService.schedule.update).toHaveBeenCalled();
      expect(result).toEqual(updatedSchedule);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(scheduleId, updateDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id',
      const scheduleWithDifferentOwner = {
        ...mockScheduleWithWorkspace,
        workspace: {
          ...mockScheduleWithWorkspace.workspace,
          ownerId: 'other-owner-id',
          userWorkspaces: [],
        },
      };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(scheduleWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.update(scheduleId, updateDto, regularUser.id)).rejects.toThrow(ForbiddenException);
    });

    it('should not add to queue if schedule becomes inactive', async () => {
      // Arrange
      const deactivateDto: UpdateScheduleDto = { active: false };
      const inactiveSchedule = { ...mockSchedule, active: false };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(mockScheduleWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(schedulesQueue, 'getRepeatableJobs').mockResolvedValue([
        { id: `schedule-${scheduleId}`, key: 'some-key' },
      ]);
      jest.spyOn(schedulesQueue, 'removeRepeatableByKey').mockResolvedValue({});
      jest.spyOn(prismaService.schedule, 'update').mockResolvedValue(inactiveSchedule);
      jest.spyOn(schedulesQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      await service.update(scheduleId, deactivateDto, userId);

      // Assert
      expect(schedulesQueue.removeRepeatableByKey).toHaveBeenCalled();
      expect(schedulesQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const scheduleId = mockSchedule.id;
    const userId = mockUser.id;

    it('should delete a schedule successfully as workspace owner', async () => {
      // Arrange
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(mockScheduleWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(schedulesQueue, 'getRepeatableJobs').mockResolvedValue([
        { id: `schedule-${scheduleId}`, key: 'some-key' },
      ]);
      jest.spyOn(schedulesQueue, 'removeRepeatableByKey').mockResolvedValue({});
      jest.spyOn(prismaService.schedule, 'delete').mockResolvedValue(mockSchedule);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.remove(scheduleId, userId);

      // Assert
      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
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
      expect(schedulesQueue.removeRepeatableByKey).toHaveBeenCalledWith('some-key');
      expect(prismaService.schedule.delete).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id',
      const scheduleWithDifferentOwner = {
        ...mockScheduleWithWorkspace,
        workspace: {
          ...mockScheduleWithWorkspace.workspace,
          ownerId: 'other-owner-id',
          userWorkspaces: [],
        },
      };
      
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(scheduleWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.remove(scheduleId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('triggerScan', () => {
    const scheduleId = mockSchedule.id;
    const userId = mockUser.id;

    it('should trigger a scan based on schedule', async () => {
      // Arrange
      const mockScan = { id: 'scan-id',
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(mockSchedule);
      jest.spyOn(scansService, 'create').mockResolvedValue(mockScan as any);

      // Act
      const result = await service.triggerScan(scheduleId, userId);

      // Assert
      expect(prismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
      expect(scansService.create).toHaveBeenCalledWith(
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
      jest.spyOn(prismaService.schedule, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.triggerScan(scheduleId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
