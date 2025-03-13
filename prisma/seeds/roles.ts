import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('Seeding roles...');
  
  // Create default roles if they don't exist
  const roles = [
    {
      name: 'Super',
      description: 'Super administrator with full access',
      isDefault: false,
    },
    {
      name: 'Owner',
      description: 'Organization owner with administrative access',
      isDefault: false,
    },
    {
      name: 'Admin',
      description: 'Administrator with workspace management access',
      isDefault: false,
    },
    {
      name: 'Member',
      description: 'Regular member with limited access',
      isDefault: true,
    },
    {
      name: 'Support',
      description: 'Support staff with read-only access',
      isDefault: false,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('Roles seeded successfully');
}
