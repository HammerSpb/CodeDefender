import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ComparePlansDto {
  @ApiProperty({
    description: 'First plan to compare',
    enum: Plan,
    example: Plan.STARTER,
  })
  @IsNotEmpty()
  @IsEnum(Plan)
  planA: Plan;

  @ApiProperty({
    description: 'Second plan to compare',
    enum: Plan,
    example: Plan.PRO,
  })
  @IsNotEmpty()
  @IsEnum(Plan)
  planB: Plan;
}
