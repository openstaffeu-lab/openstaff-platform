import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrustModule } from '../trust/trust.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { JwtGuard } from './jwt.guard';
import { PlatformRolesGuard } from './platform-roles.guard';

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  return 'SUPER_SECRET_KEY';
}

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuditModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => TrustModule),
    JwtModule.register({
      secret: resolveJwtSecret(),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtGuard,
    FirebaseAuthGuard,
    PlatformRolesGuard,
    RateLimitGuard,
  ],
  exports: [
    JwtModule,
    JwtGuard,
    FirebaseAuthGuard,
    PlatformRolesGuard,
    AuthService,
  ],
})
export class AuthModule {}
