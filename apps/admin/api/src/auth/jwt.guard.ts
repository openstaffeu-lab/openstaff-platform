import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: 'SUPER_SECRET_KEY',
      });

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}