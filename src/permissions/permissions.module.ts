import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PermissionsService } from './permissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionGuard } from './guards/permission.guard';
import { ContextAwareGuard } from './guards/context-aware.guard';
import { UnifiedAuthGuard } from './guards/unified-auth.guard';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PlansModule),
    CacheModule.register({
      ttl: 300, // 5 minutes in seconds
    }),
  ],
  providers: [
    PermissionsService,
    PermissionGuard,
    ContextAwareGuard,
    UnifiedAuthGuard,
  ],
  exports: [
    PermissionsService,
    PermissionGuard,
    ContextAwareGuard,
    UnifiedAuthGuard,
  ],
})
export class PermissionsModule {}
