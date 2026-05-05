import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicPostsController } from './public-posts.controller';
import { PublicPostsService } from './public-posts.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessControlModule],
  controllers: [PublicPostsController],
  providers: [PublicPostsService],
  exports: [PublicPostsService],
})
export class PublicPostsModule {}
