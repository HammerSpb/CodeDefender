# Authorization System

This document describes the permission-based authorization system for CodeDefender.

## Overview

CodeDefender uses a hybrid authorization approach combining:
1. Role-based access control (RBAC)
2. Plan-based feature access
3. Resource usage limits

## Permission Structure

Permissions follow the format: `RESOURCE:ACTION`

Example: `SCAN:CREATE` - Permission to create scans

### Resources
- WORKSPACE - Workspace management
- SCAN - Security scans
- REPORT - Security reports
- USER - User management
- REPOSITORY - Code repositories
- SCHEDULE - Scheduled scans
- ROLE - Role management
- PERMISSION - Permission assignments
- SETTINGS - Application settings

### Actions
- CREATE - Create resources
- READ - View resources
- UPDATE - Modify resources
- DELETE - Remove resources
- EXECUTE - Run operations
- MANAGE - Complete control

## Role Hierarchy

| Role | Description | Scope |
|------|-------------|-------|
| Super Admin | Full system access | Global |
| Workspace Owner | Full control of their workspaces | Workspace |
| Workspace Admin | Administrative access to assigned workspaces | Workspace |
| Member | Standard user permissions | Workspace |
| Support | Technical support access | Global |
| Viewer | Read-only access | Workspace |

## Plan-Based Access

Features are restricted based on subscription tier:

| Feature | Starter | Pro | Business | Enterprise |
|---------|---------|-----|----------|------------|
| Advanced Scanning | ❌ | ✅ | ✅ | ✅ |
| Historical Scans | ❌ | ✅ | ✅ | ✅ |
| Custom Rules | ❌ | ❌ | ✅ | ✅ |
| Scheduled Scans | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Team Management | ❌ | ✅ | ✅ | ✅ |
| SSO Login | ❌ | ❌ | ✅ | ✅ |
| Role Customization | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |

## Usage Limits

| Limit | Starter | Pro | Business | Enterprise |
|-------|---------|-----|----------|------------|
| Scans/Day | 5 | 20 | 50 | 100 |
| Users/Workspace | 3 | 10 | 30 | 100 |
| Max Workspaces | 1 | 3 | 10 | 100 |
| Max Repositories | 5 | 20 | 50 | 500 |
| History Retention | 14 days | 30 days | 90 days | 365 days |

## Authorization Guards

### PermissionGuard
Checks role-based permissions

```typescript
@RequiresPermission('SCAN:CREATE')
@Get()
findAll() { ... }
```

### FeatureGuard
Checks plan-based feature access

```typescript
@RequiresFeature(Feature.ADVANCED_SCAN)
@Post('advanced')
createAdvanced() { ... }
```

### LimitGuard
Checks usage limits

```typescript
@CheckLimit(LimitType.SCANS_PER_DAY)
@Post()
create() { ... }
```

### PolicyGuard
Unified guard combining all checks

## Practical Example

```typescript
// Combined policy for scan creation
export const CanCreateAdvancedScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_CREATE),
    RequiresFeature(Feature.ADVANCED_SCAN, {
      errorMessage: 'Advanced scanning requires a Pro plan or higher.',
    }),
    CheckLimit(LimitType.SCANS_PER_DAY, { 
      workspaceIdParam: 'workspaceId' 
    }),
  );
};

// Using the policy
@Post('advanced')
@CanCreateAdvancedScan()
createAdvancedScan() { ... }
```
