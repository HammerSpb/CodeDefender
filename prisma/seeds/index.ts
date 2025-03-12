import { PrismaClient } from '@prisma/client';
import { seedPermissions, seedRoles } from './common/permissions.seed';
import { seedSuperUser } from './common/users.seed';
import { seedPlanPermissions } from './plan-permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Seed in sequential order
    await seedPermissions(prisma);
    await seedRoles(prisma);
    await seedSuperUser(prisma);
    await seedPlanPermissions(prisma);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed function
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

export { seedPermissions, seedRoles, seedSuperUser, seedPlanPermissions };
