import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectAccessPolicy } from '../projects/project-access.policy';
import { ComplianceEligibilityService } from './compliance-eligibility.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, NotificationModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceEligibilityService, ProjectAccessPolicy],
  exports: [ComplianceService, ComplianceEligibilityService],
})
export class ComplianceModule {}
