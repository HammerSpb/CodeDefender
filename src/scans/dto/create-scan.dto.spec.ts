import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateScanDto } from './create-scan.dto';

describe('CreateScanDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      historical: true,
      fileExclusions: ['node_modules', '.git'],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing repositoryId', async () => {
    const dto = plainToInstance(CreateScanDto, {
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: 'not-a-uuid',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with missing branch', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      workspaceId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('branch');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing workspaceId', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid workspaceId', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid historical', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      // @ts-ignore - Testing invalid value
      historical: 'not-a-boolean',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('historical');
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });

  it('should fail validation with invalid fileExclusions', async () => {
    const dto = plainToInstance(CreateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      // @ts-ignore - Testing invalid value
      fileExclusions: [123, 456],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
