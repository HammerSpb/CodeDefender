import { validate } from 'class-validator';
import { UpdateRepositoryDto } from './update-repository.dto';
import { RepositoryProvider } from '@prisma/client';

describe('UpdateRepositoryDto', () => {
  it('should validate with all fields', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    dto.url = 'https://github.com/user/repo';
    dto.provider = RepositoryProvider.GITHUB;
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate with partial fields (url only)', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    dto.url = 'https://github.com/user/repo';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate with partial fields (provider only)', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    dto.provider = RepositoryProvider.GITHUB;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate with partial fields (accessToken only)', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should validate with empty object (no fields to update)', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when url is invalid', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    dto.url = 'not-a-url';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
  });

  it('should fail validation when provider is invalid', async () => {
    // Arrange
    const dto = new UpdateRepositoryDto();
    // @ts-ignore - Testing invalid provider intentionally
    dto.provider = 'INVALID_PROVIDER';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
  });
});
