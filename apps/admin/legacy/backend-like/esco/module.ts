import { Module } from '@nestjs/common';
import { EscoService } from './esco.service';
import { EscoController } from './esco.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EscoService],
  controllers: [EscoController],
})
export class EscoModule {}
