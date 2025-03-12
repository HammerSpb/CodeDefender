# Authorization Guards in CodeDefender

This document outlines the authorization guard system implemented in Phase 4 of the CodeDefender project.

## Overview

The authorization system provides a multi-layered approach to access control:

1. **Permission-based** - Controls access based on user roles and assigned permissions
2. **Plan-based** - Restricts feature access based on subscription plans
3. **Context-aware** - Enforces resource-level security checks (ownership, workspace membership)
4. **Environmental** - Additional restrictions based on IP address, time of day, etc.

## Guard Types

### Permission Guard

The permission guard checks if the user has the required permissions to perform an action.

```typescript
@RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
async createScan() {
  // Implementation
}

// Requiring multiple permissions (AND logic)
@RequiresAllPermissions([
  PERMISSION_CODES.WORKSPACE_READ,
  PERMISSION_CODES.SCAN_CREATE
])
async createWorkspaceScan() {
  // Implementation
}

// Requiring any of multiple permissions (OR logic)
@RequiresAnyPermission([
  PERMISSION_CODES.WORKSPACE_MANAGE,
  PERMISSION_CODES.SCAN_CREATE
])
async manageScan() {
  // Implementation
}
```

### Context-Aware Guard

The context-aware guard performs security checks based on resource context:

```typescript
// Check resource ownership
@SecurityContext({
  checkResourceOwnership: true,
  resourceType: 'WORKSPACE',
  resourceIdParam: 'workspaceId'
})
async updateWorkspace() {
  // Implementation
}

// Check workspace membership
@RequiresWorkspaceMembership()
async viewWorkspaceDetails() {
  // Implementation
}

// Restrict by time
@TimeRestricted(9, 17, 'UTC')
async performAdminOperation() {
  // Implementation
}

// Restrict by IP
@RestrictToIps(['192.168.1.1', '10.0.0.1'])
async accessSensitiveData() {
  // Implementation
}
```

### Unified Authorization Guard

The unified guard combines all aspects of authorization into a single decorator:

```typescript
@Authorize({
  permissions: [PERMISSION_CODES.SCAN_CREATE],
  features: [Feature.ADVANCED_SCAN],
  limitType: LimitType.SCANS_PER_DAY,
  checkWorkspaceMembership: true,
})
async createAdvancedScan() {
  // Implementation
}
```

## Shorthand Decorators

For common scenarios, we provide shorthand decorators:

```typescript
// Authorize resource operations
@AuthorizeResource(
  'SCAN',
  'scanId',
  [PERMISSION_CODES.SCAN_UPDATE],
  [Feature.ADVANCED_SCAN]
)
async updateScan() {
  // Implementation
}

// Authorize workspace operations
@AuthorizeWorkspace(
  [PERMISSION_CODES.WORKSPACE_READ]
)
async getWorkspaceDetails() {
  // Implementation
}

// Authorize admin operations
@AuthorizeAdmin(
  [PERMISSION_CODES.SETTINGS_MANAGE]
)
async updateSystemSettings() {
  // Implementation
}

// Authorize API access
@AuthorizeApi(
  [PERMISSION_CODES.SCAN_CREATE]
)
async apiCreateScan() {
  // Implementation
}
```

## Authorization Options

All guards support various options:

- `errorMessage` - Custom error message to display
- `allowSuper` - Whether SUPER users bypass checks (default: true)
- `failClosed` - Whether to fail securely on errors (default: true)
- `requireAllPermissions` - Whether all permissions are required (default varies)

## Error Handling

Authorization failures result in a `ForbiddenException` with either:

1. A custom error message specified in options
2. A generated message specific to the check that failed
3. Plan-specific upgrade prompts when applicable

## Environmental Checks

The system supports context-based restrictions:

### Time-Based Restrictions

Restrict operations to specific hours:

```typescript
@Authorize({
  timeRestriction: {
    startHour: 9,
    endHour: 17,
    timezone: 'UTC',
  }
})
```

### IP-Based Restrictions

Restrict operations by IP address:

```typescript
@Authorize({
  ipRestrictions: {
    allowedIps: ['192.168.1.0/24'], // Allow specific IPs
    blockedIps: ['10.0.0.5'],       // Block specific IPs
  }
})
```

## Plan-Based Authorization

The unified authorization system integrates with the plan service to:

1. Check if a user's plan includes needed permissions
2. Verify feature availability based on subscription tier
3. Enforce usage limits
4. Provide specific upgrade messages when a plan restriction is encountered

## Implementation Details

The authorization system uses NestJS guards and metadata to perform checks:

1. Each decorator sets metadata on the controller or method
2. Guards extract this metadata and perform the necessary checks
3. Checks can be combined for defense-in-depth security
4. Caching is used to optimize repeated permission checks

## Migration Guide

To migrate from the old authorization approach:

1. Replace standalone permission checks with `@RequiresPermission()`
2. Replace manual feature checks with `@RequiresFeature()`
3. For combined checks, use the `@Authorize()` decorator
4. For resource-specific operations, use `@AuthorizeResource()`
5. For workspace operations, use `@AuthorizeWorkspace()`
6. For admin operations, use `@AuthorizeAdmin()`

## Best Practices

1. Always use decorators rather than inline permission checks
2. Apply authorization at the controller level when all endpoints share requirements
3. Use more specific checks at the method level
4. Set custom error messages for better user experience
5. Use shorthand decorators for common scenarios
6. Remember to provide upgrade paths when plan-based restrictions apply
