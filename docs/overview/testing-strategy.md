# Testing Strategy

CodeDefender employs a comprehensive testing strategy to ensure code quality, security, and reliability.

## Testing Pyramid

```
    /\
   /  \
  /    \
 / E2E  \
/--------\
/ Integr. \
/----------\
/   Unit    \
--------------
```

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user flows

## Test Types

### Unit Tests

Unit tests focus on testing individual components (services, guards, utilities) in isolation.

```typescript
// src/permissions/permissions.service.spec.ts
describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('userHasPermission', () => {
    it('should return true when user has the required permission', async () => {
      // Test implementation
    });

    it('should return false when user does not have the required permission', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

Integration tests focus on testing the interaction between multiple components.

```typescript
// src/auth/auth.integration.spec.ts
describe('Auth Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    // Configure app similar to main.ts
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication flow', () => {
    it('should login successfully with valid credentials', async () => {
      // Test implementation using supertest
    });

    it('should refresh token successfully', async () => {
      // Test implementation
    });
  });
});
```

### End-to-End Tests

E2E tests validate complete user flows across the entire application.

```typescript
// test/workspaces.e2e-spec.ts
describe('Workspaces (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    // Setup app and get auth token
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create workspace', () => {
    return request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Workspace' })
      .expect(201)
      .then(response => {
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe('Test Workspace');
      });
  });

  // Additional tests for workspace operations
});
```

## Testing Tools

- **Jest**: Main testing framework
- **SuperTest**: HTTP testing
- **Jest Mock Extended**: Advanced mocking
- **Prisma Mock**: Database mocking
- **Bull Mock**: Queue mocking

## Mock Patterns

### Prisma Mocking

```typescript
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const mockPrismaService = mockDeep<PrismaService>();

// Example usage in test
mockPrismaService.user.findUnique.mockResolvedValue({
  id: 'user-id',
  email: 'test@example.com',
  role: 'ADMIN',
  // ... other user properties
});
```

### Queue Mocking

```typescript
import { Queue } from 'bull';
import { mockDeep } from 'jest-mock-extended';

export const mockQueue = mockDeep<Queue>();

// Example usage in test
mockQueue.add.mockResolvedValue({ id: 'job-id' } as any);
```

## Testing Authorization

Testing authorization is critical for security:

```typescript
describe('Permission guards', () => {
  it('should allow access when user has permission', async () => {
    mockPermissionsService.userHasPermission.mockResolvedValue(true);
    
    const canActivate = await permissionGuard.canActivate(mockExecutionContext);
    
    expect(canActivate).toBe(true);
  });

  it('should deny access when user lacks permission', async () => {
    mockPermissionsService.userHasPermission.mockResolvedValue(false);
    
    await expect(permissionGuard.canActivate(mockExecutionContext))
      .rejects.toThrow(ForbiddenException);
  });
});
```

## Plan Feature Testing

Testing plan-based access restrictions:

```typescript
describe('Feature guards', () => {
  it('should allow access when user plan includes feature', async () => {
    mockPlansService.userHasFeature.mockResolvedValue(true);
    
    const canActivate = await featureGuard.canActivate(mockExecutionContext);
    
    expect(canActivate).toBe(true);
  });

  it('should deny access when user plan does not include feature', async () => {
    mockPlansService.userHasFeature.mockResolvedValue(false);
    
    await expect(featureGuard.canActivate(mockExecutionContext))
      .rejects.toThrow(ForbiddenException);
  });
});
```

## Coverage Goals

- **Unit tests**: 80%+ coverage
- **Integration tests**: Cover all critical paths
- **E2E tests**: Cover primary user flows

## Test Automation

Tests run automatically in the CI/CD pipeline:

1. **Pre-commit**: Run unit tests on changed files
2. **Pull request**: Run all unit and integration tests
3. **Main branch**: Run all tests including E2E

## Test Command Examples

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run end-to-end tests
pnpm test:e2e

# Watch mode for development
pnpm test:watch

# Run a specific test file
pnpm test -- src/permissions/permissions.service.spec.ts
```

## Test Database

Tests use an isolated test database:

1. Using `.env.test` configuration
2. Resetting before tests with `prismaMock.resetDatabase()`
3. Using transactions for test isolation

Example test database setup:

```typescript
// test/setup.ts
import { PrismaService } from '../src/prisma/prisma.service';

beforeAll(async () => {
  const prisma = new PrismaService();
  await prisma.$connect();
  
  // Reset database to clean state before tests
  await prisma.$transaction([
    prisma.scan.deleteMany(),
    prisma.userWorkspace.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.repository.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  
  await prisma.$disconnect();
});
```