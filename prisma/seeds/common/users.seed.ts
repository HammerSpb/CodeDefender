import { PrismaClient, Plan } from '@prisma/client';

/**
 * Seed admin user
 */
export async function seedSuperUser(prisma: PrismaClient) {
  console.log('Creating super admin user...');
  
  // Create a super admin user with hashed password ('password')
  const hashedPassword = '$2a$10$PdwfLvCQD4Wv7oHvWpspEOhj.qGP4xKb36yfP.zxz8oJo7LOVCt1G';
  
  const superUser = await prisma.user.upsert({
    where: { email: 'admin@codedefender.com' },
    update: {
      password: hashedPassword,
      role: 'SUPER',
      plan: Plan.ENTERPRISE,
    },
    create: {
      email: 'admin@codedefender.com',
      password: hashedPassword,
      role: 'SUPER',
      plan: Plan.ENTERPRISE,
    }
  });
  
  // Assign Super Admin role to super user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' }
  });
  
  if (superAdminRole) {
    try {
      // Check if role assignment already exists
      const existingAssignment = await prisma.userRoleAssignment.findFirst({
        where: {
          userId: superUser.id,
          roleId: superAdminRole.id,
          workspaceId: null
        }
      });
      
      if (!existingAssignment) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: superUser.id,
            roleId: superAdminRole.id,
          }
        });
      }
    } catch (error) {
      console.error('Error assigning role to super user:', error);
    }
  }
  
  console.log('Super admin user created');
}
