# CodeDefender

CodeDefender is a security scanning and management platform for code repositories. It provides features for user management, workspace organization, scan scheduling, and audit logging.

## Features

- **User Management**: Manage users with different roles (super, owner, admin, member, support)
- **Role-Based Access Control**: Granular permission system based on roles and plans
- **Plan-Based Features**: Feature availability based on subscription plans
- **Workspace Management**: Organize repositories and scans in workspaces
- **Repository Integration**: Connect to GitHub, GitLab, and Bitbucket repositories
- **Security Scanning**: Scan repositories for secrets, vulnerabilities, and non-code files
- **Scheduled Scans**: Set up recurring scans with customizable schedules
- **Audit Logging**: Track all actions for compliance and debugging

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queuing**: Bull with Redis for asynchronous processing
- **Authentication**: JWT-based authentication
- **Testing**: Vitest for unit and integration testing
- **API Documentation**: Swagger
- **Containerization**: Docker and Docker Compose
- **Logging**: Nestjs-pino for structured logging

## Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Redis (if running locally)

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/code-defender.git
cd code-defender
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configurations.

4. Start the development environment using Docker:

```bash
pnpm docker:up
```

5. Generate Prisma client and run migrations:

```bash
pnpm prisma:generate
pnpm db:migrate
```

6. Seed the database:

```bash
pnpm db:seed
```

7. Start the development server:

```bash
pnpm start:dev
```

The API will be available at http://localhost:3000/api/v1, and the Swagger documentation at http://localhost:3000/api/docs.

### Default Users

After seeding, the following users are available:

- Super User: `super@example.com` / `pass`
- Owner: `owner@example.com` / `pass`
- Admin: `admin@example.com` / `pass`
- Member: `member@example.com` / `pass`

## API Documentation

The API documentation is available at `/api/docs` when the server is running. It provides details about all available endpoints, request/response schemas, and authentication requirements.

## Development

### Running Tests

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run end-to-end tests
pnpm test:e2e
```

### Database Management

```bash
# Generate Prisma client
pnpm prisma:generate

# Create a new migration
pnpm db:migrate

# Reset the database
pnpm db:reset

# Seed the database
pnpm db:seed
```

### Docker Commands

```bash
# Start development environment
pnpm docker:up

# Stop development environment
pnpm docker:down

# Start production environment
pnpm docker:up:prod

# Stop production environment
pnpm docker:down:prod

# Rebuild containers
pnpm docker:build
```

## Project Structure

```
code-defender/
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── src/                     # Source code
│   ├── common/             # Common utilities, guards, decorators
│   ├── auth/               # Authentication module
│   ├── users/              # Users module
│   ├── workspaces/         # Workspaces module
│   ├── repositories/       # Repositories module
│   ├── scans/              # Scans module
│   ├── schedules/          # Schedules module
│   ├── audit-logs/         # Audit logs module
│   ├── permissions/        # Permissions system
│   ├── plans/              # Plan-based features
│   ├── roles/              # Role management
│   ├── billing/            # Billing and plan upgrades
│   ├── analytics/          # Usage analytics and reporting
│   ├── prisma/             # Prisma service
│   ├── app.module.ts       # Main application module
│   └── main.ts             # Application entry point
├── test/                    # Test files
├── docker-compose.yml       # Development Docker Compose configuration
├── docker-compose.prod.yml  # Production Docker Compose configuration
├── Dockerfile               # Docker image configuration
└── README.md                # Project documentation
```

## Deployment

### Using Docker Compose (Recommended)

1. Set up your environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with production configurations.

2. Start the services:

```bash
pnpm docker:up:prod
```

### Manual Deployment

1. Build the application:

```bash
pnpm build
```

2. Run database migrations:

```bash
pnpm prisma:deploy
```

3. Start the application:

```bash
pnpm start:prod
```

## License

[MIT License](LICENSE)
