import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { AccessControlService } from './access-control.service';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role } | undefined;

    if (!user?.role) {
      throw new ForbiddenException('No authenticated user role found');
    }

    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    const permissions = await this.accessControlService.getPermissionsForRole(
      user.role,
    );

    const hasAllPermissions = requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}

