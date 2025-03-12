import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PlansService } from './plans.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureGuard } from './guards/feature.guard';
import { LimitGuard } from './guards/limit.guard';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes in seconds
    }),
  ],
  providers: [
    PlansService,
    FeatureGuard,
    LimitGuard,
  ],
  exports: [
    PlansService,
    FeatureGuard,
    LimitGuard,
  ],
})
export class PlansModule {}
