import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProfileAssetKind,
  ProfileAvailabilityStatus,
  ProfileDocumentType,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { UploadProfileDocumentDto } from './dto/upload-profile-document.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

export type UploadedProfileFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AuthenticatedUser = {
  sub: string;
  role: string;
  approvalStatus?: string;
};

const extractionStatuses = {
  NOT_REQUESTED: 'NOT_REQUESTED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  UNSUPPORTED: 'UNSUPPORTED',
  FAILED: 'FAILED',
} as const;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.sub },
      include: this.profileInclude,
    });

    if (!profile) {
      return null;
    }

    return this.toProfileResponse(profile);
  }

  async getPublicProfile(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: this.profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (
      profile.visibility !== ProfileVisibility.PUBLIC ||
      profile.moderationStatus !== ProfileModerationStatus.APPROVED ||
      profile.status !== ProfileLifecycleStatus.LIVE
    ) {
      throw new ForbiddenException('This profile is not publicly available');
    }

    return this.toPublicProfileResponse(profile);
  }

  async getRestrictedProfile(slug: string, user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: this.profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const isOwner = profile.userId === user.sub;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
    const canViewApprovedOnly =
      profile.visibility === ProfileVisibility.APPROVED_ONLY &&
      profile.moderationStatus === ProfileModerationStatus.APPROVED &&
      profile.status !== ProfileLifecycleStatus.SUSPENDED &&
      user.approvalStatus === 'APPROVED';

    if (!isOwner && !isAdmin && !canViewApprovedOnly) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    return this.toPublicProfileResponse(profile);
  }

  async upsertCurrentProfile(body: UpsertProfileDto, user: AuthenticatedUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { profile: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const profileType = body.profileType ?? existingUser.profile?.profileType ?? this.defaultProfileType(existingUser.role);
    const slug = await this.resolveUniqueSlug(
      body.slug ?? body.companyName ?? body.displayName,
      existingUser.profile?.id ?? null,
    );

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
    const profile = await this.prisma.profile.upsert({
      where: { userId: user.sub },
      update: {
        slug,
        profileType,
        displayName: body.displayName.trim(),
        companyName: this.normalizeNullableString(body.companyName),
        publicHeadline: this.normalizeNullableString(body.publicHeadline),
        summary: this.normalizeNullableString(body.summary),
        description: this.normalizeNullableString(body.description),
        websiteUrl: this.normalizeNullableString(body.websiteUrl),
        publicEmail: this.normalizeNullableString(body.publicEmail),
        publicPhone: this.normalizeNullableString(body.publicPhone),
        privateEmail: this.normalizeNullableString(body.privateEmail),
        privatePhone: this.normalizeNullableString(body.privatePhone),
        privateNotes: this.normalizeNullableString(body.privateNotes),
        companyRegistrationNumber: this.normalizeNullableString(
          body.companyRegistrationNumber,
        ),
        taxNumber: this.normalizeNullableString(body.taxNumber),
        visibility: body.visibility ?? existingUser.profile?.visibility ?? ProfileVisibility.PRIVATE,
        status: isAdmin
          ? body.status ?? existingUser.profile?.status ?? ProfileLifecycleStatus.OFFLINE
          : existingUser.profile?.status ?? ProfileLifecycleStatus.OFFLINE,
        countryId: body.countryId ?? null,
        regionId: body.regionId ?? null,
        cityId: body.cityId ?? null,
        supportedEngagementModels: body.supportedEngagementModels
          ? JSON.stringify(body.supportedEngagementModels)
          : null,
        certificationsText: this.normalizeNullableString(body.certificationsText),
        availabilityStatus:
          body.availabilityStatus ?? ProfileAvailabilityStatus.AVAILABLE,
        rating: body.rating ?? null,
      },
      create: {
        userId: user.sub,
        slug,
        profileType,
        displayName: body.displayName.trim(),
        companyName: this.normalizeNullableString(body.companyName),
        publicHeadline: this.normalizeNullableString(body.publicHeadline),
        summary: this.normalizeNullableString(body.summary),
        description: this.normalizeNullableString(body.description),
        websiteUrl: this.normalizeNullableString(body.websiteUrl),
        publicEmail: this.normalizeNullableString(body.publicEmail),
        publicPhone: this.normalizeNullableString(body.publicPhone),
        privateEmail: this.normalizeNullableString(body.privateEmail),
        privatePhone: this.normalizeNullableString(body.privatePhone),
        privateNotes: this.normalizeNullableString(body.privateNotes),
        companyRegistrationNumber: this.normalizeNullableString(
          body.companyRegistrationNumber,
        ),
        taxNumber: this.normalizeNullableString(body.taxNumber),
        visibility: body.visibility ?? ProfileVisibility.PRIVATE,
        moderationStatus: ProfileModerationStatus.PENDING,
        status: isAdmin
          ? body.status ?? ProfileLifecycleStatus.OFFLINE
          : ProfileLifecycleStatus.OFFLINE,
        countryId: body.countryId ?? null,
        regionId: body.regionId ?? null,
        cityId: body.cityId ?? null,
        supportedEngagementModels: body.supportedEngagementModels
          ? JSON.stringify(body.supportedEngagementModels)
          : JSON.stringify(['B2B']),
        certificationsText: this.normalizeNullableString(body.certificationsText),
        availabilityStatus:
          body.availabilityStatus ?? ProfileAvailabilityStatus.AVAILABLE,
        rating: body.rating ?? null,
      },
    });

    await this.syncProfileRelations(profile.id, body, profileType);

    const updatedProfile = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        moderationStatus: isAdmin
          ? existingUser.profile?.moderationStatus ?? ProfileModerationStatus.PENDING
          : ProfileModerationStatus.PENDING,
        status: isAdmin
          ? body.status ?? profile.status
          : profile.status === ProfileLifecycleStatus.SUSPENDED
            ? ProfileLifecycleStatus.SUSPENDED
            : ProfileLifecycleStatus.OFFLINE,
      },
      include: this.profileInclude,
    });

    return this.toProfileResponse(updatedProfile);
  }

  async listDocuments(profileId: string, user: AuthenticatedUser) {
    const profile = await this.getProfileForRead(profileId, user);
    const documents = await this.prisma.profileDocument.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => this.toProfileDocumentResponse(document));
  }

  async uploadDocument(
    profileId: string,
    body: UploadProfileDocumentDto,
    file: UploadedProfileFile | undefined,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getProfileForWrite(profileId, user);

    if (!file) {
      throw new BadRequestException('A file upload is required');
    }

    if (!body.title?.trim()) {
      throw new BadRequestException('Document title is required');
    }

    const relativeStorageKey = await this.persistUploadedFile(profile.id, file);
    const type = body.type ?? this.inferDocumentType(file, body.assetKind);

    const document = await this.prisma.profileDocument.create({
      data: {
        profileId: profile.id,
        uploadedById: user.sub,
        type,
        assetKind: body.assetKind ?? null,
        title: body.title.trim(),
        description: this.normalizeNullableString(body.description),
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storageProvider: 'local',
        storageKey: relativeStorageKey,
        extractionStatus: extractionStatuses.NOT_REQUESTED,
      },
    });

    await this.syncProfileAssets(profile.id, document);

    return this.toProfileDocumentResponse(document);
  }

  async getDocument(profileId: string, documentId: string, user: AuthenticatedUser) {
    const document = await this.getDocumentForRead(profileId, documentId, user);

    if (document.storageProvider !== 'local') {
      throw new BadRequestException(
        'Only locally stored profile documents can be downloaded from this endpoint',
      );
    }

    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      canPreview: this.canPreview(document.mimeType),
      stream: createReadStream(this.resolveStoragePath(document.storageKey)),
    };
  }

  async getAsset(documentId: string) {
    const document = await this.prisma.profileDocument.findUnique({
      where: { id: documentId },
      include: {
        profile: true,
      },
    });

    if (!document || !document.profile) {
      throw new NotFoundException('Asset not found');
    }

    if (
      (document.profile.visibility !== ProfileVisibility.PUBLIC &&
        document.profile.visibility !== ProfileVisibility.APPROVED_ONLY) ||
      document.profile.moderationStatus !== ProfileModerationStatus.APPROVED ||
      document.profile.status !== ProfileLifecycleStatus.LIVE
    ) {
      throw new ForbiddenException('Asset is not public');
    }

    if (
      document.assetKind !== ProfileAssetKind.LOGO &&
      document.assetKind !== ProfileAssetKind.PHOTO &&
      document.assetKind !== ProfileAssetKind.BANNER &&
      document.assetKind !== ProfileAssetKind.PORTFOLIO
    ) {
      throw new ForbiddenException('Asset is not public');
    }

    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      canPreview: this.canPreview(document.mimeType),
      stream: createReadStream(this.resolveStoragePath(document.storageKey)),
    };
  }

  async getExtractedText(profileId: string, documentId: string, user: AuthenticatedUser) {
    const document = await this.getDocumentForRead(profileId, documentId, user);

    return {
      documentId: document.id,
      extractionStatus: document.extractionStatus,
      extractionError: document.extractionError,
      extractedAt: document.extractedAt,
      extractedText: document.extractedText,
    };
  }

  async extractDocument(profileId: string, documentId: string, user: AuthenticatedUser) {
    const document = await this.getDocumentForWrite(profileId, documentId, user);

    if (document.storageProvider !== 'local') {
      throw new BadRequestException(
        'Only locally stored profile documents can be extracted in this phase',
      );
    }

    await this.prisma.profileDocument.update({
      where: { id: document.id },
      data: {
        extractionStatus: extractionStatuses.PENDING,
        extractionError: null,
      },
    });

    try {
      const buffer = await readFile(this.resolveStoragePath(document.storageKey));
      const extracted = await this.extractTextFromBuffer(
        document.mimeType,
        document.fileName,
        buffer,
      );

      const updatedDocument = await this.prisma.profileDocument.update({
        where: { id: document.id },
        data: {
          extractedText: extracted.text,
          extractionStatus: extracted.status,
          extractionError: extracted.error ?? null,
          extractedAt: new Date(),
        },
      });

      return this.toProfileDocumentResponse(updatedDocument);
    } catch (error) {
      const updatedDocument = await this.prisma.profileDocument.update({
        where: { id: document.id },
        data: {
          extractionStatus: extractionStatuses.FAILED,
          extractionError:
            error instanceof Error ? error.message : 'Text extraction failed',
          extractedAt: new Date(),
        },
      });

      return this.toProfileDocumentResponse(updatedDocument);
    }
  }

  async removeDocument(profileId: string, documentId: string, user: AuthenticatedUser) {
    const document = await this.getDocumentForWrite(profileId, documentId, user);

    await this.prisma.profileDocument.delete({
      where: { id: document.id },
    });

    if (document.storageProvider === 'local') {
      await rm(this.resolveStoragePath(document.storageKey), { force: true });
    }

    await this.removeAssetReference(profileId, document);

    return { success: true };
  }

  private async syncProfileRelations(
    profileId: string,
    body: UpsertProfileDto,
    profileType: ProfileType,
  ) {
    await this.prisma.profileLanguage.deleteMany({ where: { profileId } });
    await this.prisma.profileEscoClassification.deleteMany({ where: { profileId } });
    await this.prisma.profileNaceClassification.deleteMany({ where: { profileId } });
    await this.prisma.profileUniclassClassification.deleteMany({ where: { profileId } });

    if (body.languageIds?.length) {
      await this.prisma.profileLanguage.createMany({
        data: body.languageIds.map((languageId) => ({ profileId, languageId })),
      });
    }

    if (body.escoSkillIds?.length) {
      await this.prisma.profileEscoClassification.createMany({
        data: body.escoSkillIds.map((escoSkillId) => ({ profileId, escoSkillId })),
      });
    }

    if (body.naceIds?.length) {
      await this.prisma.profileNaceClassification.createMany({
        data: body.naceIds.map((naceId) => ({ profileId, naceId })),
      });
    }

    if (body.uniclassIds?.length) {
      await this.prisma.profileUniclassClassification.createMany({
        data: body.uniclassIds.map((uniclassId) => ({ profileId, uniclassId })),
      });
    }

    if (this.usesProfessionalWorkspace(profileType)) {
      await this.prisma.contractorProfile.deleteMany({ where: { profileId } });

      if (body.professionalProfile) {
        await this.prisma.professionalProfile.upsert({
          where: { profileId },
          update: {
            headline: body.professionalProfile.headline?.trim() ?? null,
            yearsExperience: body.professionalProfile.yearsExperience ?? null,
            portfolioFocus: body.professionalProfile.portfolioFocus?.trim() ?? null,
          },
          create: {
            profileId,
            headline: body.professionalProfile.headline?.trim() ?? null,
            yearsExperience: body.professionalProfile.yearsExperience ?? null,
            portfolioFocus: body.professionalProfile.portfolioFocus?.trim() ?? null,
          },
        });
      } else {
        await this.prisma.professionalProfile.deleteMany({ where: { profileId } });
      }

      return;
    }

    await this.prisma.professionalProfile.deleteMany({ where: { profileId } });

    if (body.contractorProfile) {
      await this.prisma.contractorProfile.upsert({
        where: { profileId },
        update: {
          tradeFocus: body.contractorProfile.tradeFocus?.trim() ?? null,
          teamSize: body.contractorProfile.teamSize ?? null,
          serviceArea: body.contractorProfile.serviceArea?.trim() ?? null,
        },
        create: {
          profileId,
          tradeFocus: body.contractorProfile.tradeFocus?.trim() ?? null,
          teamSize: body.contractorProfile.teamSize ?? null,
          serviceArea: body.contractorProfile.serviceArea?.trim() ?? null,
        },
      });
    } else {
      await this.prisma.contractorProfile.deleteMany({ where: { profileId } });
    }
  }

  private async syncProfileAssets(profileId: string, document: any) {
    const assetUrl =
      document.assetKind === ProfileAssetKind.CV
        ? `/profiles/${profileId}/documents/${document.id}`
        : `/profiles/assets/${document.id}`;

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        portfolioUrlsJson: true,
      },
    });

    const portfolioUrls = this.parseStringArray(profile?.portfolioUrlsJson ?? null);

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(document.assetKind === ProfileAssetKind.LOGO ? { logoUrl: assetUrl } : {}),
        ...(document.assetKind === ProfileAssetKind.PHOTO ? { photoUrl: assetUrl } : {}),
        ...(document.assetKind === ProfileAssetKind.BANNER ? { bannerUrl: assetUrl } : {}),
        ...(document.assetKind === ProfileAssetKind.CV ? { cvUrl: assetUrl } : {}),
        ...(document.assetKind === ProfileAssetKind.PORTFOLIO
          ? {
              portfolioUrlsJson: JSON.stringify(
                Array.from(new Set([...portfolioUrls, assetUrl])),
              ),
            }
          : {}),
      },
    });
  }

  private async removeAssetReference(profileId: string, document: any) {
    const assetUrl =
      document.assetKind === ProfileAssetKind.CV
        ? `/profiles/${profileId}/documents/${document.id}`
        : `/profiles/assets/${document.id}`;

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        logoUrl: true,
        photoUrl: true,
        bannerUrl: true,
        cvUrl: true,
        portfolioUrlsJson: true,
      },
    });

    if (!profile) {
      return;
    }

    const portfolioUrls = this.parseStringArray(profile.portfolioUrlsJson);

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        logoUrl: profile.logoUrl === assetUrl ? null : undefined,
        photoUrl: profile.photoUrl === assetUrl ? null : undefined,
        bannerUrl: profile.bannerUrl === assetUrl ? null : undefined,
        cvUrl: profile.cvUrl === assetUrl ? null : undefined,
        portfolioUrlsJson: JSON.stringify(
          portfolioUrls.filter((entry) => entry !== assetUrl),
        ),
      },
    });
  }

  private async getProfileForRead(profileId: string, user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isAdmin && profile.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    return profile;
  }

  private async getProfileForWrite(profileId: string, user: AuthenticatedUser) {
    return this.getProfileForRead(profileId, user);
  }

  private async getDocumentForRead(
    profileId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    await this.getProfileForRead(profileId, user);

    const document = await this.prisma.profileDocument.findFirst({
      where: { id: documentId, profileId },
    });

    if (!document) {
      throw new NotFoundException('Profile document not found');
    }

    return document;
  }

  private async getDocumentForWrite(
    profileId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    return this.getDocumentForRead(profileId, documentId, user);
  }

  private toProfileResponse(profile: any) {
    const ownedAssetUrls = this.resolveOwnedAssetUrls(profile);

    return {
      id: profile.id,
      userId: profile.userId,
      slug: profile.slug,
      profileType: profile.profileType,
      displayName: profile.displayName,
      companyName: profile.companyName,
      publicHeadline: profile.publicHeadline,
      description: profile.description,
      summary: profile.summary,
      websiteUrl: profile.websiteUrl,
      publicEmail: profile.publicEmail,
      publicPhone: profile.publicPhone,
      privateEmail: profile.privateEmail,
      privatePhone: profile.privatePhone,
      privateNotes: profile.privateNotes,
      companyRegistrationNumber: profile.companyRegistrationNumber,
      taxNumber: profile.taxNumber,
      visibility: profile.visibility,
      moderationStatus: profile.moderationStatus,
      status: profile.status,
      supportedEngagementModels: this.parseStringArray(profile.supportedEngagementModels),
      certificationsText: profile.certificationsText,
      availabilityStatus: profile.availabilityStatus,
      rating: profile.rating,
      geography: {
        country: profile.country,
        region: profile.region,
        city: profile.city,
      },
      languages: profile.languages.map((item: any) => item.language),
      escoSkills: profile.escoClassifications.map((item: any) => item.escoSkill),
      naceCodes: profile.naceClassifications.map((item: any) => item.nace),
      uniclassCodes: profile.uniclassClassifications.map((item: any) => item.uniclass),
      contractorProfile: profile.contractorProfile,
      professionalProfile: profile.professionalProfile,
      assets: ownedAssetUrls,
      documents: profile.documents.map((document: any) =>
        this.toProfileDocumentResponse(document),
      ),
      counts: {
        documents: profile.documents.length,
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      approvedAt: profile.approvedAt,
    };
  }

  private toPublicProfileResponse(profile: any) {
    return {
      id: profile.id,
      slug: profile.slug,
      profileType: profile.profileType,
      displayName: profile.displayName,
      companyName: profile.companyName,
      publicHeadline: profile.publicHeadline,
      summary: profile.summary,
      description: profile.description,
      websiteUrl: profile.websiteUrl,
      publicEmail: profile.publicEmail,
      publicPhone: profile.publicPhone,
      visibility: profile.visibility,
      moderationStatus: profile.moderationStatus,
      status: profile.status,
      availabilityStatus: profile.availabilityStatus,
      geography: {
        country: profile.country,
        region: profile.region,
        city: profile.city,
      },
      languages: profile.languages.map((item: any) => item.language),
      escoSkills: profile.escoClassifications.map((item: any) => item.escoSkill),
      naceCodes: profile.naceClassifications.map((item: any) => item.nace),
      uniclassCodes: profile.uniclassClassifications.map((item: any) => item.uniclass),
      contractorProfile: profile.contractorProfile,
      professionalProfile: profile.professionalProfile,
      assets: {
        logoUrl: profile.logoUrl,
        photoUrl: profile.photoUrl,
        bannerUrl: profile.bannerUrl,
        portfolioUrls: this.parseStringArray(profile.portfolioUrlsJson),
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toProfileDocumentResponse(document: any) {
    return {
      id: document.id,
      profileId: document.profileId,
      type: document.type,
      assetKind: document.assetKind,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      extractionStatus: document.extractionStatus,
      extractionError: document.extractionError,
      extractedAt: document.extractedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      storage: {
        provider: document.storageProvider,
        bucket: document.storageBucket,
        key: document.storageKey,
      },
      urls: {
        download: `/profiles/${document.profileId}/documents/${document.id}`,
        asset:
          document.assetKind !== null ? `/profiles/assets/${document.id}` : null,
      },
    };
  }

  private parseStringArray(value: string | null) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private normalizeNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private defaultProfileType(role: string) {
    if (role === 'GENERAL_CONTRACTOR') {
      return ProfileType.GENERAL_CONTRACTOR;
    }

    if (role === 'EMPLOYER') {
      return ProfileType.INVESTOR;
    }

    return role === 'PROFESSIONAL' ? ProfileType.PROFESSIONAL : ProfileType.CONTRACTOR;
  }

  private usesProfessionalWorkspace(profileType: ProfileType) {
    return (
      profileType === ProfileType.PROFESSIONAL ||
      profileType === ProfileType.INVESTOR ||
      profileType === ProfileType.TRAINING_COMPANY ||
      profileType === ProfileType.SUPERVISOR ||
      profileType === ProfileType.HSE_SAFETY ||
      profileType === ProfileType.SPECIALIST ||
      profileType === ProfileType.CLINIC_DOCTOR ||
      profileType === ProfileType.TRAINER_EVALUATOR
    );
  }

  private async resolveUniqueSlug(value: string, profileId: string | null) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.prisma.profile.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === profileId) {
        return slug;
      }

      slug = `${baseSlug}-${index}`;
      index += 1;
    }
  }

  private slugify(value: string) {
    return (
      value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `profile-${Date.now()}`
    );
  }

  private async persistUploadedFile(profileId: string, file: UploadedProfileFile) {
    const profileFolder = join(this.getUploadsRoot(), profileId);
    const extension = extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const uniqueFileName = `${randomUUID()}${extension}`;
    const relativeStorageKey = `profiles/${profileId}/${uniqueFileName}`;

    await mkdir(profileFolder, { recursive: true });
    await writeFile(join(this.getBaseUploadsPath(), relativeStorageKey), file.buffer);

    return relativeStorageKey;
  }

  private getBaseUploadsPath() {
    return join(process.cwd(), 'uploads');
  }

  private getUploadsRoot() {
    return join(this.getBaseUploadsPath(), 'profiles');
  }

  private resolveStoragePath(storageKey: string) {
    return join(this.getBaseUploadsPath(), storageKey);
  }

  private inferDocumentType(
    file: UploadedProfileFile,
    assetKind?: ProfileAssetKind | null,
  ) {
    if (assetKind === ProfileAssetKind.CV) {
      return ProfileDocumentType.CV;
    }

    if (assetKind === ProfileAssetKind.PORTFOLIO) {
      return ProfileDocumentType.PORTFOLIO;
    }

    const fileName = file.originalname.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      return ProfileDocumentType.CERTIFICATION;
    }

    if (file.mimetype.startsWith('image/')) {
      return ProfileDocumentType.IMAGE;
    }

    if (file.mimetype.startsWith('video/')) {
      return ProfileDocumentType.VIDEO;
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return ProfileDocumentType.CV;
    }

    return ProfileDocumentType.OTHER;
  }

  private extensionFromMime(mimeType: string) {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'text/plain': '.txt',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };

    return mimeMap[mimeType] ?? '';
  }

  private canPreview(mimeType: string) {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
  }

  private async extractTextFromBuffer(
    mimeType: string,
    fileName: string,
    buffer: Buffer,
  ) {
    const lowerFileName = fileName.toLowerCase();

    if (mimeType === 'text/plain' || lowerFileName.endsWith('.txt')) {
      return {
        text: buffer.toString('utf8'),
        status: extractionStatuses.COMPLETED,
      };
    }

    if (mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      return {
        text: parsed.text,
        status: extractionStatuses.COMPLETED,
      };
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerFileName.endsWith('.docx')
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      return {
        text: parsed.value,
        status: extractionStatuses.COMPLETED,
      };
    }

    if (mimeType.startsWith('image/')) {
      return {
        text: null,
        status: extractionStatuses.UNSUPPORTED,
        error: 'OCR is not implemented yet for image profile documents',
      };
    }

    if (mimeType.startsWith('video/')) {
      return {
        text: null,
        status: extractionStatuses.UNSUPPORTED,
        error: 'Video parsing is not implemented yet for profile documents',
      };
    }

    return {
      text: null,
      status: extractionStatuses.UNSUPPORTED,
      error: `Text extraction is not supported yet for ${mimeType || 'this file type'}`,
    };
  }

  private readonly profileInclude = {
    country: true,
    region: true,
    city: true,
    contractorProfile: true,
    professionalProfile: true,
    languages: {
      include: {
        language: true,
      },
    },
    documents: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    escoClassifications: {
      include: {
        escoSkill: true,
      },
    },
    naceClassifications: {
      include: {
        nace: true,
      },
    },
    uniclassClassifications: {
      include: {
        uniclass: true,
      },
    },
  } as const;

  private resolveOwnedAssetUrls(profile: any) {
    const byKind = new Map<string, any>();

    for (const document of profile.documents) {
      if (document.assetKind) {
        byKind.set(document.assetKind, document);
      }
    }

    const portfolioUrls = profile.documents
      .filter((document: any) => document.assetKind === ProfileAssetKind.PORTFOLIO)
      .map((document: any) => `/profiles/${profile.id}/documents/${document.id}`);

    return {
      logoUrl: byKind.get(ProfileAssetKind.LOGO)
        ? `/profiles/${profile.id}/documents/${byKind.get(ProfileAssetKind.LOGO).id}`
        : profile.logoUrl,
      photoUrl: byKind.get(ProfileAssetKind.PHOTO)
        ? `/profiles/${profile.id}/documents/${byKind.get(ProfileAssetKind.PHOTO).id}`
        : profile.photoUrl,
      bannerUrl: byKind.get(ProfileAssetKind.BANNER)
        ? `/profiles/${profile.id}/documents/${byKind.get(ProfileAssetKind.BANNER).id}`
        : profile.bannerUrl,
      cvUrl: byKind.get(ProfileAssetKind.CV)
        ? `/profiles/${profile.id}/documents/${byKind.get(ProfileAssetKind.CV).id}`
        : profile.cvUrl,
      portfolioUrls:
        portfolioUrls.length > 0 ? portfolioUrls : this.parseStringArray(profile.portfolioUrlsJson),
    };
  }
}
