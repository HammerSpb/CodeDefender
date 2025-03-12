/**
 * Script to wipe database, recreate schema, and load seeds
 */
const { execSync } = require('child_process');

try {
  console.log('Dropping and recreating database...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Running seed script...');
  execSync('npx ts-node -r tsconfig-paths/register ./prisma/seeds/index.ts', { stdio: 'inherit' });
  
  console.log('Database reset and seeded successfully!');
} catch (error) {
  console.error('Error resetting database:', error);
  process.exit(1);
}
