import { PrismaClient } from '@prisma/client';
import { 
  PERMISSION_CODES, 
  PERMISSION_DESCRIPTIONS,
  RoleType,
  ROLE_DESCRIPTIONS, 
  ROLE_PERMISSIONS,
} from '../data/permissions.data';
import { 
  PermissionScope,
  PermissionResource,
  PermissionAction 
} from '../../../src/permissions/constants/permission-codes';

/**
 * Seed permissions
 */
export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding permissions...');
  
  // Process each permission from the constants
  for (const [code, description] of Object.entries(PERMISSION_DESCRIPTIONS)) {
    // Parse code to determine scope and resource
    const [resource, action] = code.split(':');

    await prisma.permission.upsert({
      where: { code },
      update: {
        name: `${resource} ${action.toLowerCase()}`,
        description,
        scope: getScope(resource as PermissionResource),
        action: action as PermissionAction,
        resource: resource as PermissionResource,
      },
      create: {
        code,
        name: `${resource} ${action.toLowerCase()}`,
        description,
        scope: getScope(resource as PermissionResource),
        action: action as PermissionAction,
        resource: resource as PermissionResource,
      },
    });
  }

  console.log('Permissions seeded successfully!');
}

/**
 * Seed roles and assign permissions
 */
export async function seedRoles(prisma: PrismaClient) {
  console.log('Seeding roles...');
  
  // For each role type, create the role and assign permissions
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    // Create or update the role
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        description: ROLE_DESCRIPTIONS[roleName as RoleType],
        isDefault: roleName === RoleType.MEMBER,
      },
      create: {
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName as RoleType],
        isDefault: roleName === RoleType.MEMBER,
      },
    });

    // Clear any existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create permission assignments
    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (permission) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // Skip if permission already exists (unique constraint error)
          if (error.code !== 'P2002') {
            throw error;
          }
        }
      }
    }
  }

  console.log('Roles seeded successfully!');
}

// Helper to determine scope from resource
function getScope(resource: PermissionResource): PermissionScope {
  switch (resource) {
    case PermissionResource.WORKSPACE:
      return PermissionScope.WORKSPACE;
    case PermissionResource.SCAN:
      return PermissionScope.SCAN;
    case PermissionResource.REPORT:
      return PermissionScope.REPORT;
    case PermissionResource.USER:
      return PermissionScope.USER;
    case PermissionResource.REPOSITORY:
      return PermissionScope.REPOSITORY;
    case PermissionResource.SCHEDULE:
      return PermissionScope.SCHEDULE;
    default:
      return PermissionScope.GLOBAL;
  }
}
