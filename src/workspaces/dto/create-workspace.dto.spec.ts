import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateWorkspaceDto } from './create-workspace.dto';

describe('CreateWorkspaceDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, {
      name: 'Test Workspace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, {
      name: 'Test Workspace',
      repositoryId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing name', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with empty name', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, {
      name: '',
      repositoryId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, {
      name: 'Test Workspace',
      repositoryId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
