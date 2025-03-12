import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlansModule } from '../plans/plans.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PolicyGuard } from './guards/policy.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PermissionsModule,
    PlansModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '24h'),
        },
      }),
    }),
  ],
  providers: [
    PolicyGuard,
    RolesGuard,
  ],
  exports: [
    PolicyGuard,
    RolesGuard,
    JwtModule,
    PrismaModule,
  ],
})
export class CommonModule {}
