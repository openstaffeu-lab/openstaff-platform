import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationCategory,
  Prisma,
  VerificationAssetType,
  VerificationCaseStatus,
  VerificationCaseSubjectType,
  VerificationDecisionType,
  VerificationStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewVerificationCaseDto } from './dto/review-verification-case.dto';
import { SubmitVerificationCaseDto } from './dto/submit-verification-case.dto';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getVerificationMe(userId: string) {
    const context = await this.getVerificationContext(userId);
    return {
      identityProfile: this.toIdentitySummary(context.identityProfile),
      companyProfile: context.companyProfile
        ? this.toCompanySummary(context.companyProfile)
        : null,
      identityCase: context.identityCase
        ? this.toCaseSummary(context.identityCase)
        : null,
      companyCase: context.companyCase
        ? this.toCaseSummary(context.companyCase)
        : null,
      availableEvidence: {
        profileDocuments: context.profileDocuments.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          createdAt: item.createdAt,
        })),
        actorDocuments: context.actorDocuments.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          verifiedAt: item.verifiedAt,
          expiresAt: item.expiresAt,
        })),
        actorCertifications: context.actorCertifications.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          verifiedAt: item.verifiedAt,
          expiresAt: item.expiresAt,
        })),
        medicalFitnessCertificates: context.medicalFitnessCertificates.map(
          (item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            status: item.status,
            fitnessDecision: item.fitnessDecision,
            verifiedAt: item.verifiedAt,
            expiresAt: item.expiresAt,
          }),
        ),
      },
    };
  }

  async submitIdentityCase(userId: string, body: SubmitVerificationCaseDto) {
    const context = await this.getVerificationContext(userId);
    if (!context.identityProfile) {
      throw new NotFoundException('Identity profile not found');
    }
    const identityProfile = context.identityProfile;

    const latestCase = context.identityCase;
    if (
      latestCase &&
      (latestCase.status === VerificationCaseStatus.SUBMITTED ||
        latestCase.status === VerificationCaseStatus.IN_REVIEW)
    ) {
      throw new BadRequestException(
        'Identity verification is already under review',
      );
    }

    const links = this.buildDocumentLinks(body);
    const linkedAssets = await this.validateLinkedAssets(
      userId,
      links,
      context.profileId,
    );

    const before = latestCase ? this.toCaseSummary(latestCase) : null;
    const previousStatus = latestCase?.status;
    const now = new Date();

    const savedCase = await this.prisma.$transaction(async (tx) => {
      const verificationCase = latestCase
        ? await tx.verificationCase.update({
            where: { id: latestCase.id },
            data: {
              status: VerificationCaseStatus.SUBMITTED,
              submittedAt: now,
              reviewedAt: null,
              reviewedById: null,
              latestNote: this.normalizeNullableString(body.note),
            },
          })
        : await tx.verificationCase.create({
            data: {
              userId,
              subjectType: VerificationCaseSubjectType.IDENTITY_PROFILE,
              identityProfileId: identityProfile.id,
              status: VerificationCaseStatus.SUBMITTED,
              submittedAt: now,
              latestNote: this.normalizeNullableString(body.note),
            },
          });

      await tx.verificationCaseDocument.deleteMany({
        where: { verificationCaseId: verificationCase.id },
      });

      if (linkedAssets.length) {
        await tx.verificationCaseDocument.createMany({
          data: linkedAssets.map((item) => ({
            verificationCaseId: verificationCase.id,
            assetType: item.assetType,
            profileDocumentId: item.profileDocumentId,
            actorDocumentId: item.actorDocumentId,
            actorCertificationId: item.actorCertificationId,
            medicalFitnessCertificateId: item.medicalFitnessCertificateId,
            label: item.label,
          })),
        });
      }

      await tx.verificationDecision.create({
        data: {
          verificationCaseId: verificationCase.id,
          actorUserId: userId,
          decision: VerificationDecisionType.SUBMIT,
          fromStatus: previousStatus,
          toStatus: VerificationCaseStatus.SUBMITTED,
          note: this.normalizeNullableString(body.note),
        },
      });

      await tx.identityProfile.update({
        where: { id: identityProfile.id },
        data: { verificationStatus: VerificationStatus.PENDING },
      });

      return tx.verificationCase.findUniqueOrThrow({
        where: { id: verificationCase.id },
        include: this.caseInclude,
      });
    });

    const after = this.toCaseSummary(savedCase);
    await this.auditService.log({
      actorUserId: userId,
      entityType: 'VERIFICATION_CASE',
      entityId: savedCase.id,
      action: 'SUBMIT_IDENTITY',
      before,
      after,
    });

    await this.notificationService.emitEvent({
      key: `verification:submitted:identity:${savedCase.id}`,
      eventType: 'VERIFICATION_SUBMITTED',
      sourceType: 'VERIFICATION_CASE',
      sourceId: savedCase.id,
      userId,
      category: NotificationCategory.VERIFICATION,
      title: 'Identity verification submitted',
      message: 'Your identity verification case was submitted for review.',
      relatedEntityType: 'VerificationCase',
      relatedEntityId: savedCase.id,
      metadata: {
        subjectType: VerificationCaseSubjectType.IDENTITY_PROFILE,
      },
    });

    return {
      identityProfile: this.toIdentitySummary({
        ...identityProfile,
        verificationStatus: VerificationStatus.PENDING,
      }),
      case: after,
    };
  }

  async submitCompanyCase(userId: string, body: SubmitVerificationCaseDto) {
    const context = await this.getVerificationContext(userId);
    if (!context.companyProfile) {
      throw new NotFoundException('Company profile not found');
    }
    const companyProfile = context.companyProfile;

    const latestCase = context.companyCase;
    if (
      latestCase &&
      (latestCase.status === VerificationCaseStatus.SUBMITTED ||
        latestCase.status === VerificationCaseStatus.IN_REVIEW)
    ) {
      throw new BadRequestException(
        'Company verification is already under review',
      );
    }

    const links = this.buildDocumentLinks(body);
    const linkedAssets = await this.validateLinkedAssets(
      userId,
      links,
      context.profileId,
    );

    const before = latestCase ? this.toCaseSummary(latestCase) : null;
    const previousStatus = latestCase?.status;
    const now = new Date();

    const savedCase = await this.prisma.$transaction(async (tx) => {
      const verificationCase = latestCase
        ? await tx.verificationCase.update({
            where: { id: latestCase.id },
            data: {
              status: VerificationCaseStatus.SUBMITTED,
              submittedAt: now,
              reviewedAt: null,
              reviewedById: null,
              latestNote: this.normalizeNullableString(body.note),
            },
          })
        : await tx.verificationCase.create({
            data: {
              userId,
              subjectType: VerificationCaseSubjectType.COMPANY_PROFILE,
              companyProfileId: companyProfile.id,
              status: VerificationCaseStatus.SUBMITTED,
              submittedAt: now,
              latestNote: this.normalizeNullableString(body.note),
            },
          });

      await tx.verificationCaseDocument.deleteMany({
        where: { verificationCaseId: verificationCase.id },
      });

      if (linkedAssets.length) {
        await tx.verificationCaseDocument.createMany({
          data: linkedAssets.map((item) => ({
            verificationCaseId: verificationCase.id,
            assetType: item.assetType,
            profileDocumentId: item.profileDocumentId,
            actorDocumentId: item.actorDocumentId,
            actorCertificationId: item.actorCertificationId,
            medicalFitnessCertificateId: item.medicalFitnessCertificateId,
            label: item.label,
          })),
        });
      }

      await tx.verificationDecision.create({
        data: {
          verificationCaseId: verificationCase.id,
          actorUserId: userId,
          decision: VerificationDecisionType.SUBMIT,
          fromStatus: previousStatus,
          toStatus: VerificationCaseStatus.SUBMITTED,
          note: this.normalizeNullableString(body.note),
        },
      });

      await tx.identityCompanyProfile.update({
        where: { id: companyProfile.id },
        data: { verificationStatus: VerificationStatus.PENDING },
      });

      return tx.verificationCase.findUniqueOrThrow({
        where: { id: verificationCase.id },
        include: this.caseInclude,
      });
    });

    const after = this.toCaseSummary(savedCase);
    await this.auditService.log({
      actorUserId: userId,
      entityType: 'VERIFICATION_CASE',
      entityId: savedCase.id,
      action: 'SUBMIT_COMPANY',
      before,
      after,
    });

    await this.notificationService.emitEvent({
      key: `verification:submitted:company:${savedCase.id}`,
      eventType: 'VERIFICATION_SUBMITTED',
      sourceType: 'VERIFICATION_CASE',
      sourceId: savedCase.id,
      userId,
      category: NotificationCategory.VERIFICATION,
      title: 'Company verification submitted',
      message: 'Your company verification case was submitted for review.',
      relatedEntityType: 'VerificationCase',
      relatedEntityId: savedCase.id,
      metadata: {
        subjectType: VerificationCaseSubjectType.COMPANY_PROFILE,
      },
    });

    return {
      companyProfile: this.toCompanySummary({
        ...companyProfile,
        verificationStatus: VerificationStatus.PENDING,
      }),
      case: after,
    };
  }

  async listAdminCases(filters?: {
    q?: string;
    status?: VerificationCaseStatus;
    subjectType?: VerificationCaseSubjectType;
  }) {
    const where: Prisma.VerificationCaseWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.subjectType ? { subjectType: filters.subjectType } : {}),
    };

    if (filters?.q?.trim()) {
      const query = filters.q.trim();
      where.OR = [
        { user: { email: { contains: query, mode: 'insensitive' } } },
        {
          identityProfile: {
            displayName: { contains: query, mode: 'insensitive' },
          },
        },
        {
          companyProfile: {
            companyName: { contains: query, mode: 'insensitive' },
          },
        },
      ];
    }

    const items = await this.prisma.verificationCase.findMany({
      where,
      include: this.caseInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((item) => this.toAdminCaseSummary(item));
  }

  async getAdminCase(id: string) {
    const verificationCase = await this.prisma.verificationCase.findUnique({
      where: { id },
      include: this.caseInclude,
    });

    if (!verificationCase) {
      throw new NotFoundException('Verification case not found');
    }

    return this.toAdminCaseDetail(verificationCase);
  }

  async reviewCase(
    id: string,
    actorUserId: string,
    body: ReviewVerificationCaseDto,
  ) {
    const existing = await this.prisma.verificationCase.findUnique({
      where: { id },
      include: this.caseInclude,
    });

    if (!existing) {
      throw new NotFoundException('Verification case not found');
    }

    if (existing.status === VerificationCaseStatus.DRAFT) {
      throw new BadRequestException(
        'Draft verification cases cannot be reviewed',
      );
    }

    const targetStatus = this.resolveTargetStatus(body.decision);
    const targetVerificationStatus =
      body.decision === VerificationDecisionType.APPROVE
        ? VerificationStatus.VERIFIED
        : body.decision === VerificationDecisionType.REJECT
          ? VerificationStatus.REJECTED
          : VerificationStatus.PENDING;

    const now = new Date();
    const before = this.toAdminCaseDetail(existing);

    const saved = await this.prisma.$transaction(async (tx) => {
      const updatedCase = await tx.verificationCase.update({
        where: { id },
        data: {
          status: targetStatus,
          reviewedAt: now,
          reviewedById: actorUserId,
          latestNote: this.normalizeNullableString(body.note),
        },
      });

      await tx.verificationDecision.create({
        data: {
          verificationCaseId: id,
          actorUserId,
          decision: body.decision,
          fromStatus: existing.status,
          toStatus: targetStatus,
          note: this.normalizeNullableString(body.note),
        },
      });

      if (existing.identityProfileId) {
        await tx.identityProfile.update({
          where: { id: existing.identityProfileId },
          data: { verificationStatus: targetVerificationStatus },
        });
      }

      if (existing.companyProfileId) {
        await tx.identityCompanyProfile.update({
          where: { id: existing.companyProfileId },
          data: { verificationStatus: targetVerificationStatus },
        });
      }

      return tx.verificationCase.findUniqueOrThrow({
        where: { id: updatedCase.id },
        include: this.caseInclude,
      });
    });

    const after = this.toAdminCaseDetail(saved);
    await this.auditService.log({
      actorUserId,
      entityType: 'VERIFICATION_CASE',
      entityId: id,
      action: `REVIEW_${body.decision}`,
      before,
      after,
    });

    await this.notificationService.emitEvent({
      key: `verification:reviewed:${saved.id}:${body.decision}`,
      eventType:
        body.decision === VerificationDecisionType.APPROVE
          ? 'VERIFICATION_APPROVED'
          : body.decision === VerificationDecisionType.REJECT
            ? 'VERIFICATION_REJECTED'
            : 'VERIFICATION_REVIEWED',
      sourceType: 'VERIFICATION_CASE',
      sourceId: saved.id,
      userId: saved.userId,
      category: NotificationCategory.VERIFICATION,
      title:
        body.decision === VerificationDecisionType.APPROVE
          ? 'Verification approved'
          : body.decision === VerificationDecisionType.REJECT
            ? 'Verification rejected'
            : 'Verification updated',
      message:
        body.decision === VerificationDecisionType.APPROVE
          ? 'Your verification was approved.'
          : body.decision === VerificationDecisionType.REJECT
            ? 'Your verification was rejected. Review the latest note for next steps.'
            : 'Your verification case status was updated.',
      relatedEntityType: 'VerificationCase',
      relatedEntityId: saved.id,
      metadata: {
        decision: body.decision,
        status: saved.status,
        reviewedByUserId: actorUserId,
      },
    });

    return after;
  }

  private async getVerificationContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identityProfile: true,
        identityCompanyProfiles: {
          orderBy: { createdAt: 'asc' },
        },
        profile: {
          include: {
            documents: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        actorDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        actorCertifications: {
          orderBy: { createdAt: 'desc' },
        },
        medicalFitnessCertificates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const identityProfile = user.identityProfile;
    const companyProfile = user.identityCompanyProfiles[0] ?? null;

    const [identityCase, companyCase] = await Promise.all([
      identityProfile
        ? this.prisma.verificationCase.findFirst({
            where: { identityProfileId: identityProfile.id },
            include: this.caseInclude,
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          })
        : null,
      companyProfile
        ? this.prisma.verificationCase.findFirst({
            where: { companyProfileId: companyProfile.id },
            include: this.caseInclude,
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          })
        : null,
    ]);

    return {
      user,
      profileId: user.profile?.id ?? null,
      identityProfile,
      companyProfile,
      profileDocuments: user.profile?.documents ?? [],
      actorDocuments: user.actorDocuments,
      actorCertifications: user.actorCertifications,
      medicalFitnessCertificates: user.medicalFitnessCertificates,
      identityCase,
      companyCase,
    };
  }

  private buildDocumentLinks(body: SubmitVerificationCaseDto) {
    return [
      ...(body.profileDocumentIds ?? []).map((id) => ({
        assetType: VerificationAssetType.PROFILE_DOCUMENT,
        profileDocumentId: id,
      })),
      ...(body.actorDocumentIds ?? []).map((id) => ({
        assetType: VerificationAssetType.ACTOR_DOCUMENT,
        actorDocumentId: id,
      })),
      ...(body.actorCertificationIds ?? []).map((id) => ({
        assetType: VerificationAssetType.ACTOR_CERTIFICATION,
        actorCertificationId: id,
      })),
      ...(body.medicalFitnessCertificateIds ?? []).map((id) => ({
        assetType: VerificationAssetType.MEDICAL_FITNESS_CERTIFICATE,
        medicalFitnessCertificateId: id,
      })),
    ];
  }

  private async validateLinkedAssets(
    userId: string,
    links: Array<{
      assetType: VerificationAssetType;
      profileDocumentId?: string;
      actorDocumentId?: string;
      actorCertificationId?: string;
      medicalFitnessCertificateId?: string;
    }>,
    profileId: string | null,
  ) {
    const validated: Array<{
      assetType: VerificationAssetType;
      profileDocumentId?: string;
      actorDocumentId?: string;
      actorCertificationId?: string;
      medicalFitnessCertificateId?: string;
      label?: string;
    }> = [];

    for (const link of links) {
      if (link.profileDocumentId) {
        if (!profileId) {
          throw new BadRequestException(
            'Profile document linkage requires a profile',
          );
        }
        const record = await this.prisma.profileDocument.findFirst({
          where: { id: link.profileDocumentId, profileId },
        });
        if (!record) {
          throw new BadRequestException('Invalid profile document reference');
        }
        validated.push({
          ...link,
          label: record.title,
        });
        continue;
      }

      if (link.actorDocumentId) {
        const record = await this.prisma.actorDocument.findFirst({
          where: { id: link.actorDocumentId, userId },
        });
        if (!record) {
          throw new BadRequestException('Invalid actor document reference');
        }
        validated.push({
          ...link,
          label: record.title,
        });
        continue;
      }

      if (link.actorCertificationId) {
        const record = await this.prisma.actorCertification.findFirst({
          where: { id: link.actorCertificationId, userId },
        });
        if (!record) {
          throw new BadRequestException(
            'Invalid actor certification reference',
          );
        }
        validated.push({
          ...link,
          label: record.title,
        });
        continue;
      }

      if (link.medicalFitnessCertificateId) {
        const record = await this.prisma.medicalFitnessCertificate.findFirst({
          where: { id: link.medicalFitnessCertificateId, userId },
        });
        if (!record) {
          throw new BadRequestException(
            'Invalid medical fitness certificate reference',
          );
        }
        validated.push({
          ...link,
          label: record.title,
        });
      }
    }

    return validated;
  }

  private resolveTargetStatus(decision: VerificationDecisionType) {
    switch (decision) {
      case VerificationDecisionType.APPROVE:
        return VerificationCaseStatus.APPROVED;
      case VerificationDecisionType.REJECT:
        return VerificationCaseStatus.REJECTED;
      case VerificationDecisionType.REQUEST_INFO:
        return VerificationCaseStatus.NEEDS_INFO;
      case VerificationDecisionType.REOPEN:
        return VerificationCaseStatus.IN_REVIEW;
      default:
        throw new BadRequestException('Unsupported review decision');
    }
  }

  private toIdentitySummary(profile: any) {
    return {
      id: profile.id,
      publicSlug: profile.publicSlug,
      displayName: profile.displayName,
      verificationStatus: profile.verificationStatus,
      profileCompletionPercent: profile.profileCompletionPercent,
      onboardingCompletedAt: profile.onboardingCompletedAt,
    };
  }

  private toCompanySummary(profile: any) {
    return {
      id: profile.id,
      companyName: profile.companyName,
      legalName: profile.legalName,
      country: profile.country,
      city: profile.city,
      verificationStatus: profile.verificationStatus,
      onboardingCompletedAt: profile.onboardingCompletedAt,
    };
  }

  private toCaseSummary(item: any) {
    return {
      id: item.id,
      subjectType: item.subjectType,
      status: item.status,
      submittedAt: item.submittedAt,
      reviewedAt: item.reviewedAt,
      latestNote: item.latestNote,
      reviewedBy: item.reviewedBy
        ? {
            id: item.reviewedBy.id,
            email: item.reviewedBy.email,
            role: item.reviewedBy.role,
          }
        : null,
      documents: item.documentLinks.map((link: any) =>
        this.toDocumentLinkSummary(link),
      ),
      decisions: item.decisions.map((decision: any) => ({
        id: decision.id,
        decision: decision.decision,
        fromStatus: decision.fromStatus,
        toStatus: decision.toStatus,
        note: decision.note,
        createdAt: decision.createdAt,
        actorUser: decision.actorUser
          ? {
              id: decision.actorUser.id,
              email: decision.actorUser.email,
              role: decision.actorUser.role,
            }
          : null,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toAdminCaseSummary(item: any) {
    return {
      ...this.toCaseSummary(item),
      user: {
        id: item.user.id,
        email: item.user.email,
        role: item.user.role,
      },
      identityProfile: item.identityProfile
        ? this.toIdentitySummary(item.identityProfile)
        : null,
      companyProfile: item.companyProfile
        ? this.toCompanySummary(item.companyProfile)
        : null,
    };
  }

  private toAdminCaseDetail(item: any) {
    return this.toAdminCaseSummary(item);
  }

  private toDocumentLinkSummary(link: any) {
    return {
      id: link.id,
      assetType: link.assetType,
      label: link.label,
      profileDocument: link.profileDocument
        ? {
            id: link.profileDocument.id,
            title: link.profileDocument.title,
            type: link.profileDocument.type,
            mimeType: link.profileDocument.mimeType,
          }
        : null,
      actorDocument: link.actorDocument
        ? {
            id: link.actorDocument.id,
            title: link.actorDocument.title,
            type: link.actorDocument.type,
            status: link.actorDocument.status,
            verifiedAt: link.actorDocument.verifiedAt,
          }
        : null,
      actorCertification: link.actorCertification
        ? {
            id: link.actorCertification.id,
            title: link.actorCertification.title,
            type: link.actorCertification.type,
            status: link.actorCertification.status,
            verifiedAt: link.actorCertification.verifiedAt,
          }
        : null,
      medicalFitnessCertificate: link.medicalFitnessCertificate
        ? {
            id: link.medicalFitnessCertificate.id,
            title: link.medicalFitnessCertificate.title,
            category: link.medicalFitnessCertificate.category,
            status: link.medicalFitnessCertificate.status,
            fitnessDecision: link.medicalFitnessCertificate.fitnessDecision,
            verifiedAt: link.medicalFitnessCertificate.verifiedAt,
          }
        : null,
    };
  }

  private normalizeNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private readonly caseInclude = {
    user: true,
    identityProfile: true,
    companyProfile: true,
    reviewedBy: true,
    documentLinks: {
      include: {
        profileDocument: true,
        actorDocument: true,
        actorCertification: true,
        medicalFitnessCertificate: true,
      },
      orderBy: { createdAt: 'asc' as const },
    },
    decisions: {
      include: {
        actorUser: true,
      },
      orderBy: { createdAt: 'asc' as const },
    },
  } satisfies Prisma.VerificationCaseInclude;
}
