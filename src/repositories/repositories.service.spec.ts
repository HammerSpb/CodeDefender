import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { RepositoryProvider, UserRole, WorkspaceRole } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('RepositoriesService', () => {
  let service: RepositoriesService;
  let prismaService: PrismaService;
  let auditLogsService: AuditLogsService;

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

  const mockSuperUser = {
    ...mockUser,
    id: 'super-id',
    role: UserRole.SUPER,
  };

  const mockMemberUser = {
    ...mockUser,
    id: 'member-id',
    role: UserRole.MEMBER,
  };

  const mockRepository = {
    id: 'repo-id',
    url: 'https://github.com/user/repo',
    provider: RepositoryProvider.GITHUB,
    accessToken: 'github_token',
    ownerId: 'user-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockRepositories = [
    mockRepository,
    {
      ...mockRepository,
      id: 'repo-2',
      ownerId: 'other-id',
    },
  ];

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    ownerId: 'user-id',
    repositoryId: 'repo-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoriesService,
        {
          provide: PrismaService,
          useValue: {
            repository: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            workspace: {
              findMany: jest.fn(),
            },
            userWorkspace: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RepositoriesService>(RepositoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateRepositoryDto = {
      url: 'https://github.com/user/repo',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_token',
    };
    const userId = 'user-id';

    it('should create a repository successfully', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.repository, 'create').mockResolvedValue(mockRepository);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.repository.create).toHaveBeenCalledWith({
        data: {
          url: createDto.url,
          provider: createDto.provider,
          accessToken: createDto.accessToken,
          ownerId: userId,
        },
      });
      expect(auditLogsService.create).toHaveBeenCalledWith({
        userId,
        action: 'CREATE_REPOSITORY',
        details: {
          repositoryUrl: mockRepository.url,
          provider: mockRepository.provider,
        },
      });
      expect(result).toEqual(mockRepository);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = 'user-id';

    it('should return all repositories for a SUPER user', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockSuperUser);
      jest.spyOn(prismaService.repository, 'findMany').mockResolvedValue(mockRepositories);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.repository.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRepositories);
    });

    it('should return owned repositories for an OWNER user', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.repository, 'findMany').mockResolvedValue([mockRepository]);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(prismaService.repository.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
      });
      expect(result).toEqual([mockRepository]);
    });

    it('should return repositories from workspaces for regular users', async () => {
      // Arrange
      const mockUserWorkspaces = [
        { workspace: { repositoryId: 'repo-1' }, id: 'uw-1', role: WorkspaceRole.MEMBER, createdAt: mockDate, updatedAt: mockDate, userId: 'user-id', workspaceId: 'workspace-1' },
        { workspace: { repositoryId: 'repo-2' }, id: 'uw-2', role: WorkspaceRole.MEMBER, createdAt: mockDate, updatedAt: mockDate, userId: 'user-id', workspaceId: 'workspace-2' },
      ];
      
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockMemberUser);
      jest.spyOn(prismaService.userWorkspace, 'findMany').mockResolvedValue(mockUserWorkspaces);
      jest.spyOn(prismaService.repository, 'findMany').mockResolvedValue(mockRepositories);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(prismaService.userWorkspace.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          workspace: {
            select: {
              repositoryId: true,
            },
          },
        },
      });
      expect(prismaService.repository.findMany).toHaveBeenCalledWith({
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
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAll(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';

    it('should return a repository for a SUPER user', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockSuperUser);
      jest.spyOn(prismaService.repository, 'findUnique').mockResolvedValue(mockRepository);

      // Act
      const result = await service.findOne(repositoryId, userId);

      // Assert
      expect(prismaService.repository.findUnique).toHaveBeenCalledWith({
        where: { id: repositoryId },
      });
      expect(result).toEqual(mockRepository);
    });

    it('should return a repository for its owner', async () => {
      // Arrange
      const ownerId = 'user-id';
      const mockOwnedRepository = { ...mockRepository, ownerId };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.repository, 'findUnique').mockResolvedValue(mockOwnedRepository);

      // Act
      const result = await service.findOne(repositoryId, ownerId);

      // Assert
      expect(result).toEqual(mockOwnedRepository);
    });

    it('should check workspace access for regular users', async () => {
      // Arrange
      const mockWorkspaces = [mockWorkspace];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockMemberUser);
      jest.spyOn(prismaService.repository, 'findUnique').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue(mockWorkspaces);

      // Act
      const result = await service.findOne(repositoryId, userId);

      // Assert
      expect(prismaService.workspace.findMany).toHaveBeenCalledWith({
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
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockSuperUser);
      jest.spyOn(prismaService.repository, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(repositoryId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockMemberUser);
      jest.spyOn(prismaService.repository, 'findUnique').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue([]);

      // Act & Assert
      await expect(service.findOne(repositoryId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';
    const updateDto: UpdateRepositoryDto = {
      url: 'https://github.com/user/updated-repo',
    };
    const updatedRepository = {
      ...mockRepository,
      url: updateDto.url || mockRepository.url, // Ensure url is never undefined
    };

    it('should update a repository when user is the owner', async () => {
      // Arrange
      // Setup for findOne call
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.repository, 'update').mockResolvedValue(updatedRepository);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.update(repositoryId, updateDto, userId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(repositoryId, userId);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.repository.update).toHaveBeenCalledWith({
        where: { id: repositoryId },
        data: updateDto,
      });
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(updatedRepository);
    });

    it('should update a repository when user is a SUPER user', async () => {
      // Arrange
      // Setup for findOne call
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockSuperUser);
      jest.spyOn(prismaService.repository, 'update').mockResolvedValue(updatedRepository);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.update(repositoryId, updateDto, 'super-id');

      // Assert
      expect(prismaService.repository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedRepository);
    });

    it('should throw ForbiddenException if user is not owner or SUPER', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockMemberUser);

      // Act & Assert
      await expect(service.update(repositoryId, updateDto, 'other-id')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const repositoryId = 'repo-id';
    const userId = 'user-id';

    it('should delete a repository when user is the owner', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.repository, 'delete').mockResolvedValue(mockRepository);
      jest.spyOn(auditLogsService, 'create').mockResolvedValue({} as any);

      // Act
      const result = await service.remove(repositoryId, userId);

      // Assert
      expect(prismaService.workspace.findMany).toHaveBeenCalledWith({
        where: { repositoryId },
      });
      expect(prismaService.repository.delete).toHaveBeenCalledWith({
        where: { id: repositoryId },
      });
      expect(auditLogsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockRepository);
    });

    it('should throw ForbiddenException if repository is linked to workspaces', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.workspace, 'findMany').mockResolvedValue([mockWorkspace]);

      // Act & Assert
      await expect(service.remove(repositoryId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not owner or SUPER', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRepository);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockMemberUser);

      // Act & Assert
      await expect(service.remove(repositoryId, 'other-id')).rejects.toThrow(ForbiddenException);
    });
  });
});
