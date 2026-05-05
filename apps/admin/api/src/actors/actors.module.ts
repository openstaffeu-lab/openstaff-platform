import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ActorsController } from './actors.controller';
import { ActorsService } from './actors.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [ActorsController],
  providers: [ActorsService],
  exports: [ActorsService],
})
export class ActorsModule {}
