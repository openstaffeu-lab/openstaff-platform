import { forwardRef, Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuditModule),
    forwardRef(() => AuthModule),
    forwardRef(() => AccessControlModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, RateLimitGuard],
  exports: [NotificationService],
})
export class NotificationModule {}
