import { validate } from 'class-validator';
import { CreateScheduleDto } from './create-schedule.dto';

describe('CreateScheduleDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all optional fields', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';
    dto.historical = true;
    dto.fileExclusions = ['node_modules', '.git'];
    dto.active = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when repositoryId is missing', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
  });

  it('should fail validation when repositoryId is not a UUID', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = 'not-a-uuid';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
  });

  it('should fail validation when branch is missing', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('branch');
  });

  it('should fail validation when workspaceId is missing', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
  });

  it('should fail validation when workspaceId is not a UUID', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = 'not-a-uuid';
    dto.cronExpression = '0 0 * * *';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
  });

  it('should fail validation when cronExpression is missing', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cronExpression');
  });

  it('should fail validation when historical is not a boolean', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';
    // @ts-ignore - Testing invalid type intentionally
    dto.historical = 'not-a-boolean';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('historical');
  });

  it('should fail validation when fileExclusions is not an array of strings', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';
    // @ts-ignore - Testing invalid type intentionally
    dto.fileExclusions = [123, 456];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fileExclusions');
  });

  it('should fail validation when active is not a boolean', async () => {
    // Arrange
    const dto = new CreateScheduleDto();
    dto.repositoryId = '550e8400-e29b-41d4-a716-446655440000';
    dto.branch = 'main';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.cronExpression = '0 0 * * *';
    // @ts-ignore - Testing invalid type intentionally
    dto.active = 'not-a-boolean';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('active');
  });
});
