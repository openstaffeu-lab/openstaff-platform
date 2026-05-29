import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AccessControlService } from './access-control.service';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService,
    private readonly auditService: AuditService,
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
      await this.auditService.logSecurityEvent({
        userId: request?.user?.sub ?? null,
        type: 'PERMISSION_DENIED' as any,
        category: 'RBAC',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message:
          'Permissions guard denied request because no role was resolved',
        request,
      });
      throw new ForbiddenException('No authenticated user role found');
    }

    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    if (requiredPermissions.includes(Permission.MANAGE_TECHNICAL_OPERATIONS)) {
      await this.auditService.logSecurityEvent({
        userId: request?.user?.sub ?? null,
        type: 'PERMISSION_DENIED' as any,
        category: 'RBAC',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message: 'Technical operations require SUPERADMIN role',
        metadata: {
          requiredPermissions,
          role: user.role,
        },
        request,
      });
      throw new ForbiddenException('Technical operations require SUPERADMIN');
    }

    const permissions = await this.accessControlService.getPermissionsForRole(
      user.role,
    );

    const hasAllPermissions = requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      await this.auditService.logSecurityEvent({
        userId: request?.user?.sub ?? null,
        type: 'PERMISSION_DENIED' as any,
        category: 'RBAC',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message: 'Missing required permission',
        metadata: {
          requiredPermissions,
          role: user.role,
        },
        request,
      });
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}
