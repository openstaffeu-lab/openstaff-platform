import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  TimesheetsAdminController,
  TimesheetsWorkerController,
} from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [TimesheetsAdminController, TimesheetsWorkerController],
  providers: [TimesheetsService],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}
