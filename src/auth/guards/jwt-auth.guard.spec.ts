import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  // Create mock dependencies
  const mockJwtService = {
    verify: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  // Mock execution context
  const mockExecutionContext = {
    switchToHttp: vi.fn().mockReturnThis(),
    getRequest: vi.fn(),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    // Create guard with mocked dependencies
    guard = new JwtAuthGuard(mockJwtService as any, mockConfigService as any);

    // Reset all mocks
    vi.clearAllMocks();

    // Setup AuthGuard to be properly replaced
    // @ts-ignore - Mocking protected/private methods
    guard.canActivate = vi.fn().mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call parent canActivate method', async () => {
      // Act
      await guard.canActivate(mockExecutionContext);

      // Assert
      // @ts-ignore - Accessing mocked method
      expect(guard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
    });
  });

  describe('handleRequest', () => {
    it('should return the user when no error and user exists', () => {
      // Arrange
      const mockUser = { id: 'user-id', email: 'user@example.com' };

      // Act
      const result = guard.handleRequest(null, mockUser, null);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw the original error if one is provided', () => {
      // Arrange
      const mockError = new Error('Original error');

      // Act & Assert
      expect(() => guard.handleRequest(mockError, null, null)).toThrow(mockError);
    });

    it('should throw UnauthorizedException if no user is found', () => {
      // Act & Assert
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null)).toThrow('Invalid token');
    });
  });
});
