import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsController } from './audit-logs.controller';

// Create mock service
const mockAuditLogsService = {
  findAll: vi.fn(),
  findByWorkspace: vi.fn(),
  findByUser: vi.fn(),
};

describe('AuditLogsController', () => {
  let controller: AuditLogsController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new AuditLogsController(mockAuditLogsService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all audit logs', async () => {
      // Arrange
      const mockAuditLogs = [
        { id: 'log-1', action: 'CREATE_USER' },
        { id: 'log-2', action: 'CREATE_WORKSPACE' },
      ];
      mockAuditLogsService.findAll.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockAuditLogsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findByWorkspace', () => {
    it('should return audit logs for a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockAuditLogs = [
        { id: 'log-1', workspaceId, action: 'CREATE_WORKSPACE' },
        { id: 'log-2', workspaceId, action: 'UPDATE_WORKSPACE' },
      ];
      mockAuditLogsService.findByWorkspace.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await controller.findByWorkspace(workspaceId);

      // Assert
      expect(mockAuditLogsService.findByWorkspace).toHaveBeenCalledWith(workspaceId);
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a user', async () => {
      // Arrange
      const userId = 'user-id';
      const mockRequest = { user: { sub: 'owner-id', role: 'OWNER' } };
      const mockAuditLogs = [
        { id: 'log-1', userId, action: 'LOGIN' },
        { id: 'log-2', userId, action: 'CREATE_WORKSPACE' },
      ];
      mockAuditLogsService.findByUser.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await controller.findByUser(userId, mockRequest);

      // Assert
      expect(mockAuditLogsService.findByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findMyLogs', () => {
    it('should return audit logs for the current user', async () => {
      // Arrange
      const userId = 'current-user-id';
      const mockRequest = { user: { sub: userId } };
      const mockAuditLogs = [
        { id: 'log-1', userId, action: 'LOGIN' },
        { id: 'log-2', userId, action: 'CREATE_WORKSPACE' },
      ];
      mockAuditLogsService.findByUser.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await controller.findMyLogs(mockRequest);

      // Assert
      expect(mockAuditLogsService.findByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockAuditLogs);
    });
  });
});
