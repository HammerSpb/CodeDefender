import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulesController } from './schedules.controller';

// Create mock service
const mockSchedulesService = {
  create: vi.fn(),
  findAllByWorkspace: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  triggerScan: vi.fn(),
};

describe('SchedulesController', () => {
  let controller: SchedulesController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new SchedulesController(mockSchedulesService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a schedule', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const createScheduleDto = {
        repositoryId: 'repo-id',
        branch: 'main',
        workspaceId: 'workspace-id',
        cronExpression: '0 0 * * *',
        historical: false,
        fileExclusions: ['node_modules'],
        active: true,
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockSchedule = {
        id: 'schedule-id',
        ...createScheduleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSchedulesService.create.mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.create(workspaceId, createScheduleDto, mockRequest);

      // Assert
      expect(mockSchedulesService.create).toHaveBeenCalledWith({ ...createScheduleDto, workspaceId }, 'user-id');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('findAll', () => {
    it('should return all schedules for a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockSchedules = [
        { id: 'schedule-1', workspaceId },
        { id: 'schedule-2', workspaceId },
      ];
      mockSchedulesService.findAllByWorkspace.mockResolvedValue(mockSchedules);

      // Act
      const result = await controller.findAll(workspaceId, mockRequest);

      // Assert
      expect(mockSchedulesService.findAllByWorkspace).toHaveBeenCalledWith(workspaceId, 'user-id');
      expect(result).toEqual(mockSchedules);
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      // Arrange
      const scheduleId = 'schedule-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockSchedule = {
        id: scheduleId,
        workspaceId: 'workspace-id',
      };
      mockSchedulesService.findOne.mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.findOne(scheduleId, mockRequest);

      // Assert
      expect(mockSchedulesService.findOne).toHaveBeenCalledWith(scheduleId, 'user-id');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('update', () => {
    it('should update a schedule', async () => {
      // Arrange
      const scheduleId = 'schedule-id';
      const updateScheduleDto = {
        cronExpression: '0 0 1 * *',
        active: false,
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockSchedule = {
        id: scheduleId,
        repositoryId: 'repo-id',
        workspaceId: 'workspace-id',
        branch: 'main',
        cronExpression: '0 0 1 * *',
        active: false,
        updatedAt: new Date(),
      };
      mockSchedulesService.update.mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.update(scheduleId, updateScheduleDto, mockRequest);

      // Assert
      expect(mockSchedulesService.update).toHaveBeenCalledWith(scheduleId, updateScheduleDto, 'user-id');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('remove', () => {
    it('should remove a schedule', async () => {
      // Arrange
      const scheduleId = 'schedule-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockSchedule = {
        id: scheduleId,
        workspaceId: 'workspace-id',
      };
      mockSchedulesService.remove.mockResolvedValue(mockSchedule);

      // Act
      const result = await controller.remove(scheduleId, mockRequest);

      // Assert
      expect(mockSchedulesService.remove).toHaveBeenCalledWith(scheduleId, 'user-id');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('trigger', () => {
    it('should manually trigger a scheduled scan', async () => {
      // Arrange
      const scheduleId = 'schedule-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockScan = {
        id: 'scan-id',
        repositoryId: 'repo-id',
        workspaceId: 'workspace-id',
        branch: 'main',
        status: 'QUEUED',
      };
      mockSchedulesService.triggerScan.mockResolvedValue(mockScan);

      // Act
      const result = await controller.trigger(scheduleId, mockRequest);

      // Assert
      expect(mockSchedulesService.triggerScan).toHaveBeenCalledWith(scheduleId, 'user-id');
      expect(result).toEqual(mockScan);
    });
  });
});
