# Code Organization

CodeDefender follows a modular, feature-based code organization pattern using NestJS's module system.

## Directory Structure

```
src/
├── analytics/        # Usage analytics and reporting
├── audit-logs/       # Audit logging functionality
├── auth/             # Authentication and session management
├── billing/          # Plan management and billing integration
├── common/           # Shared utilities and helpers
│   └── utils/        # Common utility functions
├── permissions/      # Permission and authorization system
├── plans/            # Subscription plans and feature flags
├── prisma/           # Prisma service and database connectivity
├── repositories/     # Repository management
├── roles/            # Role management and assignment
├── scans/            # Security scanning functionality
├── schedules/        # Scheduled scan management
├── users/            # User management
├── workspaces/       # Workspace organization
├── app.module.ts     # Root application module
└── main.ts           # Application entry point
```

## Module Structure

Each feature module follows a consistent structure:

```
feature/
├── constants/        # Constants and enums
│   └── feature-constants.ts
├── decorators/       # Custom decorators
│   └── feature.decorator.ts
├── dto/              # Data transfer objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── index.ts     # Re-export all DTOs
├── interfaces/       # TypeScript interfaces
│   ├── feature.interface.ts
│   └── index.ts     # Re-export all interfaces
├── guards/           # Authorization guards
│   └── feature.guard.ts
├── tests/            # Unit and integration tests
│   ├── feature.controller.spec.ts
│   └── feature.service.spec.ts
├── feature.controller.ts  # HTTP controllers
├── feature.module.ts      # Module definition
└── feature.service.ts     # Business logic
```

## Common Utilities

The `common/utils` directory contains shared utility functions:

```
common/utils/
├── request.utils.ts   # HTTP request helpers
├── user.utils.ts      # User-related functions
├── guard.utils.ts     # Authorization helper functions
└── index.ts           # Barrel export file
```

## Key Modules

### Authentication Module (`auth/`)

Handles user authentication, session management, and token handling.

```typescript
// auth.module.ts
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({...}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    TokensService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
```

### Permissions Module (`permissions/`)

Provides the authorization system for resource access.

```typescript
// permissions.module.ts
@Module({
  imports: [PrismaModule],
  providers: [
    PermissionsService,
    PermissionGuard,
    ContextAwareGuard,
    UnifiedAuthGuard,
  ],
  exports: [
    PermissionsService,
    PermissionGuard,
    ContextAwareGuard,
    UnifiedAuthGuard,
  ],
})
export class PermissionsModule {}
```

### Plans Module (`plans/`)

Implements plan-based feature flags and usage limits.

```typescript
// plans.module.ts
@Module({
  imports: [PrismaModule],
  providers: [
    PlansService,
    UsageService,
    FeatureGuard,
    LimitGuard,
  ],
  exports: [
    PlansService,
    UsageService,
    FeatureGuard,
    LimitGuard,
  ],
})
export class PlansModule {}
```

### Scans Module (`scans/`)

Handles security scanning functionality.

```typescript
// scans.module.ts
@Module({
  imports: [
    PermissionsModule,
    PlansModule,
    BullModule.registerQueue({
      name: 'scans',
    }),
  ],
  controllers: [ScansController],
  providers: [ScansService, ScansProcessor],
  exports: [ScansService],
})
export class ScansModule {}
```

## Common Patterns

### Controller Pattern

Controllers handle HTTP requests and delegate to services.

```typescript
@Controller('workspaces/:workspace_id/scans')
@ApiBearerAuth()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @CanCreateScan()
  @ApiOperation({ summary: 'Create a new scan' })
  create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto) {
    createScanDto.workspaceId = workspaceId;
    return this.scansService.create(createScanDto);
  }
}
```

### Service Pattern

Services implement business logic and data access.

```typescript
@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
  ) {}

  async create(createScanDto: CreateScanDto, userId: string): Promise<Scan> {
    // Business logic implementation
  }
}
```

### Guard Pattern

Guards enforce authentication and authorization using shared utilities.

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { userId, workspaceId, isSuper } = await extractGuardContext(
      context, 
      this.prisma,
      { allowSuper: true }
    );
    
    // Authorization logic using shared utilities
  }
}
```

### Decorator Pattern

Custom decorators simplify authorization requirements.

```typescript
export const RequiresPermission = (
  permissions: string | string[],
  options?: PermissionOptions,
) => {
  // Decorator implementation
};
```

### Shared Utilities Pattern

Utilities extract common functionality:

```typescript
// Using request utilities
const userId = extractUserId(request);
const workspaceId = extractResourceId(request, 'workspaceId');

// Using user utilities
const userRole = await getUserRole(prisma, userId);
const isInWorkspace = await isUserInWorkspace(prisma, userId, workspaceId);

// Using guard utilities
const guardContext = await extractGuardContext(context, prisma, options);
handleGuardResult(hasPermission, 'Permission denied', options);
```

## Style Guidelines

- **Single Responsibility**: Each class has a single responsibility
- **Descriptive Naming**: Clear, consistent naming conventions
- **DRY Principle**: Avoid duplication through shared utilities
- **SOLID Principles**: Follow OOP best practices
- **Consistent Formatting**: Use Prettier for consistent style
- **Error Handling**: Consistent error handling patterns
- **Comments**: Document complex logic and public APIs