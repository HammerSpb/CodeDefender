import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PlansModule } from '@/plans/plans.module';
import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    PlansModule,
    AuditLogsModule,
    ConfigModule,
  ],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
