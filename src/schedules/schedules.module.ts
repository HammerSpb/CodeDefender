import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ScansModule } from '@/scans/scans.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    ScansModule,
    CommonModule,
    BullModule.registerQueue({
      name: 'schedules',
    }),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
