import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicFeedbackController } from './public-feedback.controller';
import { PublicFeedbackService } from './public-feedback.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [PublicFeedbackController],
  providers: [PublicFeedbackService],
  exports: [PublicFeedbackService],
})
export class PublicFeedbackModule {}
