import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  // Create mock dependencies
  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const mockJwtService = {
    sign: vi.fn(),
  };

  beforeEach(() => {
    // Create service with mocked dependencies
    service = new AuthService(mockJwtService as any, mockPrismaService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-id',
        email,
        password: 'hashed_password',
        role: 'MEMBER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'wrong_password';
      const mockUser = {
        id: 'user-id',
        email,
        password: 'hashed_password',
        role: 'MEMBER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      // Act & Assert
      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no password', async () => {
      // Arrange
      const email = 'oauth-user@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-id',
        email,
        password: null, // OAuth user with no password
        role: 'MEMBER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return JWT token and user info when login succeeds', async () => {
      // Arrange
      const loginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        password: 'hashed_password',
        role: 'MEMBER',
        orgName: 'Test Org',
        plan: 'PRO',
      };

      const mockToken = 'jwt-token';
      const mockPayload = {
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
        ownerId: undefined,
      };

      // Mock the validateUser method
      service.validateUser = vi.fn().mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith(mockPayload);
      expect(result).toEqual({
        accessToken: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          orgName: mockUser.orgName,
          plan: mockUser.plan,
        },
      });
    });

    it('should propagate UnauthorizedException from validateUser', async () => {
      // Arrange
      const loginDto = {
        email: 'user@example.com',
        password: 'wrong_password',
      };

      // Mock validateUser to throw UnauthorizedException
      service.validateUser = vi.fn().mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
