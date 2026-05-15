import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule, AuditModule],
  controllers: [MessagingController],
  providers: [MessagingService, RateLimitGuard],
  exports: [MessagingService],
})
export class MessagingModule {}
