import { validate } from 'class-validator';
import { CreateRepositoryDto } from './create-repository.dto';
import { RepositoryProvider } from '@prisma/client';

describe('CreateRepositoryDto', () => {
  it('should validate a valid DTO', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.url = 'https://github.com/user/repo';
    dto.provider = RepositoryProvider.GITHUB;
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when url is missing', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.provider = RepositoryProvider.GITHUB;
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
  });

  it('should fail validation when url is invalid', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.url = 'not-a-url';
    dto.provider = RepositoryProvider.GITHUB;
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
  });

  it('should fail validation when provider is missing', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.url = 'https://github.com/user/repo';
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
  });

  it('should fail validation when provider is invalid', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.url = 'https://github.com/user/repo';
    // @ts-ignore - Testing invalid provider intentionally
    dto.provider = 'INVALID_PROVIDER';
    dto.accessToken = 'github_token';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
  });

  it('should fail validation when accessToken is missing', async () => {
    // Arrange
    const dto = new CreateRepositoryDto();
    dto.url = 'https://github.com/user/repo';
    dto.provider = RepositoryProvider.GITHUB;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('accessToken');
  });
});
