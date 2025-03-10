import { validate } from 'class-validator';
import { UpdateWorkspaceDto } from './update-workspace.dto';

describe('UpdateWorkspaceDto', () => {
  it('should validate a valid DTO with name field', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();
    dto.name = 'Updated Workspace Name';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with repositoryId field', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();
    dto.repositoryId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with all fields', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();
    dto.name = 'Updated Workspace Name';
    dto.repositoryId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO (partial update)', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when name is not a string', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();
    // @ts-ignore - Intentionally setting invalid type for testing
    dto.name = 123;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when repositoryId is not a valid UUID', async () => {
    // Arrange
    const dto = new UpdateWorkspaceDto();
    dto.repositoryId = 'not-a-uuid';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('repositoryId');
  });
});
