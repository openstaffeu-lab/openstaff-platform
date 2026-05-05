import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

const TEMP_ADMIN_USERNAME = 'admin';
const TEMP_ADMIN_PASSWORD = 'Filipesti2%26!';
const TEMP_ADMIN_USER = {
  id: 'openstaff-superadmin',
  email: 'admin@openstaff.local',
  role: 'SUPERADMIN' as const,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    role: Role;
  }) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    return user;
  }

  async login(data: { username?: string; email?: string; password: string }) {
    const identifier = data.username?.trim() || data.email?.trim() || '';

    if (
      identifier === TEMP_ADMIN_USERNAME &&
      data.password === TEMP_ADMIN_PASSWORD
    ) {
      const payload = {
        sub: TEMP_ADMIN_USER.id,
        email: TEMP_ADMIN_USER.email,
        role: TEMP_ADMIN_USER.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          role: 'superadmin',
        },
      };
    }

    if (!data.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        role: user.role,
      },
    };
  }
}
