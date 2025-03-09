import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  // Create mock dependencies
  const mockPrismaService = {
    workspace: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userWorkspace: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new WorkspacesService(mockPrismaService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createWorkspaceDto = {
      name: 'Test Workspace',
      repositoryId: 'repo-id',
    };

    const userId = 'user-id';

    const mockWorkspace = {
      id: 'workspace-id',
      name: 'Test Workspace',
      repositoryId: 'repo-id',
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a workspace successfully', async () => {
      // Arrange
      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.create(createWorkspaceDto, userId);

      // Assert
      expect(mockPrismaService.workspace.create).toHaveBeenCalledWith({
        data: {
          name: createWorkspaceDto.name,
          ownerId: userId,
          repositoryId: createWorkspaceDto.repositoryId,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId: mockWorkspace.id,
          action: 'CREATE_WORKSPACE',
          details: {
            workspaceName: mockWorkspace.name,
          },
        },
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should throw BadRequestException if there is an error during creation', async () => {
      // Arrange
      mockPrismaService.workspace.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createWorkspaceDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const userId = 'user-id';

    it('should return all workspaces for a user', async () => {
      // Arrange
      const ownedWorkspaces = [
        { id: 'workspace-1', name: 'Owned Workspace 1' },
        { id: 'workspace-2', name: 'Owned Workspace 2' },
      ];

      const memberWorkspaces = [
        { workspace: { id: 'workspace-3', name: 'Member Workspace 1' } },
        { workspace: { id: 'workspace-4', name: 'Member Workspace 2' } },
      ];

      mockPrismaService.workspace.findMany.mockResolvedValue(ownedWorkspaces);
      mockPrismaService.userWorkspace.findMany.mockResolvedValue(memberWorkspaces);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(mockPrismaService.workspace.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: userId,
        },
        include: expect.any(Object),
      });
      expect(mockPrismaService.userWorkspace.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        include: expect.any(Object),
      });

      // Should combine owned and member workspaces
      expect(result.length).toBe(4);
      expect(result).toContainEqual(ownedWorkspaces[0]);
      expect(result).toContainEqual(ownedWorkspaces[1]);
      expect(result).toContainEqual(memberWorkspaces[0].workspace);
      expect(result).toContainEqual(memberWorkspaces[1].workspace);
    });
  });

  describe('findOne', () => {
    const workspaceId = 'workspace-id';
    const userId = 'user-id';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Test Workspace',
      ownerId: userId,
      repository: null,
      owner: {
        id: userId,
        email: 'owner@example.com',
      },
      userWorkspaces: [],
      scans: [],
      schedules: [],
    };

    it('should return a workspace by id when user is the owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      // Act
      const result = await service.findOne(workspaceId, userId);

      // Assert
      expect(mockPrismaService.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should return a workspace by id when user is a member', async () => {
      // Arrange
      const memberUserId = 'member-user-id';
      const workspaceWithMember = {
        ...mockWorkspace,
        ownerId: 'other-owner-id',
        userWorkspaces: [{ user: { id: memberUserId } }],
      };
      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithMember);

      // Act
      const result = await service.findOne(workspaceId, memberUserId);

      // Assert
      expect(result).toEqual(workspaceWithMember);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const noAccessUserId = 'no-access-user-id';
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      // Act & Assert
      await expect(service.findOne(workspaceId, noAccessUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const workspaceId = 'workspace-id';
    const userId = 'user-id';
    const updateWorkspaceDto = {
      name: 'Updated Workspace',
    };

    const mockWorkspace = {
      id: workspaceId,
      name: 'Test Workspace',
      ownerId: userId,
    };

    const updatedWorkspace = {
      ...mockWorkspace,
      name: 'Updated Workspace',
    };

    it('should update a workspace when user is the owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.update.mockResolvedValue(updatedWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.update(workspaceId, updateWorkspaceDto, userId);

      // Assert
      expect(mockPrismaService.workspace.update).toHaveBeenCalledWith({
        where: { id: workspaceId },
        data: updateWorkspaceDto,
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(updatedWorkspace);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(workspaceId, updateWorkspaceDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const nonOwnerUserId = 'non-owner-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };
      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);

      // Act & Assert
      await expect(service.update(workspaceId, updateWorkspaceDto, nonOwnerUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if there is an error during update', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.update(workspaceId, updateWorkspaceDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const workspaceId = 'workspace-id';
    const userId = 'user-id';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Test Workspace',
      ownerId: userId,
    };

    it('should remove a workspace when user is the owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.delete.mockResolvedValue(mockWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.remove(workspaceId, userId);

      // Assert
      expect(mockPrismaService.workspace.delete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual({ message: `Workspace with ID ${workspaceId} deleted successfully` });
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(workspaceId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const nonOwnerUserId = 'non-owner-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };
      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);

      // Act & Assert
      await expect(service.remove(workspaceId, nonOwnerUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if there is an error during deletion', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.workspace.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.remove(workspaceId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addUser', () => {
    const workspaceId = 'workspace-id';
    const userId = 'owner-id';
    const addUserDto = {
      email: 'user@example.com',
      role: 'MEMBER',
    };

    const mockWorkspace = {
      id: workspaceId,
      name: 'Test Workspace',
      ownerId: userId,
    };

    const mockUserToAdd = {
      id: 'user-to-add-id',
      email: 'user@example.com',
    };

    const mockUserWorkspace = {
      id: 'user-workspace-id',
      userId: mockUserToAdd.id,
      workspaceId,
      role: 'MEMBER',
      user: mockUserToAdd,
    };

    it('should add a user to a workspace when user is the owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserToAdd);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue(null);
      mockPrismaService.userWorkspace.create.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.addUser(workspaceId, addUserDto, userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: addUserDto.email },
      });
      expect(mockPrismaService.userWorkspace.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserToAdd.id,
          workspaceId,
          role: addUserDto.role,
        },
        include: {
          user: expect.any(Object),
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockUserWorkspace);
    });

    it('should add a user to a workspace when user is an admin', async () => {
      // Arrange
      const adminUserId = 'admin-user-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };
      const mockUserWorkspaceForAdmin = {
        userId: adminUserId,
        workspaceId,
        role: 'ADMIN',
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);
      mockPrismaService.userWorkspace.findUnique.mockImplementation(args => {
        if (args.where.userId_workspaceId.userId === mockUserToAdd.id) {
          return null;
        }
        return mockUserWorkspaceForAdmin;
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserToAdd);
      mockPrismaService.userWorkspace.create.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.addUser(workspaceId, addUserDto, adminUserId);

      // Assert
      expect(mockPrismaService.userWorkspace.create).toHaveBeenCalled();
      expect(result).toEqual(mockUserWorkspace);
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner or admin', async () => {
      // Arrange
      const regularUserId = 'regular-user-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue({
        userId: regularUserId,
        workspaceId,
        role: 'MEMBER',
      });

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, regularUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user to add is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already in workspace', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserToAdd);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue({});

      // Act & Assert
      await expect(service.addUser(workspaceId, addUserDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeUser', () => {
    const workspaceId = 'workspace-id';
    const ownerUserId = 'owner-id';
    const userToRemoveId = 'user-to-remove-id';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Test Workspace',
      ownerId: ownerUserId,
    };

    const mockUserWorkspace = {
      userId: userToRemoveId,
      workspaceId,
      role: 'MEMBER',
    };

    it('should remove a user from a workspace when user is the owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.userWorkspace.delete.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.removeUser(workspaceId, userToRemoveId, ownerUserId);

      // Assert
      expect(mockPrismaService.userWorkspace.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: userToRemoveId,
            workspaceId,
          },
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User removed from workspace successfully' });
    });

    it('should remove a user from a workspace when user is an admin', async () => {
      // Arrange
      const adminUserId = 'admin-user-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };
      const mockUserWorkspaceForAdmin = {
        userId: adminUserId,
        workspaceId,
        role: 'ADMIN',
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);
      mockPrismaService.userWorkspace.findUnique.mockImplementation(args => {
        if (args.where.userId_workspaceId?.userId === adminUserId) {
          return mockUserWorkspaceForAdmin;
        }
        return mockUserWorkspace;
      });
      mockPrismaService.userWorkspace.delete.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Act
      const result = await service.removeUser(workspaceId, userToRemoveId, adminUserId);

      // Assert
      expect(mockPrismaService.userWorkspace.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User removed from workspace successfully' });
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeUser(workspaceId, userToRemoveId, ownerUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner or admin', async () => {
      // Arrange
      const regularUserId = 'regular-user-id';
      const workspaceWithDifferentOwner = {
        ...mockWorkspace,
        ownerId: 'different-owner-id',
      };

      mockPrismaService.workspace.findUnique.mockResolvedValue(workspaceWithDifferentOwner);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue({
        userId: regularUserId,
        workspaceId,
        role: 'MEMBER',
      });

      // Act & Assert
      await expect(service.removeUser(workspaceId, userToRemoveId, regularUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trying to remove the workspace owner', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      // Act & Assert
      await expect(service.removeUser(workspaceId, ownerUserId, ownerUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user to remove is not in workspace', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeUser(workspaceId, userToRemoveId, ownerUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if there is an error during removal', async () => {
      // Arrange
      mockPrismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrismaService.userWorkspace.findUnique.mockResolvedValue(mockUserWorkspace);
      mockPrismaService.userWorkspace.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.removeUser(workspaceId, userToRemoveId, ownerUserId)).rejects.toThrow(BadRequestException);
    });
  });
});
