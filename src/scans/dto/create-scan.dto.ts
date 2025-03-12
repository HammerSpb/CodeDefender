import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateScanDto {
  @ApiProperty({
    description: 'Repository ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  repositoryId: string;

  @ApiProperty({
    description: 'Branch to scan',
    example: 'main',
  })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({
    description: 'Workspace ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Whether to scan the entire history',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  historical?: boolean;

  @ApiProperty({
    description: 'Whether to use advanced scanning options',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAdvanced?: boolean;

  @ApiProperty({
    description: 'Files or directories to exclude from the scan',
    example: ['node_modules', '.git'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileExclusions?: string[];
}
