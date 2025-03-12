// src/workspaces/workspaces.module.ts
import { PlansModule } from '@/plans/plans.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { WorkspaceAdminController } from './workspace-admin.controller';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PrismaModule, CommonModule, PermissionsModule, PlansModule],
  controllers: [WorkspacesController, WorkspaceAdminController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
