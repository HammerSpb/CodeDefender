import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Plan, UserRole, WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: UserRole.MEMBER,
    orgName: 'Test Org',
    plan: Plan.PRO, // Changed from BASIC to PRO since it doesn't exist
    ownerId: 'owner-id',
    createdAt: mockDate,
  };

  const mockUserWithWorkspaces = {
    ...mockUser,
    userWorkspaces: [
      {
        id: 'user-workspace-id',
        userId: mockUser.id,
        workspaceId: 'workspace-id',
        role: WorkspaceRole.ADMIN, // Explicitly using WorkspaceRole enum
        createdAt: mockDate,
        updatedAt: mockDate,
        workspace: {
          id: 'workspace-id',
          name: 'Test Workspace',
          ownerId: 'owner-id',
          repositoryId: 'repo-id',
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should create a new user', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Arrange
      const users = [mockUser];
      jest.spyOn(service, 'findAll').mockResolvedValue(users);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    const userId = mockUser.id;

    it('should return a user by ID', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUserWithWorkspaces);

      // Act
      const result = await controller.findOne(userId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserWithWorkspaces);
    });
  });

  describe('update', () => {
    const userId = mockUser.id;
    const updateDto: UpdateUserDto = {
      email: 'updated@example.com',
      role: UserRole.ADMIN,
    };

    it('should update a user', async () => {
      // Arrange
      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com', // Using concrete string instead of updateDto.email
        role: UserRole.ADMIN, // Using concrete enum value instead of updateDto.role
        updatedAt: new Date(),
      };
      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(userId, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    const userId = mockUser.id;

    it('should remove a user', async () => {
      // Arrange
      const deleteResult = { message: `User with ID ${userId} deleted successfully` };
      jest.spyOn(service, 'remove').mockResolvedValue(deleteResult);

      // Act
      const result = await controller.remove(userId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(deleteResult);
    });
  });
});
