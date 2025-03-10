import { Test, TestingModule } from '@nestjs/testing';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { RepositoryProvider } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

// Mock the RolesGuard
jest.mock('../common/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('RepositoriesController', () => {
  let controller: RepositoriesController;
  let service: RepositoriesService;

  // Test data setup
  const mockDate = new Date();
  const mockRepository = {
    id: 'repo-id',
    url: 'https://github.com/user/repo',
    provider: RepositoryProvider.GITHUB,
    accessToken: 'github_token',
    ownerId: 'user-id',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoriesController],
      providers: [
        {
          provide: RepositoriesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
    service = module.get<RepositoriesService>(RepositoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a repository', async () => {
      // Arrange
      const createDto: CreateRepositoryDto = {
        url: 'https://github.com/user/repo',
        provider: RepositoryProvider.GITHUB,
        accessToken: 'github_token',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = mockRepository;
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createDto, mockRequest);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of repositories', async () => {
      // Arrange
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = [
        mockRepository,
        {
          ...mockRepository,
          id: 'repo-2',
          url: 'https://github.com/user/repo2',
        },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single repository', async () => {
      // Arrange
      const repoId = 'repo-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = mockRepository;
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(repoId, mockRequest);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(repoId, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a repository', async () => {
      // Arrange
      const repoId = 'repo-id';
      const updateDto: UpdateRepositoryDto = {
        url: 'https://github.com/user/updated-repo',
      };
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = {
        ...mockRepository,
        url: 'https://github.com/user/updated-repo',
      };
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(repoId, updateDto, mockRequest);

      // Assert
      expect(service.update).toHaveBeenCalledWith(repoId, updateDto, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a repository', async () => {
      // Arrange
      const repoId = 'repo-id';
      const mockRequest = { user: { sub: 'user-id' } };
      const expectedResult = mockRepository;
      jest.spyOn(service, 'remove').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.remove(repoId, mockRequest);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(repoId, mockRequest.user.sub);
      expect(result).toEqual(expectedResult);
    });
  });
});
