# API Design

CodeDefender follows RESTful API design principles with consistent patterns across all endpoints.

## API Structure

The API is versioned and follows the pattern:

```
/api/v1/{resource}
```

### Resource Hierarchy

```
/api/v1/auth                       # Authentication endpoints
/api/v1/users                      # User management
/api/v1/workspaces                 # Workspace management
/api/v1/workspaces/{id}/users      # Workspace members
/api/v1/workspaces/{id}/scans      # Scans for a workspace
/api/v1/workspaces/{id}/schedules  # Scan schedules
/api/v1/workspaces/{id}/repositories # Workspace repositories
/api/v1/roles                      # Role management
/api/v1/settings                   # System settings
```

## Authentication

All API endpoints (except authentication endpoints) require authentication via JWT bearer token.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Request/Response Format

### Request Format

```json
{
  "property1": "value1",
  "property2": "value2"
}
```

### Success Response Format

```json
{
  "data": {
    "id": "uuid",
    "property1": "value1",
    "property2": "value2"
  },
  "meta": {
    "timestamp": "2023-08-15T12:00:00Z"
  }
}
```

### List Response Format

```json
{
  "data": [
    {
      "id": "uuid1",
      "property1": "value1"
    },
    {
      "id": "uuid2",
      "property1": "value2"
    }
  ],
  "meta": {
    "count": 2,
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### Error Response Format

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action",
    "details": {
      "requiredPermission": "SCAN:CREATE"
    }
  },
  "meta": {
    "timestamp": "2023-08-15T12:00:00Z",
    "requestId": "req-12345"
  }
}
```

## Common Patterns

### Pagination

All list endpoints support pagination via query parameters:

```
GET /api/v1/workspaces?page=1&pageSize=10
```

### Filtering

List endpoints support filtering via query parameters:

```
GET /api/v1/scans?status=COMPLETED&dateFrom=2023-01-01&dateTo=2023-01-31
```

### Sorting

List endpoints support sorting via query parameters:

```
GET /api/v1/scans?sort=createdAt&order=desc
```

### Field Selection

Some endpoints support field selection to reduce payload size:

```
GET /api/v1/scans?fields=id,status,createdAt
```

## Key Endpoints

### Authentication

```
POST /api/v1/auth/login                # Login with credentials
POST /api/v1/auth/logout               # Logout (revoke session)
POST /api/v1/auth/refresh              # Refresh access token
POST /api/v1/auth/forgot-password      # Request password reset
POST /api/v1/auth/reset-password       # Reset password with token
GET  /api/v1/auth/sessions             # List active sessions
DELETE /api/v1/auth/sessions/{id}      # Revoke specific session
POST /api/v1/auth/mfa/setup            # Set up multi-factor authentication
POST /api/v1/auth/mfa/verify           # Verify MFA code
```

### User Management

```
GET    /api/v1/users                   # List users
POST   /api/v1/users                   # Create user
GET    /api/v1/users/{id}              # Get user details
PATCH  /api/v1/users/{id}              # Update user
DELETE /api/v1/users/{id}              # Delete user
GET    /api/v1/users/{id}/permissions  # Get user permissions
GET    /api/v1/users/{id}/roles        # Get user roles
```

### Workspace Management

```
GET    /api/v1/workspaces              # List workspaces
POST   /api/v1/workspaces              # Create workspace
GET    /api/v1/workspaces/{id}         # Get workspace details
PATCH  /api/v1/workspaces/{id}         # Update workspace
DELETE /api/v1/workspaces/{id}         # Delete workspace
GET    /api/v1/workspaces/{id}/users   # List workspace members
POST   /api/v1/workspaces/{id}/users   # Add user to workspace
DELETE /api/v1/workspaces/{id}/users/{userId} # Remove user from workspace
```

### Scan Management

```
GET    /api/v1/workspaces/{id}/scans   # List scans in workspace
POST   /api/v1/workspaces/{id}/scans   # Create scan
GET    /api/v1/workspaces/{id}/scans/{scanId} # Get scan details
DELETE /api/v1/workspaces/{id}/scans/{scanId} # Delete scan
POST   /api/v1/workspaces/{id}/scans/advanced # Create advanced scan
GET    /api/v1/workspaces/{id}/scans/historical # Get historical scans
```

### Schedule Management

```
GET    /api/v1/workspaces/{id}/schedules # List schedules in workspace
POST   /api/v1/workspaces/{id}/schedules # Create schedule
GET    /api/v1/workspaces/{id}/schedules/{scheduleId} # Get schedule details
PATCH  /api/v1/workspaces/{id}/schedules/{scheduleId} # Update schedule
DELETE /api/v1/workspaces/{id}/schedules/{scheduleId} # Delete schedule
```

## API Controller Example

```typescript
@ApiTags('scans')
@Controller('workspaces/:workspace_id/scans')
@ApiBearerAuth()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @CanCreateScan()
  @ApiOperation({ summary: 'Create a new scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden or plan limits exceeded' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto, @Request() req) {
    createScanDto.workspaceId = workspaceId;
    return this.scansService.create(createScanDto, req.user.sub);
  }

  @Get()
  @CanViewScan()
  @ApiOperation({ summary: 'Get all scans for a workspace' })
  @ApiResponse({ status: 200, description: 'Return all scans for a workspace' })
  findAll(@Param('workspace_id') workspaceId: string, @Request() req) {
    return this.scansService.findAllByWorkspace(workspaceId, req.user.sub);
  }

  @Get(':id')
  @CanViewScan()
  @ApiOperation({ summary: 'Get a scan by ID' })
  @ApiResponse({ status: 200, description: 'Return the scan' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.scansService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  @CanDeleteScan()
  @ApiOperation({ summary: 'Delete a scan' })
  @ApiResponse({ status: 200, description: 'Scan deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.scansService.remove(id, req.user.sub);
  }
}
```

## API Documentation

API documentation is available through Swagger at `/api/docs` when the server is running.

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('CodeDefender API')
  .setDescription('API for code security scanning and management')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```