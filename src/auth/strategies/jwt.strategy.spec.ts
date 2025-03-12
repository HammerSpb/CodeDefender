import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    // Mock the ConfigService first
    const configServiceMock = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return null;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw an error if JWT_SECRET is not defined', () => {
      // Arrange
      const configServiceWithoutSecret = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;

      // Act & Assert
      expect(() => {
        // We need to create a new instance to test the constructor
        new JwtStrategy(configServiceWithoutSecret);
      }).toThrow('JWT_SECRET is not defined in the environment variables');
    });

    it('should initialize with correct options when JWT_SECRET is defined', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('test-secret');

      // Act
      const instance = new JwtStrategy(configService);

      // Assert
      expect(instance).toBeDefined();
      // We can't directly test the super() call options, but we can verify the configService was called
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
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
