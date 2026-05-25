import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrustAdminController, TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuditModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [TrustController, TrustAdminController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
