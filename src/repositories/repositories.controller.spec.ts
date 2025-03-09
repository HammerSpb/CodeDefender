import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import controller
import { RepositoriesController } from './repositories.controller';

// Create mock service
const mockRepositoriesService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('RepositoriesController', () => {
  let controller: RepositoriesController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new RepositoriesController(mockRepositoriesService);

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a repository', async () => {
      // Arrange
      const createDto = {
        url: 'https://github.com/test/repo',
        provider: 'GITHUB',
        accessToken: 'github_token',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockRepository = {
        id: 'repo-id',
        ...createDto,
        ownerId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepositoriesService.create.mockResolvedValue(mockRepository);

      // Act
      const result = await controller.create(createDto, mockRequest);

      // Assert
      expect(mockRepositoriesService.create).toHaveBeenCalledWith(createDto, 'user-id');
      expect(result).toEqual(mockRepository);
    });
  });

  describe('findAll', () => {
    it('should return all accessible repositories', async () => {
      // Arrange
      const mockRepos = [
        { id: 'repo-1', url: 'https://github.com/test/repo1' },
        { id: 'repo-2', url: 'https://github.com/test/repo2' },
      ];
      mockRepositoriesService.findAll.mockResolvedValue(mockRepos);
      const mockRequest = { user: { sub: 'user-id' } };

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(mockRepositoriesService.findAll).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockRepos);
    });
  });

  describe('findOne', () => {
    it('should return a repository by id', async () => {
      // Arrange
      const repositoryId = 'repo-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockRepository = {
        id: repositoryId,
        url: 'https://github.com/test/repo',
      };
      mockRepositoriesService.findOne.mockResolvedValue(mockRepository);

      // Act
      const result = await controller.findOne(repositoryId, mockRequest);

      // Assert
      expect(mockRepositoriesService.findOne).toHaveBeenCalledWith(repositoryId, 'user-id');
      expect(result).toEqual(mockRepository);
    });
  });

  describe('update', () => {
    it('should update a repository', async () => {
      // Arrange
      const repositoryId = 'repo-id';
      const updateDto = {
        url: 'https://github.com/updated/repo',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockRepository = {
        id: repositoryId,
        url: 'https://github.com/updated/repo',
        provider: 'GITHUB',
        accessToken: 'github_token',
        ownerId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepositoriesService.update.mockResolvedValue(mockRepository);

      // Act
      const result = await controller.update(repositoryId, updateDto, mockRequest);

      // Assert
      expect(mockRepositoriesService.update).toHaveBeenCalledWith(repositoryId, updateDto, 'user-id');
      expect(result).toEqual(mockRepository);
    });
  });

  describe('remove', () => {
    it('should remove a repository', async () => {
      // Arrange
      const repositoryId = 'repo-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockRepository = {
        id: repositoryId,
        url: 'https://github.com/test/repo',
      };
      mockRepositoriesService.remove.mockResolvedValue(mockRepository);

      // Act
      const result = await controller.remove(repositoryId, mockRequest);

      // Assert
      expect(mockRepositoriesService.remove).toHaveBeenCalledWith(repositoryId, 'user-id');
      expect(result).toEqual(mockRepository);
    });
  });
});
