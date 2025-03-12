import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let service: AuditLogsService;

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

  // Super admin user
  const mockSuperUser = {
    id: 'super-user-id',
    sub: 'super-user-id',
    email: 'super@example.com',
    role: UserRole.SUPER,
    mfaSecret: null,
    mfaEnabled: false,
  };

  // Owner user
  const mockOwnerUser = {
    id: 'owner-id',
    sub: 'owner-id',
    email: 'owner@example.com',
    role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
  };

  // Regular member user
  const mockMemberUser = {
    id: 'member-id',
    sub: 'member-id',
    email: 'member@example.com',
    role: UserRole.MEMBER,
    mfaSecret: null,
    mfaEnabled: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditLogsService,
          useValue: {
            findAll: jest.fn(),
            findByWorkspace: jest.fn(),
            findByUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all audit logs', async () => {
      // Arrange
      const mockAuditLogs = [mockAuditLog];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockAuditLogs);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('findByWorkspace', () => {
    const workspaceId = 'workspace-id';

    it('should return audit logs for a workspace', async () => {
      // Arrange
      const mockWorkspaceAuditLogs = [mockAuditLog];
      jest.spyOn(service, 'findByWorkspace').mockResolvedValue(mockWorkspaceAuditLogs);

      // Act
      const result = await controller.findByWorkspace(workspaceId);

      // Assert
      expect(service.findByWorkspace).toHaveBeenCalledWith(workspaceId);
      expect(result).toEqual(mockWorkspaceAuditLogs);
    });
  });

  describe('findByUser', () => {
    const userId = 'user-id';

    it('should return audit logs for a user when requested by super admin', async () => {
      // Arrange
      const mockUserAuditLogs = [mockAuditLog];
      const req = { user: mockSuperUser };
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await controller.findByUser(userId, req);

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserAuditLogs);
    });

    it('should return audit logs for a user when requested by the owner for their own user', async () => {
      // Arrange
      const mockUserAuditLogs = [mockAuditLog];
      const req = { user: mockOwnerUser };
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await controller.findByUser(mockOwnerUser.sub, req);

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith(mockOwnerUser.sub);
      expect(result).toEqual(mockUserAuditLogs);
    });
  });

  describe('findMyLogs', () => {
    it('should return audit logs for the current user (member)', async () => {
      // Arrange
      const mockUserAuditLogs = [mockAuditLog];
      const req = { user: mockMemberUser };
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await controller.findMyLogs(req);

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith(mockMemberUser.sub);
      expect(result).toEqual(mockUserAuditLogs);
    });

    it('should return audit logs for the current user (owner)', async () => {
      // Arrange
      const mockUserAuditLogs = [mockAuditLog];
      const req = { user: mockOwnerUser };
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await controller.findMyLogs(req);

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith(mockOwnerUser.sub);
      expect(result).toEqual(mockUserAuditLogs);
    });

    it('should return audit logs for the current user (super)', async () => {
      // Arrange
      const mockUserAuditLogs = [mockAuditLog];
      const req = { user: mockSuperUser };
      jest.spyOn(service, 'findByUser').mockResolvedValue(mockUserAuditLogs);

      // Act
      const result = await controller.findMyLogs(req);

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith(mockSuperUser.sub);
      expect(result).toEqual(mockUserAuditLogs);
    });
  });
});
