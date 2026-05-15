import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { JwtGuard } from './jwt.guard';
import { PlatformRolesGuard } from './platform-roles.guard';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'SUPER_SECRET_KEY',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, FirebaseAuthGuard, PlatformRolesGuard],
  exports: [JwtModule, JwtGuard, FirebaseAuthGuard, PlatformRolesGuard, AuthService],
})
export class AuthModule {}
