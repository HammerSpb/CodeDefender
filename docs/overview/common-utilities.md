# Common Utilities

This document describes the shared utility functions used throughout the CodeDefender application to promote code reuse and maintainability.

## Utility Structure

```
src/common/utils/
├── request.utils.ts  # Request parsing functions
├── user.utils.ts     # User-related utilities 
├── guard.utils.ts    # Shared guard functionality
└── index.ts          # Barrel export file
```

## Request Utilities

The `request.utils.ts` module provides functions for extracting data from HTTP requests.

### Key Functions

```typescript
// Extract a resource ID from request params, body, or query
extractResourceId(
  request: any, 
  paramName: string, 
  fromParams = true,
  fromBody = true,
  fromQuery = true
): string | undefined

// Extract multiple resource IDs at once
extractMultipleResourceIds(
  request: any,
  paramNames: string[]
): Record<string, string | undefined>

// Extract user ID from authenticated request
extractUserId(request: any): string | undefined
```

### Usage Example

```typescript
import { extractResourceId, extractUserId } from '../common/utils';

@Controller('workspaces/:workspaceId/scans')
export class ScansController {
  @Post()
  create(@Req() request) {
    const workspaceId = extractResourceId(request, 'workspaceId');
    const userId = extractUserId(request);
    // Implementation
  }
}
```

## User Utilities

The `user.utils.ts` module provides functions for common user-related operations.

### Key Functions

```typescript
// Get a user's role from the database
getUserRole(
  prisma: PrismaService, 
  userId: string
): Promise<string | null>

// Check if user is a super user
isUserSuper(
  prisma: PrismaService,
  userId: string
): Promise<boolean>

// Check workspace membership
isUserInWorkspace(
  prisma: PrismaService,
  userId: string,
  workspaceId: string
): Promise<boolean>

// Get user's role in a workspace
getUserWorkspaceRole(
  prisma: PrismaService,
  userId: string,
  workspaceId: string
): Promise<string | null>
```

### Usage Example

```typescript
import { PrismaService } from '../prisma/prisma.service';
import { getUserRole, isUserInWorkspace } from '../common/utils';

@Injectable()
export class SomeService {
  constructor(private prisma: PrismaService) {}

  async someMethod(userId: string, workspaceId: string) {
    const userRole = await getUserRole(this.prisma, userId);
    const isMember = await isUserInWorkspace(this.prisma, userId, workspaceId);
    
    // Implementation using this information
  }
}
```

## Guard Utilities

The `guard.utils.ts` module provides shared functionality for authorization guards.

### Key Functions

```typescript
// Authorization options interface
interface AuthorizationOptions {
  allowSuper?: boolean;
  requireAll?: boolean;
  errorMessage?: string;
  requireWorkspace?: boolean;
  workspaceIdParam?: string;
}

// Extract common context information for guards
extractGuardContext(
  context: ExecutionContext,
  prisma: PrismaService,
  options: AuthorizationOptions = {}
): Promise<{
  request: any;
  userId: string;
  workspaceId?: string;
  isSuper: boolean;
  userRole: string | null;
}>

// Handle common guard error conditions
handleGuardResult(
  condition: boolean,
  defaultMessage: string,
  options: AuthorizationOptions = {}
): void

// Get required permissions from metadata
getRequiredPermissions(
  reflector: Reflector,
  context: ExecutionContext,
  key: string
): string[]

// Get options from metadata with defaults
getOptions<T>(
  reflector: Reflector,
  context: ExecutionContext,
  key: string,
  defaultOptions: T
): T
```

### Usage Example

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { 
  extractGuardContext, 
  getOptions, 
  handleGuardResult 
} from '../common/utils/guard.utils';

@Injectable()
export class CustomGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private someService: SomeService,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required resources and options from metadata
    const requiredResources = this.reflector.getAllAndOverride<string[]>(
      'SOME_KEY',
      [context.getHandler(), context.getClass()],
    );
    
    const options = getOptions(
      this.reflector,
      context,
      'OPTIONS_KEY',
      { defaultOption: true }
    );
    
    // Extract context info
    const { userId, workspaceId, isSuper } = await extractGuardContext(
      context, 
      this.prisma,
      options
    );
    
    // Apply authorization logic
    const isAuthorized = await this.someService.checkAuthorization(
      userId, 
      requiredResources
    );
    
    // Handle result
    handleGuardResult(
      isAuthorized,
      'You are not authorized to access this resource',
      options
    );
    
    return true;
  }
}
```

## Benefits of Using Shared Utilities

- **Reduced code duplication**: Common logic is centralized
- **Improved consistency**: Standard behavior across guards and controllers
- **Better maintainability**: Changes to common logic only need to be made in one place
- **Enhanced testability**: Utilities can be tested in isolation

## Best Practices

1. **Always use shared utilities** instead of duplicating logic
2. **Add new utilities** when you find repeated patterns
3. **Keep utilities focused** on specific concerns
4. **Unit test all utilities** thoroughly
5. **Document parameter expectations** and return values

## Migrating Existing Code

When refactoring existing code to use these utilities:

1. Identify duplicated logic in guards, controllers, or services
2. Extract to an appropriate utility function
3. Replace the original code with calls to the utility
4. Update tests to reflect the changes
5. Verify that behavior remains consistent