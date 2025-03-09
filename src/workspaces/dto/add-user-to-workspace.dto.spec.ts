import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AddUserToWorkspaceDto } from './add-user-to-workspace.dto';

// Mock WorkspaceRole enum
const WorkspaceRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

describe('AddUserToWorkspaceDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(AddUserToWorkspaceDto, {
      email: 'user@example.com',
      role: WorkspaceRole.MEMBER,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing email', async () => {
    const dto = plainToInstance(AddUserToWorkspaceDto, {
      role: WorkspaceRole.MEMBER,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid email', async () => {
    const dto = plainToInstance(AddUserToWorkspaceDto, {
      email: 'not-an-email',
      role: WorkspaceRole.MEMBER,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with missing role', async () => {
    const dto = plainToInstance(AddUserToWorkspaceDto, {
      email: 'user@example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid role', async () => {
    const dto = plainToInstance(AddUserToWorkspaceDto, {
      email: 'user@example.com',
      // @ts-ignore - Testing invalid value
      role: 'INVALID_ROLE',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });
});
