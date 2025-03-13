# CodeDefender Documentation

Welcome to the comprehensive documentation for the CodeDefender security scanning platform.

## Table of Contents

### System Overview
- [Architecture Overview](overview.md)
- [System Architecture](overview/architecture.md)
- [Security Model](overview/security-model.md)
- [Data Model](overview/data-model.md)
- [Code Organization](overview/code-organization.md)
- [API Design](overview/api-design.md)
- [Authentication System](overview/authentication.md)
- [Authorization System](overview/authorization.md)
- [Testing Strategy](overview/testing-strategy.md)
- [Common Utilities](overview/common-utilities.md)

### Developer Guides
- [Coding Standards](developing/coding-standards.md)
- [Contributing Guide](developing/contributing.md)
- [Adding New Features](developing/adding-new-features.md)

### Authorization System
- [Authorization System Overview](authorization/README.md)
- [Core Concepts](authorization/core-concepts.md)
- [Permissions Reference](authorization/permissions.md)
- [Guards & Decorators](authorization/guards-decorators.md)
- [Developer Guides](authorization/guides/)
  - [Adding New Permissions](authorization/guides/adding-permissions.md)
  - [Securing New Endpoints](authorization/guides/securing-endpoints.md)
  - [Working with Plans & Features](authorization/guides/working-with-plans.md)
  - [Implementing Usage Limits](authorization/guides/implementing-limits.md)

### API Documentation
- [API Overview](api/README.md)
- [Authentication API](api/authentication.md)
- [Scans API](api/scans.md)

### Database
- [Database Schema](database/schema.md)
- [Migrations](database/migrations.md)
- [Seeding Data](database/seeding.md)

### Development
- [Development Environment Setup](development/setup.md)
- [Coding Guidelines](development/coding-guidelines.md)
- [Testing Strategy](development/testing.md)

### Plans
- [Subscription Plans Overview](plans/README.md)
- [Using Plan-Based Access](plans/using-plan-based-access.md)

## Quick References

### Key Concepts
- **Workspaces**: Isolated environments for organizing repositories and scans
- **Permissions**: Fine-grained access control based on user roles
- **Plans**: Subscription-based feature access and usage limits
- **Scans**: Security analysis of code repositories
- **Schedules**: Automated recurring scans

### Getting Started
1. Check out the [Development Environment Setup](development/setup.md)
2. Review the [Architecture Overview](overview.md)
3. Understand the [Authorization System](authorization/README.md)
4. Follow the [Contributing Guide](developing/contributing.md)

### Helpful Resources
- [API Swagger Documentation](http://localhost:3000/api/docs) (when running locally)
- [Testing Guide](development/testing.md)
- [Coding Standards](developing/coding-standards.md)

## Contributing to Documentation

When extending or modifying CodeDefender documentation:

1. **Keep Documentation in Sync** - Update documentation when code changes
2. **Follow Markdown Standards** - Use consistent formatting
3. **Include Examples** - Provide code examples for complex concepts
4. **Document Authorization** - Always include authorization requirements
5. **Be Concise** - Write clearly and concisely