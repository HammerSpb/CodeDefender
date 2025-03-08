import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
