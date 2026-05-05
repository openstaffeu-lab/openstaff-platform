import { Module } from '@nestjs/common';
import { UniclassService } from './uniclass.service';
import { UniclassController } from './uniclass.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UniclassService],
  controllers: [UniclassController],
})
export class UniclassModule {}
