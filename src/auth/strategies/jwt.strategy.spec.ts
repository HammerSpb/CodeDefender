import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  // Create mock dependencies
  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(() => {
    mockConfigService.get.mockReturnValue('test_jwt_secret');

    // Create strategy with mocked dependencies
    strategy = new JwtStrategy(mockConfigService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw an error if JWT_SECRET is not defined', () => {
    // Arrange
    mockConfigService.get.mockReturnValue(undefined);

    // Act & Assert
    expect(() => new JwtStrategy(mockConfigService as any)).toThrow(
      'JWT_SECRET is not defined in the environment variables',
    );
  });

  describe('validate', () => {
    it('should return a user object from JWT payload', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'user@example.com',
        role: 'MEMBER',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      });
    });
  });
});
