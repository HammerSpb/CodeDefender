import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepositoriesService } from './repositories.service';

// Mock UserRole enum
const UserRole = {
  SUPER: 'SUPER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  SUPPORT: 'SUPPORT',
};

describe('RepositoriesService', () => {
  let service: RepositoriesService;

  // Create mock dependencies
  const mockPrismaService = {
    repository: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    workspace: {
      findMany: vi.fn(),
    },
    userWorkspace: {
      findMany: vi.fn(),
    },
  };

  const mockAuditLogsService = {
    create: vi.fn(),
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new RepositoriesService(mockPrismaService as any, mockAuditLogsService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createRepositoryDto = {
      url: 'https://github.com/test/repo',
      provider: 'GITHUB',
      accessToken: 'github_token',
    };

    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      role: UserRole.OWNER,
    };

    const mockRepository = {
      id: 'repo-id',
      url: 'https://github.com/test/repo',
      provider: 'GITHUB',
      accessToken: 'github_token',
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a repository successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.create.mockResolvedValue(mockRepository);
      mockAuditLogsService.create.mockResolvedValue({});

      // Act
      const result = await service.create(createRepositoryDto, userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.repository.create).toHaveBeenCalledWith({
        data: {
          url: createRepositoryDto.url,
          provider: createRepositoryDto.provider,
          accessToken: createRepositoryDto.accessToken,
          ownerId: userId,
        },
      });
      expect(mockAuditLogsService.create).toHaveBeenCalledWith({
        userId,
        action: 'CREATE_REPOSITORY',
        details: expect.any(Object),
      });
      expect(result).toEqual(mockRepository);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createRepositoryDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const userId = 'user-id';

    it('should return all repositories for a SUPER user', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.SUPER };
      const mockRepositories = [{ id: 'repo-1' }, { id: 'repo-2' }];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findMany.mockResolvedValue(mockRepositories);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.repository.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRepositories);
    });

    it('should return owned repositories for an OWNER user', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.OWNER };
      const mockRepositories = [{ id: 'repo-1' }];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findMany.mockResolvedValue(mockRepositories);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(mockPrismaService.repository.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
      expect(result).toEqual(mockRepositories);
    });

    it('should return repositories from workspaces for regular users', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.MEMBER };
      const mockUserWorkspaces = [{ workspace: { repositoryId: 'repo-1' } }, { workspace: { repositoryId: 'repo-2' } }];
      const mockRepositories = [{ id: 'repo-1' }, { id: 'repo-2' }];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userWorkspace.findMany.mockResolvedValue(mockUserWorkspaces);
      mockPrismaService.repository.findMany.mockResolvedValue(mockRepositories);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(mockPrismaService.userWorkspace.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          workspace: {
            select: {
              repositoryId: true,
            },
          },
        },
      });
      expect(mockPrismaService.repository.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['repo-1', 'repo-2'],
          },
        },
      });
      expect(result).toEqual(mockRepositories);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAll(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';
    const mockRepository = {
      id: repositoryId,
      ownerId: 'owner-id',
    };

    it('should return a repository for a SUPER user', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.SUPER };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);

      // Act
      const result = await service.findOne(repositoryId, userId);

      // Assert
      expect(mockPrismaService.repository.findUnique).toHaveBeenCalledWith({
        where: { id: repositoryId },
      });
      expect(result).toEqual(mockRepository);
    });

    it('should return a repository for its owner', async () => {
      // Arrange
      const ownerId = 'owner-id';
      const mockUser = { id: ownerId, role: UserRole.OWNER };
      const mockOwnedRepository = { ...mockRepository, ownerId };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findUnique.mockResolvedValue(mockOwnedRepository);

      // Act
      const result = await service.findOne(repositoryId, ownerId);

      // Assert
      expect(result).toEqual(mockOwnedRepository);
    });

    it('should check workspace access for regular users', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.MEMBER };
      const mockWorkspaces = [{ id: 'workspace-1' }];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.workspace.findMany.mockResolvedValue(mockWorkspaces);

      // Act
      const result = await service.findOne(repositoryId, userId);

      // Assert
      expect(mockPrismaService.workspace.findMany).toHaveBeenCalledWith({
        where: {
          repositoryId,
          OR: [
            { ownerId: userId },
            {
              userWorkspaces: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      });
      expect(result).toEqual(mockRepository);
    });

    it('should throw NotFoundException if repository is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, role: UserRole.SUPER });
      mockPrismaService.repository.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(repositoryId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const mockUser = { id: userId, role: UserRole.MEMBER };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.workspace.findMany.mockResolvedValue([]);

      // Act & Assert
      await expect(service.findOne(repositoryId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';
    const updateRepositoryDto = {
      url: 'https://github.com/updated/repo',
    };
    const mockRepository = {
      id: repositoryId,
      ownerId: userId,
    };
    const updatedRepository = { ...mockRepository, url: updateRepositoryDto.url };

    it('should update a repository when user is the owner', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, role: UserRole.OWNER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.repository.update.mockResolvedValue(updatedRepository);
      mockAuditLogsService.create.mockResolvedValue({});

      // Act
      const result = await service.update(repositoryId, updateRepositoryDto, userId);

      // Assert
      expect(mockPrismaService.repository.update).toHaveBeenCalledWith({
        where: { id: repositoryId },
        data: updateRepositoryDto,
      });
      expect(mockAuditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(updatedRepository);
    });

    it('should update a repository when user is a SUPER user', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'super-id', role: UserRole.SUPER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.repository.update.mockResolvedValue(updatedRepository);
      mockAuditLogsService.create.mockResolvedValue({});

      // Act
      const result = await service.update(repositoryId, updateRepositoryDto, 'super-id');

      // Assert
      expect(mockPrismaService.repository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedRepository);
    });

    it('should throw ForbiddenException if user is not owner or SUPER', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'other-id', role: UserRole.MEMBER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);

      // Act & Assert
      await expect(service.update(repositoryId, updateRepositoryDto, 'other-id')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';
    const mockRepository = {
      id: repositoryId,
      ownerId: userId,
      url: 'https://github.com/test/repo',
    };

    it('should delete a repository when user is the owner', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, role: UserRole.OWNER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.workspace.findMany.mockResolvedValue([]);
      mockPrismaService.repository.delete.mockResolvedValue(mockRepository);
      mockAuditLogsService.create.mockResolvedValue({});

      // Act
      const result = await service.remove(repositoryId, userId);

      // Assert
      expect(mockPrismaService.workspace.findMany).toHaveBeenCalledWith({
        where: { repositoryId },
      });
      expect(mockPrismaService.repository.delete).toHaveBeenCalledWith({
        where: { id: repositoryId },
      });
      expect(mockAuditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockRepository);
    });

    it('should throw ForbiddenException if repository is linked to workspaces', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, role: UserRole.OWNER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);
      mockPrismaService.workspace.findMany.mockResolvedValue([{ id: 'workspace-1' }]);

      // Act & Assert
      await expect(service.remove(repositoryId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not owner or SUPER', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'other-id', role: UserRole.MEMBER });
      mockPrismaService.repository.findUnique.mockResolvedValue(mockRepository);

      // Act & Assert
      await expect(service.remove(repositoryId, 'other-id')).rejects.toThrow(ForbiddenException);
    });
  });
});
