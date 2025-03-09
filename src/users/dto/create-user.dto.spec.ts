import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateUserDto } from './create-user.dto';

// Mock user enums
const UserRole = {
  SUPER: 'SUPER',
  SUPPORT: 'SUPPORT',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

const Plan = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
};

describe('CreateUserDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.MEMBER,
      orgName: 'Test Org',
      plan: Plan.STARTER,
      ownerId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with missing email', async () => {
    const dto = plainToInstance(CreateUserDto, {
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing password', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with short password', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation with invalid role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'password123',
      // @ts-ignore - Testing invalid value
      role: 'INVALID_ROLE',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with invalid plan', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'password123',
      // @ts-ignore - Testing invalid value
      plan: 'INVALID_PLAN',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('plan');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with invalid UUID for ownerId', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'password123',
      ownerId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ownerId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
