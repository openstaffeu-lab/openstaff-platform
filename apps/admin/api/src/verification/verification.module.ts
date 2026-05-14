import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  VerificationAdminController,
  VerificationController,
} from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [VerificationController, VerificationAdminController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
