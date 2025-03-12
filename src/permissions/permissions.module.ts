import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PermissionsService } from './permissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes in seconds
    }),
  ],
  providers: [
    PermissionsService,
    PermissionGuard,
  ],
  exports: [
    PermissionsService,
    PermissionGuard,
  ],
})
export class PermissionsModule {}
