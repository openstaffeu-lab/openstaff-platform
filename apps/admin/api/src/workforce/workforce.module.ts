import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  WorkforceAdminController,
  WorkforceWorkerController,
} from './workforce.controller';
import { WorkforceService } from './workforce.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkforceAdminController, WorkforceWorkerController],
  providers: [WorkforceService],
  exports: [WorkforceService],
})
export class WorkforceModule {}
