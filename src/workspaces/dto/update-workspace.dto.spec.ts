import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateWorkspaceDto } from './update-workspace.dto';

describe('UpdateWorkspaceDto', () => {
  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with name only', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {
      name: 'Updated Workspace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with repositoryId only', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {
      name: 'Updated Workspace',
      repositoryId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty name', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {
      name: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(UpdateWorkspaceDto, {
      repositoryId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});
