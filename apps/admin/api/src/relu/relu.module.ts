import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { GeminiModule } from '../gemini/gemini.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminReluController } from './admin-relu.controller';
import { ReluController } from './relu.controller';
import { ReluService } from './relu.service';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    GeminiModule,
    AuditModule,
    AccessControlModule,
    MessagingModule,
    NotificationModule,
  ],
  controllers: [ReluController, AdminReluController],
  providers: [ReluService],
  exports: [ReluService],
})
export class ReluModule {}
