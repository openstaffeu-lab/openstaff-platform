import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrivateMessagingController } from './private-messaging.controller';
import { PrivateMessagingService } from './private-messaging.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [PrivateMessagingController],
  providers: [PrivateMessagingService],
  exports: [PrivateMessagingService],
})
export class PrivateMessagingModule {}
