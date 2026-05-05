import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  ProfileAvailabilityStatus,
  ProfileDocumentType,
  ProfileType,
  WorkerDocumentType,
  WorkerEmploymentType,
  WorkerStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import mammoth from 'mammoth';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileWorkerDto } from './dto/create-profile-worker.dto';
import { CreateWorkerDocumentDto } from './dto/create-worker-document.dto';
import { CreateWorkerSkillDto } from './dto/create-worker-skill.dto';
import { UploadProfileDocumentDto } from './dto/upload-profile-document.dto';
import { UpdateProfileWorkerDto } from './dto/update-profile-worker.dto';
import { UpdateWorkerDocumentDto } from './dto/update-worker-document.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
  ) {}

  async getCurrentProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      include: this.profileInclude,
    });

    return profile ? this.toProfileResponse(profile) : null;
  }

  async upsertCurrentProfile(body: UpsertProfileDto, user: AuthenticatedUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const profileType = body.profileType ?? this.defaultProfileType(existingUser.role);

    const profile = await this.prisma.profile.upsert({
      where: {
        userId: user.sub,
      },
      update: {
        profileType,
        displayName: body.displayName.trim(),
        companyName: body.companyName?.trim() ?? null,
        summary: body.summary?.trim() ?? null,
        description: body.description?.trim() ?? null,
        countryId: body.countryId ?? null,
        regionId: body.regionId ?? null,
        cityId: body.cityId ?? null,
        supportedEngagementModels: body.supportedEngagementModels
          ? JSON.stringify(body.supportedEngagementModels)
          : null,
        certificationsText: body.certificationsText?.trim() ?? null,
        availabilityStatus: body.availabilityStatus ?? ProfileAvailabilityStatus.AVAILABLE,
        rating: body.rating ?? null,
      },
      create: {
        userId: user.sub,
        profileType,
        displayName: body.displayName.trim(),
        companyName: body.companyName?.trim() ?? null,
        summary: body.summary?.trim() ?? null,
        description: body.description?.trim() ?? null,
        countryId: body.countryId ?? null,
        regionId: body.regionId ?? null,
        cityId: body.cityId ?? null,
        supportedEngagementModels: body.supportedEngagementModels
          ? JSON.stringify(body.supportedEngagementModels)
          : JSON.stringify(['B2B']),
        certificationsText: body.certificationsText?.trim() ?? null,
        availabilityStatus: body.availabilityStatus ?? ProfileAvailabilityStatus.AVAILABLE,
        rating: body.rating ?? null,
      },
    });

    await this.syncProfileRelations(profile.id, body, profileType);

    const updatedProfile = await this.prisma.profile.findUnique({
      where: {
        id: profile.id,
      },
      include: this.profileInclude,
    });

    if (!updatedProfile) {
      throw new NotFoundException('Profile not found after update');
    }

    return this.toProfileResponse(updatedProfile);
  }

  async listDocuments(profileId: string, user: AuthenticatedUser) {
    const profile = await this.getProfileForRead(profileId, user);
    const documents = await this.prisma.profileDocument.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
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

    const document = await this.prisma.profileDocument.create({
      data: {
        profileId: profile.id,
        uploadedById: user.sub,
        type: body.type ?? this.inferDocumentType(file),
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storageProvider: 'local',
        storageKey: relativeStorageKey,
        extractionStatus: extractionStatuses.NOT_REQUESTED,
      },
    });

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
      where: {
        id: document.id,
      },
    });

    if (document.storageProvider === 'local') {
      await rm(this.resolveStoragePath(document.storageKey), { force: true });
    }

    return { success: true };
  }

  async listWorkers(user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    const workers = await this.prisma.profileWorker.findMany({
      where: {
        profileId: profile.id,
      },
      include: this.workerInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return Promise.all(workers.map((worker) => this.toWorkerResponse(worker)));
  }

  async createWorker(body: CreateProfileWorkerDto, user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    this.assertWorkerProfileType(profile.profileType);

    const worker = await this.prisma.profileWorker.create({
      data: {
        profileId: profile.id,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: this.normalizeNullableString(body.email),
        phone: this.normalizeNullableString(body.phone),
        roleTitle: body.roleTitle.trim(),
        employmentType: body.employmentType ?? WorkerEmploymentType.EMPLOYEE,
        status: WorkerStatus.ACTIVE,
      },
      include: this.workerInclude,
    });

    return this.toWorkerResponse(worker);
  }

  async getWorker(workerId: string, user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    const worker = await this.getWorkerForProfile(profile.id, workerId);
    return this.toWorkerResponse(worker);
  }

  async updateWorker(workerId: string, body: UpdateProfileWorkerDto, user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    const existing = await this.getWorkerForProfile(profile.id, workerId);

    const worker = await this.prisma.profileWorker.update({
      where: {
        id: existing.id,
      },
      data: {
        firstName: body.firstName !== undefined ? body.firstName.trim() : undefined,
        lastName: body.lastName !== undefined ? body.lastName.trim() : undefined,
        email: body.email !== undefined ? this.normalizeNullableString(body.email) : undefined,
        phone: body.phone !== undefined ? this.normalizeNullableString(body.phone) : undefined,
        roleTitle: body.roleTitle !== undefined ? body.roleTitle.trim() : undefined,
        employmentType: body.employmentType ?? undefined,
        status: body.status ?? undefined,
      },
      include: this.workerInclude,
    });

    return this.toWorkerResponse(worker);
  }

  async removeWorker(workerId: string, user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    const worker = await this.getWorkerForProfile(profile.id, workerId);

    await this.prisma.profileWorker.delete({
      where: {
        id: worker.id,
      },
    });

    return { success: true };
  }

  async listWorkerDocuments(workerId: string, user: AuthenticatedUser) {
    const worker = await this.getManagedWorker(workerId, user);
    const documents = await this.prisma.workerDocument.findMany({
      where: {
        workerId: worker.id,
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });

    return documents.map((document) => this.toWorkerDocumentResponse(document));
  }

  async createWorkerDocument(
    workerId: string,
    body: CreateWorkerDocumentDto,
    user: AuthenticatedUser,
  ) {
    const worker = await this.getManagedWorker(workerId, user);
    const document = await this.prisma.workerDocument.create({
      data: {
        workerId: worker.id,
        type: body.type,
        title: body.title.trim(),
        issuer: this.normalizeNullableString(body.issuer),
        issuedAt: this.toDate(body.issuedAt) ?? null,
        expiresAt: this.toDate(body.expiresAt) ?? null,
        status: body.status ?? ComplianceDocumentStatus.PENDING,
        fileName: this.normalizeNullableString(body.fileName),
        mimeType: this.normalizeNullableString(body.mimeType),
        sizeBytes: body.sizeBytes ?? null,
        storageProvider: this.normalizeNullableString(body.storageProvider),
        storageKey: this.normalizeNullableString(body.storageKey),
        medicalCategory:
          body.type === WorkerDocumentType.MEDICAL ? body.medicalCategory ?? null : null,
      },
    });

    return this.toWorkerDocumentResponse(document);
  }

  async updateWorkerDocument(
    workerId: string,
    documentId: string,
    body: UpdateWorkerDocumentDto,
    user: AuthenticatedUser,
  ) {
    const worker = await this.getManagedWorker(workerId, user);
    const existing = await this.prisma.workerDocument.findFirst({
      where: {
        id: documentId,
        workerId: worker.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Worker document not found');
    }

    const document = await this.prisma.workerDocument.update({
      where: {
        id: existing.id,
      },
      data: {
        type: body.type ?? undefined,
        title: body.title !== undefined ? body.title.trim() : undefined,
        issuer: body.issuer !== undefined ? this.normalizeNullableString(body.issuer) : undefined,
        issuedAt: body.issuedAt !== undefined ? this.toDate(body.issuedAt) ?? null : undefined,
        expiresAt:
          body.expiresAt !== undefined ? this.toDate(body.expiresAt) ?? null : undefined,
        status: body.status ?? undefined,
        fileName:
          body.fileName !== undefined ? this.normalizeNullableString(body.fileName) : undefined,
        mimeType:
          body.mimeType !== undefined ? this.normalizeNullableString(body.mimeType) : undefined,
        sizeBytes: body.sizeBytes !== undefined ? body.sizeBytes ?? null : undefined,
        storageProvider:
          body.storageProvider !== undefined
            ? this.normalizeNullableString(body.storageProvider)
            : undefined,
        storageKey:
          body.storageKey !== undefined ? this.normalizeNullableString(body.storageKey) : undefined,
        medicalCategory:
          body.medicalCategory !== undefined
            ? body.type === WorkerDocumentType.MEDICAL || existing.type === WorkerDocumentType.MEDICAL
              ? body.medicalCategory ?? null
              : null
            : undefined,
      },
    });

    return this.toWorkerDocumentResponse(document);
  }

  async listWorkerSkills(workerId: string, user: AuthenticatedUser) {
    const worker = await this.getManagedWorker(workerId, user);
    const skills = await this.prisma.workerSkill.findMany({
      where: {
        workerId: worker.id,
      },
      include: {
        escoSkill: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return skills.map((skill) => this.toWorkerSkillResponse(skill));
  }

  async createWorkerSkill(workerId: string, body: CreateWorkerSkillDto, user: AuthenticatedUser) {
    const worker = await this.getManagedWorker(workerId, user);
    const skill = await this.prisma.workerSkill.create({
      data: {
        workerId: worker.id,
        escoSkillId: body.escoSkillId ?? null,
        title: body.title.trim(),
        level: this.normalizeNullableString(body.level),
      },
      include: {
        escoSkill: true,
      },
    });

    return this.toWorkerSkillResponse(skill);
  }

  async removeWorkerSkill(workerId: string, skillId: string, user: AuthenticatedUser) {
    const worker = await this.getManagedWorker(workerId, user);
    const skill = await this.prisma.workerSkill.findFirst({
      where: {
        id: skillId,
        workerId: worker.id,
      },
    });

    if (!skill) {
      throw new NotFoundException('Worker skill not found');
    }

    await this.prisma.workerSkill.delete({
      where: {
        id: skill.id,
      },
    });

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

  private async getProfileForRead(profileId: string, user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (user.role !== 'ADMIN' && profile.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    return profile;
  }

  private async getProfileForWrite(profileId: string, user: AuthenticatedUser) {
    return this.getProfileForRead(profileId, user);
  }

  private async getCurrentManagedProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for the current user');
    }

    return profile;
  }

  private async getDocumentForRead(
    profileId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    await this.getProfileForRead(profileId, user);

    const document = await this.prisma.profileDocument.findFirst({
      where: {
        id: documentId,
        profileId,
      },
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

  private async getManagedWorker(workerId: string, user: AuthenticatedUser) {
    const profile = await this.getCurrentManagedProfile(user);
    return this.getWorkerForProfile(profile.id, workerId);
  }

  private async getWorkerForProfile(profileId: string, workerId: string) {
    const worker = await this.prisma.profileWorker.findFirst({
      where: {
        id: workerId,
        profileId,
      },
      include: this.workerInclude,
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  private toProfileResponse(profile: any) {
    return {
      id: profile.id,
      userId: profile.userId,
      profileType: profile.profileType,
      displayName: profile.displayName,
      companyName: profile.companyName,
      description: profile.description,
      summary: profile.summary,
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
      documents: profile.documents.map((document: any) => this.toProfileDocumentResponse(document)),
      counts: {
        documents: profile.documents.length,
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
    };
  }

  private async toWorkerResponse(worker: any) {
    const eligibility = await this.complianceEligibilityService.evaluateWorkerForProfileByIds(
      worker.profileId,
      worker.id,
    );

    return {
      id: worker.id,
      profileId: worker.profileId,
      userId: worker.userId,
      firstName: worker.firstName,
      lastName: worker.lastName,
      fullName: `${worker.firstName} ${worker.lastName}`.trim(),
      email: worker.email,
      phone: worker.phone,
      roleTitle: worker.roleTitle,
      employmentType: worker.employmentType,
      status: worker.status,
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt,
      documents: worker.documents.map((document: any) => this.toWorkerDocumentResponse(document)),
      skills: worker.skills.map((skill: any) => this.toWorkerSkillResponse(skill)),
      counts: {
        documents: worker.documents.length,
        skills: worker.skills.length,
        assignments: worker.assignments.length,
      },
      eligibility,
    };
  }

  private toWorkerDocumentResponse(document: any) {
    return {
      id: document.id,
      workerId: document.workerId,
      type: document.type,
      title: document.title,
      issuer: document.issuer,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
      status: document.status,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      storageProvider: document.storageProvider,
      storageKey: document.storageKey,
      medicalCategory: document.medicalCategory,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private toWorkerSkillResponse(skill: any) {
    return {
      id: skill.id,
      workerId: skill.workerId,
      escoSkillId: skill.escoSkillId,
      title: skill.title,
      level: skill.level,
      createdAt: skill.createdAt,
      escoSkill: skill.escoSkill
        ? {
            id: skill.escoSkill.id,
            code: skill.escoSkill.code,
            title: skill.escoSkill.title,
            description: skill.escoSkill.description,
          }
        : null,
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

  private toDate(value?: string | null) {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private defaultProfileType(role: string) {
    if (role === 'GENERAL_CONTRACTOR') {
      return ProfileType.GENERAL_CONTRACTOR;
    }

    return role === 'PROFESSIONAL' ? ProfileType.PROFESSIONAL : ProfileType.CONTRACTOR;
  }

  private usesProfessionalWorkspace(profileType: ProfileType) {
    return (
      profileType === ProfileType.PROFESSIONAL ||
      profileType === ProfileType.SUPERVISOR ||
      profileType === ProfileType.SPECIALIST ||
      profileType === ProfileType.CLINIC_DOCTOR ||
      profileType === ProfileType.TRAINER_EVALUATOR
    );
  }

  private assertWorkerProfileType(profileType: ProfileType) {
    if (
      profileType !== ProfileType.CONTRACTOR &&
      profileType !== ProfileType.SUBCONTRACTOR &&
      profileType !== ProfileType.GENERAL_CONTRACTOR
    ) {
      throw new ForbiddenException(
        'Only contractor-oriented profiles can manage worker rosters in this phase',
      );
    }
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

  private inferDocumentType(file: UploadedProfileFile) {
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

  private readonly workerInclude = {
    documents: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    skills: {
      include: {
        escoSkill: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    assignments: {
      select: {
        id: true,
      },
    },
  } as const;
}
