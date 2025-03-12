// src/repositories/repositories.module.ts
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PlansModule } from '@/plans/plans.module';

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
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
