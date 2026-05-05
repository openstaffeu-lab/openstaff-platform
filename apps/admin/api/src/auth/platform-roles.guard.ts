import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { PLATFORM_ROLES_KEY } from './platform-roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const actor = request.actor;

    if (!actor) {
      throw new ForbiddenException('Actor context is required');
    }

    if (!requiredRoles.includes(actor.role)) {
      throw new ForbiddenException('Actor does not have the required platform role');
    }

    return true;
  }
}
