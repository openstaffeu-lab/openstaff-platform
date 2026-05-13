import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  OnboardingAdminController,
  OnboardingController,
  OnboardingPublicProfilesController,
} from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [
    OnboardingController,
    OnboardingPublicProfilesController,
    OnboardingAdminController,
  ],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
