import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
