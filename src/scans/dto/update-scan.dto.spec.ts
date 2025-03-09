import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateScanDto } from './update-scan.dto';

describe('UpdateScanDto', () => {
  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateScanDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid fields', async () => {
    const dto = plainToInstance(UpdateScanDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'develop',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      historical: true,
      fileExclusions: ['dist', 'coverage'],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(UpdateScanDto, {
      repositoryId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid workspaceId', async () => {
    const dto = plainToInstance(UpdateScanDto, {
      workspaceId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid historical', async () => {
    const dto = plainToInstance(UpdateScanDto, {
      // @ts-ignore - Testing invalid value
      historical: 'not-a-boolean',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('historical');
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });

  it('should fail validation with invalid fileExclusions', async () => {
    const dto = plainToInstance(UpdateScanDto, {
      // @ts-ignore - Testing invalid value
      fileExclusions: [123, 456],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
