import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RolloutIntelligenceController } from './rollout-intelligence.controller';
import { RolloutIntelligenceService } from './rollout-intelligence.service';

@Module({
  imports: [PrismaModule, AuditModule, NotificationModule],
  controllers: [RolloutIntelligenceController],
  providers: [RolloutIntelligenceService],
  exports: [RolloutIntelligenceService],
})
export class RolloutIntelligenceModule {}
