import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('No user found');
    }

    if (user.role === 'SUPERADMIN') {
      return true;
    }

    if (!this.roles.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
