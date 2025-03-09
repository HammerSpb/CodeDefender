import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;

  // Create mock dependencies
  const mockPrismaService = {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new UsersService(mockPrismaService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
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

    it('should create a user successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          password: 'hashed_password',
          role: createUserDto.role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          orgName: true,
          plan: true,
          ownerId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: createUserDto.email,
      });

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if there is an error during creation', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          role: true,
          orgName: true,
          plan: true,
          ownerId: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
      role: 'MEMBER',
      createdAt: new Date(),
      userWorkspaces: [],
    };

    it('should return a user by id', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          orgName: true,
          plan: true,
          ownerId: true,
          createdAt: true,
          userWorkspaces: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 'user-id';
    const updateUserDto = {
      email: 'updated@example.com',
    };
    const mockUser = {
      id: userId,
      email: 'user@example.com',
    };
    const updatedUser = {
      id: userId,
      email: 'updated@example.com',
      updatedAt: new Date(),
    };

    it('should update a user successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(userId, updateUserDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          role: true,
          orgName: true,
          plan: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided in update', async () => {
      // Arrange
      const updateWithPassword = {
        ...updateUserDto,
        password: 'new_password',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      await service.update(userId, updateWithPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        }),
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if there is an error during update', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
    };

    it('should remove a user successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      // Act
      const result = await service.remove(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({ message: `User with ID ${userId} deleted successfully` });
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if there is an error during deletion', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(BadRequestException);
    });
  });
});
