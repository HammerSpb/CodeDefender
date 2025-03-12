import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UserRole, WorkspaceRole } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('SchedulesController', () => {
  let controller: SchedulesController;
  let service: SchedulesService;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    sub: 'user-id',
    email: 'test@example.com',
    role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
  };

  const mockSchedule = {
    id: 'schedule-id',
    repositoryId: 'repo-id',
    workspaceId: 'workspace-id',
    branch: 'main',
    cronExpression: '0 0 * * *',
    historical: false,
    fileExclusions: [],
    active: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [
        {
          provide: SchedulesService,
          useValue: {
            create: jest.fn(),
            findAllByWorkspace: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            triggerScan: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<SchedulesController>(SchedulesController);
    service = module.get<SchedulesService>(SchedulesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const workspaceId = 'workspace-id';
    const createDto: CreateScheduleDto = {
      repositoryId: 'repo-id',
      branch: 'main',
      workspaceId: 'other-workspace-id', // Should be overridden
      cronExpression: '0 0 * * *',
      historical: false,
      fileExclusions: [],
      active: true,
    };
    const req = { user: mockUser };

    it('should create a new schedule', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.create(workspaceId, createDto, req);

      // Assert
      expect(createDto.workspaceId).toBe(workspaceId); // Should be overridden by the controller
      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.sub);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('findAll', () => {
    const workspaceId = 'workspace-id';
    const req = { user: mockUser };

    it('should return all schedules for a workspace', async () => {
      // Arrange
      const schedules = [mockSchedule];
      jest.spyOn(service, 'findAllByWorkspace').mockResolvedValue(schedules);

      // Act
      const result = await controller.findAll(workspaceId, req);

      // Assert
      expect(service.findAllByWorkspace).toHaveBeenCalledWith(workspaceId, mockUser.sub);
      expect(result).toEqual(schedules);
    });
  });

  describe('findOne', () => {
    const scheduleId = mockSchedule.id;
    const req = { user: mockUser };

    it('should return a schedule by ID', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.findOne(scheduleId, req);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(scheduleId, mockUser.sub);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('update', () => {
    const scheduleId = mockSchedule.id;
    const updateDto: UpdateScheduleDto = {
      branch: 'develop',
      cronExpression: '0 12 * * *',
    };
    const req = { user: mockUser };

    it('should update a schedule', async () => {
      // Arrange
      const updatedSchedule = {
        ...mockSchedule,
        // Make sure we use concrete values, not properties from updateDto
        branch: 'develop',
        cronExpression: '0 12 * * *',
      };
      jest.spyOn(service, 'update').mockResolvedValue(updatedSchedule);

      // Act
      const result = await controller.update(scheduleId, updateDto, req);

      // Assert
      expect(service.update).toHaveBeenCalledWith(scheduleId, updateDto, mockUser.sub);
      expect(result).toEqual(updatedSchedule);
    });
  });

  describe('remove', () => {
    const scheduleId = mockSchedule.id;
    const req = { user: mockUser };

    it('should delete a schedule', async () => {
      // Arrange
      jest.spyOn(service, 'remove').mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.remove(scheduleId, req);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(scheduleId, mockUser.sub);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('trigger', () => {
    const scheduleId = mockSchedule.id;
    const req = { user: mockUser };

    it('should trigger a scheduled scan', async () => {
      // Arrange
      const mockScan = { id: 'scan-id',
      jest.spyOn(service, 'triggerScan').mockResolvedValue(mockScan as any);

      // Act
      const result = await controller.trigger(scheduleId, req);

      // Assert
      expect(service.triggerScan).toHaveBeenCalledWith(scheduleId, mockUser.sub);
      expect(result).toEqual(mockScan);
    });
  });
});
