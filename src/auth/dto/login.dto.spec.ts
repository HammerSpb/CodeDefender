import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should pass validation with valid input', async () => {
    // Arrange
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };
    const dto = plainToInstance(LoginDto, loginData);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid email', async () => {
    // Arrange
    const loginData = {
      email: 'invalid-email',
      password: 'password123',
    };
    const dto = plainToInstance(LoginDto, loginData);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with empty email', async () => {
    // Arrange
    const loginData = {
      email: '',
      password: 'password123',
    };
    const dto = plainToInstance(LoginDto, loginData);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with empty password', async () => {
    // Arrange
    const loginData = {
      email: 'test@example.com',
      password: '',
    };
    const dto = plainToInstance(LoginDto, loginData);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing fields', async () => {
    // Arrange
    const loginData = {};
    const dto = plainToInstance(LoginDto, loginData);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(2);
    expect(errors.map(e => e.property).sort()).toEqual(['email', 'password']);
  });
});
