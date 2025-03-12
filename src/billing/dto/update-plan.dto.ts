import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdatePlanDto {
  @ApiProperty({
    description: 'The new plan to assign',
    enum: Plan,
    example: Plan.PRO,
  })
  @IsNotEmpty()
  @IsEnum(Plan)
  plan: Plan;
}
