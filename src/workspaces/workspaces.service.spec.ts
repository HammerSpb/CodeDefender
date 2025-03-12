import {  BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Plan,  Test, TestingModule } from '@nestjs/testing';
import { Plan,  UserRole, WorkspaceRole } from '@prisma/client';
import { Plan,  PrismaService } from '../prisma/prisma.service';
import { Plan,  AddUserToWorkspaceDto } from './dto/add-user-to-workspace.dto';
import { Plan,  CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Plan,  UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Plan,  WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prismaService: PrismaService;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    firstName: '',
    lastName: '',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
    provider: null,
    providerId: null,
    orgName: null,
    plan: Plan.PRO, firstName: null, lastName: null, mfaSecret: null, mfaEnabled: false,
    ownerId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockUserToAdd = {
    ...mockUser,
    id: 'user-to-add-id',
    email: 'user-to-add@example.com',
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-id',
    role: UserRole.ADMIN,
    mfaSecret: null,
    mfaEnabled: false,
  };

  const mockWorkspace = {
    id: 'workspace-id',
    name: 'Test Workspace',
    ownerId: mockUser.id,
    repositoryId: 'repo-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockWorkspaceWithIncludes = {
    ...mockWorkspace,
    repository: {
      id: 'repo-id',
      url: 'https://github.com/user/repo',
      provider: 'GITHUB',
      accessToken: 'github_token',
      ownerId: mockUser.id,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    owner: {
      id: mockUser.id,
      email: mockUser.email,
    },
    userWorkspaces: [
      {
        id: 'user-workspace-id',
        userId: mockUser.id,
        workspaceId: mockWorkspace.id,
        role: WorkspaceRole.ADMIN,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      },
    ],
    scans: [],
    schedules: [],
  };

  const mockUserWorkspace = {
    id: 'user-workspace-id',
    userId: mockUserToAdd.id,
    workspaceId: mockWorkspace.id,
    role: WorkspaceRole.MEMBER,
    createdAt: mockDate,
    updatedAt: mockDate,
    user: {
      id: mockUserToAdd.id,
      email: mockUserToAdd.email,
      role: mockUserToAdd.role,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: {
            workspace: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            userWorkspace: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateWorkspaceDto = {
      name: 'Test Workspace',
      repositoryId: 'repo-id',
    };
    const userId = mockUser.id;

    it('should create a workspace successfully', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'create').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(prismaService.workspace.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          ownerId: userId,
          repositoryId: createDto.repositoryId,
        },
      });
      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId: mockWorkspace.id,
          action: 'CREATE_WORKSPACE',
          details: {
            workspaceName: createDto.name,
          },
        },
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should throw BadRequestException if creation fails', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'create').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const userId = mockUser.id;

    it('should return owned and member workspaces', async () => {
      // Arrange
      const ownedWorkspaces = [mockWorkspaceWithIncludes];
      const memberWorkspaces = [
        {
          id: 'user-workspace-id-2',
          userId: userId,
          workspaceId: 'workspace-2',
          role: WorkspaceRole.MEMBER,
          createdAt: mockDate,
          updatedAt: mockDate,
          workspace: { ...mockWorkspaceWithIncludes, id: 'workspace-2', name: 'Another Workspace' },
        },
      ];

      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(ownedWorkspaces);
      jest.spyOn(prismaService.userWorkspace, 'findMany').mockResolvedValue(memberWorkspaces);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(prismaService.workspace.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: userId,
        },
        include: {
          repository: true,
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
      expect(prismaService.userWorkspace.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        include: {
          workspace: {
            include: {
              repository: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Should return combined workspaces without duplicates
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockWorkspaceWithIncludes.id);
      expect(result[1].id).toBe('workspace-2');
    });
  });

  describe('findOne', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;

    it('should return a workspace if user is the owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspaceWithIncludes);

      // Act
      const result = await service.findOne(workspaceId, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: {
          repository: true,
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
          userWorkspaces: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          scans: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
          schedules: true,
        },
      });
      expect(result).toEqual(mockWorkspaceWithIncludes);
    });

    it('should return a workspace if user is a member', async () => {
      // Arrange
      const memberUserId = 'member-id';
      const workspaceWithMember = {
        ...mockWorkspaceWithIncludes,
        ownerId: 'other-owner-id',
        userWorkspaces: [
          {
            id: 'user-workspace-id',
            userId: memberUserId,
            workspaceId: workspaceId,
            role: WorkspaceRole.MEMBER,
            createdAt: mockDate,
            updatedAt: mockDate,
            user: {
              id: memberUserId,
              email: 'member@example.com',
              role: UserRole.MEMBER,
    mfaSecret: null,
    mfaEnabled: false,
            },
          },
        ],
      };

      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(workspaceWithMember);

      // Act
      const result = await service.findOne(workspaceId, memberUserId);

      // Assert
      expect(result).toEqual(workspaceWithMember);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const unauthorizedUserId = 'unauthorized-id';
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspaceWithIncludes);

      // Act & Assert
      await expect(service.findOne(workspaceId, unauthorizedUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;
    const updateDto: UpdateWorkspaceDto = {
      name: 'Updated Workspace Name',
    };
    const updatedWorkspace = {
      ...mockWorkspace,
      name: updateDto.name || mockWorkspace.name, // Ensure name is never undefined
    };

    it('should update a workspace if user is the owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.workspace, 'update').mockResolvedValue(updatedWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.update(workspaceId, updateDto, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(prismaService.workspace.update).toHaveBeenCalledWith({
        where: { id: workspaceId },
        data: updateDto,
      });
      expect(prismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(updatedWorkspace);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(workspaceId, updateDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const nonOwnerUserId = 'non-owner-id';
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
      });

      // Act & Assert
      await expect(service.update(workspaceId, updateDto, nonOwnerUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if update fails', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.workspace, 'update').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.update(workspaceId, updateDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;

    it('should delete a workspace if user is the owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.workspace, 'delete').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.remove(workspaceId, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(prismaService.auditLog.create).toHaveBeenCalled();
      expect(prismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(result).toEqual({ message: `Workspace with ID ${workspaceId} deleted successfully` });
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const nonOwnerUserId = 'non-owner-id';
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
      });

      // Act & Assert
      await expect(service.remove(workspaceId, nonOwnerUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if deletion fails', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);
      jest.spyOn(prismaService.workspace, 'delete').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.remove(workspaceId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addUser', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;
    const addUserDto: AddUserToWorkspaceDto = {
      email: mockUserToAdd.email,
      role: WorkspaceRole.MEMBER,
    };

    it('should add a user to a workspace if current user is the owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUserToAdd);
      jest.spyOn(prismaService.userWorkspace, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.userWorkspace, 'create').mockResolvedValue(mockUserWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.addUser(workspaceId, addUserDto, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: addUserDto.email },
      });
      expect(prismaService.userWorkspace.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: mockUserToAdd.id,
            workspaceId,
          },
        },
      });
      expect(prismaService.userWorkspace.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserToAdd.id,
          workspaceId,
          role: addUserDto.role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
      expect(prismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockUserWorkspace);
    });

    it('should add a user to a workspace if current user is an admin', async () => {
      // Arrange
      const adminId = mockAdminUser.id;
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
      });
      jest
        .spyOn(prismaService.userWorkspace, 'findUnique')
        .mockResolvedValueOnce({
          // First call: check if admin has access
          userId: adminId,
          workspaceId,
          role: WorkspaceRole.ADMIN,
        } as any)
        .mockResolvedValueOnce(null); // Second call: check if user to add exists in workspace

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUserToAdd);
      jest.spyOn(prismaService.userWorkspace, 'create').mockResolvedValue(mockUserWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.addUser(workspaceId, addUserDto, adminId);

      // Assert
      expect(result).toEqual(mockUserWorkspace);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner or admin', async () => {
      // Arrange
      const regularUserId = 'regular-user-id';
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-owner-id',
      });
      jest.spyOn(prismaService.userWorkspace, 'findUnique').mockResolvedValue({
        userId: regularUserId,
        workspaceId,
        role: WorkspaceRole.MEMBER,
      } as any);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, regularUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user to add is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already in workspace', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUserToAdd);
      jest.spyOn(prismaService.userWorkspace, 'findUnique').mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeUser', () => {
    const workspaceId = mockWorkspace.id;
    const userId = mockUser.id;
    const userIdToRemove = mockUserToAdd.id;

    it('should remove a user from workspace if current user is the owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.userWorkspace, 'findUnique').mockResolvedValue(mockUserWorkspace);
      jest.spyOn(prismaService.userWorkspace, 'delete').mockResolvedValue(mockUserWorkspace);
      jest.spyOn(prismaService.auditLog, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.removeUser(workspaceId, userIdToRemove, userId);

      // Assert
      expect(prismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(prismaService.userWorkspace.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: userIdToRemove,
            workspaceId,
          },
        },
      });
      expect(prismaService.userWorkspace.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: userIdToRemove,
            workspaceId,
          },
        },
      });
      expect(prismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual({ message: `User removed from workspace successfully` });
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeUser(workspaceId, userIdToRemove, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to remove workspace owner', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);

      // Act & Assert
      await expect(service.removeUser(workspaceId, mockWorkspace.ownerId, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user to remove is not in workspace', async () => {
      // Arrange
      jest.spyOn(prismaService.workspace, 'findUnique').mockResolvedValue(mockWorkspace);
      jest.spyOn(prismaService.userWorkspace, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeUser(workspaceId, userIdToRemove, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
