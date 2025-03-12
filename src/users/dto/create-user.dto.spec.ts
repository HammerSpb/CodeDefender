import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '@prisma/client';

describe('CreateUserDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all optional fields', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.role = UserRole.ADMIN;
    dto.orgName = 'Test Organization';
    dto.plan = Plan.ENTERPRISE;
    dto.ownerId = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is missing', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when email is invalid', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'invalid-email';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when password is missing', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation when password is too short', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'short';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation when role is invalid', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    // @ts-ignore - Testing invalid role intentionally
    dto.role = 'INVALID_ROLE';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });

  it('should fail validation when plan is invalid', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    // @ts-ignore - Testing invalid plan intentionally
    dto.plan = 'INVALID_PLAN';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('plan');
  });

  it('should fail validation when ownerId is invalid UUID', async () => {
    // Arrange
    const dto = new CreateUserDto();
    dto.email = 'user@example.com';
    dto.password = 'password123';
    dto.ownerId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ownerId');
  });
});
