import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthService } from './service';
import { JwtGuard } from './jwt.guard';
import { PlatformRolesGuard } from './platform-roles.guard';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET ?? 'SUPER_SECRET_KEY',
        signOptions: { expiresIn: '1d' },
      }),
  }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, FirebaseAuthGuard, PlatformRolesGuard],
  exports: [JwtModule, JwtGuard, FirebaseAuthGuard, PlatformRolesGuard],
})
export class AuthModule {}
