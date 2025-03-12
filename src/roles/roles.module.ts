import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [
    PrismaModule,
    PermissionsModule,
    AuditLogsModule,
  ],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
