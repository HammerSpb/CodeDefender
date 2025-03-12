import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { AuditLogsService } from '@/audit-logs/audit-logs.service';
import { Role, User, UserRoleAssignment } from '@prisma/client';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Assign a role to a user
   * @param assignerId ID of the user assigning the role (usually admin/owner)
   * @param userId ID of the user being assigned the role
   * @param roleId ID of the role to assign
   * @param workspaceId Optional ID of the workspace scope (null for global role)
   */
  async assignRole(assignerId: string, userId: string, roleId: string, workspaceId?: string): Promise<any> {
    // Verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify the role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify workspace exists if provided
    if (workspaceId) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      
      if (!workspace) {
        throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
      }

      // Verify assigner has permission to assign roles in this workspace
      const hasPermission = await this.verifyAssignerPermission(assignerId, workspaceId);
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to assign roles in this workspace');
      }
    } else {
      // Verify assigner has permission to assign global roles (typically admin/super)
      const assigner = await this.prisma.user.findUnique({
        where: { id: assignerId },
      });

      if (!assigner || !['SUPER', 'ADMIN'].includes(assigner.role)) {
        throw new ForbiddenException('You do not have permission to assign global roles');
      }
    }

    try {
      // Check if role assignment already exists
      const existingAssignment = await this.prisma.userRoleAssignment.findUnique({
        where: {
          userId_roleId_workspaceId: {
            userId,
            roleId,
            workspaceId: workspaceId || null as any,
          },
        },
      });

      if (existingAssignment) {
        throw new BadRequestException('User already has this role in this context');
      }

      // Create the role assignment
      const roleAssignment = await this.prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          workspaceId: workspaceId || null as any,
        },
        include: {
          role: true,
        },
      });

      // Log the action
      await this.auditLogsService.create({
        userId: assignerId,
        workspaceId,
        action: 'ASSIGN_ROLE',
        details: {
          targetUserId: userId,
          roleName: role.name,
          roleId: roleId,
          workspaceScoped: !!workspaceId,
        },
      });

      // Clear permissions cache for the user
      await this.permissionsService.clearUserPermissionCache(userId);

      return {
        message: 'Role assigned successfully',
        roleAssignment,
      };
    } catch (error) {
      this.logger.error(`Error assigning role: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign role');
    }
  }

  /**
   * Remove a role from a user
   * @param removerId ID of the user removing the role
   * @param userId ID of the user to remove the role from
   * @param roleId ID of the role to remove
   * @param workspaceId Optional workspace context
   */
  async removeRole(removerId: string, userId: string, roleId: string, workspaceId?: string): Promise<any> {
    // Verify the role assignment exists
    const roleAssignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
          userId_roleId_workspaceId: {
            userId,
            roleId,
            workspaceId: workspaceId || null as any,
          },
      },
      include: {
        role: true,
      },
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    // Verify permission to remove roles
    if (workspaceId) {
      const hasPermission = await this.verifyAssignerPermission(removerId, workspaceId);
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to remove roles in this workspace');
      }
    } else {
      // Verify remover has permission to remove global roles
      const remover = await this.prisma.user.findUnique({
        where: { id: removerId },
      });

      if (!remover || !['SUPER', 'ADMIN'].includes(remover.role)) {
        throw new ForbiddenException('You do not have permission to remove global roles');
      }
    }

    try {
      // Delete the role assignment
      await this.prisma.userRoleAssignment.delete({
        where: {
          id: roleAssignment.id,
        },
      });

      // Get role name safely (using type assertion)
      const typedRoleAssignment = roleAssignment as unknown as { role: { name: string } };

      // Log the action
      await this.auditLogsService.create({
        userId: removerId,
        workspaceId,
        action: 'REMOVE_ROLE',
        details: {
          targetUserId: userId,
          roleName: typedRoleAssignment.role.name,
          roleId: roleId,
          workspaceScoped: !!workspaceId,
        },
      });

      // Clear permissions cache for the user
      await this.permissionsService.clearUserPermissionCache(userId);

      return {
        message: 'Role removed successfully',
      };
    } catch (error) {
      this.logger.error(`Error removing role: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove role');
    }
  }

  /**
   * Change a user's role
   * @param changerId ID of the user changing the role
   * @param userId ID of the user whose role is being changed
   * @param newRoleId ID of the new role
   * @param workspaceId Optional workspace context
   */
  async changeRole(changerId: string, userId: string, newRoleId: string, workspaceId?: string): Promise<any> {
    // First find current roles for the user in this context
    const currentRoleAssignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        workspaceId,
      },
      include: {
        role: true,
      },
    });

    // Verify new role exists
    const newRole = await this.prisma.role.findUnique({
      where: { id: newRoleId },
    });
    
    if (!newRole) {
      throw new NotFoundException(`Role with ID ${newRoleId} not found`);
    }

    // Verify permission to change roles
    if (workspaceId) {
      const hasPermission = await this.verifyAssignerPermission(changerId, workspaceId);
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to change roles in this workspace');
      }
    } else {
      // Verify changer has permission to change global roles
      const changer = await this.prisma.user.findUnique({
        where: { id: changerId },
      });

      if (!changer || !['SUPER', 'ADMIN'].includes(changer.role)) {
        throw new ForbiddenException('You do not have permission to change global roles');
      }
    }

    // Check if user already has the new role
    if (currentRoleAssignments.some(ra => ra.roleId === newRoleId)) {
      throw new BadRequestException('User already has this role');
    }

    try {
      // Start a transaction for role change
      return await this.prisma.$transaction(async (prisma) => {
        // Remove current roles
        for (const ra of currentRoleAssignments) {
          await prisma.userRoleAssignment.delete({
            where: { id: ra.id },
          });
        }

        // Assign new role
        const newAssignment = await prisma.userRoleAssignment.create({
          data: {
            userId,
            roleId: newRoleId,
            workspaceId: workspaceId || null as any,
          },
          include: {
            role: true,
          },
        });

        // Log the action
        await this.auditLogsService.create({
          userId: changerId,
          workspaceId,
          action: 'CHANGE_ROLE',
          details: {
            targetUserId: userId,
            oldRoles: currentRoleAssignments.map(ra => ({
              id: ra.roleId,
              name: ra.role.name,
            })),
            newRole: {
              id: newRoleId,
              name: newRole.name,
            },
            workspaceScoped: !!workspaceId,
          },
        });

        // Clear permissions cache for the user
        await this.permissionsService.clearUserPermissionCache(userId);

        return {
          message: 'Role changed successfully',
          newAssignment,
        };
      });
    } catch (error) {
      this.logger.error(`Error changing role: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to change role');
    }
  }

  /**
   * Get all roles assigned to a user
   * @param userId User ID
   */
  async getUserRoles(userId: string): Promise<any[]> {
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return userRoles.map(ur => ({
      id: ur.id,
      role: {
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      },
      scope: ur.workspace ? 'workspace' : 'global',
      workspace: ur.workspace,
      createdAt: ur.createdAt,
    }));
  }

  /**
   * Get all roles assigned to users in a workspace
   * @param workspaceId Workspace ID
   */
  async getWorkspaceUserRoles(workspaceId: string): Promise<any[]> {
    const workspaceRoles = await this.prisma.userRoleAssignment.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: true,
      },
    });

    return workspaceRoles.map(wr => ({
      id: wr.id,
      user: wr.user,
      role: {
        id: wr.role.id,
        name: wr.role.name,
        description: wr.role.description,
      },
      createdAt: wr.createdAt,
    }));
  }

  /**
   * List all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Verify if a user has permission to assign roles
   * @private
   */
  private async verifyAssignerPermission(assignerId: string, workspaceId: string): Promise<boolean> {
    // Check if assigner is workspace owner
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    
    if (workspace && workspace.ownerId === assignerId) {
      return true;
    }

    // Check if assigner has WORKSPACE:MANAGE_ROLES permission
    const hasPermission = await this.permissionsService.userHasPermission(
      assignerId,
      'WORKSPACE:MANAGE_ROLES', // This permission code should match whatever is used in your system
      workspaceId,
    );

    return hasPermission;
  }
}
