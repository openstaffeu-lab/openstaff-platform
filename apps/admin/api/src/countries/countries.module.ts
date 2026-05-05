import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  providers: [CountriesService],
  controllers: [CountriesController],
})
export class CountriesModule {}
