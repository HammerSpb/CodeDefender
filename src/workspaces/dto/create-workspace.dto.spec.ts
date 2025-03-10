import { validate } from 'class-validator';
import { CreateWorkspaceDto } from './create-workspace.dto';

describe('CreateWorkspaceDto', () => {
  it('should validate a valid DTO with required fields', async () => {
    // Arrange
    const dto = new CreateWorkspaceDto();
    dto.name = 'Test Workspace';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    // Arrange
    const dto = new CreateWorkspaceDto();
    dto.name = 'Test Workspace';
    dto.repositoryId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when name is missing', async () => {
    // Arrange
    const dto = new CreateWorkspaceDto();
    dto.repositoryId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when name is not a string', async () => {
    // Arrange
    const dto = new CreateWorkspaceDto();
    // @ts-ignore - Intentionally setting invalid type for testing
    dto.name = 123;
    dto.repositoryId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when repositoryId is not a valid UUID', async () => {
    // Arrange
    const dto = new CreateWorkspaceDto();
    dto.name = 'Test Workspace';
    dto.repositoryId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
  });
});
