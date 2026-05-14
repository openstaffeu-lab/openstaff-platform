import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollAdminController, PayrollWorkerController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [PayrollAdminController, PayrollWorkerController],
  providers: [PayrollService],
})
export class PayrollModule {}
