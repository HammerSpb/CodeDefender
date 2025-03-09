import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  // Create mock dependencies
  const mockPrismaService = {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new AuditLogsService(mockPrismaService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      // Arrange
      const createAuditLogDto: CreateAuditLogDto = {
        userId: 'user-id',
        workspaceId: 'workspace-id',
        action: 'CREATE_WORKSPACE',
        details: { workspaceName: 'Test Workspace' },
      };

      const mockAuditLog = {
        id: 'log-id',
        ...createAuditLogDto,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      // Act
      const result = await service.create(createAuditLogDto);

      // Assert
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: createAuditLogDto.userId,
          workspaceId: createAuditLogDto.workspaceId,
          action: createAuditLogDto.action,
          details: createAuditLogDto.details,
        },
      });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findAll', () => {
    it('should return all audit logs with user and workspace info', async () => {
      // Arrange
      const mockAuditLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          workspaceId: 'workspace-1',
          action: 'CREATE_WORKSPACE',
          user: { id: 'user-1', email: 'user1@example.com' },
          workspace: { id: 'workspace-1', name: 'Workspace 1' },
        },
        {
          id: 'log-2',
          userId: 'user-2',
          workspaceId: null,
          action: 'CREATE_USER',
          user: { id: 'user-2', email: 'user2@example.com' },
          workspace: null,
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findByWorkspace', () => {
    it('should return audit logs for a specific workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockAuditLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          workspaceId,
          action: 'CREATE_WORKSPACE',
          user: { id: 'user-1', email: 'user1@example.com' },
        },
        {
          id: 'log-2',
          userId: 'user-2',
          workspaceId,
          action: 'UPDATE_WORKSPACE',
          user: { id: 'user-2', email: 'user2@example.com' },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await service.findByWorkspace(workspaceId);

      // Assert
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user', async () => {
      // Arrange
      const userId = 'user-id';
      const mockAuditLogs = [
        {
          id: 'log-1',
          userId,
          workspaceId: 'workspace-1',
          action: 'CREATE_WORKSPACE',
          workspace: { id: 'workspace-1', name: 'Workspace 1' },
        },
        {
          id: 'log-2',
          userId,
          workspaceId: null,
          action: 'LOGIN',
          workspace: null,
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await service.findByUser(userId);

      // Assert
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toEqual(mockAuditLogs);
    });
  });
});
