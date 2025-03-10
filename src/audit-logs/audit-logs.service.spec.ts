import { PrismaService } from '@/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let prismaService: PrismaService;

  // Test data setup
  const mockDate = new Date();
  const mockAuditLog = {
    id: 'audit-log-id',
    userId: 'user-id',
    workspaceId: 'workspace-id',
    action: 'CREATE_SCAN',
    details: { scanId: 'scan-id' },
    timestamp: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate
  };

  const mockAuditLogWithRelations = {
    ...mockAuditLog,
    user: {
      id: 'user-id',
      email: 'test@example.com',
    },
    workspace: {
      id: 'workspace-id',
      name: 'Test Workspace',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log', async () => {
      // Arrange
      const createDto: CreateAuditLogDto = {
        userId: 'user-id',
        workspaceId: 'workspace-id',
        action: 'CREATE_SCAN',
        details: { scanId: 'scan-id' },
      };
      
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue(mockAuditLog);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: createDto.userId,
          workspaceId: createDto.workspaceId,
          action: createDto.action,
          details: createDto.details,
        },
      });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findAll', () => {
    it('should return all audit logs with relations', async () => {
      // Arrange
      const mockAuditLogs = [mockAuditLogWithRelations];
      jest.spyOn(prismaService.auditLog, 'findMany').mockResolvedValue(mockAuditLogs);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith({
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
      const mockWorkspaceAuditLogs = [
        {
          ...mockAuditLog,
          user: {
            id: 'user-id',
            email: 'test@example.com',
          },
        },
      ];
      
      jest.spyOn(prismaService.auditLog, 'findMany').mockResolvedValue(mockWorkspaceAuditLogs);

      // Act
      const result = await service.findByWorkspace(workspaceId);

      // Assert
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockWorkspaceAuditLogs);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user', async () => {
      // Arrange
      const userId = 'user-id';
      const mockUserAuditLogs = [
        {
          ...mockAuditLog,
          workspace: {
            id: 'workspace-id',
            name: 'Test Workspace',
          },
        },
      ];
      
      jest.spyOn(prismaService.auditLog, 'findMany').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await service.findByUser(userId);

      // Assert
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUserAuditLogs);
    });
  });
});
