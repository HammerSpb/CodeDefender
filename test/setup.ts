import { vi } from 'vitest';

// Mock the Prisma client at the module level
vi.mock('@prisma/client', () => {
  const UserRole = {
    SUPER: 'SUPER',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    SUPPORT: 'SUPPORT',
  };

  const RepositoryProvider = {
    GITHUB: 'GITHUB',
    GITLAB: 'GITLAB',
    BITBUCKET: 'BITBUCKET',
  };

  const ScanStatus = {
    QUEUED: 'QUEUED',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  };

  const Plan = {
    STARTER: 'STARTER',
    PRO: 'PRO',
    BUSINESS: 'BUSINESS',
    ENTERPRISE: 'ENTERPRISE',
  };

  const WorkspaceRole = {
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
  };

  return {
    UserRole,
    RepositoryProvider,
    ScanStatus,
    Plan,
    WorkspaceRole,
    PrismaClient: vi.fn().mockImplementation(() => ({
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      repository: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      userWorkspace: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    })),
  };
});
