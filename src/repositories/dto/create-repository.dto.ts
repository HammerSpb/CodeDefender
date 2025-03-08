import { ApiProperty } from '@nestjs/swagger';
import { RepositoryProvider } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateRepositoryDto {
  @ApiProperty({
    description: 'Repository URL',
    example: 'https://github.com/user/repo',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Repository provider',
    enum: RepositoryProvider,
    example: RepositoryProvider.GITHUB,
  })
  @IsEnum(RepositoryProvider)
  @IsNotEmpty()
  provider: RepositoryProvider;

  @ApiProperty({
    description: 'Access token for the repository',
    example: 'github_pat_123456789',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
