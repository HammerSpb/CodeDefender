import { PrismaClient, Plan, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');
  
  // Hash for 'pass' password
  const password = await bcrypt.hash('pass', 10);
  
  // Default users
  const users = [
    {
      email: 'super@example.com',
      role: 'SUPER',
      plan: Plan.ENTERPRISE,
      firstName: 'Super',
      lastName: 'User',
      password,
    },
    {
      email: 'owner@example.com',
      role: 'OWNER',
      plan: Plan.BUSINESS,
      firstName: 'Organization',
      lastName: 'Owner',
      password,
      orgName: 'Test Organization',
    },
    {
      email: 'admin@example.com',
      role: 'ADMIN',
      plan: Plan.PRO,
      firstName: 'Admin',
      lastName: 'User',
      password,
    },
    {
      email: 'member@example.com',
      role: 'MEMBER',
      plan: Plan.STARTER,
      firstName: 'Regular',
      lastName: 'Member',
      password,
    },
  ];

  // Create users and workspaces
  for (const userData of users) {
    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });

    // Find the role corresponding to the user's role
    const role = await prisma.role.findFirst({
      where: { name: userData.role === 'MEMBER' ? 'Member' : userData.role === 'ADMIN' ? 'Admin' : userData.role === 'OWNER' ? 'Owner' : 'Super' },
    });

    if (role) {
      // Assign role to user if it doesn't exist already
      const existingAssignment = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: user.id,
          roleId: role.id,
        },
      });

      if (!existingAssignment) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    }

    // Create workspace if it doesn't exist
    const workspaceName = userData.orgName 
      ? `${userData.orgName} Workspace` 
      : `${userData.firstName}'s Workspace`;
      
    const workspace = await prisma.workspace.upsert({
      where: {
        // We can't have a unique constraint on name + ownerId, so we need to check existence first
        id: (await prisma.workspace.findFirst({
          where: {
            name: workspaceName,
            ownerId: user.id,
          },
        }))?.id || 'new-workspace',
      },
      update: {},
      create: {
        name: workspaceName,
        ownerId: user.id,
      },
    });

    // Add user to workspace if not already added
    const existingUserWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    });

    if (!existingUserWorkspace) {
      await prisma.userWorkspace.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.ADMIN,
        },
      });
    }
  }

  console.log('Users seeded successfully');
}
