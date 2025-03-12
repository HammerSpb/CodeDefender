import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plan, UserRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Example Organization',
  })
  @IsString()
  @IsOptional()
  orgName?: string;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: Plan,
  })
  @IsEnum(Plan)
  @IsOptional()
  plan?: Plan;

  @ApiPropertyOptional({
    description: 'ID of the owner user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'MFA secret',
  })
  @IsString()
  @IsOptional()
  mfaSecret?: string | null;

  @ApiPropertyOptional({
    description: 'MFA enabled status',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;
}
