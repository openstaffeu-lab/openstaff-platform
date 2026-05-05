import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EscoController } from './esco.controller';
import { EscoService } from './esco.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [EscoController],
  providers: [EscoService],
})
export class EscoModule {}
