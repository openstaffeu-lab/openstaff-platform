import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicPostsController } from './public-posts.controller';
import { PublicPostsService } from './public-posts.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessControlModule,
    AuditModule,
    NotificationModule,
  ],
  controllers: [PublicPostsController],
  providers: [PublicPostsService, RateLimitGuard],
  exports: [PublicPostsService],
})
export class PublicPostsModule {}
