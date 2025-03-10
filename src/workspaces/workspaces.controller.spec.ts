import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddUserToWorkspaceDto } from './dto/add-user-to-workspace.dto';
import { RepositoryProvider, UserRole, WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

// Mock the guards
jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock('../common/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let service: WorkspacesService;

  // Test data setup
  const mockDate = new Date();
  const mockWorkspace = {
    id: 'workspace-id',
    name: 'Test Workspace',
    ownerId: 'user-id',
    repositoryId: 'repo-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockWorkspaceWithDetails = {
    ...mockWorkspace,
    repository: {
      id: 'repo-id',
      url: 'https://github.com/user/repo',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_token',
      ownerId: 'user-id',
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    owner: {
      id: 'user-id',
      email: 'test@example.com',
    },
    userWorkspaces: [
      {
        id: 'user-workspace-id',
        userId: 'user-id',
        workspaceId: 'workspace-id',
        role: WorkspaceRole.ADMIN,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          id: 'user-id',
          email: 'test@example.com',
          role: UserRole.OWNER,
        },
      },
    ],
    scans: [],
    schedules: [],
  };

  const mockUserWorkspace = {
    id: 'user-workspace-id',
    userId: 'new-user-id',
    workspaceId: 'workspace-id',
    role: WorkspaceRole.MEMBER,
    createdAt: mockDate,
    updatedAt: mockDate,
    user: {
      id: 'new-user-id',
      email: 'newuser@example.com',
      role: UserRole.MEMBER,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            addUser: jest.fn(),
            removeUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'jwt.secret') return 'test-secret';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
    service = module.get<WorkspacesService>(WorkspacesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      // Arrange
      const createDto: CreateWorkspaceDto = {
        name: 'Test Workspace',
        repositoryId: 'repo-id',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      
      jest.spyOn(service, 'create').mockResolvedValue(mockWorkspace);

      // Act
      const result = await controller.create(createDto, mockRequest);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, mockRequest.user.sub);
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('findAll', () => {
    it('should return an array of workspaces', async () => {
      // Arrange
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = [mockWorkspaceWithDetails];
      
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockWorkspaceWithDetails);

      // Act
      const result = await controller.findOne(workspaceId, mockRequest);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(workspaceId, mockRequest.user.sub);
      expect(result).toEqual(mockWorkspaceWithDetails);
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const updateDto: UpdateWorkspaceDto = {
        name: 'Updated Workspace Name',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = {
        ...mockWorkspace,
        name: 'Updated Workspace Name',
      };
      
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(workspaceId, updateDto, mockRequest);

      // Assert
      expect(service.update).toHaveBeenCalledWith(workspaceId, updateDto, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = { message: 'Workspace with ID workspace-id deleted successfully' };
      
      jest.spyOn(service, 'remove').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.remove(workspaceId, mockRequest);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(workspaceId, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addUser', () => {
    it('should add a user to a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const addUserDto: AddUserToWorkspaceDto = {
        email: 'newuser@example.com',
        role: WorkspaceRole.MEMBER,
      };
      const mockRequest = { user: { sub: 'user-id' } };
      
      jest.spyOn(service, 'addUser').mockResolvedValue(mockUserWorkspace);

      // Act
      const result = await controller.addUser(workspaceId, addUserDto, mockRequest);

      // Assert
      expect(service.addUser).toHaveBeenCalledWith(workspaceId, addUserDto, mockRequest.user.sub);
      expect(result).toEqual(mockUserWorkspace);
    });
  });

  describe('removeUser', () => {
    it('should remove a user from a workspace', async () => {
      // Arrange
      const workspaceId = 'workspace-id';
      const userIdToRemove = 'user-to-remove-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = { message: 'User removed from workspace successfully' };
      
      jest.spyOn(service, 'removeUser').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.removeUser(workspaceId, userIdToRemove, mockRequest);

      // Assert
      expect(service.removeUser).toHaveBeenCalledWith(workspaceId, userIdToRemove, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });
});
