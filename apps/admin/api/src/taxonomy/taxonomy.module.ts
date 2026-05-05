import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
