// src/acekoprssw / workspaces.service.ts;
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddUserToWorkspaceDto } from './dto/add-user-to-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    const { name, repositoryId } = createWorkspaceDto;

    try {
      // Create workspace
      const workspace = await this.prisma.workspace.create({
        data: {
          name,
          ownerId: userId,
          repositoryId,
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          workspaceId: workspace.id,
          action: 'CREATE_WORKSPACE',
          details: {
            workspaceName: name,
          },
        },
      });

      return workspace;
    } catch (error) {
      throw new BadRequestException('Could not create workspace');
    }
  }

  async findAll(userId: string) {
    // Get workspaces where user is owner
    const ownedWorkspaces = await this.prisma.workspace.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        repository: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Get workspaces where user is a member through UserWorkspace
    const memberWorkspaces = await this.prisma.userWorkspace.findMany({
      where: {
        userId,
      },
      include: {
        workspace: {
          include: {
            repository: true,
            owner: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Combine and return unique workspaces
    const workspaces = [...ownedWorkspaces, ...memberWorkspaces.map(uw => uw.workspace)];

    // Remove duplicates
    return [...new Map(workspaces.map(item => [item.id, item])).values()];
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        repository: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        userWorkspaces: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
        scans: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        schedules: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    // Check if user has access to workspace
    if (workspace.ownerId !== userId && !workspace.userWorkspaces.some(uw => uw.user.id === userId)) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return workspace;
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string) {
    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    // Check if user is the owner
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can update it');
    }

    try {
      const updatedWorkspace = await this.prisma.workspace.update({
        where: { id },
        data: updateWorkspaceDto,
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          workspaceId: id,
          action: 'UPDATE_WORKSPACE',
          details: {
            workspaceName: updatedWorkspace.name,
            updatedFields: Object.keys(updateWorkspaceDto),
          },
        },
      });

      return updatedWorkspace;
    } catch (error) {
      throw new BadRequestException('Could not update workspace');
    }
  }

  async remove(id: string, userId: string) {
    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    // Check if user is the owner
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    try {
      // Create audit log before deletion
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_WORKSPACE',
          details: {
            workspaceId: id,
            workspaceName: workspace.name,
          },
        },
      });

      // Delete workspace
      await this.prisma.workspace.delete({
        where: { id },
      });

      return { message: `Workspace with ID ${id} deleted successfully` };
    } catch (error) {
      throw new BadRequestException('Could not delete workspace');
    }
  }

  async addUser(workspaceId: string, addUserDto: AddUserToWorkspaceDto, userId: string) {
    const { email, role } = addUserDto;

    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    // Check if user is the owner or admin
    if (workspace.ownerId !== userId) {
      const userWorkspace = await this.prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      if (!userWorkspace || userWorkspace.role !== 'ADMIN') {
        throw new ForbiddenException('Only the workspace owner or admins can add users');
      }
    }

    // Find user by email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    // Check if user is already in workspace
    const existingUserWorkspace = await this.prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToAdd.id,
          workspaceId,
        },
      },
    });

    if (existingUserWorkspace) {
      throw new BadRequestException(`User with email ${email} is already in workspace`);
    }

    try {
      // Add user to workspace
      const userWorkspace = await this.prisma.userWorkspace.create({
        data: {
          userId: userToAdd.id,
          workspaceId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          workspaceId,
          action: 'ADD_USER_TO_WORKSPACE',
          details: {
            addedUserId: userToAdd.id,
            addedUserEmail: email,
            role,
          },
        },
      });

      return userWorkspace;
    } catch (error) {
      throw new BadRequestException('Could not add user to workspace');
    }
  }

  async removeUser(workspaceId: string, userIdToRemove: string, userId: string) {
    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    // Check if user is the owner or admin
    if (workspace.ownerId !== userId) {
      const userWorkspace = await this.prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      if (!userWorkspace || userWorkspace.role !== 'ADMIN') {
        throw new ForbiddenException('Only the workspace owner or admins can remove users');
      }
    }

    // Cannot remove the owner
    if (workspace.ownerId === userIdToRemove) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }

    // Check if user to remove is in workspace
    const userWorkspaceToRemove = await this.prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: userIdToRemove,
          workspaceId,
        },
      },
    });

    if (!userWorkspaceToRemove) {
      throw new NotFoundException(`User is not a member of this workspace`);
    }

    try {
      // Remove user from workspace
      await this.prisma.userWorkspace.delete({
        where: {
          userId_workspaceId: {
            userId: userIdToRemove,
            workspaceId,
          },
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          workspaceId,
          action: 'REMOVE_USER_FROM_WORKSPACE',
          details: {
            removedUserId: userIdToRemove,
          },
        },
      });

      return { message: `User removed from workspace successfully` };
    } catch (error) {
      throw new BadRequestException('Could not remove user from workspace');
    }
  }
}
