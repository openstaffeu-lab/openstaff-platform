import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalLinksController } from './external-links.controller';
import { ExternalLinksService } from './external-links.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [ExternalLinksController],
  providers: [ExternalLinksService],
  exports: [ExternalLinksService],
})
export class ExternalLinksModule {}
