# Testing Strategy for CodeDefender

This document outlines the testing approach for the CodeDefender project after moving from Vitest to Jest.

## Test Structure

All tests should follow the naming convention `*.spec.ts` and be placed alongside the files they test:

```
src/
  ├── users/
  │    ├── users.service.ts
  │    └── users.service.spec.ts
  ├── auth/
  │    ├── auth.service.ts
  │    └── auth.service.spec.ts
```

## Testing Patterns

### Unit Tests

For services, controllers, and other classes:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  
  // Define your mocks
  const mockDependency = {
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: 'DependencyName',
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    
    // Reset mocks between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Your test cases
});
```

### Mocking Prisma

Since Prisma Client is a significant dependency, here's a pattern for mocking it:

```typescript
// For one-off mocks in a specific test
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// For globally mocking Prisma (at the top of your test file)
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});
```

### Testing Controllers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from './your.controller';
import { YourService } from './your.service';

describe('YourController', () => {
  let controller: YourController;
  let service: YourService;

  const mockYourService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: mockYourService,
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
    service = module.get<YourService>(YourService);
    
    jest.clearAllMocks();
  });

  // Test cases
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run e2e tests (if any)
pnpm test:e2e
```

## Best Practices

1. Use the **Arrange-Act-Assert** pattern for clear test structure
2. Each test should focus on a single behavior
3. Use descriptive test names
4. Keep assertions focused
5. Consider using `beforeEach` to reset mocks between tests
6. Use Jest matchers to make assertions readable
7. Use `describe` blocks to organize related tests

## Example Test (See src/example.spec.ts)

An example test has been provided in `src/example.spec.ts` that demonstrates these patterns.

## E2E Testing

For E2E tests, use the `jest-e2e.json` configuration in the `test` directory. E2E tests should be placed in the `test` directory with the `.e2e-spec.ts` extension.
