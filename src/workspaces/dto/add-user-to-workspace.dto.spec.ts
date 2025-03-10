import { validate } from 'class-validator';
import { AddUserToWorkspaceDto } from './add-user-to-workspace.dto';
import { WorkspaceRole } from '@prisma/client';

describe('AddUserToWorkspaceDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = new AddUserToWorkspaceDto();
    dto.email = 'test@example.com';
    dto.role = WorkspaceRole.MEMBER;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is missing', async () => {
    // Arrange
    const dto = new AddUserToWorkspaceDto();
    dto.role = WorkspaceRole.MEMBER;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when email is invalid', async () => {
    // Arrange
    const dto = new AddUserToWorkspaceDto();
    dto.email = 'not-an-email';
    dto.role = WorkspaceRole.MEMBER;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when role is missing', async () => {
    // Arrange
    const dto = new AddUserToWorkspaceDto();
    dto.email = 'test@example.com';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });

  it('should fail validation when role is invalid', async () => {
    // Arrange
    const dto = new AddUserToWorkspaceDto();
    dto.email = 'test@example.com';
    // @ts-ignore - Testing invalid role value
    dto.role = 'INVALID_ROLE';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });
});
