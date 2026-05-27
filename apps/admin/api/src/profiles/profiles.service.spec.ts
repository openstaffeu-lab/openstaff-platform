import { ForbiddenException } from '@nestjs/common';
import {
  ProfileAssetKind,
  ProfileDocumentType,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileVisibility,
  PublicModerationStatus,
} from '@prisma/client';
import { Readable } from 'stream';
import { ProfilesService } from './profiles.service';

function publicProfile(overrides: Record<string, unknown> = {}) {
  return {
    visibility: ProfileVisibility.PUBLIC,
    moderationStatus: ProfileModerationStatus.APPROVED,
    status: ProfileLifecycleStatus.LIVE,
    ...overrides,
  };
}

function profileAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-logo',
    profileId: 'profile-1',
    type: ProfileDocumentType.IMAGE,
    assetKind: ProfileAssetKind.LOGO,
    title: 'Approved logo',
    fileName: 'logo.png',
    mimeType: 'image/png',
    storageProvider: 'local',
    storageBucket: null,
    storageKey: 'profiles/profile-1/logo.png',
    moderationStatus: PublicModerationStatus.APPROVED,
    profile: publicProfile(),
    ...overrides,
  };
}

describe('ProfilesService public asset delivery', () => {
  const prisma = {
    profileDocument: {
      findUnique: jest.fn(),
    },
  };

  let service: ProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfilesService(prisma as any, {} as any);
    jest
      .spyOn(service as any, 'createDocumentReadStream')
      .mockReturnValue(Readable.from(['asset']));
  });

  it('returns approved company/profile assets anonymously', async () => {
    prisma.profileDocument.findUnique.mockResolvedValue(profileAsset());

    await expect(service.getAsset('doc-logo')).resolves.toMatchObject({
      fileName: 'logo.png',
      mimeType: 'image/png',
      canPreview: true,
    });
  });

  it('blocks unapproved profile assets even when the profile is public', async () => {
    prisma.profileDocument.findUnique.mockResolvedValue(
      profileAsset({ moderationStatus: PublicModerationStatus.PENDING }),
    );

    await expect(service.getAsset('doc-logo')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks approved assets when the parent profile is not public-approved-live', async () => {
    prisma.profileDocument.findUnique.mockResolvedValue(
      profileAsset({
        profile: publicProfile({
          moderationStatus: ProfileModerationStatus.PENDING,
        }),
      }),
    );

    await expect(service.getAsset('doc-logo')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
