import { PrismaClient } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding permissions...');
  
  // Define basic permissions
  const permissions = [
    // User permissions
    {
      code: 'USER:READ',
      name: 'Read Users',
      description: 'View user information',
      scope: 'GLOBAL',
      action: 'READ',
      resource: 'USER',
    },
    {
      code: 'USER:CREATE',
      name: 'Create Users',
      description: 'Create new users',
      scope: 'GLOBAL',
      action: 'CREATE',
      resource: 'USER',
    },
    {
      code: 'USER:UPDATE',
      name: 'Update Users',
      description: 'Modify user information',
      scope: 'GLOBAL',
      action: 'UPDATE',
      resource: 'USER',
    },
    {
      code: 'USER:DELETE',
      name: 'Delete Users',
      description: 'Remove users from the system',
      scope: 'GLOBAL',
      action: 'DELETE',
      resource: 'USER',
    },
    
    // Workspace permissions
    {
      code: 'WORKSPACE:READ',
      name: 'Read Workspaces',
      description: 'View workspace information',
      scope: 'WORKSPACE',
      action: 'READ',
      resource: 'WORKSPACE',
    },
    {
      code: 'WORKSPACE:CREATE',
      name: 'Create Workspaces',
      description: 'Create new workspaces',
      scope: 'GLOBAL',
      action: 'CREATE',
      resource: 'WORKSPACE',
    },
    {
      code: 'WORKSPACE:UPDATE',
      name: 'Update Workspaces',
      description: 'Modify workspace information',
      scope: 'WORKSPACE',
      action: 'UPDATE',
      resource: 'WORKSPACE',
    },
    {
      code: 'WORKSPACE:DELETE',
      name: 'Delete Workspaces',
      description: 'Remove workspaces from the system',
      scope: 'WORKSPACE',
      action: 'DELETE',
      resource: 'WORKSPACE',
    },
    
    // Repository permissions
    {
      code: 'REPOSITORY:READ',
      name: 'Read Repositories',
      description: 'View repository information',
      scope: 'WORKSPACE',
      action: 'READ',
      resource: 'REPOSITORY',
    },
    {
      code: 'REPOSITORY:CREATE',
      name: 'Create Repositories',
      description: 'Add new repositories',
      scope: 'WORKSPACE',
      action: 'CREATE',
      resource: 'REPOSITORY',
    },
    {
      code: 'REPOSITORY:UPDATE',
      name: 'Update Repositories',
      description: 'Modify repository information',
      scope: 'WORKSPACE',
      action: 'UPDATE',
      resource: 'REPOSITORY',
    },
    {
      code: 'REPOSITORY:DELETE',
      name: 'Delete Repositories',
      description: 'Remove repositories',
      scope: 'WORKSPACE',
      action: 'DELETE',
      resource: 'REPOSITORY',
    },
    
    // Scan permissions
    {
      code: 'SCAN:READ',
      name: 'Read Scans',
      description: 'View scan results',
      scope: 'WORKSPACE',
      action: 'READ',
      resource: 'SCAN',
    },
    {
      code: 'SCAN:CREATE',
      name: 'Create Scans',
      description: 'Initiate security scans',
      scope: 'WORKSPACE',
      action: 'CREATE',
      resource: 'SCAN',
    },
    {
      code: 'SCAN:UPDATE',
      name: 'Update Scans',
      description: 'Modify scan configurations',
      scope: 'WORKSPACE',
      action: 'UPDATE',
      resource: 'SCAN',
    },
    {
      code: 'SCAN:DELETE',
      name: 'Delete Scans',
      description: 'Remove scan history',
      scope: 'WORKSPACE',
      action: 'DELETE',
      resource: 'SCAN',
    },
  ];

  // Create permissions if they don't exist
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log('Permissions seeded successfully');
}
