import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OnboardingStatus,
  ProfileType,
  VerificationCaseStatus,
  VerificationCaseSubjectType,
  VerificationStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import { UpsertCompanyProfileDto } from './dto/upsert-company-profile.dto';
import { UpsertIdentityProfileDto } from './dto/upsert-identity-profile.dto';

type OnboardingContext = any;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOnboardingMe(userId: string) {
    const context = await this.ensureOnboardingContext(userId);
    return this.toOnboardingResponse(context);
  }

  async getOnboardingProgress(userId: string) {
    const context = await this.ensureOnboardingContext(userId);
    return {
      currentStep: context.onboardingSession.currentStep,
      completedSteps: this.parseCompletedSteps(context.onboardingSession.completedSteps),
      completionPercent: context.onboardingSession.completionPercent,
      status: context.onboardingSession.status,
      onboardingCompletedAt: context.identityProfile.onboardingCompletedAt,
    };
  }

  async upsertIdentityProfile(userId: string, body: UpsertIdentityProfileDto) {
    const context = await this.ensureOnboardingContext(userId);
    const before = this.toOnboardingResponse(context);
    const displayName = this.resolveDisplayName(body, context);
    const publicSlug = await this.resolveUniquePublicSlug(
      body.publicSlug ?? displayName,
      context.identityProfile.id,
    );

    await this.prisma.identityProfile.update({
      where: { userId },
      data: {
        publicSlug,
        firstName: this.normalizeNullableString(body.firstName),
        lastName: this.normalizeNullableString(body.lastName),
        displayName,
        avatarUrl: this.normalizeNullableString(body.avatarUrl),
        bio: this.normalizeNullableString(body.bio),
        language: this.normalizeNullableString(body.language),
        timezone: this.normalizeNullableString(body.timezone),
        country: this.normalizeNullableString(body.country),
        city: this.normalizeNullableString(body.city),
        phone: this.normalizeNullableString(body.phone),
        website: this.normalizeNullableString(body.website),
        linkedinUrl: this.normalizeNullableString(body.linkedinUrl),
        githubUrl: this.normalizeNullableString(body.githubUrl),
        portfolioUrl: this.normalizeNullableString(body.portfolioUrl),
      },
    });

    await this.syncLegacyProfileFromIdentity(userId, {
      displayName,
      bio: body.bio,
      phone: body.phone,
      website: body.website,
    });

    await this.bumpOnboardingStep(userId, 'identity');
    const afterContext = await this.recomputeAndReload(userId);
    const after = this.toOnboardingResponse(afterContext);
    await this.auditService.log({
      actorUserId: userId,
      entityType: 'IDENTITY_PROFILE',
      entityId: after.identityProfile.id,
      action: 'UPSERT',
      before,
      after,
    });
    return after;
  }

  async upsertCompanyProfile(userId: string, body: UpsertCompanyProfileDto) {
    const context = await this.ensureOnboardingContext(userId);
    const before = this.toOnboardingResponse(context);
    const existingCompany = context.identityCompanyProfiles[0] ?? null;

    if (!body.companyName.trim()) {
      throw new BadRequestException('companyName is required.');
    }

    if (existingCompany) {
      await this.prisma.identityCompanyProfile.update({
        where: { id: existingCompany.id },
        data: {
          companyName: body.companyName.trim(),
          legalName: this.normalizeNullableString(body.legalName),
          registrationNumber: this.normalizeNullableString(body.registrationNumber),
          vatId: this.normalizeNullableString(body.vatId),
          country: this.normalizeNullableString(body.country),
          city: this.normalizeNullableString(body.city),
          addressLine1: this.normalizeNullableString(body.addressLine1),
          addressLine2: this.normalizeNullableString(body.addressLine2),
          postalCode: this.normalizeNullableString(body.postalCode),
          website: this.normalizeNullableString(body.website),
          logoUrl: this.normalizeNullableString(body.logoUrl),
        },
      });
    } else {
      await this.prisma.identityCompanyProfile.create({
        data: {
          ownerUserId: userId,
          companyName: body.companyName.trim(),
          legalName: this.normalizeNullableString(body.legalName),
          registrationNumber: this.normalizeNullableString(body.registrationNumber),
          vatId: this.normalizeNullableString(body.vatId),
          country: this.normalizeNullableString(body.country),
          city: this.normalizeNullableString(body.city),
          addressLine1: this.normalizeNullableString(body.addressLine1),
          addressLine2: this.normalizeNullableString(body.addressLine2),
          postalCode: this.normalizeNullableString(body.postalCode),
          website: this.normalizeNullableString(body.website),
          logoUrl: this.normalizeNullableString(body.logoUrl),
        },
      });
    }

    await this.prisma.profile.updateMany({
      where: { userId },
      data: {
        companyName: body.companyName.trim(),
        websiteUrl: this.normalizeNullableString(body.website),
      },
    });

    await this.bumpOnboardingStep(userId, 'company');
    const afterContext = await this.recomputeAndReload(userId);
    const after = this.toOnboardingResponse(afterContext);
    await this.auditService.log({
      actorUserId: userId,
      entityType: 'IDENTITY_COMPANY_PROFILE',
      entityId: after.companyProfile?.id ?? after.identityProfile.id,
      action: 'UPSERT',
      before,
      after,
    });
    return after;
  }

  async updateOnboardingSteps(userId: string, body: UpdateOnboardingStepDto) {
    const context = await this.ensureOnboardingContext(userId);
    const before = this.toOnboardingResponse(context);
    const completedSteps = new Set(this.parseCompletedSteps(context.onboardingSession.completedSteps));

    if (body.completedStep?.trim()) {
      completedSteps.add(body.completedStep.trim());
    }

    for (const step of body.completedSteps ?? []) {
      const normalized = step.trim();
      if (normalized) {
        completedSteps.add(normalized);
      }
    }

    await this.prisma.onboardingSession.update({
      where: { userId },
      data: {
        currentStep: body.currentStep?.trim() || context.onboardingSession.currentStep,
        completedSteps: Array.from(completedSteps),
        ...(body.status ? { status: body.status } : {}),
        ...(body.completionPercent !== undefined
          ? { completionPercent: body.completionPercent }
          : {}),
      },
    });

    const afterContext = await this.recomputeAndReload(userId);
    const after = this.toOnboardingResponse(afterContext);
    await this.auditService.log({
      actorUserId: userId,
      entityType: 'ONBOARDING_SESSION',
      entityId: after.onboardingSession.id,
      action: 'UPDATE_STEPS',
      before,
      after,
    });
    return after;
  }

  async getPublicProfileBySlug(slug: string) {
    const profile = await this.prisma.identityProfile.findUnique({
      where: { publicSlug: slug },
      include: {
        user: {
          include: {
            identityCompanyProfiles: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const company = profile.user.identityCompanyProfiles[0] ?? null;
    const identityCase = await this.prisma.verificationCase.findFirst({
      where: {
        identityProfileId: profile.id,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return {
      slug: profile.publicSlug,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      language: profile.language,
      timezone: profile.timezone,
      country: profile.country,
      city: profile.city,
      links: {
        website: profile.website,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
      },
      companySummary: company
        ? {
            companyName: company.companyName,
            legalName: company.legalName,
            website: company.website,
            country: company.country,
            city: company.city,
            verificationStatus: company.verificationStatus,
          }
        : null,
      publicIndicators: {
        verificationStatus: profile.verificationStatus,
        onboardingCompleted: Boolean(profile.onboardingCompletedAt),
        profileCompletionPercent: profile.profileCompletionPercent,
        verificationCaseStatus: identityCase?.status ?? null,
      },
    };
  }

  async listAdminOnboardingSessions(filters?: {
    q?: string;
    onboardingStatus?: OnboardingStatus;
    verificationStatus?: VerificationStatus;
  }) {
    const sessions = await this.prisma.onboardingSession.findMany({
      include: {
        user: {
          include: {
            identityProfile: true,
            identityCompanyProfiles: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });

    const q = filters?.q?.trim().toLowerCase();

    return sessions
      .filter((session) => {
        const identity = session.user.identityProfile;
        const company = session.user.identityCompanyProfiles[0] ?? null;

        if (filters?.onboardingStatus && session.status !== filters.onboardingStatus) {
          return false;
        }

        if (filters?.verificationStatus) {
          const matchesIdentity =
            identity?.verificationStatus === filters.verificationStatus;
          const matchesCompany =
            company?.verificationStatus === filters.verificationStatus;

          if (!matchesIdentity && !matchesCompany) {
            return false;
          }
        }

        if (!q) {
          return true;
        }

        return [
          session.user.email,
          identity?.displayName ?? '',
          identity?.publicSlug ?? '',
          company?.companyName ?? '',
        ].some((value) => value.toLowerCase().includes(q));
      })
      .map((session) => this.toAdminSessionResponse(session));
  }

  private async ensureOnboardingContext(userId: string) {
    const existing = await this.loadOnboardingContext(userId);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const displayName =
      existing.identityProfile?.displayName ??
      existing.profile?.displayName ??
      existing.email.split('@')[0] ??
      'OpenStaff User';

    if (!existing.identityProfile) {
      await this.prisma.identityProfile.create({
        data: {
          userId,
          publicSlug: await this.resolveUniquePublicSlug(
            existing.profile?.slug ?? displayName,
          ),
          displayName,
          language: 'ro',
          timezone: 'Europe/Bucharest',
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      });
    }

    if (!existing.onboardingSession) {
      await this.prisma.onboardingSession.create({
        data: {
          userId,
          currentStep: 'welcome',
          completedSteps: [],
          status: OnboardingStatus.NOT_STARTED,
        },
      });
    }

    return this.recomputeAndReload(userId);
  }

  private async recomputeAndReload(userId: string) {
    await this.recomputeProfileCompletion(userId);
    const reloaded = await this.loadOnboardingContext(userId);

    if (!reloaded || !reloaded.identityProfile || !reloaded.onboardingSession) {
      throw new NotFoundException('Onboarding context not found');
    }

    return reloaded as NonNullable<OnboardingContext>;
  }

  private async recomputeProfileCompletion(userId: string) {
    const context = await this.loadOnboardingContext(userId);

    if (!context || !context.identityProfile || !context.onboardingSession) {
      return;
    }

    const identity = context.identityProfile;
    const company = context.identityCompanyProfiles[0] ?? null;
    const completedSteps = this.parseCompletedSteps(context.onboardingSession.completedSteps);
    const identityCase = (context.verificationCases ?? []).find(
      (item: any) => item.subjectType === VerificationCaseSubjectType.IDENTITY_PROFILE,
    );
    const companyCase = (context.verificationCases ?? []).find(
      (item: any) => item.subjectType === VerificationCaseSubjectType.COMPANY_PROFILE,
    );
    const linksCount = [
      identity.website,
      identity.linkedinUrl,
      identity.githubUrl,
      identity.portfolioUrl,
    ].filter(Boolean).length;

    let score = 0;
    if (identity.displayName?.trim()) score += 10;
    if (identity.avatarUrl?.trim()) score += 10;
    if (identity.bio?.trim()) score += 10;
    if (identity.phone?.trim()) score += 10;
    if (identity.country?.trim() || identity.city?.trim()) score += 10;
    if (identity.language?.trim()) score += 10;
    if (identity.timezone?.trim()) score += 10;
    if (linksCount > 0) score += 10;
    if (company) score += 10;
    if (identityCase) score += 5;
    if (companyCase) score += 5;
    if (completedSteps.length > 0) {
      score += Math.min(10, completedSteps.length * 3 + 1);
    }

    const completionPercent = Math.min(100, score);
    const nextStatus =
      context.onboardingSession.status === OnboardingStatus.SKIPPED
        ? OnboardingStatus.SKIPPED
        : completionPercent >= 80 && completedSteps.includes('completion')
          ? OnboardingStatus.COMPLETED
          : completionPercent > 0
            ? OnboardingStatus.IN_PROGRESS
            : OnboardingStatus.NOT_STARTED;

    await this.prisma.identityProfile.update({
      where: { userId },
      data: {
        profileCompletionPercent: completionPercent,
        onboardingCompletedAt:
          nextStatus === OnboardingStatus.COMPLETED ? new Date() : null,
      },
    });

    if (company) {
      await this.prisma.identityCompanyProfile.update({
        where: { id: company.id },
        data: {
          onboardingCompletedAt:
            nextStatus === OnboardingStatus.COMPLETED ? new Date() : null,
        },
      });
    }

    await this.prisma.onboardingSession.update({
      where: { userId },
      data: {
        completionPercent,
        status: nextStatus,
        completedAt: nextStatus === OnboardingStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  private async bumpOnboardingStep(userId: string, completedStep: string) {
    const session = await this.prisma.onboardingSession.findUnique({
      where: { userId },
      select: {
        currentStep: true,
        completedSteps: true,
      },
    });

    const completedSteps = new Set(this.parseCompletedSteps(session?.completedSteps ?? null));
    completedSteps.add(completedStep);

    await this.prisma.onboardingSession.update({
      where: { userId },
      data: {
        currentStep: completedStep,
        completedSteps: Array.from(completedSteps),
      },
    });
  }

  private async syncLegacyProfileFromIdentity(
    userId: string,
    input: {
      displayName: string;
      bio?: string;
      phone?: string;
      website?: string;
    },
  ) {
    await this.prisma.profile.updateMany({
      where: { userId },
      data: {
        displayName: input.displayName,
        summary: this.normalizeNullableString(input.bio),
        publicPhone: this.normalizeNullableString(input.phone),
        websiteUrl: this.normalizeNullableString(input.website),
      },
    });
  }

  private resolveDisplayName(body: UpsertIdentityProfileDto, context: OnboardingContext) {
    const explicit = body.displayName?.trim();
    if (explicit) {
      return explicit;
    }

    const combined = [body.firstName?.trim(), body.lastName?.trim()].filter(Boolean).join(' ');
    if (combined) {
      return combined;
    }

    return (
      context?.identityProfile?.displayName ??
      context?.profile?.displayName ??
      context?.email.split('@')[0] ??
      'OpenStaff User'
    );
  }

  private async resolveUniquePublicSlug(value: string, excludeId?: string) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.prisma.identityProfile.findUnique({
        where: { publicSlug: slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
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

  private parseCompletedSteps(value: unknown) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }

    return [];
  }

  private normalizeNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async loadOnboardingContext(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        identityProfile: true,
        identityCompanyProfiles: {
          orderBy: { createdAt: 'asc' },
        },
        onboardingSession: true,
        verificationCases: {
          include: {
            reviewedBy: true,
            decisions: {
              include: {
                actorUser: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });
  }

  private toOnboardingResponse(context: NonNullable<OnboardingContext>) {
    const company = context.identityCompanyProfiles[0] ?? null;
    const completedSteps = this.parseCompletedSteps(context.onboardingSession.completedSteps);
    const identityCase = (context.verificationCases ?? []).find(
      (item: any) => item.subjectType === VerificationCaseSubjectType.IDENTITY_PROFILE,
    );
    const companyCase = (context.verificationCases ?? []).find(
      (item: any) => item.subjectType === VerificationCaseSubjectType.COMPANY_PROFILE,
    );

    return {
      identityProfile: {
        id: context.identityProfile.id,
        publicSlug: context.identityProfile.publicSlug,
        firstName: context.identityProfile.firstName,
        lastName: context.identityProfile.lastName,
        displayName: context.identityProfile.displayName,
        avatarUrl: context.identityProfile.avatarUrl,
        bio: context.identityProfile.bio,
        language: context.identityProfile.language,
        timezone: context.identityProfile.timezone,
        country: context.identityProfile.country,
        city: context.identityProfile.city,
        phone: context.identityProfile.phone,
        website: context.identityProfile.website,
        linkedinUrl: context.identityProfile.linkedinUrl,
        githubUrl: context.identityProfile.githubUrl,
        portfolioUrl: context.identityProfile.portfolioUrl,
        verificationStatus: context.identityProfile.verificationStatus,
        onboardingCompletedAt: context.identityProfile.onboardingCompletedAt,
        profileCompletionPercent: context.identityProfile.profileCompletionPercent,
        createdAt: context.identityProfile.createdAt,
        updatedAt: context.identityProfile.updatedAt,
      },
      companyProfile: company
        ? {
            id: company.id,
            companyName: company.companyName,
            legalName: company.legalName,
            registrationNumber: company.registrationNumber,
            vatId: company.vatId,
            country: company.country,
            city: company.city,
            addressLine1: company.addressLine1,
            addressLine2: company.addressLine2,
            postalCode: company.postalCode,
            website: company.website,
            logoUrl: company.logoUrl,
            verificationStatus: company.verificationStatus,
            onboardingCompletedAt: company.onboardingCompletedAt,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          }
        : null,
      onboardingSession: {
        id: context.onboardingSession.id,
        currentStep: context.onboardingSession.currentStep,
        completedSteps,
        completionPercent: context.onboardingSession.completionPercent,
        status: context.onboardingSession.status,
        startedAt: context.onboardingSession.startedAt,
        completedAt: context.onboardingSession.completedAt,
        createdAt: context.onboardingSession.createdAt,
        updatedAt: context.onboardingSession.updatedAt,
      },
      completionPercent: context.onboardingSession.completionPercent,
      verificationStates: {
        identityProfile: context.identityProfile.verificationStatus,
        companyProfile: company?.verificationStatus ?? VerificationStatus.UNVERIFIED,
      },
      verificationSummary: {
        identityCase: this.toVerificationCaseSummary(identityCase),
        companyCase: this.toVerificationCaseSummary(companyCase),
        overallStatus: this.resolveOverallVerificationStatus(
          context.identityProfile.verificationStatus,
          company?.verificationStatus ?? VerificationStatus.UNVERIFIED,
          identityCase?.status,
          companyCase?.status,
        ),
      },
      legacyProfile: context.profile
        ? {
            id: context.profile.id,
            slug: context.profile.slug,
            profileType: context.profile.profileType,
          }
        : null,
    };
  }

  private toVerificationCaseSummary(item: any) {
    if (!item) {
      return null;
    }

    return {
      id: item.id,
      subjectType: item.subjectType,
      status: item.status,
      submittedAt: item.submittedAt,
      reviewedAt: item.reviewedAt,
      latestNote: item.latestNote,
      decisionCount: Array.isArray(item.decisions) ? item.decisions.length : 0,
      reviewedBy: item.reviewedBy
        ? {
            id: item.reviewedBy.id,
            email: item.reviewedBy.email,
            role: item.reviewedBy.role,
          }
        : null,
    };
  }

  private resolveOverallVerificationStatus(
    identityStatus: VerificationStatus,
    companyStatus: VerificationStatus,
    identityCaseStatus?: VerificationCaseStatus,
    companyCaseStatus?: VerificationCaseStatus,
  ) {
    if (
      identityStatus === VerificationStatus.REJECTED ||
      companyStatus === VerificationStatus.REJECTED
    ) {
      return VerificationStatus.REJECTED;
    }

    if (
      identityStatus === VerificationStatus.VERIFIED &&
      (companyStatus === VerificationStatus.VERIFIED ||
        companyStatus === VerificationStatus.UNVERIFIED)
    ) {
      return VerificationStatus.VERIFIED;
    }

    if (
      identityStatus === VerificationStatus.PENDING ||
      companyStatus === VerificationStatus.PENDING ||
      identityCaseStatus === VerificationCaseStatus.SUBMITTED ||
      identityCaseStatus === VerificationCaseStatus.IN_REVIEW ||
      companyCaseStatus === VerificationCaseStatus.SUBMITTED ||
      companyCaseStatus === VerificationCaseStatus.IN_REVIEW
    ) {
      return VerificationStatus.PENDING;
    }

    return VerificationStatus.UNVERIFIED;
  }

  private toAdminSessionResponse(session: any) {
    const identity = session.user.identityProfile;
    const company = session.user.identityCompanyProfiles[0] ?? null;

    return {
      id: session.id,
      userId: session.userId,
      email: session.user.email,
      currentStep: session.currentStep,
      completedSteps: this.parseCompletedSteps(session.completedSteps),
      completionPercent: session.completionPercent,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      updatedAt: session.updatedAt,
      identityProfile: identity
        ? {
            displayName: identity.displayName,
            publicSlug: identity.publicSlug,
            verificationStatus: identity.verificationStatus,
          }
        : null,
      companyProfile: company
        ? {
            companyName: company.companyName,
            verificationStatus: company.verificationStatus,
          }
        : null,
    };
  }
}
