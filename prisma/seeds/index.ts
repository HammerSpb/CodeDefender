import { PrismaClient } from '@prisma/client';
import { seedRoles } from './roles';
import { seedUsers } from './users';
import { seedPermissions } from './permissions';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Seed in order of dependencies
    await seedPermissions(prisma);
    await seedRoles(prisma);
    await seedUsers(prisma);
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Explicitly disconnect for faster process exit
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
