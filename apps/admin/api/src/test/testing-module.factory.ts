import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlService } from '../access-control/access-control.service';
import { AuditService } from '../audit/audit.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { PrismaService } from '../prisma/prisma.service';

type ModuleOptions = {
  controllers?: Array<new (...args: never[]) => unknown>;
  providers?: Array<new (...args: never[]) => unknown>;
  extraProviders?: Provider[];
};

export function createPrismaServiceMock() {
  return {
    $connect: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
    country: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    region: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    city: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    escoSkill: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    taxonomy: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    nace: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    uniclass: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

export function createJwtServiceMock() {
  return {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
}

export function createReflectorMock() {
  return {
    getAllAndOverride: jest.fn(),
  };
}

export function createRuntimeConfigServiceMock() {
  return {
    environment: 'test',
    isProduction: false,
    isDevelopment: false,
    getFeatureFlags: jest.fn().mockReturnValue({}),
    getValidationSummary: jest.fn().mockReturnValue({
      environment: 'test',
      warnings: [],
      errors: [],
    }),
    isDevAuthBypassEnabled: jest.fn().mockReturnValue(false),
    isAiFallbackEnabled: jest.fn().mockReturnValue(true),
    isDemoPublicFeedEnabled: jest.fn().mockReturnValue(false),
    isDemoMessagingEnabled: jest.fn().mockReturnValue(false),
    logValidationWarnings: jest.fn(),
    getPublicSummary: jest.fn().mockReturnValue({
      environment: 'test',
      featureFlags: {},
      warnings: [],
      errors: [],
    }),
  };
}

export function createAuditServiceMock() {
  return {
    log: jest.fn(),
    logSecurityEvent: jest.fn(),
    createOrUpdateSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    listUserSessions: jest.fn(),
    listSecurityEvents: jest.fn(),
    markSecurityEventStatus: jest.fn(),
    getAuditOverview: jest.fn(),
    getSecurityOverview: jest.fn(),
    getActorAuditTimeline: jest.fn(),
    getProjectAuditTimeline: jest.fn(),
  };
}

export function createAccessControlServiceMock() {
  return {
    getManagedRoles: jest.fn().mockReturnValue([]),
    getDefaultPermissions: jest.fn().mockReturnValue([]),
    getPermissionsForRole: jest.fn().mockResolvedValue([]),
    listRolePermissions: jest.fn().mockResolvedValue([]),
    updateRolePermissions: jest.fn(),
  };
}

export async function createTestingModule(
  options: ModuleOptions,
): Promise<TestingModule> {
  return Test.createTestingModule({
    controllers: options.controllers ?? [],
    providers: [
      ...(options.providers ?? []),
      {
        provide: PrismaService,
        useValue: createPrismaServiceMock(),
      },
      {
        provide: JwtService,
        useValue: createJwtServiceMock(),
      },
      {
        provide: Reflector,
        useValue: createReflectorMock(),
      },
      {
        provide: RuntimeConfigService,
        useValue: createRuntimeConfigServiceMock(),
      },
      {
        provide: AuditService,
        useValue: createAuditServiceMock(),
      },
      {
        provide: AccessControlService,
        useValue: createAccessControlServiceMock(),
      },
      ...(options.extraProviders ?? []),
    ],
  }).compile();
}
