import { Permission, Role } from '@prisma/client';

export const APP_MANAGED_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.ADMIN,
  Role.AI_MODERATOR,
  Role.EMPLOYER,
  Role.CONTRACTOR,
  Role.WORKER,
  Role.GENERAL_CONTRACTOR,
  Role.PROFESSIONAL,
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPERADMIN]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.MANAGE_USERS,
    Permission.MODERATE_AI,
    Permission.MANAGE_TECHNICAL_OPERATIONS,
  ],
  [Role.ADMIN]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.MANAGE_USERS,
    Permission.MODERATE_AI,
  ],
  [Role.AI_MODERATOR]: [Permission.READ, Permission.MODERATE_AI],
  [Role.CONTRACTOR]: [Permission.READ, Permission.WRITE],
  [Role.WORKER]: [Permission.READ],
  [Role.EMPLOYER]: [Permission.READ, Permission.WRITE],
  [Role.GENERAL_CONTRACTOR]: [Permission.READ, Permission.WRITE],
  [Role.PROFESSIONAL]: [Permission.READ],
};

export function isRole(value: string): value is Role {
  return Object.values(Role).includes(value as Role);
}

export function toPublicRoleLabel(role: Role) {
  return role.toLowerCase();
}
