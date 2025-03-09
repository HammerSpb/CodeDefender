import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

// Create mock service
const mockAuthService = {
  login: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    // Manually create the controller instance
    controller = new AuthController(mockAuthService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return a token when credentials are valid', async () => {
      // Arrange
      const loginDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const mockAuthResponse = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'MEMBER',
        },
      };
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });
});
