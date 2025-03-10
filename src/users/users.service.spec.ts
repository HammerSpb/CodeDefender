import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole, Plan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

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
    plan: Plan.PRO,
    ownerId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockUserWithWorkspaces = {
    ...mockUser,
    userWorkspaces: [
      {
        id: 'user-workspace-id',
        userId: mockUser.id,
        workspaceId: 'workspace-id',
        role: 'ADMIN',
        createdAt: mockDate,
        updatedAt: mockDate,
        workspace: {
          id: 'workspace-id',
          name: 'Test Workspace',
          ownerId: mockUser.id,
          repositoryId: 'repo-id',
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      role: UserRole.MEMBER,
      orgName: 'New Org',
      plan: Plan.PRO,
      ownerId: 'owner-id',
    };

    it('should create a user successfully', async () => {
      // Arrange
      const createdUser = {
        id: 'new-user-id',
        email: createDto.email,
        password: 'hashed-password',
        role: UserRole.MEMBER, // Using concrete enum value instead of createDto.role
        provider: null,
        providerId: null,
        orgName: createDto.orgName || null,
        plan: createDto.plan || null,
        ownerId: createDto.ownerId || null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(createdUser);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createDto.email,
          password: 'hashed-password',
          role: createDto.role,
          orgName: createDto.orgName,
          plan: createDto.plan,
          ownerId: createDto.ownerId,
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
      expect(result).toEqual(expect.objectContaining({
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      }));
    });

    it('should throw ConflictException if user with email already exists', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
    });

    it('should throw BadRequestException if creation fails', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [mockUser];
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    const userId = mockUser.id;

    it('should return a user by ID with workspaces', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUserWithWorkspaces);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUserWithWorkspaces);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = mockUser.id;
    const updateDto: UpdateUserDto = {
      email: 'updated@example.com',
      role: UserRole.ADMIN,
    };

    it('should update a user successfully without password', async () => {
      // Arrange
      const updatedUser = {
        ...mockUser,
        email: updateDto.email ?? mockUser.email,
        role: updateDto.role ?? mockUser.role,
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(userId, updateDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDto,
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

    it('should update a user with password', async () => {
      // Arrange
      const updateDtoWithPassword: UpdateUserDto = {
        ...updateDto,
        password: 'newpassword123',
      };
      
      const updatedUser = {
        ...mockUser,
        email: updateDto.email ?? mockUser.email,
        role: updateDto.role ?? mockUser.role,
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(userId, updateDtoWithPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(updateDtoWithPassword.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          password: 'hashed-password',
        }),
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

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if update fails', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const userId = mockUser.id;

    it('should remove a user successfully', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser);

      // Act
      const result = await service.remove(userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({ message: `User with ID ${userId} deleted successfully` });
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if deletion fails', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'delete').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(BadRequestException);
    });
  });
});
