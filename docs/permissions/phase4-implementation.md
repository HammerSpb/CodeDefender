# Phase 4: Authorization Guards Implementation

This document outlines the implementation of Phase 4 in the CodeDefender project, focusing on Authorization Guards.

## Overview

Phase 4 has enhanced the security model by implementing a comprehensive authorization system that combines:

1. **Permission-Based Access Control** - Checks user roles and permissions
2. **Plan-Based Feature Access** - Verifies subscription plan compatibility 
3. **Context-Aware Security** - Enforces resource-level restrictions
4. **Environmental Security** - Adds time and IP-based constraints

## Components Implemented

### 1. Context-Aware Security Guard

We've created a guard that checks security based on the request context:

- **Resource Ownership** - Verifies the user owns the requested resource
- **Workspace Membership** - Ensures the user belongs to the workspace
- **Time-Based Restrictions** - Limits operations to certain hours
- **IP-Based Restrictions** - Controls access by IP address

### 2. Unified Authorization Guard

We've implemented a comprehensive guard that combines multiple security aspects:

- Integrates permission checks, plan verification, and context security
- Provides detailed error messages with upgrade paths
- Handles SUPER user bypass configuration
- Implements proper error handling with secure defaults

### 3. Security Context Decorator

We've created decorators for applying contextual security:

- **@SecurityContext** - Base decorator for context security
- **@RequiresResourceOwnership** - Shorthand for ownership checks
- **@RequiresWorkspaceMembership** - Shorthand for workspace membership
- **@TimeRestricted** - Shorthand for time-based restrictions
- **@RestrictToIps / @BlockIps** - Shorthand for IP restrictions

### 4. Unified Authorization Decorator

We've implemented a comprehensive authorization decorator:

- **@Authorize** - Combined decorator for all security aspects
- **@AuthorizeResource** - Shorthand for resource authorization
- **@AuthorizeWorkspace** - Shorthand for workspace operations
- **@AuthorizeAdmin** - Shorthand for admin operations
- **@AuthorizeApi** - Shorthand for API access

### 5. Example Controller Implementation

We've created an example controller demonstrating various authorization scenarios:

- Basic permission checks
- Feature verification
- Resource ownership validation
- Workspace membership verification
- IP restrictions
- Time-based restrictions
- Combined authorization scenarios

## Integration Points

The authorization system integrates with:

1. **Permissions System** - From Phase 2, for role-based checks
2. **Plans System** - From Phase 3, for subscription-based checks
3. **NestJS Guard System** - For request interception
4. **Prisma ORM** - For resource relationship verification

## Key Features

### Multi-Layered Security

The system implements defense-in-depth by combining multiple security checks:

```typescript
@Authorize({
  permissions: [PERMISSION_CODES.WORKSPACE_UPDATE],
  features: [Feature.TEAM_MANAGEMENT],
  checkResourceOwnership: true,
  resourceType: 'WORKSPACE',
  resourceIdParam: 'workspaceId',
})
```

### Granular Access Control

The authorization system supports fine-grained controls:

- Permission-level access control
- Feature-level access control
- Resource-level access control
- Contextual access control

### Readable & Maintainable Code

The decorators provide a clean, declarative way to specify authorization:

```typescript
// Before
async updateWorkspace() {
  // Manual permission checks
  if (!await this.permissionService.userHasPermission(...)) {
    throw new ForbiddenException();
  }
  
  // Manual feature checks
  if (!await this.planService.userHasFeature(...)) {
    throw new ForbiddenException();
  }
  
  // Manual ownership check
  const workspace = await this.prisma.workspace.findUnique(...);
  if (workspace.ownerId !== userId) {
    throw new ForbiddenException();
  }
  
  // Implementation
}

// After
@AuthorizeResource(
  'WORKSPACE',
  'workspaceId',
  [PERMISSION_CODES.WORKSPACE_UPDATE],
  [Feature.TEAM_MANAGEMENT]
)
async updateWorkspace() {
  // Implementation
}
```

### Enhanced User Experience

The system provides clear, helpful error messages:

- Custom error messages for different scenarios
- Plan upgrade prompts when applicable
- Specific messages for different types of restrictions

## Testing

To test the implementation:

1. Create users with different roles and permissions
2. Test with users on different subscription plans
3. Verify resource ownership checks
4. Test time-based restrictions
5. Test IP-based restrictions
6. Verify error messages and upgrade prompts

## Next Steps

With Phase 4 complete, the authorization system is now fully implemented. Next steps could include:

1. Adding more sophisticated resource relationship checks
2. Implementing audit logging for authorization decisions
3. Adding two-factor authentication for critical operations
4. Creating a unified policy management interface
