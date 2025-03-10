import { validate } from 'class-validator';
import { CreateAuditLogDto } from './create-audit-log.dto';

describe('CreateAuditLogDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.workspaceId = '550e8400-e29b-41d4-a716-446655440000';
    dto.action = 'CREATE_SCAN';
    dto.details = { scanId: '123', repositoryId: '456' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO without workspaceId', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.action = 'USER_LOGIN';
    dto.details = { ip: '192.168.1.1' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when userId is missing', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.action = 'CREATE_SCAN';
    dto.details = { scanId: '123' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail validation when userId is not a UUID', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = 'not-a-uuid';
    dto.action = 'CREATE_SCAN';
    dto.details = { scanId: '123' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail validation when workspaceId is not a UUID', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.workspaceId = 'not-a-uuid';
    dto.action = 'CREATE_SCAN';
    dto.details = { scanId: '123' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('workspaceId');
  });

  it('should fail validation when action is missing', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.details = { scanId: '123' };

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('action');
  });

  it('should fail validation when details is missing', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.action = 'CREATE_SCAN';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('details');
  });

  it('should fail validation when details is not an object', async () => {
    // Arrange
    const dto = new CreateAuditLogDto();
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';
    dto.action = 'CREATE_SCAN';
    // @ts-ignore - Testing invalid type intentionally
    dto.details = 'not-an-object';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('details');
  });
});
