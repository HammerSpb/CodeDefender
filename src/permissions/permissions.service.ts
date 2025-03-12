import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check if a user has a specific permission in a given context
   * @param userId User ID to check permissions for
   * @param permissionCode Permission code to check
   * @param workspaceId Optional workspace context
   * @param resourceId Optional specific resource ID
   */
  async userHasPermission(
    userId: string,
    permissionCode: string,
    workspaceId?: string,
    resourceId?: string,
  ): Promise<boolean> {
    try {
      // Try to get from cache first
      const cacheKey = `permission:${userId}:${permissionCode}:${workspaceId || 'global'}:${resourceId || 'all'}`;
      const cachedResult = await this.cacheManager.get<boolean>(cacheKey);
      
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult;
      }

      // Check for user's global roles first
      const userWithRoles = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoleAssignments: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithRoles) {
        await this.cacheManager.set(cacheKey, false, this.CACHE_TTL);
        return false;
      }

      // Check if user is SUPER, they have all permissions
      if (userWithRoles.role === 'SUPER') {
        await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
        return true;
      }

      // Extract permissions from global roles (roles without a workspaceId)
      const globalPermissions = userWithRoles.userRoleAssignments
        .filter((userRole) => !userRole.workspaceId)
        .flatMap((userRole) => userRole.role.rolePermissions)
        .map((rolePermission) => rolePermission.permission.code);

      // Check if the user has the permission globally
      if (globalPermissions.includes(permissionCode)) {
        await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
        return true;
      }

      // If workspaceId is provided, check workspace-specific roles
      if (workspaceId) {
        const workspacePermissions = userWithRoles.userRoleAssignments
          .filter((userRole) => userRole.workspaceId === workspaceId)
          .flatMap((userRole) => userRole.role.rolePermissions)
          .map((rolePermission) => rolePermission.permission.code);

        // Check if the user has the permission in this workspace
        if (workspacePermissions.includes(permissionCode)) {
          await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
          return true;
        }

        // Check workspace ownership
        const workspace = await this.prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        // Workspace owners have all permissions in their workspace
        if (workspace && workspace.ownerId === userId) {
          await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
          return true;
        }
      }

      // Store negative result in cache
      await this.cacheManager.set(cacheKey, false, this.CACHE_TTL);
      return false;
    } catch (error) {
      this.logger.error(`Error checking permission: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param userId User ID to check
   * @param permissionCodes Array of permission codes
   * @param workspaceId Optional workspace context
   */
  async userHasAnyPermission(
    userId: string,
    permissionCodes: string[],
    workspaceId?: string,
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      const hasPermission = await this.userHasPermission(userId, code, workspaceId);
      if (hasPermission) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all specified permissions
   * @param userId User ID to check
   * @param permissionCodes Array of permission codes
   * @param workspaceId Optional workspace context
   */
  async userHasAllPermissions(
    userId: string,
    permissionCodes: string[],
    workspaceId?: string,
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      const hasPermission = await this.userHasPermission(userId, code, workspaceId);
      if (!hasPermission) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user
   * @param userId User ID
   * @param workspaceId Optional workspace context
   */
  async getUserPermissions(
    userId: string,
    workspaceId?: string,
  ): Promise<string[]> {
    // Try to get from cache first
    const cacheKey = `user-permissions:${userId}:${workspaceId || 'global'}`;
    const cachedPermissions = await this.cacheManager.get<string[]>(cacheKey);
    
    if (cachedPermissions) {
      return cachedPermissions;
    }

    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoleAssignments: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      await this.cacheManager.set(cacheKey, [], this.CACHE_TTL);
      return [];
    }

    // If user is SUPER, return all permissions
    if (userWithRoles.role === 'SUPER') {
      const allPermissions = await this.prisma.permission.findMany();
      const permissionCodes = allPermissions.map((p) => p.code);
      await this.cacheManager.set(cacheKey, permissionCodes, this.CACHE_TTL);
      return permissionCodes;
    }

    // Get global permissions
    const globalPermissions = userWithRoles.userRoleAssignments
      .filter((userRole) => !userRole.workspaceId)
      .flatMap((userRole) => userRole.role.rolePermissions)
      .map((rolePermission) => rolePermission.permission.code);

    // If workspaceId is provided, include workspace-specific permissions
    if (workspaceId) {
      const workspacePermissions = userWithRoles.userRoleAssignments
        .filter((userRole) => userRole.workspaceId === workspaceId)
        .flatMap((userRole) => userRole.role.rolePermissions)
        .map((rolePermission) => rolePermission.permission.code);

      // Check workspace ownership
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (workspace && workspace.ownerId === userId) {
        // Workspace owners have all workspace-related permissions
        const workspaceRelatedPermissions = await this.prisma.permission.findMany({
          where: {
            scope: 'WORKSPACE',
          },
        });
        
        const allPermissions = [...new Set([
          ...globalPermissions,
          ...workspacePermissions,
          ...workspaceRelatedPermissions.map((p) => p.code),
        ])];
        
        await this.cacheManager.set(cacheKey, allPermissions, this.CACHE_TTL);
        return allPermissions;
      }

      const combinedPermissions = [...new Set([...globalPermissions, ...workspacePermissions])];
      await this.cacheManager.set(cacheKey, combinedPermissions, this.CACHE_TTL);
      return combinedPermissions;
    }

    // If no workspaceId, return just global permissions
    await this.cacheManager.set(cacheKey, [...new Set(globalPermissions)], this.CACHE_TTL);
    return [...new Set(globalPermissions)];
  }

  /**
   * Check if a role has a specific permission
   * @param roleId Role ID
   * @param permissionCode Permission code to check
   */
  async roleHasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const cacheKey = `role-permission:${roleId}:${permissionCode}`;
    const cachedResult = await this.cacheManager.get<boolean>(cacheKey);
    
    if (cachedResult !== undefined && cachedResult !== null) {
      return cachedResult;
    }

    const roleWithPermissions = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) {
      await this.cacheManager.set(cacheKey, false, this.CACHE_TTL);
      return false;
    }

    const permissions = roleWithPermissions.rolePermissions.map(
      (rp) => rp.permission.code,
    );

    const result = permissions.includes(permissionCode);
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get all permissions assigned to a role
   * @param roleId Role ID
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const cacheKey = `role-permissions:${roleId}`;
    const cachedPermissions = await this.cacheManager.get<string[]>(cacheKey);
    
    if (cachedPermissions) {
      return cachedPermissions;
    }
    
    const roleWithPermissions = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) {
      await this.cacheManager.set(cacheKey, [], this.CACHE_TTL);
      return [];
    }

    const permissions = roleWithPermissions.rolePermissions.map(
      (rp) => rp.permission.code,
    );

    await this.cacheManager.set(cacheKey, permissions, this.CACHE_TTL);
    return permissions;
  }

  /**
   * Get all permissions by code
   * @param permissionCodes Permission codes to retrieve
   */
  async getPermissionsByCodes(permissionCodes: string[]): Promise<any[]> {
    return this.prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes,
        },
      },
    });
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<any[]> {
    const cacheKey = 'all-permissions';
    const cachedPermissions = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cachedPermissions) {
      return cachedPermissions;
    }
    
    const permissions = await this.prisma.permission.findMany({
      orderBy: {
        resource: 'asc',
      },
    });
    
    await this.cacheManager.set(cacheKey, permissions, this.CACHE_TTL);
    return permissions;
  }

  /**
   * Clear permission cache for a user
   * @param userId User ID
   */
  async clearUserPermissionCache(userId: string): Promise<void> {
    // We would ideally use cache tags or patterns, but for simplicity,
    // we'll implement basic invalidation
    const cacheKeys = [
      `user-permissions:${userId}:global`,
    ];
    
    // Get all workspaces for the user
    const userWorkspaces = await this.prisma.userWorkspace.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    
    for (const workspace of userWorkspaces) {
      cacheKeys.push(`user-permissions:${userId}:${workspace.workspaceId}`);
    }
    
    // Delete each cache key
    for (const key of cacheKeys) {
      await this.cacheManager.del(key);
    }
  }
}
