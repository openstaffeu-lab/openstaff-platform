import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';

function contextFor(role?: Role): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/test',
        user: role ? { sub: `${role.toLowerCase()}-user`, role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard EXEC-75 role isolation', () => {
  const auditService = {
    logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  };
  const accessControlService = {
    getPermissionsForRole: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function guard(requiredPermissions: Permission[]) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions),
    } as unknown as Reflector;

    return new PermissionsGuard(
      reflector,
      accessControlService as any,
      auditService as any,
    );
  }

  it('blocks normal ADMIN from technical operations APIs', async () => {
    accessControlService.getPermissionsForRole.mockResolvedValue([
      Permission.READ,
      Permission.WRITE,
      Permission.DELETE,
      Permission.MANAGE_USERS,
      Permission.MODERATE_AI,
      Permission.MANAGE_TECHNICAL_OPERATIONS,
    ]);

    await expect(
      guard([Permission.MANAGE_TECHNICAL_OPERATIONS]).canActivate(
        contextFor(Role.ADMIN),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(accessControlService.getPermissionsForRole).not.toHaveBeenCalled();
  });

  it('allows SUPERADMIN through technical operations APIs', async () => {
    await expect(
      guard([Permission.MANAGE_TECHNICAL_OPERATIONS]).canActivate(
        contextFor(Role.SUPERADMIN),
      ),
    ).resolves.toBe(true);

    expect(accessControlService.getPermissionsForRole).not.toHaveBeenCalled();
  });

  it('allows AI_MODERATOR only on RELU moderation permissions', async () => {
    accessControlService.getPermissionsForRole.mockResolvedValue([
      Permission.READ,
      Permission.MODERATE_AI,
    ]);

    await expect(
      guard([Permission.MODERATE_AI]).canActivate(
        contextFor(Role.AI_MODERATOR),
      ),
    ).resolves.toBe(true);

    await expect(
      guard([Permission.MANAGE_TECHNICAL_OPERATIONS]).canActivate(
        contextFor(Role.AI_MODERATOR),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks anonymous requests before permissions are evaluated', async () => {
    await expect(
      guard([Permission.MODERATE_AI]).canActivate(contextFor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
