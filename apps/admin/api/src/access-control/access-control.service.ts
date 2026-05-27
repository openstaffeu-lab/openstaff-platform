import { Injectable } from '@nestjs/common';
import { Permission, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  APP_MANAGED_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from './access-control.constants';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  getManagedRoles() {
    return APP_MANAGED_ROLES;
  }

  getDefaultPermissions(role: Role) {
    return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  }

  async getPermissionsForRole(role: Role) {
    try {
      const storedPermissions = await this.prisma.rolePermission.findMany({
        where: { role, enabled: true },
        orderBy: { permission: 'asc' },
      });

      if (storedPermissions.length > 0) {
        return storedPermissions.map((item) => item.permission);
      }
    } catch (error) {
      if (!this.isMissingRolePermissionModel(error)) {
        console.error('AccessControlService.getPermissionsForRole', error);
      }
    }

    return this.getDefaultPermissions(role);
  }

  async listRolePermissions() {
    const roles = this.getManagedRoles();

    return Promise.all(
      roles.map(async (role) => ({
        role,
        permissions: await this.getPermissionsForRole(role),
      })),
    );
  }

  async updateRolePermissions(role: Role, permissions: Permission[]) {
    const uniquePermissions = Array.from(new Set(permissions));

    await this.ensureRolePermissionTableAvailable();

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role } }),
      this.prisma.rolePermission.createMany({
        data: uniquePermissions.map((permission) => ({
          role,
          permission,
          enabled: true,
        })),
      }),
    ]);

    return {
      role,
      permissions: uniquePermissions,
    };
  }

  private async ensureRolePermissionTableAvailable() {
    try {
      await this.prisma.rolePermission.findFirst();
    } catch (error) {
      if (this.isMissingRolePermissionModel(error)) {
        throw new Error(
          'Role permissions table is not available yet. Run Prisma migration before editing permissions.',
        );
      }

      throw error;
    }
  }

  private isMissingRolePermissionModel(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021'
    );
  }
}
