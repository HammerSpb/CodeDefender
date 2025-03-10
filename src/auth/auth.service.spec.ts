import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.OWNER,
    provider: null,
    providerId: null,
    orgName: null,
    plan: null,
    ownerId: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockAccessToken = 'mock.jwt.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(mockUser.email, 'correct-password');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser('nonexistent@example.com', 'any-password'))
        .rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user has no password (OAuth user)', async () => {
      // Arrange
      const oauthUser = { ...mockUser, password: null };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(oauthUser);

      // Act & Assert
      await expect(service.validateUser(oauthUser.email, 'any-password'))
        .rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: oauthUser.email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.validateUser(mockUser.email, 'wrong-password'))
        .rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', mockUser.password);
    });
  });

  describe('login', () => {
    it('should return access token and user info when login is successful', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: mockUser.email,
        password: 'correct-password',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockAccessToken);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
        ownerId: mockUser.ownerId,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
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
      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrong-password',
      };

      jest.spyOn(service, 'validateUser').mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
