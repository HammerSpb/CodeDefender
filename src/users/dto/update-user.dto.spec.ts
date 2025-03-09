import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateUserDto } from './update-user.dto';

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

describe('UpdateUserDto', () => {
  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateUserDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with individual fields', async () => {
    // Email only
    let dto = plainToInstance(UpdateUserDto, {
      email: 'updated@example.com',
    });
    let errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Password only
    dto = plainToInstance(UpdateUserDto, {
      password: 'new_password123',
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Role only
    dto = plainToInstance(UpdateUserDto, {
      role: UserRole.ADMIN,
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Organization name only
    dto = plainToInstance(UpdateUserDto, {
      orgName: 'Updated Org',
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Plan only
    dto = plainToInstance(UpdateUserDto, {
      plan: Plan.BUSINESS,
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Owner ID only
    dto = plainToInstance(UpdateUserDto, {
      ownerId: '12345678-1234-1234-1234-123456789012',
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with multiple fields', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'updated@example.com',
      password: 'new_password123',
      role: UserRole.ADMIN,
      orgName: 'Updated Org',
      plan: Plan.BUSINESS,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'not-an-email',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with short password', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      password: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation with invalid role', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      // @ts-ignore - Testing invalid value
      role: 'INVALID_ROLE',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with invalid plan', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      // @ts-ignore - Testing invalid value
      plan: 'INVALID_PLAN',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('plan');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with invalid UUID for ownerId', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      ownerId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ownerId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
