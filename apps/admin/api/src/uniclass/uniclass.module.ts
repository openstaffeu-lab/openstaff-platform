import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UniclassController } from './uniclass.controller';
import { UniclassService } from './uniclass.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [UniclassController],
  providers: [UniclassService],
})
export class UniclassModule {}
