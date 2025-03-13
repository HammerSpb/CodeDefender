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

Each feature module typically includes:

```
feature/
├── constants/        # Constants and enums
├── decorators/       # Custom decorators
├── dto/              # Data transfer objects
├── entities/         # Entity definitions
├── guards/           # Authorization guards
├── interfaces/       # TypeScript interfaces
├── feature.controller.ts       # HTTP controllers
├── feature.module.ts           # Module definition
├── feature.service.ts          # Business logic
└── feature.service.spec.ts     # Unit tests
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

Guards enforce authentication and authorization.

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Authorization logic
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

## Style Guidelines

- **Single Responsibility**: Each class has a single responsibility
- **Descriptive Naming**: Clear, consistent naming conventions
- **DRY Principle**: Avoid duplication through abstraction
- **SOLID Principles**: Follow OOP best practices
- **Consistent Formatting**: Use Prettier for consistent style
- **Error Handling**: Consistent error handling patterns
- **Comments**: Document complex logic and public APIs