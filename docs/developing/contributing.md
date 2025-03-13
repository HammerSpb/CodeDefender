# Contributing Guide

This document provides guidelines for contributing to the CodeDefender project. Following these guidelines helps ensure a smooth and efficient development process.

## Getting Started

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Copy `.env.example` to `.env` and configure environment variables
4. Start the development environment with `pnpm docker:up`
5. Run migrations with `pnpm db:migrate`
6. Seed the database with `pnpm db:seed`
7. Start the development server with `pnpm start:dev`

## Development Workflow

### Branch Strategy

We follow a simplified GitFlow workflow:

- `main`: Production-ready code
- `develop`: Integration branch for new features
- `feature/*`: New features and enhancements
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes

### Creating a Feature

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes with regular commits
3. Push your branch to the remote repository
4. Open a pull request against `develop`

### Code Review Process

1. Ensure your code passes all tests and linting checks
2. Request review from at least one team member
3. Address any feedback from the code review
4. Once approved, the PR will be merged

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code functionality (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

### Scopes

- `auth`: Authentication and authorization
- `users`: User management
- `workspaces`: Workspace functionality
- `scans`: Scanning functionality
- `repos`: Repository management
- `schedules`: Scheduled scans
- `permissions`: Permission system
- `plans`: Plan-based features
- `audit`: Audit logging
- `api`: API endpoints
- `docs`: Documentation
- `ci`: CI/CD pipeline

### Examples

```
feat(scans): add advanced scanning option
fix(auth): resolve token refresh issue
docs(api): update API documentation for scans
refactor(permissions): simplify permission checking logic
```

## Pull Request Guidelines

### PR Title

Follow the same Conventional Commits format for PR titles:

```
feat(scans): add advanced scanning option
```

### PR Description

Include:

1. A summary of the changes
2. Motivation for the changes
3. Any breaking changes
4. Screenshots/GIFs for UI changes
5. References to related issues

Example:
```
## Changes

This PR adds advanced scanning options to the scan creation workflow.

## Motivation

Users need more control over scan parameters for specialized repositories.

## Breaking Changes

None

## Related Issues

Closes #123
```

### PR Checklist

- [ ] Code follows project coding standards
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No new linting errors
- [ ] Self-reviewed the changes

## Testing Guidelines

### Unit Tests

- Write unit tests for all new functionality
- Update existing tests when changing behavior
- Run tests with `pnpm test`

### Integration Tests

- Add integration tests for complex features
- Run integration tests with `pnpm test:e2e`

### Manual Testing

- Test your changes in development environment
- Verify all success and error cases
- Test with different user roles and permissions

## Documentation

### Code Documentation

- Add JSDoc comments for public interfaces
- Document complex algorithms
- Update existing documentation when changing behavior

### Feature Documentation

For significant features, update or create documentation in the `/docs` directory:

1. If adding a new feature, create a feature documentation file
2. If enhancing an existing feature, update the relevant documentation
3. For architectural changes, update the architecture documentation

## Deployment

### Staging Deployment

1. Changes merged to `develop` are automatically deployed to the staging environment
2. Verify your changes in the staging environment

### Production Deployment

1. Staging changes are promoted to `main` through a PR
2. Changes in `main` are automatically deployed to production
3. Tag production releases with semantic version numbers

## Troubleshooting

### Common Issues

#### Database Sync Issues

If you encounter database schema errors:

```bash
# Reset and recreate the database
pnpm db:reset

# Apply migrations and seed data
pnpm db:migrate
pnpm db:seed
```

#### Docker Issues

If you encounter Docker-related issues:

```bash
# Stop and remove containers
pnpm docker:down

# Clean up Docker resources
pnpm docker:clean

# Start fresh environment
pnpm docker:up
```

### Getting Help

- Check existing documentation
- Ask in the team chat channel
- Consult with the tech lead
- Create an issue for recurring problems