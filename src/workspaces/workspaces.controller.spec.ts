import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspacesController } from './workspaces.controller';

// Create mock service
const mockWorkspacesService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  addUser: vi.fn(),
  removeUser: vi.fn(),
};

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new WorkspacesController(mockWorkspacesService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      // Arrange
      const createWorkspaceDto = {
        name: 'Test Workspace',
        repositoryId: 'repo-id',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockWorkspace = {
        id: 'workspace-id',
        name: 'Test Workspace',
        repositoryId: 'repo-id',
        ownerId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWorkspacesService.create.mockResolvedValue(mockWorkspace);

      // Act
      const result = await controller.create(createWorkspaceDto, mockRequest);

      // Assert
      expect(mockWorkspacesService.create).toHaveBeenCalledWith(createWorkspaceDto, 'user-id');
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('findAll', () => {
    it('should return all accessible workspaces', async () => {
      // Arrange
      const mockRequest = { user: { sub: 'user-id' } };
      const mockWorkspaces = [
        { id: 'workspace-1', name: 'Workspace 1' },
        { id: 'workspace-2', name: 'Workspace 2' },
      ];
      mockWorkspacesService.findAll.mockResolvedValue(mockWorkspaces);

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(mockWorkspacesService.findAll).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('findOne', () => {
    it('should return a workspace by id', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockWorkspace = {
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: 'user-id',
      };
      mockWorkspacesService.findOne.mockResolvedValue(mockWorkspace);

      // Act
      const result = await controller.findOne(workspaceId, mockRequest);

      // Assert
      expect(mockWorkspacesService.findOne).toHaveBeenCalledWith(workspaceId, 'user-id');
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const updateWorkspaceDto = {
        name: 'Updated Workspace',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockWorkspace = {
        id: workspaceId,
        name: 'Updated Workspace',
        ownerId: 'user-id',
        updatedAt: new Date(),
      };
      mockWorkspacesService.update.mockResolvedValue(mockWorkspace);

      // Act
      const result = await controller.update(workspaceId, updateWorkspaceDto, mockRequest);

      // Assert
      expect(mockWorkspacesService.update).toHaveBeenCalledWith(workspaceId, updateWorkspaceDto, 'user-id');
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('remove', () => {
    it('should remove a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockResponse = { message: `Workspace with ID ${workspaceId} deleted successfully` };
      mockWorkspacesService.remove.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.remove(workspaceId, mockRequest);

      // Assert
      expect(mockWorkspacesService.remove).toHaveBeenCalledWith(workspaceId, 'user-id');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addUser', () => {
    it('should add a user to a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const addUserDto = {
        email: 'user@example.com',
        role: 'MEMBER',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const mockUserWorkspace = {
        id: 'user-workspace-id',
        userId: 'added-user-id',
        workspaceId,
        role: 'MEMBER',
        user: {
          id: 'added-user-id',
          email: 'user@example.com',
        },
      };
      mockWorkspacesService.addUser.mockResolvedValue(mockUserWorkspace);

      // Act
      const result = await controller.addUser(workspaceId, addUserDto, mockRequest);

      // Assert
      expect(mockWorkspacesService.addUser).toHaveBeenCalledWith(workspaceId, addUserDto, 'user-id');
      expect(result).toEqual(mockUserWorkspace);
    });
  });

  describe('removeUser', () => {
    it('should remove a user from a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const userId = 'user-to-remove-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const mockResponse = { message: 'User removed from workspace successfully' };
      mockWorkspacesService.removeUser.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.removeUser(workspaceId, userId, mockRequest);

      // Assert
      expect(mockWorkspacesService.removeUser).toHaveBeenCalledWith(workspaceId, userId, 'user-id');
      expect(result).toEqual(mockResponse);
    });
  });
});
