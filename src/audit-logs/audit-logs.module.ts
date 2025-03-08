import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
