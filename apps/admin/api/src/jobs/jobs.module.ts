import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReluModule } from '../relu/relu.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [PrismaModule, AuthModule, ReluModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
