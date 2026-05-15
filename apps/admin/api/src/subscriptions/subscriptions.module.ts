import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminSubscriptionUpgradeRequestsController,
  AdminUserSubscriptionsController,
  SubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, BillingModule, NotificationModule],
  controllers: [
    SubscriptionsController,
    AdminSubscriptionUpgradeRequestsController,
    AdminUserSubscriptionsController,
  ],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
