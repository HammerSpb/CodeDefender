# Coding Standards

This document outlines the coding standards for the CodeDefender project to ensure consistency, maintainability, and quality.

## General Principles

- **KISS (Keep It Simple, Stupid)**: Prefer simple, easy-to-understand solutions
- **DRY (Don't Repeat Yourself)**: Avoid duplication through proper abstraction
- **YAGNI (You Aren't Gonna Need It)**: Only implement what is currently required
- **SOLID Principles**: Follow object-oriented design principles
- **Clean Code**: Write self-documenting, maintainable code

## File Organization

### File Structure

- One class per file (with exceptions for closely related small classes)
- Filename matches the class name (e.g., `auth.service.ts` for `AuthService`)
- Consistent file naming: `feature.type.ts` (e.g., `auth.controller.ts`, `create-user.dto.ts`)
- Group related files in feature directories

### Module Structure

```
feature/
├── constants/                # Constants and enums
├── decorators/              # Custom decorators
├── dto/                     # Data transfer objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── index.ts            # Re-export all DTOs
├── entities/                # Entity definitions
├── guards/                  # Authorization guards
├── interfaces/              # TypeScript interfaces
├── feature.controller.ts    # HTTP controllers
├── feature.module.ts        # Module definition
├── feature.service.ts       # Business logic
└── feature.service.spec.ts  # Unit tests
```

## Coding Style

### Formatting and Linting

- Use Prettier for consistent code formatting
- Follow ESLint rules for code quality
- Run linting as part of the pre-commit process

### Naming Conventions

- **Classes**: PascalCase (e.g., `AuthService`)
- **Methods and Functions**: camelCase (e.g., `createUser()`)
- **Variables**: camelCase (e.g., `userProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase, prefixed with 'I' (e.g., `IUserProfile`)
- **Types**: PascalCase (e.g., `UserRole`)
- **Enums**: PascalCase (e.g., `PermissionScope`)
- **Files**: kebab-case (e.g., `auth-service.ts`)

### Variable Declarations

- Use `const` wherever possible
- Use `let` only when a variable needs to be reassigned
- Avoid using `var`
- Declare variables close to their usage

```typescript
// Good
const user = await this.userService.findById(userId);
const permissions = await this.getPermissions(user.id);

// Avoid
const user = await this.userService.findById(userId);
// many lines of code...
const permissions = await this.getPermissions(user.id);
```

### Typing

- Use explicit TypeScript types for function parameters and return values
- Use interfaces for complex object types
- Use union types for variables that can have multiple types
- Avoid using `any` type unless absolutely necessary

```typescript
// Good
function getUser(id: string): Promise<User> {
  // implementation
}

// Avoid
function getUser(id): Promise<any> {
  // implementation
}
```

## Code Organization

### Function Design

- Functions should be small and focused on a single task
- Maximum function length: ~30 lines
- Extract complex logic into separate helper functions
- Use meaningful function names that describe what they do

```typescript
// Good
async function validateUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
  // implementation
}

// Avoid
async function check(userId: string, perms: string[]): Promise<boolean> {
  // implementation
}
```

### Class Design

- Classes should have a single responsibility
- Maximum class length: ~300 lines
- Use composition over inheritance
- Keep constructor parameter lists short, use dependency injection

```typescript
// Good
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  
  // implementation
}

// Avoid
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private auditLogService: AuditLogService,
    private permissionsService: PermissionsService,
    private plansService: PlansService,
  ) {}
  
  // implementation
}
```

## Error Handling

### Try-Catch Blocks

- Use try-catch blocks for error handling
- Catch specific errors rather than all errors
- Re-throw or transform errors as appropriate

```typescript
// Good
try {
  const result = await this.userService.createUser(createUserDto);
  return result;
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException('Email already exists');
  }
  throw error;
}

