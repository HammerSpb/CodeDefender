import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLogsModule } from '@/audit-logs/audit-logs.module';
import { TokensService } from './tokens.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottleLoginGuard } from './guards/throttle-login.guard';
import { AuthExceptionFilter } from './filters/auth-exceptions.filter';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '15m'),
        },
      }),
    }),
    ThrottlerModule.forRoot([{
      name: 'auth',
      ttl: 60000, // 1 minute
      limit: 5, // 5 requests per minute for login/register
    }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    TokensService, 
    JwtStrategy,
    GithubStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottleLoginGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
  ],
  exports: [AuthService, TokensService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
