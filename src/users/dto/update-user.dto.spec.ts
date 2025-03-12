import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';
import { UserRole } from '@prisma/client';

describe('UpdateUserDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    // Arrange
    const dto = new UpdateUserDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid email', async () => {
    // Arrange
    const dto = new UpdateUserDto();
    dto.email = 'updated@example.com';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid password', async () => {
    // Arrange
    const dto = new UpdateUserDto();
    dto.password = 'newpassword123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with all valid fields', async () => {
    // Arrange
    const dto = new UpdateUserDto();
    dto.email = 'updated@example.com';
    dto.password = 'newpassword123';
    dto.role = UserRole.ADMIN;
    dto.orgName = 'Updated Organization';
    dto.plan = Plan.ENTERPRISE;
    dto.ownerId = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is invalid', async () => {
    // Arrange
    const dto = new UpdateUserDto();
    dto.email = 'invalid-email';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when password is too short', async () => {
    // Arrange
    const dto = new UpdateUserDto();
    dto.password = 'short';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation when role is invalid', async () => {
    // Arrange
    const dto = new UpdateUserDto();
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
    const dto = new UpdateUserDto();
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
    const dto = new UpdateUserDto();
    dto.ownerId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ownerId');
  });
});
