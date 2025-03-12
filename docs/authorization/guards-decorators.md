# Authorization Guards & Decorators

This document provides detailed information about the authorization guards and decorators used in CodeDefender.

## Guards Overview

Guards in NestJS intercept requests to determine if they should proceed. CodeDefender implements several specialized guards for authorization.

### PermissionGuard

Validates that the authenticated user has the required permission for the requested operation.

```typescript
// Implementation
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    
    if (!requiredPermission) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId;
    
    return this.permissionService.hasPermission(
      user.id,
      requiredPermission,
      workspaceId,
    );
  }
}
```

### FeatureGuard

Checks if the workspace's subscription plan includes access to the requested feature.

```typescript
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private planService: PlanService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<Feature>(
      'feature',
      context.getHandler(),
    );
    
    if (!requiredFeature) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params.workspaceId;
    
    return this.planService.hasFeatureAccess(workspaceId, requiredFeature);
  }
}
```

### LimitGuard

Verifies that the operation doesn't exceed plan-defined usage limits.

```typescript
@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    private planService: PlanService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<LimitType>(
      'limitType',
      context.getHandler(),
    );
    
    if (!limitType) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params.workspaceId;
    
    return this.planService.checkUsageLimit(workspaceId, limitType);
  }
}
```

### PolicyGuard

Combines multiple authorization checks into a unified policy decision.

```typescript
@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private planService: PlanService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.get<AuthPolicy>(
      'policy',
      context.getHandler(),
    );
    
    if (!policy) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    // Evaluate all policy conditions
    // ...
    
    return result; // Combined authorization decision
  }
}
```

## Decorators

Decorators provide a clean API for applying authorization rules to controllers and methods.

### @RequiresPermission()

Requires the user to have a specific permission.

```typescript
export const RequiresPermission = (permission: string) => {
  return applyDecorators(
    SetMetadata('permission', permission),
    UseGuards(PermissionGuard),
  );
};

// Usage
@Controller('scans')
export class ScanController {
  @Post()
  @RequiresPermission(PERMISSION_CODES.SCAN_CREATE)
  create() { ... }
}
```

### @RequiresFeature()

Ensures the workspace has access to a specific feature.

```typescript
export const RequiresFeature = (feature: Feature, options?: FeatureOptions) => {
  return applyDecorators(
    SetMetadata('feature', feature),
    SetMetadata('featureOptions', options),
    UseGuards(FeatureGuard),
  );
};

// Usage
@Post('advanced')
@RequiresFeature(Feature.ADVANCED_SCAN, {
  errorMessage: 'Advanced scanning requires a Pro plan or higher.',
})
createAdvanced() { ... }
```

### @CheckLimit()

Validates the operation against plan usage limits.

```typescript
export const CheckLimit = (limitType: LimitType, options?: LimitOptions) => {
  return applyDecorators(
    SetMetadata('limitType', limitType),
    SetMetadata('limitOptions', options),
    UseGuards(LimitGuard),
  );
};

// Usage
@Post()
@CheckLimit(LimitType.SCANS_PER_DAY, { 
  workspaceIdParam: 'workspaceId' 
})
create() { ... }
```

## Composite Policies

For common authorization patterns, composite policies combine multiple guards:

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

## Error Handling

When authorization fails, the guards throw appropriate exceptions:

- `PermissionDeniedException`: User lacks required permission
- `FeatureNotAvailableException`: Feature not included in workspace plan
- `UsageLimitExceededException`: Operation would exceed plan limits
- `AuthorizationFailedException`: Generic authorization failure

These exceptions are caught by the global exception filter and transformed into appropriate HTTP responses.
