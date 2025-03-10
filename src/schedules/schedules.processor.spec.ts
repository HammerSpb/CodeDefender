import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SchedulesProcessor } from './schedules.processor';
import { SchedulesService } from './schedules.service';

describe('SchedulesProcessor', () => {
  let processor: SchedulesProcessor;
  let schedulesService: SchedulesService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesProcessor,
        {
          provide: SchedulesService,
          useValue: {
            triggerScan: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<SchedulesProcessor>(SchedulesProcessor);
    schedulesService = module.get<SchedulesService>(SchedulesService);

    // Mock the logger to avoid console output during tests
    logger = new Logger();
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    Object.defineProperty(processor, 'logger', { value: logger });
  });

  describe('handleTriggerScan', () => {
    it('should trigger a scan successfully', async () => {
      // Arrange
      const mockDate = new Date();
      const mockScan = {
        id: 'scan-id',
        status: 'PENDING',
        createdAt: mockDate,
      };
      const mockJob = {
        data: {
          scheduleId: 'schedule-id',
          userId: 'user-id',
        },
      };

      jest.spyOn(schedulesService, 'triggerScan').mockResolvedValue(mockScan as any);
      jest.spyOn(logger, 'debug');

      // Act
      const result = await processor.handleTriggerScan(mockJob as any);

      // Assert
      expect(schedulesService.triggerScan).toHaveBeenCalledWith(
        mockJob.data.scheduleId,
        mockJob.data.userId,
      );
      expect(logger.debug).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockScan);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const mockError = new Error('Test error');
      const mockJob = {
        data: {
          scheduleId: 'schedule-id',
          userId: 'user-id',
        },
      };

      jest.spyOn(schedulesService, 'triggerScan').mockRejectedValue(mockError);
      jest.spyOn(logger, 'error');

      // Act & Assert
      await expect(processor.handleTriggerScan(mockJob as any)).rejects.toThrow(mockError);
      expect(logger.error).toHaveBeenCalled();
      expect(schedulesService.triggerScan).toHaveBeenCalledWith(
        mockJob.data.scheduleId,
        mockJob.data.userId,
      );
    });
  });
});
