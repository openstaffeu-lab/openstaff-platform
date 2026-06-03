import {
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  Role,
  VerificationStatus,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AuthService } from './auth.service';

describe('AuthService EXEC-78D account registration separation', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    identityProfile: {
      create: jest.fn(),
    },
    identityCompanyProfile: {
      create: jest.fn(),
    },
    onboardingSession: {
      create: jest.fn(),
    },
    accountSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    usageMeter: {
      findFirst: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const auditService = {
    logSecurityEvent: jest.fn(),
  };
  const notificationService = {
    emitEvent: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      auditService as unknown as AuditService,
      notificationService as unknown as NotificationService,
      {} as unknown as TrustService,
    );
    jest
      .spyOn(service as any, 'ensureDefaultSubscriptionForUser')
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, 'buildAuthResponse').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1' },
    });
  });

  it('creates an active authentication account without auto-created public profile records', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.eu',
      role: Role.PROFESSIONAL,
      approvalStatus: AccountApprovalStatus.APPROVED,
      accountStatus: AccountLifecycleStatus.LIVE,
    });

    await service.register({
      email: 'Owner@Example.eu',
      password: 'Password123',
      countryCode: 'IE',
      languageCode: 'en',
      phone: '+353',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'owner@example.eu',
        role: Role.PROFESSIONAL,
        approvalStatus: AccountApprovalStatus.APPROVED,
        accountStatus: AccountLifecycleStatus.LIVE,
      }),
    });
    expect(prisma.profile.create).not.toHaveBeenCalled();
    expect(prisma.identityProfile.create).not.toHaveBeenCalled();
    expect(prisma.identityCompanyProfile.create).not.toHaveBeenCalled();
    expect(prisma.onboardingSession.create).not.toHaveBeenCalled();
  });

  it('summarizes Both identity state without treating account activation as public profile approval', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.eu',
      role: Role.PROFESSIONAL,
      approvalStatus: AccountApprovalStatus.APPROVED,
      accountStatus: AccountLifecycleStatus.LIVE,
      profile: null,
      identityProfile: {
        displayName: 'Owner',
        verificationStatus: VerificationStatus.UNVERIFIED,
        onboardingCompletedAt: null,
      },
      identityCompanyProfiles: [
        {
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      ],
      onboardingSession: {
        currentStep: 'company',
        completedSteps: ['identity-type', 'identity-type:both', 'identity'],
        status: 'IN_PROGRESS',
      },
    });
    prisma.accountSubscription.findFirst.mockResolvedValue(null);

    await expect(service.getCurrentUser('user-1')).resolves.toMatchObject({
      accountStatus: AccountLifecycleStatus.LIVE,
      approvalStatus: AccountApprovalStatus.APPROVED,
      actorType: ActorType.COMPANY,
      onboardingDone: false,
      onboardingCurrentStep: 'company',
      profile: null,
      identityState: {
        hasProfessionalIdentity: true,
        hasCompanyIdentity: true,
        selectedIdentityType: 'BOTH',
        identityProfileStatus: VerificationStatus.UNVERIFIED,
        companyProfileStatus: VerificationStatus.UNVERIFIED,
      },
    });
  });
});
