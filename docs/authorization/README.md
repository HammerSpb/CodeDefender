# CodeDefender Authorization System

This folder contains comprehensive documentation for the authorization system in CodeDefender.

## System Overview

CodeDefender implements a hybrid authorization system that combines:

1. **Role-Based Access Control (RBAC)**: Permissions assigned via user roles
2. **Plan-Based Feature Access**: Features restricted by subscription tier
3. **Resource Usage Limits**: Usage quotas based on subscription level
4. **Context-Aware Authorization**: Security checks based on request context

## Documentation Structure

- [**Core Concepts**](./core-concepts.md): Authorization system principles and terminology
- [**Permissions Reference**](./permissions.md): Permission structure and role hierarchy
- [**Guards & Decorators**](./guards-decorators.md): Authorization enforcement mechanisms
- [**Developer Guides**](./guides/): Implementation guides for common scenarios
  - [Adding New Permissions](./guides/adding-permissions.md)
  - [Securing New Endpoints](./guides/securing-endpoints.md)
  - [Working with Plans & Features](./guides/working-with-plans.md)
  - [Implementing Usage Limits](./guides/implementing-limits.md)

## Quick Start

For developers implementing authorization in new features:

1. Determine the required permissions for your new functionality
2. Check if existing permission codes cover your needs
3. Use the appropriate guard or create a composite policy
4. Add authorization decorators to your controllers or methods
5. Test with different user roles and plan levels
6. Document any new permissions or authorization patterns

## Best Practices

- Always use the centralized constants for permissions
- Test authorization rules with different user roles
- Consider both permission and plan-based restrictions
- Document authorization requirements in API endpoints
- Use composite policies for complex authorization logic

## Related Documentation

- [API Documentation](../api/): API endpoint authorization requirements
- [Plans & Features](../plans/): Subscription plan feature sets
- [User Management](../users/): User creation and role assignment
