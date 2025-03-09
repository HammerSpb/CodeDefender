import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateAuditLogDto } from './create-audit-log.dto';

describe('CreateAuditLogDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      action: 'CREATE_USER',
      details: { targetUser: 'user@example.com' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      action: 'CREATE_WORKSPACE',
      details: { workspaceName: 'Test Workspace' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing userId', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      action: 'CREATE_USER',
      details: { targetUser: 'user@example.com' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid userId format', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: 'not-a-uuid',
      action: 'CREATE_USER',
      details: { targetUser: 'user@example.com' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid workspaceId format', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      workspaceId: 'not-a-uuid',
      action: 'CREATE_WORKSPACE',
      details: { workspaceName: 'Test Workspace' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with missing action', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      details: { targetUser: 'user@example.com' },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('action');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing details', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      action: 'CREATE_USER',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('details');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with non-object details', async () => {
    const dto = plainToInstance(CreateAuditLogDto, {
      userId: '12345678-1234-1234-1234-123456789012',
      action: 'CREATE_USER',
      // @ts-ignore - Testing invalid value
      details: 'not-an-object',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('details');
    expect(errors[0].constraints).toHaveProperty('isObject');
  });
});
