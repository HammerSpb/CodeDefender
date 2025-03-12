# CodeDefender API Documentation

This section provides documentation for the CodeDefender API endpoints and their authorization requirements.

## API Overview

CodeDefender exposes a RESTful API with the following characteristics:

- All endpoints are secured with JWT authentication
- Authorization is enforced through roles, permissions, and plans
- Resource paths follow a hierarchical structure
- JSON is used for request and response payloads

## API Structure

The API is structured around these primary resources:

- `/api/auth` - Authentication operations
- `/api/workspaces` - Workspace management
- `/api/workspaces/:workspaceId/scans` - Security scanning operations
- `/api/workspaces/:workspaceId/repositories` - Code repository management
- `/api/workspaces/:workspaceId/reports` - Security report access
- `/api/workspaces/:workspaceId/users` - Workspace user management
- `/api/workspaces/:workspaceId/roles` - Role management
- `/api/plans` - Subscription plan information

## API Documentation Sections

- [Authentication](./authentication.md) - API authentication methods
- [Workspaces](./workspaces.md) - Workspace management endpoints
- [Scans](./scans.md) - Security scanning endpoints
- [Repositories](./repositories.md) - Repository management endpoints
- [Reports](./reports.md) - Security report endpoints
- [Users](./users.md) - User management endpoints
- [Roles](./roles.md) - Role management endpoints
- [Plans](./plans.md) - Plan and billing endpoints

## Authorization Requirements

All API endpoints include authorization requirements, which are documented in the following format:

- **Permission**: Required permission code(s)
- **Plan Feature**: Required subscription feature(s), if applicable
- **Usage Limit**: Applicable usage limitations

Example:

```
POST /api/workspaces/:workspaceId/scans
Create a new security scan

Authorization:
- Permission: SCAN:CREATE
- Plan Feature: None (Basic) or ADVANCED_SCAN (Advanced)
- Usage Limit: SCANS_PER_DAY
```

## Error Responses

The API returns standardized error responses for authorization failures:

### Permission Denied

```json
{
  "statusCode": 403,
  "message": "You do not have permission to perform this action",
  "error": "Forbidden"
}
```

### Feature Not Available

```json
{
  "statusCode": 403,
  "message": "This feature requires a Pro plan or higher",
  "error": "Forbidden",
  "upgradePath": "/billing/upgrade"
}
```

### Usage Limit Exceeded

```json
{
  "statusCode": 403,
  "message": "You have reached your daily scan limit of 5. Try again tomorrow or upgrade your plan.",
  "error": "Forbidden",
  "upgradePath": "/billing/upgrade"
}
```

## API Versioning

The API is versioned to ensure compatibility:

- Current stable version: v1
- Access versioned API at: `/api/v1/...`
- The default `/api/...` path points to the latest stable version