// Avoid
try {
  const result = await this.userService.createUser(createUserDto);
  return result;
} catch (error) {
  throw new InternalServerErrorException('Failed to create user');
}
```

### Custom Exceptions

- Use NestJS exception classes for HTTP errors
- Create custom exception classes for domain-specific errors
- Include useful error messages and context

```typescript
// Good
if (!workspace) {
  throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
}

// Avoid
if (!workspace) {
  throw new Error('Workspace not found');
}
```

## Asynchronous Code

### Promises and Async/Await

- Use async/await for asynchronous code
- Avoid mixing promise chains and async/await
- Use Promise.all for parallel asynchronous operations

```typescript
// Good
async function processUsers(userIds: string[]): Promise<ProcessedUser[]> {
  const users = await Promise.all(userIds.map(id => this.userService.findById(id)));
  return users.map(user => ({ id: user.id, name: user.name }));
}

// Avoid
async function processUsers(userIds: string[]): Promise<ProcessedUser[]> {
  const results = [];
  for (const id of userIds) {
    const user = await this.userService.findById(id);
    results.push({ id: user.id, name: user.name });
  }
  return results;
}
```

### Error Handling in Promises

- Always handle promise rejections
- Use try-catch with async/await
- Add error handling for Promise.all

```typescript
// Good
try {
  const results = await Promise.all(
    userIds.map(async id => {
      try {
        return await this.userService.findById(id);
      } catch (error) {
        this.logger.error(`Failed to fetch user ${id}`, error);
        return null;
      }
    })
  );
  
  const validResults = results.filter(result => result !== null);
  return validResults;
} catch (error) {
  throw new InternalServerErrorException('Failed to process users');
}
```

## Documentation

### Code Comments

- Use JSDoc-style comments for public interfaces
- Comment complex algorithms and business logic
- Avoid commenting obvious code

```typescript
/**
 * Validates user permissions against required permissions
 * 
 * @param userId - The ID of the user to check
 * @param requiredPermissions - List of permission codes to check
 * @param workspaceId - Optional workspace context for permission check
 * @returns True if user has all required permissions, false otherwise
 */
async function userHasPermissions(
  userId: string, 
  requiredPermissions: string[], 
  workspaceId?: string
): Promise<boolean> {
  // implementation
}
```

### Documentation Files

- Document complex systems with markdown files
- Keep documentation in sync with code changes
- Create diagrams for complex flows and architecture

## Security Practices

### Authentication & Authorization

- Never store passwords in plain text
- Use strong hashing algorithms (bcrypt)
- Always validate user permissions before actions
- Use the centralized guards and decorators

### Input Validation

- Validate all user input using DTOs
- Use class-validator for validation rules
- Implement custom validators for complex rules

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
```

### Data Access

- Follow the principle of least privilege
- Always check permissions before accessing data
- Use parameterized queries to prevent SQL injection

## Testing

### Testing Coverage

- Write tests for all business logic
- Aim for minimum 80% code coverage
- Test happy paths and edge cases

### Test Organization

- Group tests logically by functionality
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      
      // Act
      const result = await service.login(loginDto, mockDeviceInfo);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
    
    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'wrong' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);
      
      // Act & Assert
      await expect(service.login(loginDto, mockDeviceInfo))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
```

## Performance

### Database Queries

- Minimize database round trips
- Use appropriate indexes
- Paginate large result sets
- Select only needed fields

### Memory Management

- Avoid memory leaks
- Be cautious with closures and event listeners
- Clean up resources when no longer needed

### Caching

- Cache frequently accessed, rarely changing data
- Implement proper cache invalidation
- Use TTL for cached items

## Version Control

### Commits

- Write meaningful commit messages
- Follow conventional commits format: `type(scope): description`
- Keep commits focused on single tasks

### Branches

- Follow GitFlow or a similar branching strategy
- Use feature branches for new development
- Use hotfix branches for urgent fixes

### Pull Requests

- Keep PRs small and focused
- Include detailed descriptions
- Link related issues
- Ensure all tests pass and code meets standards