# CodeDefender Architecture

## High-Level Architecture

CodeDefender is built on a modern, modular architecture designed for scalability, security, and maintainability. The system follows a layered approach with clear separation of concerns.

## Layers

### API Layer
- **Controllers**: Handle HTTP requests and delegate business logic to services
- **DTOs**: Define data transfer objects for request/response validation
- **Guards**: Implement authentication and authorization checks

### Service Layer
- **Services**: Implement business logic and domain rules
- **Processors**: Handle asynchronous tasks via Bull queues
- **Validators**: Implement validation logic beyond DTO validation

### Data Layer
- **Prisma**: ORM for database access with type safety
- **Repositories**: Encapsulate database operations for specific domains
- **Migrations**: Handle database schema evolution

## Key Architectural Patterns

### Dependency Injection
NestJS provides a robust DI container that promotes loose coupling and testability.

```typescript
@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private plansService: PlansService,
  ) {}
  
  // Service methods...
}
```

### Modular Organization
The application is organized into cohesive modules that encapsulate related functionality.

```typescript
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

### Guard Pattern
Authentication and authorization are implemented using guards that intercept requests before they reach controllers.

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Guard implementation...
  }
}
```

### Decorator Pattern
Custom decorators provide a clean, declarative way to express authentication, authorization, and validation requirements.

```typescript
@Post()
@CanCreateScan()
@ApiOperation({ summary: 'Create a new scan' })
create(@Param('workspace_id') workspaceId: string, @Body() createScanDto: CreateScanDto) {
  // Controller method implementation...
}
```

## System Components

### Authentication System
- **JWT-based authentication** with refresh tokens
- **Session management** for tracking active user sessions
- **MFA support** for enhanced security
- **OAuth integration** for social login

### Authorization System
- **Role-based access control** (RBAC) with granular permissions
- **Plan-based feature access** tied to subscription plans
- **Context-aware authorization** based on resource ownership

### Scanning Engine
- **Repository scanning** for secrets and vulnerabilities
- **Scheduled scans** with configurable frequency
- **Historical analysis** for tracking security posture over time

### Workspace Management
- **Multi-tenancy** with workspace isolation
- **Team collaboration** with role assignments
- **Repository management** within workspaces

### Audit and Logging
- **Comprehensive audit logging** for security and compliance
- **Structured logging** for operational monitoring
- **Usage tracking** for plan enforcement

## Deployment Architecture

CodeDefender is designed for containerized deployment using Docker and Kubernetes.

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                      API Servers                        │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌──────────────────┴────────────────┐
        │                                   │
┌───────▼──────────┐              ┌─────────▼─────────┐
│  PostgreSQL DB   │              │    Redis Cache    │
└──────────────────┘              └───────────────────┘
```

## Data Flow

1. **Request**: Client sends authenticated request to API
2. **Authentication**: JWT validation and session verification
3. **Authorization**: Permission and plan checks
4. **Processing**: Business logic execution in service layer
5. **Data Access**: Prisma ORM for type-safe database operations
6. **Response**: Formatted response returned to client

## Security Architecture

- **Defense in depth**: Multiple security layers
- **Principle of least privilege**: Fine-grained permissions
- **Secure by default**: Conservative security defaults
- **Audit trail**: Comprehensive logging of security events