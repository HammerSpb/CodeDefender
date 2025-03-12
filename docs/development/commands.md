# Development Commands

This document outlines the available npm/pnpm scripts for managing the CodeDefender application during development.

## Database Management

| Command | Description |
|---------|-------------|
| `pnpm prisma:generate` | Generate Prisma client from schema |
| `pnpm prisma:migrate` | Create a new migration from schema changes |
| `pnpm prisma:deploy` | Deploy migrations to the database |
| `pnpm prisma:seed` | Run seed script to populate the database |
| `pnpm prisma:reset` | Reset the database (using Prisma migrate reset) |
| `pnpm db:seed` | Alias for prisma:seed |
| `pnpm db:migrate` | Alias for prisma:migrate |
| `pnpm db:reset` | Alias for prisma:reset |
| `pnpm db:reset:full` | Force reset DB, run migrations, and seed data |

## Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:build` | Build all containers |
| `pnpm docker:up` | Start all containers |
| `pnpm docker:down` | Stop all containers |
| `pnpm docker:db:up` | Start only database containers (PostgreSQL and Redis) |
| `pnpm docker:db:down` | Stop only database containers |
| `pnpm docker:api:up` | Start only the API container |
| `pnpm docker:api:down` | Stop only the API container |
| `pnpm docker:clean` | Remove all containers and volumes (CAUTION: destroys data) |
| `pnpm docker:up:prod` | Start containers in production mode |
| `pnpm docker:down:prod` | Stop containers in production mode |

## Common Workflows

### Initial Setup
```bash
# Build and start only the database containers
pnpm docker:db:up

# Generate Prisma client
pnpm prisma:generate

# Reset database and seed with initial data
pnpm db:reset:full

# Start the API in development mode
pnpm start:dev
```

### Database Reset
```bash
# Reset and recreate the database
pnpm db:reset:full
```

### Development with Docker
```bash
# Start database containers
pnpm docker:db:up

# Build and start API separately (for easier debugging)
pnpm docker:build
pnpm docker:api:up
```

### Clean Environment
```bash
# Stop all containers and remove volumes
pnpm docker:clean

# Start fresh environment
pnpm docker:db:up
pnpm db:reset:full
```

### Production-like Environment
```bash
# Start all containers in production mode
pnpm docker:up:prod
```
