# Guide: Securing New Endpoints

This guide explains how to properly secure new endpoints in CodeDefender using the authorization system.

## Overview

When creating new endpoints, you need to:
1. Determine the required permissions
2. Apply appropriate guards
3. Test with different user roles and plans

## Step 1: Identify Required Permissions

For each endpoint, identify the:
- Resource being accessed
- Action being performed
- Required subscription features
- Usage limits that apply

Example for a scan endpoint:
```
Endpoint: POST /api/workspaces/:workspaceId/scans
Permission: SCAN:CREATE
Feature: BASIC_SCAN (all plans) or ADVANCED_SCAN (Pro+)
Limit: SCANS_PER_DAY
```

## Step 2: Apply Authorization Decorators

Apply the appropriate decorators to your controller methods:

```typescript
import { Controller, Post, Body, Param } from '@nestjs/common';
import { RequiresPermission } from '../authorization/decorators/requires-permission.decorator';
import { RequiresFeature } from '../authorization/decorators/requires-feature.decorator';
import { CheckLimit } from '../authorization/decorators/check-limit.decorator';
import { PERMISSION_CODES } from '../authorization/constants/permissions.constants';
import { Feature } from '../plans/enums/feature.enum';
import { LimitType } from '../plans/enums/limit-type.enum';

@Controller('workspaces/:workspaceId/scans')
export class ScanController {
  @Post()
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @CheckLimit(LimitType.SCANS_PER_DAY)
  create(@Param('workspaceId') workspaceId: string, @Body() createScanDto: CreateScanDto) {
    // Implementation...
  }

  @Post('advanced')
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @RequiresFeature(Feature.ADVANCED_SCAN, {
    errorMessage: 'Advanced scanning requires a Pro plan or higher.',
    upgradePath: '/billing/upgrade',
  })
  @CheckLimit(LimitType.SCANS_PER_DAY)
  createAdvanced(@Param('workspaceId') workspaceId: string, @Body() createAdvancedScanDto: CreateAdvancedScanDto) {
    // Implementation...
  }
}
```

## Step 3: Use Composite Policies for Common Patterns

For common authorization patterns, create and use composite policies:

```typescript
// src/authorization/policies/scan-policies.ts
import { applyDecorators } from '@nestjs/common';
import { RequiresPermission } from '../decorators/requires-permission.decorator';
import { RequiresFeature } from '../decorators/requires-feature.decorator';
import { CheckLimit } from '../decorators/check-limit.decorator';
import { PERMISSION_CODES } from '../constants/permissions.constants';
import { Feature } from '../../plans/enums/feature.enum';
import { LimitType } from '../../plans/enums/limit-type.enum';

export const CanCreateScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_CREATE),
    CheckLimit(LimitType.SCANS_PER_DAY),
  );
};

export const CanCreateAdvancedScan = () => {
  return applyDecorators(
    RequiresPermission(PERMISSION_CODES.SCAN_CREATE),
    RequiresFeature(Feature.ADVANCED_SCAN, {
      errorMessage: 'Advanced scanning requires a Pro plan or higher.',
      upgradePath: '/billing/upgrade',
    }),
    CheckLimit(LimitType.SCANS_PER_DAY),
  );
};

// Usage in controller
@Post()
@CanCreateScan()
create() { ... }

@Post('advanced')
@CanCreateAdvancedScan()
createAdvanced() { ... }
```

## Step 4: Workspace Context

Most endpoints operate within a workspace context. Ensure your authorization checks include the workspace ID:

```typescript
// The workspace ID is typically extracted from the request URL
// The guards automatically use this parameter
@Controller('workspaces/:workspaceId/resources')
export class ResourceController {
  @Get()
  @RequiresPermission(PERMISSION_CODES.RESOURCE_READ)
  findAll(@Param('workspaceId') workspaceId: string) {
    // The permission check will automatically scope to this workspace
    return this.resourceService.findAll(workspaceId);
  }
}
```

## Step 5: Document Authorization Requirements

Document the authorization requirements in your API documentation:

```typescript
@ApiTags('Scans')
@ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/scans')
export class ScanController {
  @Post()
  @ApiOperation({ summary: 'Create a new security scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or plan limits' })
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  @CheckLimit(LimitType.SCANS_PER_DAY)
  create() { ... }
}
```

## Step 6: Testing Authorization

Test your authorization logic with different user roles:

```typescript
describe('ScanController (Authorization)', () => {
  it('allows workspace owner to create scan', async () => {
    // Setup test with workspace owner role
    // ...
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/scans`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(createScanDto);
    
    expect(response.status).toBe(201);
  });

  it('prevents viewers from creating scans', async () => {
    // Setup test with viewer role
    // ...
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/scans`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(createScanDto);
    
    expect(response.status).toBe(403);
  });

  it('prevents exceeding plan limits', async () => {
    // Setup test with exceeded limits
    // ...
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/scans`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send(createScanDto);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('daily scan limit');
  });
});
```

## Best Practices

1. **Use Constants**: Always use centralized permission constants
2. **Layer Security**: Apply both permission and plan-based checks
3. **Clear Error Messages**: Provide helpful error messages for users
4. **Test Coverage**: Test with various roles and edge cases
5. **Document Requirements**: Clearly document authorization requirements
6. **Resource-Level Security**: Apply checks at the resource level when needed

## Related Documentation

- [Guards & Decorators Reference](../guards-decorators.md)
- [Working with Plans & Features](./working-with-plans.md)
- [Implementing Usage Limits](./implementing-limits.md)
