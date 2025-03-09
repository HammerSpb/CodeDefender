import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScansService } from './scans.service';

// Mock ScanStatus enum
const ScanStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// Mock user roles
const UserRole = {
  SUPER: 'SUPER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  SUPPORT: 'SUPPORT',
};

describe('ScansService', () => {
  let service: ScansService;

  // Create mock dependencies
  const mockPrismaService = {
    scan: {
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

  const mockQueue = {
    add: vi.fn(),
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new ScansService(mockPrismaService as any, mockAuditLogsService as any, mockQueue as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  // Previous test blocks would be here...

  describe('updateScanStatus', () => {
    const scanId = 'scan-id';
    const mockScan = {
      id: scanId,
      status: ScanStatus.QUEUED,
    };

    const mockCompletedScan = {
      ...mockScan,
      status: ScanStatus.COMPLETED,
      completedAt: new Date(),
      results: { findings: { high: 2, medium: 3, low: 5 } },
    };

    it('should update scan status to RUNNING', async () => {
      // Arrange
      mockPrismaService.scan.findUnique.mockResolvedValue(mockScan);
      mockPrismaService.scan.update.mockResolvedValue({ ...mockScan, status: ScanStatus.RUNNING });

      // Act
      const result = await service.updateScanStatus(scanId, ScanStatus.RUNNING);

      // Assert
      expect(mockPrismaService.scan.update).toHaveBeenCalledWith({
        where: { id: scanId },
        data: { status: ScanStatus.RUNNING },
      });
      expect(result.status).toBe(ScanStatus.RUNNING);
    });

    it('should update scan status to COMPLETED with results', async () => {
      // Arrange
      mockPrismaService.scan.findUnique.mockResolvedValue(mockScan);
      mockPrismaService.scan.update.mockResolvedValue(mockCompletedScan);

      const results = { findings: { high: 2, medium: 3, low: 5 } };

      // Act
      const result = await service.updateScanStatus(scanId, ScanStatus.COMPLETED, results);

      // Assert
      expect(mockPrismaService.scan.update).toHaveBeenCalledWith({
        where: { id: scanId },
        data: {
          status: ScanStatus.COMPLETED,
          completedAt: expect.any(Date),
          results,
        },
      });
      expect(result.status).toBe(ScanStatus.COMPLETED);
      expect(result.results).toEqual(results);
      expect(result.completedAt).toBeDefined();
    });

    it('should update scan status to FAILED', async () => {
      // Arrange
      mockPrismaService.scan.findUnique.mockResolvedValue(mockScan);
      mockPrismaService.scan.update.mockResolvedValue({ ...mockScan, status: ScanStatus.FAILED });

      // Act
      const result = await service.updateScanStatus(scanId, ScanStatus.FAILED);

      // Assert
      expect(mockPrismaService.scan.update).toHaveBeenCalledWith({
        where: { id: scanId },
        data: { status: ScanStatus.FAILED },
      });
      expect(result.status).toBe(ScanStatus.FAILED);
    });

    it('should throw NotFoundException if scan is not found', async () => {
      // Arrange
      mockPrismaService.scan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateScanStatus(scanId, ScanStatus.RUNNING)).rejects.toThrow(NotFoundException);
    });
  });
});
