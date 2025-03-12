import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PlansModule } from '@/plans/plans.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { ScansProcessor } from './scans.processor';
import { ScansService } from './scans.service';
import { ScanController } from './controllers/scan.controller';
import { ScanService } from './services/scan.service';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    CommonModule,
    PermissionsModule,
    PlansModule,
    BullModule.registerQueue({
      name: 'scans',
    }),
  ],
  controllers: [ScansController, ScanController],
  providers: [ScansService, ScansProcessor, ScanService],
  exports: [ScansService],
})
export class ScansModule {}
