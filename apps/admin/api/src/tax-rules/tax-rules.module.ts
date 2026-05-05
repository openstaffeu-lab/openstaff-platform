import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxRulesController } from './tax-rules.controller';
import { TaxRulesService } from './tax-rules.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaxRulesController],
  providers: [TaxRulesService],
  exports: [TaxRulesService],
})
export class TaxRulesModule {}
