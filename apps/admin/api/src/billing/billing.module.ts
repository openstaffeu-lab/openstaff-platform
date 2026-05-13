import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingAdminController, BillingPublicController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [BillingAdminController, BillingPublicController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
