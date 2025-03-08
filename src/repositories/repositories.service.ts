// src/repositories/repositories.service.ts (continued)
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository, UserRole } from '@prisma/client';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    private prismaService: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createRepositoryDto: CreateRepositoryDto, userId: string): Promise<Repository> {
    // Get the user
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create the repository
    const repository = await this.prismaService.repository.create({
      data: {
        url: createRepositoryDto.url,
        provider: createRepositoryDto.provider,
        accessToken: createRepositoryDto.accessToken,
        ownerId: userId,
      },
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      action: 'CREATE_REPOSITORY',
      details: {
        repositoryUrl: repository.url,
        provider: repository.provider,
      },
    });

    return repository;
  }

  async findAll(userId: string): Promise<Repository[]> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Super users can see all repositories
    if (user?.role === UserRole.SUPER) {
      return this.prismaService.repository.findMany();
    }

    // Owners can see repositories they own
    if (user?.role === UserRole.OWNER) {
      return this.prismaService.repository.findMany({
        where: { ownerId: userId },
      });
    }

    // Other users can see repositories from workspaces they're part of
    const userWorkspaces = await this.prismaService.userWorkspace.findMany({
      where: { userId },
      select: {
        workspace: {
          select: {
            repositoryId: true,
          },
        },
      },
    });

    const repositoryIds = userWorkspaces.map(uw => uw.workspace.repositoryId).filter(id => id !== null);

    return this.prismaService.repository.findMany({
      where: {
        id: {
          in: repositoryIds,
        },
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Repository> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const repository = await this.prismaService.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      throw new NotFoundException(`Repository with ID ${id} not found`);
    }

    // Super users can see any repository
    if (user?.role === UserRole.SUPER) {
      return repository;
    }

    // Owners can see repositories they own
    if (user?.role === UserRole.OWNER && repository.ownerId === userId) {
      return repository;
    }

    // Check if the repository is part of a workspace the user has access to
    const workspaces = await this.prismaService.workspace.findMany({
      where: {
        repositoryId: id,
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

    if (workspaces.length === 0) {
      throw new ForbiddenException('You do not have access to this repository');
    }

    return repository;
  }

  async update(id: string, updateRepositoryDto: UpdateRepositoryDto, userId: string): Promise<Repository> {
    // Check if repository exists and user has access
    const repository = await this.findOne(id, userId);

    // Only the owner or a super user can update a repository
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== UserRole.SUPER && repository.ownerId !== userId) {
      throw new ForbiddenException('Only the repository owner or a super user can update a repository');
    }

    // Update repository
    const updatedRepository = await this.prismaService.repository.update({
      where: { id },
      data: updateRepositoryDto,
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      action: 'UPDATE_REPOSITORY',
      details: {
        repositoryUrl: updatedRepository.url,
      },
    });

    return updatedRepository;
  }

  async remove(id: string, userId: string): Promise<Repository> {
    // Check if repository exists and user has access
    const repository = await this.findOne(id, userId);

    // Only the owner or a super user can delete a repository
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== UserRole.SUPER && repository.ownerId !== userId) {
      throw new ForbiddenException('Only the repository owner or a super user can delete a repository');
    }

    // Check if the repository is linked to any workspaces
    const workspaces = await this.prismaService.workspace.findMany({
      where: { repositoryId: id },
    });

    if (workspaces.length > 0) {
      throw new ForbiddenException('Cannot delete repository that is linked to workspaces');
    }

    // Delete repository
    const deletedRepository = await this.prismaService.repository.delete({
      where: { id },
    });

    // Create audit log
    await this.auditLogsService.create({
      userId,
      action: 'DELETE_REPOSITORY',
      details: {
        repositoryUrl: deletedRepository.url,
      },
    });

    return deletedRepository;
  }
}
