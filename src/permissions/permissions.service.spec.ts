import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prismaService = module.get(PrismaService) as DeepMockProxy<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('userHasPermission', () => {
    const userId = 'user-id';
    const permissionCode = 'SCAN:VIEW';
    const workspaceId = 'workspace-id';

    it('should return true for SUPER users', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'super@example.com',
        role: 'SUPER',
        userRoleAssignments: [],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.userHasPermission(userId, permissionCode);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          userRoleAssignments: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should return true if user has global permission', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id',
            userId,
            roleId: 'role-id',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id',
                  permissionId: 'permission-id',
                  permission: {
                    id: 'permission-id',
                    code: 'SCAN:VIEW',
                    name: 'View Scans',
                    description: 'Can view scans',
                    scope: 'SCAN',
                    action: 'VIEW',
                    resource: 'SCAN',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.userHasPermission(userId, permissionCode);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true if user has workspace-specific permission', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id',
            userId,
            roleId: 'role-id',
            workspaceId,
            createdAt: new Date(),
            role: {
              id: 'role-id',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id',
                  permissionId: 'permission-id',
                  permission: {
                    id: 'permission-id',
                    code: 'SCAN:VIEW',
                    name: 'View Scans',
                    description: 'Can view scans',
                    scope: 'SCAN',
                    action: 'VIEW',
                    resource: 'SCAN',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.userHasPermission(userId, permissionCode, workspaceId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true if user is workspace owner', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: userId,
        repositoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.userHasPermission(userId, permissionCode, workspaceId);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
    });

    it('should return false if user has no permission', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id',
            userId,
            roleId: 'role-id',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id',
                  permissionId: 'permission-id',
                  permission: {
                    id: 'permission-id',
                    code: 'REPORT:VIEW',
                    name: 'View Reports',
                    description: 'Can view reports',
                    scope: 'REPORT',
                    action: 'VIEW',
                    resource: 'REPORT',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: 'other-user-id',
        repositoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.userHasPermission(userId, permissionCode, workspaceId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    const userId = 'user-id';
    const workspaceId = 'workspace-id';

    it('should return all permissions for SUPER users', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'super@example.com',
        role: 'SUPER',
        userRoleAssignments: [],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const allPermissions = [
        { id: 'p1', code: 'SCAN:VIEW' },
        { id: 'p2', code: 'REPORT:VIEW' },
      ];
      prismaService.permission.findMany.mockResolvedValue(allPermissions);

      // Act
      const result = await service.getUserPermissions(userId);

      // Assert
      expect(result).toEqual(['SCAN:VIEW', 'REPORT:VIEW']);
      expect(prismaService.permission.findMany).toHaveBeenCalled();
    });

    it('should return combined global permissions', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id-1',
            userId,
            roleId: 'role-id-1',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id-1',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id-1',
                  permissionId: 'permission-id-1',
                  permission: {
                    id: 'permission-id-1',
                    code: 'SCAN:VIEW',
                    name: 'View Scans',
                    description: 'Can view scans',
                    scope: 'SCAN',
                    action: 'VIEW',
                    resource: 'SCAN',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
          {
            id: 'role-assignment-id-2',
            userId,
            roleId: 'role-id-2',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id-2',
              name: 'Reporter',
              description: 'Can view reports',
              isDefault: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id-2',
                  permissionId: 'permission-id-2',
                  permission: {
                    id: 'permission-id-2',
                    code: 'REPORT:VIEW',
                    name: 'View Reports',
                    description: 'Can view reports',
                    scope: 'REPORT',
                    action: 'VIEW',
                    resource: 'REPORT',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.getUserPermissions(userId);

      // Assert
      expect(result).toEqual(['SCAN:VIEW', 'REPORT:VIEW']);
    });

    it('should return combined global and workspace permissions', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id-1',
            userId,
            roleId: 'role-id-1',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id-1',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id-1',
                  permissionId: 'permission-id-1',
                  permission: {
                    id: 'permission-id-1',
                    code: 'SCAN:VIEW',
                    name: 'View Scans',
                    description: 'Can view scans',
                    scope: 'SCAN',
                    action: 'VIEW',
                    resource: 'SCAN',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
          {
            id: 'role-assignment-id-2',
            userId,
            roleId: 'role-id-2',
            workspaceId,
            createdAt: new Date(),
            role: {
              id: 'role-id-2',
              name: 'Workspace Admin',
              description: 'Admin in the workspace',
              isDefault: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id-2',
                  permissionId: 'permission-id-2',
                  permission: {
                    id: 'permission-id-2',
                    code: 'WORKSPACE:EDIT',
                    name: 'Edit Workspace',
                    description: 'Can edit workspace',
                    scope: 'WORKSPACE',
                    action: 'EDIT',
                    resource: 'WORKSPACE',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: 'other-user-id',
        repositoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.getUserPermissions(userId, workspaceId);

      // Assert
      expect(result).toEqual(['SCAN:VIEW', 'WORKSPACE:EDIT']);
    });

    it('should return all workspace-related permissions for workspace owner', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        role: 'MEMBER',
        userRoleAssignments: [
          {
            id: 'role-assignment-id-1',
            userId,
            roleId: 'role-id-1',
            workspaceId: null,
            createdAt: new Date(),
            role: {
              id: 'role-id-1',
              name: 'Member',
              description: 'Regular member',
              isDefault: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              rolePermissions: [
                {
                  roleId: 'role-id-1',
                  permissionId: 'permission-id-1',
                  permission: {
                    id: 'permission-id-1',
                    code: 'SCAN:VIEW',
                    name: 'View Scans',
                    description: 'Can view scans',
                    scope: 'SCAN',
                    action: 'VIEW',
                    resource: 'SCAN',
                    createdAt: new Date(),
                  },
                },
              ],
            },
          },
        ],
        firstName: null,
        lastName: null,
        password: null,
        provider: null,
        providerId: null,
        orgName: null,
        plan: null,
        ownerId: null,
        mfaSecret: null,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: userId,
        repositoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const workspacePermissions = [
        {
          id: 'p1',
          code: 'WORKSPACE:VIEW',
          scope: 'WORKSPACE',
        },
        {
          id: 'p2',
          code: 'WORKSPACE:EDIT',
          scope: 'WORKSPACE',
        },
      ];
      prismaService.permission.findMany.mockResolvedValue(workspacePermissions);

      // Act
      const result = await service.getUserPermissions(userId, workspaceId);

      // Assert
      expect(result).toContain('SCAN:VIEW');
      expect(result).toContain('WORKSPACE:VIEW');
      expect(result).toContain('WORKSPACE:EDIT');
      expect(prismaService.permission.findMany).toHaveBeenCalledWith({
        where: {
          scope: 'WORKSPACE',
        },
      });
    });
  });
});
