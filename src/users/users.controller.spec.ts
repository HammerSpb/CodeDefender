import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';

// Create mock service
const mockUsersService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new UsersController(mockUsersService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      // Arrange
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'MEMBER',
      };
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      };
      mockUsersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(createUserDto);

      // Assert
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
      };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await controller.findOne(userId);

      // Assert
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto = {
        email: 'updated@example.com',
      };
      const mockUser = {
        id: userId,
        email: 'updated@example.com',
        role: 'MEMBER',
        updatedAt: new Date(),
      };
      mockUsersService.update.mockResolvedValue(mockUser);

      // Act
      const result = await controller.update(userId, updateUserDto);

      // Assert
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange
      const userId = 'user-id';
      const mockResponse = { message: `User with ID ${userId} deleted successfully` };
      mockUsersService.remove.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.remove(userId);

      // Assert
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResponse);
    });
  });
});
