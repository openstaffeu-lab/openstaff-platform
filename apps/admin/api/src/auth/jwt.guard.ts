import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountLifecycleStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const isDevBypass =
      this.runtimeConfig.isDevAuthBypassEnabled() &&
      process.env.SKIP_JWT_AUTH === 'true';

    if (isDevBypass) {
      request.user = {
        sub: process.env.DEV_USER_ID ?? 'dev-user-skip-jwt',
        email: process.env.DEV_USER_EMAIL ?? 'dev@openstaff.eu',
        role: process.env.DEV_USER_ROLE ?? 'SUPERADMIN',
      };
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      await this.auditService.logSecurityEvent({
        type: 'PERMISSION_DENIED' as any,
        category: 'AUTH',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message: 'Missing bearer token',
        request,
      });
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      await this.auditService.logSecurityEvent({
        type: 'PERMISSION_DENIED' as any,
        category: 'AUTH',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message: 'Invalid authorization header format',
        request,
      });
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        accountStatus?: AccountLifecycleStatus;
      }>(token, {
        secret: this.getJwtSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          accountStatus: true,
        },
      });

      if (!user) {
        await this.auditService.logSecurityEvent({
          type: 'PERMISSION_DENIED' as any,
          category: 'AUTH',
          sourceType: 'USER',
          sourceId: payload.sub,
          message: 'JWT resolved to a missing user',
          request,
        });
        throw new UnauthorizedException('User not found');
      }

      if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
        await this.auditService.logSecurityEvent({
          userId: user.id,
          type: 'PERMISSION_DENIED' as any,
          category: 'AUTH',
          sourceType: 'USER',
          sourceId: user.id,
          message: 'Suspended account attempted guarded route access',
          request,
        });
        throw new ForbiddenException('Your account is suspended');
      }

      request.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      await this.auditService.logSecurityEvent({
        type: 'PERMISSION_DENIED' as any,
        category: 'AUTH',
        sourceType: 'HTTP_ROUTE',
        sourceId: `${request?.method ?? 'GET'} ${request?.url ?? ''}`,
        message: 'JWT validation failed',
        request,
      });

      throw new UnauthorizedException('Invalid token');
    }
  }

  private getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production.');
    }

    return 'SUPER_SECRET_KEY';
  }
}
