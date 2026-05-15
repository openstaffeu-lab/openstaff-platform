import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  HiringAdminController,
  HiringCandidateController,
} from './hiring.controller';
import { HiringService } from './hiring.service';

@Module({
  imports: [PrismaModule, AuthModule, MessagingModule, NotificationModule],
  controllers: [HiringAdminController, HiringCandidateController],
  providers: [HiringService],
  exports: [HiringService],
})
export class HiringModule {}
