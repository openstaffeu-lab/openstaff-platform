import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [PrismaModule, AuthModule, ComplianceModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
