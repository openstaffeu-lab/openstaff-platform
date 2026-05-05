import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UiConfigController } from './ui-config.controller';
import { UiConfigService } from './ui-config.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UiConfigController],
  providers: [UiConfigService],
  exports: [UiConfigService],
})
export class UiConfigModule {}
