import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateRepositoryDto } from './create-repository.dto';

// Mock the RepositoryProvider enum
const RepositoryProvider = {
  GITHUB: 'GITHUB',
  GITLAB: 'GITLAB',
  BITBUCKET: 'BITBUCKET',
};

describe('CreateRepositoryDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      url: 'https://github.com/test/repo',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid URL', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      url: 'not-a-url',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });

  it('should fail validation with missing URL', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      provider: RepositoryProvider.GITHUB,
      accessToken: 'github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid provider', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      url: 'https://github.com/test/repo',
      // @ts-ignore - Testing invalid value
      provider: 'INVALID_PROVIDER',
      accessToken: 'github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with missing provider', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      url: 'https://github.com/test/repo',
      accessToken: 'github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing accessToken', async () => {
    const dto = plainToInstance(CreateRepositoryDto, {
      url: 'https://github.com/test/repo',
      provider: RepositoryProvider.GITHUB,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('accessToken');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});
