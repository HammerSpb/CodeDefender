# Security Model

CodeDefender implements a comprehensive, multi-layered security model to protect sensitive data and ensure proper access controls.

## Authentication

### JWT-Based Authentication
- **Access tokens**: Short-lived JWT tokens (15 min) for API authorization
- **Refresh tokens**: Long-lived tokens for obtaining new access tokens
- **Session tracking**: All active sessions recorded in database

### Multi-Factor Authentication
- Optional TOTP-based second factor
- Device fingerprinting for suspicious login detection
- Trusted device management

### Login Methods
- Username/password with bcrypt hashing
- OAuth providers (GitHub, GitLab)
- Magic link / passwordless authentication

## Authorization

### Role-Based Access Control
The system uses a three-tier authorization model:

1. **System Roles** (global)
   - SUPER: System administrator with all permissions
   - SUPPORT: Support staff with limited admin capabilities
   - OWNER: Organization owner with org-wide permissions
   - ADMIN: Administrator with elevated workspace permissions
   - MEMBER: Regular user with basic permissions

2. **Workspace Roles** (per workspace)
   - ADMIN: Workspace administrator
   - MEMBER: Workspace member

3. **Custom Roles** (per workspace)
   - User-defined roles with custom permission sets

### Permission Model

Permissions follow a resource-action pattern:
```
{RESOURCE}:{ACTION}
```

Examples:
- `WORKSPACE:CREATE` - Can create workspaces
- `SCAN:EXECUTE` - Can execute scans
- `USER:MANAGE` - Has full control over users

Permissions are organized by:
- **Scope**: GLOBAL, WORKSPACE, SCAN, REPORT, etc.
- **Action**: CREATE, READ, UPDATE, DELETE, EXECUTE, MANAGE
- **Resource**: WORKSPACE, SCAN, REPORT, USER, etc.

### Plan-Based Access

Feature availability is determined by subscription plan:
- **Starter**: Basic scanning capabilities
- **Pro**: Advanced scans, API access, team management
- **Business**: Custom roles, SSO, audit logs
- **Enterprise**: Priority support, unlimited resources

## Resource Protection

### Resource Ownership
- Each resource has an owner
- Ownership checks enforce access restrictions
- Special handling for team/shared resources

### Workspace Isolation
- Resources are isolated by workspace
- Cross-workspace access is prohibited
- Workspace membership required for access

## Security Implementations

### Guards
- `PermissionGuard`: Checks permission-based access
- `FeatureGuard`: Enforces plan-based feature access
- `LimitGuard`: Enforces usage limits
- `UnifiedAuthGuard`: Combines multiple authorization strategies

### Decorators
- `@RequiresPermission()`: Declarative permission requirements
- `@RequiresFeature()`: Plan-based feature requirements
- `@CheckLimit()`: Usage limit enforcement
- `@Authorize()`: Unified authorization decorator

## Usage Example

```typescript
@Controller('workspaces/:workspace_id/scans')
export class ScansController {
  @Post()
  @Authorize({
    permissions: [PERMISSION_CODES.SCAN_CREATE],
    limitType: LimitType.SCANS_PER_DAY,
    checkWorkspaceMembership: true
  })
  create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto) {
    // Implementation...
  }
}
```

## Audit and Compliance

- **Comprehensive audit logs** for all security-relevant actions
- **Session tracking** for detecting unauthorized access
- **Usage monitoring** for plan compliance
- **IP-based restrictions** for enhanced security