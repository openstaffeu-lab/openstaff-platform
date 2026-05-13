import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminSubscriptionUpgradeRequestsController,
  AdminUserSubscriptionsController,
  SubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, BillingModule],
  controllers: [
    SubscriptionsController,
    AdminSubscriptionUpgradeRequestsController,
    AdminUserSubscriptionsController,
  ],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
