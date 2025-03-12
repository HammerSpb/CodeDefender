import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PlansService } from './plans.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { FeatureGuard } from './guards/feature.guard';
import { LimitGuard } from './guards/limit.guard';
import { UnifiedPolicyGuard } from './guards/unified-policy.guard';
import { UsageService } from './services/usage.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PermissionsModule),
    CacheModule.register({
      ttl: 300, // 5 minutes in seconds
    }),
  ],
  providers: [
    PlansService,
    UsageService,
    FeatureGuard,
    LimitGuard,
    UnifiedPolicyGuard,
  ],
  exports: [
    PlansService,
    UsageService,
    FeatureGuard,
    LimitGuard,
    UnifiedPolicyGuard,
  ],
})
export class PlansModule {}
