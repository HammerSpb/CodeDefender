# Database Seeding

This document describes the seeding system for CodeDefender.

## Overview

Seeds provide initial data for the application, including:
- Permissions and roles
- Default users
- Test data

## Directory Structure

```
prisma/
├── seeds/
│   ├── common/           # Core seed functionality
│   │   ├── permissions.seed.ts
│   │   └── users.seed.ts
│   ├── data/             # Static seed data
│   │   └── permissions.data.ts
│   └── index.ts          # Exports all seed functions
└── seed.ts               # Main entry point for Prisma
```

## Running Seeds

### Reset Database and Run All Seeds

```bash
pnpm db:reset:full
```

This command:
1. Drops and recreates the database schema
2. Regenerates the Prisma client
3. Runs all seed scripts

### Run Only Seed Scripts

```bash
pnpm db:seed
```

## Seed Modules

### Permissions and Roles

`prisma/seeds/common/permissions.seed.ts` defines:

- Base permissions (SCAN:CREATE, REPORT:VIEW, etc.)
- Role hierarchy (Super, Owner, Admin, Member, Support, Viewer)
- Role-permission mappings

Permissions follow the pattern: `RESOURCE:ACTION` (e.g., WORKSPACE:CREATE).

### Users

`prisma/seeds/common/users.seed.ts` creates:

- Default super admin (admin@codedefender.com)
- Assigns appropriate roles

## Adding New Seeds

1. Create a new seed file in the appropriate directory
2. Export seed functions that accept the Prisma client
3. Import and call from main seed script

Example:

```typescript
// prisma/seeds/common/my-feature.seed.ts
import { PrismaClient } from '@prisma/client';

export async function seedMyFeature(prisma: PrismaClient) {
  // Seed implementation
}

// Add to prisma/seeds/index.ts
export { seedMyFeature } from './common/my-feature.seed';

// Use in prisma/seed.ts
await seedMyFeature(prisma);
```
