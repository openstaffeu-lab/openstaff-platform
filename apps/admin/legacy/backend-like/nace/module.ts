import { Module } from '@nestjs/common';
import { NaceService } from './nace.service';
import { NaceController } from './nace.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NaceService],
  controllers: [NaceController],
})
export class NaceModule {}
