import { forwardRef, Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AccessControlService } from './access-control.service';
import { PermissionsGuard } from './permissions.guard';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUsersController } from './admin-users.controller';

@Global()
@Module({
  imports: [PrismaModule, UsersModule, forwardRef(() => AuthModule)],
  controllers: [AdminRolesController, AdminUsersController],
  providers: [AccessControlService, PermissionsGuard],
  exports: [AccessControlService, PermissionsGuard],
})
export class AccessControlModule {}
