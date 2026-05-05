import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NaceController } from './nace.controller';
import { NaceService } from './nace.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [NaceController],
  providers: [NaceService],
})
export class NaceModule {}
