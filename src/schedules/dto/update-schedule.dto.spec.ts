import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateScheduleDto } from './update-schedule.dto';

describe('UpdateScheduleDto', () => {
  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with partial fields', async () => {
    // Branch only
    let dto = plainToInstance(UpdateScheduleDto, {
      branch: 'develop',
    });
    let errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Cron expression only
    dto = plainToInstance(UpdateScheduleDto, {
      cronExpression: '0 0 1 * *',
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Historical only
    dto = plainToInstance(UpdateScheduleDto, {
      historical: true,
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // Active only
    dto = plainToInstance(UpdateScheduleDto, {
      active: false,
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);

    // File exclusions only
    dto = plainToInstance(UpdateScheduleDto, {
      fileExclusions: ['dist', 'coverage'],
    });
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with multiple fields', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {
      branch: 'develop',
      cronExpression: '0 0 1 * *',
      active: false,
      historical: true,
      fileExclusions: ['dist', 'coverage'],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid repositoryId', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {
      repositoryId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid workspaceId', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {
      workspaceId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with invalid fileExclusions', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {
      // @ts-ignore - Testing invalid value
      fileExclusions: [123, 456],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with invalid active value', async () => {
    const dto = plainToInstance(UpdateScheduleDto, {
      // @ts-ignore - Testing invalid value
      active: 'not-a-boolean',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('active');
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });
});
