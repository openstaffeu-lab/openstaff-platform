import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [GeminiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
