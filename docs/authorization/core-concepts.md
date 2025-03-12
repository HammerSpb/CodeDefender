# Authorization System: Core Concepts

This document explains the fundamental concepts behind CodeDefender's authorization system.

## Authorization Model

CodeDefender implements a multi-layered authorization model that provides fine-grained access control:

### 1. Authentication

Before authorization, the system verifies user identity through:
- JWT token validation
- Session management
- Trusted device verification

### 2. Role-Based Access Control (RBAC)

Users are assigned roles that determine their permissions:
- Roles contain collections of permissions
- Permissions follow `RESOURCE:ACTION` format
- Roles have specific scopes (global or workspace-level)
- Role hierarchy determines inheritance of permissions

### 3. Plan-Based Access Control

Subscription plans determine feature availability:
- Plans (FREE, PRO, ENTERPRISE) restrict access to premium features
- Features are enabled/disabled based on the workspace's plan
- Plan limitations apply to all users in a workspace

### 4. Usage Limits

Plans enforce resource usage quotas:
- Daily/monthly limits for operations (scans, reports)
- User count restrictions per workspace
- Storage and retention limitations
- API rate limiting

### 5. Context-Based Controls

Authorization decisions may consider additional context:
- Request origin (IP address)
- Time-based restrictions
- Device trust level
- User activity history

## Key Components

### Permission System

The permission system uses a `RESOURCE:ACTION` format:
- Resources represent protected entities (SCAN, REPORT, USER)
- Actions define allowed operations (CREATE, READ, UPDATE, DELETE)
- Permission codes are centrally defined as constants

### User Roles

Predefined roles with specific permission sets:
- Super Admin: Global system access
- Workspace Owner: Full control of owned workspaces
- Workspace Admin: Administrative access to assigned workspaces
- Member: Standard user capabilities
- Support: Technical support access
- Viewer: Read-only access

### Plan Features

Features controlled by subscription level:
- Core features available to all plans
- Advanced features restricted to higher-tier plans
- Enterprise features for the highest subscription tier

### Authorization Guards

Guards enforce authorization rules at various levels:
- `PermissionGuard`: Checks role-based permissions
- `FeatureGuard`: Verifies plan-based feature access
- `LimitGuard`: Enforces usage limitations
- `PolicyGuard`: Combines multiple authorization checks

### Decorator System

Decorators provide a clean API for applying authorization rules:
- `@RequiresPermission()`: Enforces permission requirements
- `@RequiresFeature()`: Checks for plan-based feature access
- `@CheckLimit()`: Validates against usage limits
- Composite policy decorators for common use cases
