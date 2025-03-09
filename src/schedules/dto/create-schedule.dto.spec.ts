import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateScheduleDto } from './create-schedule.dto';

describe('CreateScheduleDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
      historical: true,
      fileExclusions: ['node_modules', '.git'],
      active: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing repositoryId', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: 'not-a-uuid',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with missing branch', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('branch');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing workspaceId', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid workspaceId', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: 'not-a-uuid',
      cronExpression: '0 0 * * *',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with missing cronExpression', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cronExpression');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid fileExclusions', async () => {
    const dto = plainToInstance(CreateScheduleDto, {
      repositoryId: '12345678-1234-1234-1234-123456789012',
      branch: 'main',
      workspaceId: '12345678-1234-1234-1234-123456789012',
      cronExpression: '0 0 * * *',
      // @ts-ignore - Testing invalid value
      fileExclusions: [123, 456],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
