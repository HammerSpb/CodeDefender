// prisma/seed.ts
import { Plan, PrismaClient, RepositoryProvider, ScanStatus, UserRole, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.userWorkspace.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.user.deleteMany();

  // Create super user
  const superUser = await prisma.user.create({
    data: { email: 'super@example.com', password: await bcrypt.hash('pass', 10), role: UserRole.SUPER },
  });

  // Create owner user aka new client
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: await bcrypt.hash('pass', 10),
      role: UserRole.OWNER,
      orgName: 'Example Organization',
      plan: Plan.BUSINESS,
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcrypt.hash('pass', 10),
      role: UserRole.ADMIN,
      ownerId: ownerUser.id,
    },
  });

  // Create member user
  const memberUser = await prisma.user.create({
    data: {
      email: 'member@example.com',
      password: await bcrypt.hash('pass', 10),
      role: UserRole.MEMBER,
      ownerId: ownerUser.id,
    },
  });

  // Create repository
  const repository = await prisma.repository.create({
    data: {
      url: 'https://github.com/example/repo',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_pat_example',
      ownerId: ownerUser.id,
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: { name: 'Example Workspace', ownerId: ownerUser.id, repositoryId: repository.id },
  });

  // Create user-workspace relationships
  await prisma.userWorkspace.create({
    data: { userId: adminUser.id, workspaceId: workspace.id, role: WorkspaceRole.ADMIN },
  });

  await prisma.userWorkspace.create({
    data: { userId: memberUser.id, workspaceId: workspace.id, role: WorkspaceRole.MEMBER },
  });

  // Create a scan
  const scan = await prisma.scan.create({
    data: {
      repositoryId: repository.id,
      workspaceId: workspace.id,
      branch: 'main',
      status: ScanStatus.COMPLETED,
      historical: false,
      fileExclusions: ['node_modules', '.git'],
      results: {
        findings: { high: 2, medium: 5, low: 10 },
        scannedFiles: 120,
        secretsFound: 3,
        vulnerabilitiesFound: 7,
      },
      completedAt: new Date(),
    },
  });

  // Create a schedule
  const schedule = await prisma.schedule.create({
    data: {
      repositoryId: repository.id,
      workspaceId: workspace.id,
      branch: 'main',
      cronExpression: '0 0 * * *', // Daily at midnight
      historical: false,
      fileExclusions: ['node_modules', '.git'],
      active: true,
    },
  });

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      userId: superUser.id,
      action: 'CREATE_USER',
      details: { targetUser: ownerUser.email, role: 'OWNER' },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ownerUser.id,
      workspaceId: workspace.id,
      action: 'CREATE_WORKSPACE',
      details: { workspaceName: workspace.name },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ownerUser.id,
      workspaceId: workspace.id,
      action: 'CREATE_SCAN',
      details: { scanId: scan.id, repositoryUrl: repository.url },
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
