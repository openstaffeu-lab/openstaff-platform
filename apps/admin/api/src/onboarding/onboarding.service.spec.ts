import {
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
} from '@prisma/client';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService EXEC-78D identity draft creation', () => {
  const prisma = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: OnboardingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OnboardingService(prisma as any, {} as any, {} as any);
  });

  it('creates a professional identity draft as private, pending, and offline', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({ id: 'profile-1' });

    await (service as any).ensureLegacyProfileDraft('user-1', {
      displayName: 'Professional Owner',
      profileType: ProfileType.PROFESSIONAL,
    });

    expect(prisma.profile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        profileType: ProfileType.PROFESSIONAL,
        displayName: 'Professional Owner',
        visibility: ProfileVisibility.PRIVATE,
        moderationStatus: ProfileModerationStatus.PENDING,
        status: ProfileLifecycleStatus.OFFLINE,
      }),
      select: { id: true },
    });
  });

  it('creates a company identity draft without public company visibility', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({ id: 'profile-2' });

    await (service as any).ensureLegacyProfileDraft('user-2', {
      displayName: 'Company Owner',
      companyName: 'OpenStaff Works',
      profileType: ProfileType.CONTRACTOR,
    });

    expect(prisma.profile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-2',
        profileType: ProfileType.CONTRACTOR,
        displayName: 'Company Owner',
        companyName: 'OpenStaff Works',
        visibility: ProfileVisibility.PRIVATE,
        moderationStatus: ProfileModerationStatus.PENDING,
        status: ProfileLifecycleStatus.OFFLINE,
      }),
      select: { id: true },
    });
  });
});
