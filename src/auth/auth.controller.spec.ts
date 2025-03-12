import {  UnauthorizedException } from '@nestjs/common';
import { Plan,  Test, TestingModule } from '@nestjs/testing';
import { Plan,  UserRole } from '@prisma/client';
import { Plan,  AuthController } from './auth.controller';
import { Plan,  AuthService } from './auth.service';
import { Plan,  LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Test data setup
  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockLoginResponse = {
    accessToken: 'mock.jwt.token',
    user: {
      id: 'user-id',
      email: 'test@example.com',
      role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
      orgName: null,
      plan: Plan.PRO, firstName: null, lastName: null, mfaSecret: null, mfaEnabled: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return login response when login is successful', async () => {
      // Arrange
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(mockLoginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should propagate UnauthorizedException from authService', async () => {
      // Arrange
      jest.spyOn(authService, 'login').mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
    });
  });
});
