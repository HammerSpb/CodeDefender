import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ScansProcessor } from './scans.processor';
import { ScansService } from './scans.service';
import { ScanStatus } from '@prisma/client';

describe('ScansProcessor', () => {
  let processor: ScansProcessor;
  let scansService: ScansService;
  let prismaService: PrismaService;
  let auditLogsService: AuditLogsService;
  let logger: Logger;

  // Test data setup
  const mockDate = new Date();
  const mockScan = {
    id: 'scan-id',
    repositoryId: 'repo-id',
    workspaceId: 'workspace-id',
    branch: 'main',
    status: ScanStatus.QUEUED,
    historical: false,
    fileExclusions: [],
    results: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    completedAt: null,
    repository: {
      id: 'repo-id',
      url: 'https://github.com/user/repo',
      provider: 'GITHUB',
      accessToken: 'github_token',
      ownerId: 'user-id',
      createdAt: mockDate,
      updatedAt: mockDate,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansProcessor,
        {
          provide: ScansService,
          useValue: {
            updateScanStatus: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            scan: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ScansProcessor>(ScansProcessor);
    scansService = module.get<ScansService>(ScansService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);

    // Mock the logger to avoid console output during tests
    logger = new Logger();
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    Object.defineProperty(processor, 'logger', { value: logger });

    // Mock setTimeout to speed up tests
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0 as any;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('handleScan', () => {
    it('should process a scan successfully', async () => {
      // Arrange
      const mockJob = {
        data: {
          scanId: 'scan-id',
          userId: 'user-id',
        },
      };
      const mockCompletedScan = {
        ...mockScan,
        status: ScanStatus.COMPLETED,
        completedAt: new Date(),
        results: { findings: { high: 3, medium: 5, low: 8 } },
      };

      jest.spyOn(scansService, 'updateScanStatus')
        .mockResolvedValueOnce({ ...mockScan, status: ScanStatus.RUNNING })
        .mockResolvedValueOnce(mockCompletedScan);
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(mockScan);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);
      jest.spyOn(processor as any, 'generateMockResults').mockReturnValue({
        findings: { high: 3, medium: 5, low: 8 },
        details: { issues: [] },
      });
      jest.spyOn(logger, 'debug');

      // Act
      const result = await processor.handleScan(mockJob as any);

      // Assert
      expect(scansService.updateScanStatus).toHaveBeenCalledWith(mockJob.data.scanId, ScanStatus.RUNNING);
      expect(prismaService.scan.findUnique).toHaveBeenCalledWith({
        where: { id: mockJob.data.scanId },
        include: {
          repository: true,
        },
      });
      expect(scansService.updateScanStatus).toHaveBeenCalledWith(
        mockJob.data.scanId,
        ScanStatus.COMPLETED,
        expect.objectContaining({
          findings: expect.any(Object),
        }),
      );
      expect(auditLogsService.create).toHaveBeenCalledWith({
        userId: mockJob.data.userId,
        workspaceId: mockScan.workspaceId,
        action: 'SCAN_COMPLETED',
        details: expect.objectContaining({
          scanId: mockJob.data.scanId,
        }),
      });
      expect(logger.debug).toHaveBeenCalledTimes(3); // Processing, Scanning, Completed
      expect(result).toEqual(mockCompletedScan);
    });

    it('should handle errors during scan processing', async () => {
      // Arrange
      const mockJob = {
        data: {
          scanId: 'scan-id',
          userId: 'user-id',
        },
      };
      const mockError = new Error('Test error');

      jest.spyOn(scansService, 'updateScanStatus')
        .mockResolvedValueOnce({ ...mockScan, status: ScanStatus.RUNNING })
        .mockResolvedValueOnce({ ...mockScan, status: ScanStatus.FAILED });
      jest.spyOn(prismaService.scan, 'findUnique').mockRejectedValue(mockError);
      jest.spyOn(logger, 'error');

      // Act & Assert
      await expect(processor.handleScan(mockJob as any)).rejects.toThrow(mockError);
      expect(scansService.updateScanStatus).toHaveBeenCalledWith(mockJob.data.scanId, ScanStatus.RUNNING);
      expect(scansService.updateScanStatus).toHaveBeenCalledWith(mockJob.data.scanId, ScanStatus.FAILED);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle errors when scan is not found', async () => {
      // Arrange
      const mockJob = {
        data: {
          scanId: 'scan-id',
          userId: 'user-id',
        },
      };

      jest.spyOn(scansService, 'updateScanStatus').mockResolvedValueOnce({ ...mockScan, status: ScanStatus.RUNNING });
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(null);
      jest.spyOn(logger, 'error');

      // Act & Assert
      await expect(processor.handleScan(mockJob as any)).rejects.toThrow('Scan scan-id not found');
      expect(scansService.updateScanStatus).toHaveBeenCalledWith(mockJob.data.scanId, ScanStatus.FAILED);
    });
  });

  describe('generateMockResults', () => {
    it('should generate mock scan results', () => {
      // Arrange & Act
      // @ts-ignore - Using private method for testing
      const results = processor.generateMockResults();

      // Assert
      expect(results).toEqual(
        expect.objectContaining({
          findings: expect.objectContaining({
            high: expect.any(Number),
            medium: expect.any(Number),
            low: expect.any(Number),
          }),
          scannedFiles: expect.any(Number),
          secretsFound: expect.any(Number),
          vulnerabilitiesFound: expect.any(Number),
          details: expect.objectContaining({
            issues: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('generateMockIssues', () => {
    it('should generate mock issues with correct counts and severities', () => {
      // Arrange & Act
      // @ts-ignore - Using private method for testing
      const issues = processor.generateMockIssues(2, 3, 4);

      // Assert
      expect(issues.length).toBe(9); // 2 high + 3 medium + 4 low
      
      const highIssues = issues.filter(issue => issue.severity === 'high');
      const mediumIssues = issues.filter(issue => issue.severity === 'medium');
      const lowIssues = issues.filter(issue => issue.severity === 'low');
      
      expect(highIssues.length).toBe(2);
      expect(mediumIssues.length).toBe(3);
      expect(lowIssues.length).toBe(4);
      
      // Check structure of an issue
      expect(issues[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          description: expect.any(String),
          severity: expect.any(String),
          path: expect.any(String),
          line: expect.any(Number),
        }),
      );
    });
  });
});
