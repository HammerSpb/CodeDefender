import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScansController } from './scans.controller';

// Create mock service
const mockScansService = {
  create: vi.fn(),
  findAllByWorkspace: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
};

describe('ScansController', () => {
  let controller: ScansController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new ScansController(mockScansService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a scan', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const createScanDto = {
        repositoryId: 'repo-id',
        branch: 'main',
        workspaceId: 'other-workspace-id', // Should be overridden
        historical: false,
        fileExclusions: ['node_modules'],
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockScan = {
        id: 'scan-id',
        repositoryId: 'repo-id',
        workspaceId,
        branch: 'main',
        status: 'QUEUED',
        historical: false,
        fileExclusions: ['node_modules'],
        createdAt: new Date(),
      };
      mockScansService.create.mockResolvedValue(mockScan);

      // Act
      const result = await controller.create(workspaceId, createScanDto, mockRequest);

      // Assert
      // Check that workspaceId from URL parameter is used
      expect(mockScansService.create).toHaveBeenCalledWith({ ...createScanDto, workspaceId }, 'user-id');
      expect(result).toEqual(mockScan);
    });
  });

  describe('findAll', () => {
    it('should return all scans for a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockScans = [
        { id: 'scan-1', workspaceId },
        { id: 'scan-2', workspaceId },
      ];
      mockScansService.findAllByWorkspace.mockResolvedValue(mockScans);

      // Act
      const result = await controller.findAll(workspaceId, mockRequest);

      // Assert
      expect(mockScansService.findAllByWorkspace).toHaveBeenCalledWith(workspaceId, 'user-id');
      expect(result).toEqual(mockScans);
    });
  });

  describe('findOne', () => {
    it('should return a scan by id', async () => {
      // Arrange
      const scanId = 'scan-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockScan = {
        id: scanId,
        workspaceId: 'workspace-id',
      };
      mockScansService.findOne.mockResolvedValue(mockScan);

      // Act
      const result = await controller.findOne(scanId, mockRequest);

      // Assert
      expect(mockScansService.findOne).toHaveBeenCalledWith(scanId, 'user-id');
      expect(result).toEqual(mockScan);
    });
  });

  describe('remove', () => {
    it('should remove a scan', async () => {
      // Arrange
      const scanId = 'scan-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockScan = {
        id: scanId,
        workspaceId: 'workspace-id',
      };
      mockScansService.remove.mockResolvedValue(mockScan);

      // Act
      const result = await controller.remove(scanId, mockRequest);

      // Assert
      expect(mockScansService.remove).toHaveBeenCalledWith(scanId, 'user-id');
      expect(result).toEqual(mockScan);
    });
  });
});
