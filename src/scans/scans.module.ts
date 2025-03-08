import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { ScansProcessor } from './scans.processor';
import { ScansService } from './scans.service';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    CommonModule,
    BullModule.registerQueue({
      name: 'scans',
    }),
  ],
  controllers: [ScansController],
  providers: [ScansService, ScansProcessor],
  exports: [ScansService],
})
export class ScansModule {}
