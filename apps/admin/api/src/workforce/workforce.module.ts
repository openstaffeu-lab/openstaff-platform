import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  WorkforceAdminController,
  WorkforceWorkerController,
} from './workforce.controller';
import { WorkforceService } from './workforce.service';

@Module({
  imports: [PrismaModule, AuthModule, MessagingModule, NotificationModule],
  controllers: [WorkforceAdminController, WorkforceWorkerController],
  providers: [WorkforceService],
  exports: [WorkforceService],
})
export class WorkforceModule {}
