import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateRepositoryDto } from './update-repository.dto';

// Mock the RepositoryProvider enum
const RepositoryProvider = {
  GITHUB: 'GITHUB',
  GITLAB: 'GITLAB',
  BITBUCKET: 'BITBUCKET',
};

describe('UpdateRepositoryDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      url: 'https://github.com/test/repo',
      provider: RepositoryProvider.GITHUB,
      accessToken: 'new_github_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only url', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      url: 'https://github.com/test/repo-updated',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only provider', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      provider: RepositoryProvider.GITLAB,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only accessToken', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      accessToken: 'updated_token',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid URL', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      url: 'not-a-url',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });

  it('should fail validation with invalid provider', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      // @ts-ignore - Testing invalid value
      provider: 'INVALID_PROVIDER',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('provider');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should validate when only valid fields are provided', async () => {
    const dto = plainToInstance(UpdateRepositoryDto, {
      url: 'https://github.com/test/repo',
      unknownField: 'some value', // This should be stripped by whitelist option if used
    });

    // Note: This only tests basic validation. In a real app with validation pipe
    // configured with whitelist: true, the unknownField would be removed.
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
