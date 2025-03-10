import { validate } from 'class-validator';
import { UpdateScheduleDto } from './update-schedule.dto';

describe('UpdateScheduleDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid repositoryId', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid branch', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.branch = 'develop';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid workspaceId', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid cronExpression', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.cronExpression = '0 12 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid historical flag', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.historical = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid fileExclusions', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.fileExclusions = ['node_modules', 'dist', '.git'];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with valid active flag', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.active = false;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a DTO with all valid fields', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'feature/new-feature';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 9 * * 1-5';
    dto.historical = false;
    dto.fileExclusions = ['node_modules', 'build', 'coverage'];
    dto.active = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when repositoryId is not a UUID', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.repositoryId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
  });

  it('should fail validation when workspaceId is not a UUID', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    dto.workspaceId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
  });

  it('should fail validation when fileExclusions is not an array of strings', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    // @ts-ignore - Testing invalid type intentionally
    dto.fileExclusions = [123, 456];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
  });

  it('should fail validation when historical is not a boolean', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    // @ts-ignore - Testing invalid type intentionally
    dto.historical = 'not-a-boolean';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('historical');
  });

  it('should fail validation when active is not a boolean', async () => {
    // Arrange
    const dto = new UpdateScheduleDto();
    // @ts-ignore - Testing invalid type intentionally
    dto.active = 'not-a-boolean';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('active');
  });
});
