import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { ScanStatus, UserRole, WorkspaceRole } from '@prisma/client';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScansService } from './scans.service';

describe('ScansService', () => {
  let service: ScansService;
  let prismaService: PrismaService;
  let auditLogsService: AuditLogsService;
  let scansQueue: any;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.OWNER,
    provider: null,
    providerId: null,
    orgName: null,
    plan: null,
    ownerId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-id',
    role: UserRole.ADMIN,
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

  const mockScan = {
    id: 'scan-id',
    repositoryId: 'repo-id',
    workspaceId: mockWorkspace.id,
    branch: 'main',
    status: ScanStatus.QUEUED,
    historical: false,
    fileExclusions: [],
    results: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    completedAt: null,
  };

  const mockScanWithWorkspace = {
    ...mockScan,
    workspace: {
      ...mockWorkspace,
      userWorkspaces: [],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        {
          provide: PrismaService,
          useValue: {
            workspace: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            scan: {
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
          provide: getQueueToken('scans'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
    scansQueue = module.get(getQueueToken('scans'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateScanDto = {
      repositoryId: 'repo-id',
      branch: 'main',
      workspaceId: mockWorkspace.id,
      historical: false,
      fileExclusions: [],
    };
    const userId = mockUser.id;

    it('should create a scan successfully as workspace owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.scan, 'create').mockResolvedValue(mockScan);
      jest.spyOn(scansQueue, 'add').mockResolvedValue({});
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
      expect(prismaService.scan.create).toHaveBeenCalledWith({
        data: {
          repositoryId: createDto.repositoryId,
          workspaceId: createDto.workspaceId,
          branch: createDto.branch,
          status: ScanStatus.QUEUED,
          historical: createDto.historical,
          fileExclusions: createDto.fileExclusions,
        },
      });
      expect(scansQueue.add).toHaveBeenCalledWith('scan', {
        scanId: mockScan.id,
        userId,
      });
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockScan);
    });

    it('should create a scan successfully as workspace admin', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspaceWithUserWorkspaces);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(prismaService.scan, 'create').mockResolvedValue(mockScan);
      jest.spyOn(scansQueue, 'add').mockResolvedValue({});
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
      expect(prismaService.scan.create).toHaveBeenCalled();
      expect(scansQueue.add).toHaveBeenCalled();
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockScan);
    });

    it('should create a scan successfully as super admin', async () => {
      // Arrange
      const superAdmin = { ...mockUser, id: 'super-id', role: UserRole.SUPER };
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(superAdmin);
      jest.spyOn(prismaService.scan, 'create').mockResolvedValue(mockScan);
      jest.spyOn(scansQueue, 'add').mockResolvedValue({});
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, superAdmin.id);

      // Assert
      expect(prismaService.scan.create).toHaveBeenCalled();
      expect(result).toEqual(mockScan);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id', role: UserRole.MEMBER };
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.create(createDto, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByWorkspace', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;

    it('should return all scans for a workspace', async () => {
      // Arrange
      const scans = [mockScan];
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.scan, 'findMany').mockResolvedValue(scans);

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
      expect(prismaService.scan.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(scans);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access to workspace', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id', role: UserRole.MEMBER };
      const workspaceWithDifferentOwner = { ...mockWorkspace, ownerId: 'other-owner-id', userWorkspaces: [] };
      
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.findAllByWorkspace(workspaceId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    const scanId = mockScan.id;
    const userId = mockUser.id;

    it('should return a scan by ID', async () => {
      // Arrange
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(mockScanWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(scanId, userId);

      // Assert
      expect(prismaService.scan.findUnique).toHaveBeenCalledWith({
        where: { id: scanId },
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
      expect(result).toEqual(mockScanWithWorkspace);
    });

    it('should throw NotFoundException if scan is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(scanId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access to workspace', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id', role: UserRole.MEMBER };
      const scanWithDifferentOwner = {
        ...mockScanWithWorkspace,
        workspace: {
          ...mockScanWithWorkspace.workspace,
          ownerId: 'other-owner-id',
        },
      };
      
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(scanWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.findOne(scanId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const scanId = mockScan.id;
    const userId = mockUser.id;

    it('should delete a scan successfully as workspace owner', async () => {
      // Arrange
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(mockScanWithWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.scan, 'delete').mockResolvedValue(mockScan);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.remove(scanId, userId);

      // Assert
      expect(prismaService.scan.findUnique).toHaveBeenCalledWith({
        where: { id: scanId },
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
      expect(prismaService.scan.delete).toHaveBeenCalledWith({
        where: { id: scanId },
      });
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockScan);
    });

    it('should throw NotFoundException if scan is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(scanId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      // Arrange
      const regularUser = { ...mockUser, id: 'regular-user-id', role: UserRole.MEMBER };
      const scanWithDifferentOwner = {
        ...mockScanWithWorkspace,
        workspace: {
          ...mockScanWithWorkspace.workspace,
          ownerId: 'other-owner-id',
          userWorkspaces: [],
        },
      };
      
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(scanWithDifferentOwner);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(regularUser);

      // Act & Assert
      await expect(service.remove(scanId, regularUser.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateScanStatus', () => {
    const scanId = mockScan.id;

    it('should update the scan status', async () => {
      // Arrange
      const updatedScan = {
        ...mockScan,
        status: ScanStatus.RUNNING,
      };
      
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(mockScan);
      jest.spyOn(prismaService.scan, 'update').mockResolvedValue(updatedScan);

      // Act
      const result = await service.updateScanStatus(scanId, ScanStatus.RUNNING);

      // Assert
      expect(prismaService.scan.findUnique).toHaveBeenCalledWith({
        where: { id: scanId },
      });
      expect(prismaService.scan.update).toHaveBeenCalledWith({
        where: { id: scanId },
        data: { status: ScanStatus.RUNNING },
      });
      expect(result).toEqual(updatedScan);
    });

    it('should update the scan status to completed with results and completion time', async () => {
      // Arrange
      const results = { findings: { high: 1, medium: 2, low: 3 } };
      const completedScan = {
        ...mockScan,
        status: ScanStatus.COMPLETED,
        results,
        completedAt: expect.any(Date),
      };
      
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(mockScan);
      jest.spyOn(prismaService.scan, 'update').mockResolvedValue(completedScan);

      // Act
      const result = await service.updateScanStatus(scanId, ScanStatus.COMPLETED, results);

      // Assert
      expect(prismaService.scan.update).toHaveBeenCalledWith({
        where: { id: scanId },
        data: {
          status: ScanStatus.COMPLETED,
          completedAt: expect.any(Date),
          results,
        },
      });
      expect(result).toEqual(completedScan);
    });

    it('should throw NotFoundException if scan is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.scan, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateScanStatus(scanId, ScanStatus.RUNNING)).rejects.toThrow(NotFoundException);
    });
  });
});
