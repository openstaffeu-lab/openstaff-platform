import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { APP_MANAGED_ROLES } from '../access-control/access-control.constants';

const TEMP_SUPERADMIN_ID = 'openstaff-superadmin';
const TEMP_SUPERADMIN_EMAIL = 'admin@openstaff.local';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    role: Role;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllAdminUsers() {
    let users: Awaited<ReturnType<UsersService['findAll']>> = [];

    try {
      users = await this.findAll();
    } catch (error) {
      console.error('UsersService.findAllAdminUsers', error);
    }

    return [
      {
        id: TEMP_SUPERADMIN_ID,
        email: TEMP_SUPERADMIN_EMAIL,
        role: Role.SUPERADMIN,
        createdAt: new Date(0),
        isTemporary: true,
      },
      ...users,
    ];
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRole(userId: string, role: Role) {
    if (!APP_MANAGED_ROLES.includes(role)) {
      throw new Error('Role is not assignable from the admin panel');
    }

    if (userId === TEMP_SUPERADMIN_ID) {
      throw new Error('Temporary superadmin role cannot be modified');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
