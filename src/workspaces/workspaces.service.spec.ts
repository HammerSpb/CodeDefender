// src/workspaces/workspaces.service.spec.ts
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Create a better mock that exactly matches what your service expects
    const prismaServiceMock = {
      workspace: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      userWorkspace: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(callback => callback(prismaServiceMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      // Arrange
      const userId = 'user123';
      const createWorkspaceDto = {
        name: 'Test Workspace',
        repositoryId: 'repo123',
      };

      const mockWorkspace = {
        id: 'workspace123',
        name: createWorkspaceDto.name,
        ownerId: userId,
        repositoryId: createWorkspaceDto.repositoryId,
      };

      // Make sure the mock returns what we expect
      prisma.workspace.create = vi.fn().mockResolvedValue(mockWorkspace);
      prisma.auditLog.create = vi.fn().mockResolvedValue({});

      // Act
      const result = await service.create(createWorkspaceDto, userId);

      // Assert
      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: createWorkspaceDto.name,
          ownerId: userId,
          repositoryId: createWorkspaceDto.repositoryId,
        },
      });

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw BadRequestException on error', async () => {
      // Arrange
      const userId = 'user123';
      const createWorkspaceDto = {
        name: 'Test Workspace',
        repositoryId: 'repo123',
      };

      prisma.workspace.create = vi.fn().mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(service.create(createWorkspaceDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all workspaces for a user', async () => {
      // Arrange
      const userId = 'user123';
      const ownedWorkspaces = [{ id: 'workspace1', name: 'Workspace 1', ownerId: userId }];

      const memberWorkspaces = [
        {
          workspace: {
            id: 'workspace2',
            name: 'Workspace 2',
            ownerId: 'otherUser',
          },
        },
      ];

      prisma.workspace.findMany = vi.fn().mockResolvedValue(ownedWorkspaces);
      prisma.userWorkspace.findMany = vi.fn().mockResolvedValue(memberWorkspaces);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
        include: expect.any(Object),
      });

      expect(prisma.userWorkspace.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
      });

      expect(result).toHaveLength(2); // Combined workspaces
    });
  });
});
