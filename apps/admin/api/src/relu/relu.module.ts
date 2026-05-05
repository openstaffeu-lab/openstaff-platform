import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeminiModule } from '../gemini/gemini.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReluController } from './relu.controller';
import { ReluService } from './relu.service';

@Module({
  imports: [AuthModule, PrismaModule, GeminiModule],
  controllers: [ReluController],
  providers: [ReluService],
  exports: [ReluService],
})
export class ReluModule {}
