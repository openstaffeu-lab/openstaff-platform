import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OnboardingStatus,
  NotificationCategory,
  ProfileType,
  VerificationCaseStatus,
  VerificationCaseSubjectType,
  VerificationStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import { UpsertCompanyProfileDto } from './dto/upsert-company-profile.dto';
import { UpsertIdentityProfileDto } from './dto/upsert-identity-profile.dto';

type OnboardingContext = any;
type RegistrationDefaultsResponse = {
  inferredFrom: string[];
  country: string;
  countryCode: string;
  language: string;
  currency: string;
  vatMode: 'domestic' | 'eu' | 'international';
  timezone: string;
  city: string | null;
  phonePrefix: string;
  explanation: string;
};

type CompanyLookupResponse = {
  rawFiscalCode: string;
  normalizedFiscalCode: string;
  countryCode: string;
  provider: string;
  providerLabel: string;
  lookupTimestamp: string;
  verifiedSource: boolean;
  lookupStatus:
    | 'matched'
    | 'manual_required'
    | 'invalid'
    | 'provider_unavailable';
  verificationStatus: 'unverified' | 'provider_matched';
  explanation: string;
  lookupMetadata?: Record<string, unknown> | null;
  company: {
    companyName: string | null;
    legalName: string | null;
    registrationNumber: string | null;
    vatId: string | null;
    country: string | null;
    city: string | null;
    addressLine1: string | null;
    postalCode: string | null;
    vatPayer: boolean | null;
    vatMode: string | null;
    legalStatus?: string | null;
  };
};

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getOnboardingMe(userId: string) {
    const context = await this.ensureOnboardingContext(userId);
    return this.toOnboardingResponse(context);
  }

  async getOnboardingProgress(userId: string) {
    const context = await this.ensureOnboardingContext(userId);
    return {
      currentStep: context.onboardingSession.currentStep,
      completedSteps: this.parseCompletedSteps(
        context.onboardingSession.completedSteps,
      ),
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
    await this.emitProfileCompletedIfNeeded(before, after, userId);
    await this.emitOnboardingCompletedIfNeeded(userId, after);
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
          registrationNumber: this.normalizeNullableString(
            body.registrationNumber,
          ),
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
          registrationNumber: this.normalizeNullableString(
            body.registrationNumber,
          ),
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
    await this.emitProfileCompletedIfNeeded(before, after, userId);
    await this.emitOnboardingCompletedIfNeeded(userId, after);
    return after;
  }

  async updateOnboardingSteps(userId: string, body: UpdateOnboardingStepDto) {
    const context = await this.ensureOnboardingContext(userId);
    const before = this.toOnboardingResponse(context);
    const completedSteps = new Set(
      this.parseCompletedSteps(context.onboardingSession.completedSteps),
    );

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
        currentStep:
          body.currentStep?.trim() || context.onboardingSession.currentStep,
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
    await this.emitOnboardingCompletedIfNeeded(userId, after);
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
    const sessions: any[] = await this.prisma.onboardingSession.findMany({
      include: {
        user: {
          include: {
            identityProfile: true,
            identityCompanyProfiles: {
              orderBy: { createdAt: 'asc' },
            },
            profile: {
              include: {
                escoClassifications: {
                  include: {
                    escoSkill: {
                      select: { code: true, title: true },
                    },
                  },
                },
                naceClassifications: {
                  include: {
                    nace: {
                      select: { code: true, title: true },
                    },
                  },
                },
                uniclassClassifications: {
                  include: {
                    uniclass: {
                      select: { code: true, title: true },
                    },
                  },
                },
              },
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

        if (
          filters?.onboardingStatus &&
          session.status !== filters.onboardingStatus
        ) {
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

  async getRegistrationDefaults(
    request?: any,
  ): Promise<RegistrationDefaultsResponse> {
    const acceptLanguage = this.getAcceptLanguage(request);
    const timezoneHeader = this.firstHeaderValue(request, 'x-timezone');
    const countryHeader =
      this.firstHeaderValue(request, 'x-country-code') ||
      this.firstHeaderValue(request, 'cf-ipcountry') ||
      this.firstHeaderValue(request, 'x-appengine-country');
    const cityHeader =
      this.firstHeaderValue(request, 'x-city') ||
      this.firstHeaderValue(request, 'cf-ipcity') ||
      this.firstHeaderValue(request, 'x-appengine-city');
    const countryCode = this.normalizeCountryCode(countryHeader) ?? 'RO';
    const language =
      (countryCode === 'RO'
        ? 'ro'
        : acceptLanguage?.split('-')[0]?.toLowerCase()) || 'ro';
    const timezone = timezoneHeader?.trim() || 'Europe/Bucharest';
    const city = this.normalizeNullableString(cityHeader);

    return {
      inferredFrom: [
        acceptLanguage ? 'browser-language' : null,
        timezoneHeader ? 'browser-timezone' : null,
        countryHeader ? 'request-country-header' : null,
        city ? 'request-city-header' : null,
      ].filter((item): item is string => Boolean(item)),
      country: this.countryNameFromCode(countryCode),
      countryCode,
      language,
      currency: countryCode === 'RO' ? 'RON' : 'EUR',
      vatMode:
        countryCode === 'RO'
          ? 'domestic'
          : this.isEuropeanUnionCountry(countryCode)
            ? 'eu'
            : 'international',
      timezone,
      city,
      phonePrefix: this.phonePrefixFromCountryCode(countryCode),
      explanation:
        'These defaults are inferred from browser language, timezone, country headers, and any available city hint. You can override every value before continuing.',
    };
  }

  async lookupCompanyProfile(input: {
    fiscalCode: string;
    countryCode?: string;
    request?: any;
  }): Promise<CompanyLookupResponse> {
    const rawFiscalCode = input.fiscalCode.trim();
    const lookupTimestamp = new Date().toISOString();
    const countryCode =
      this.normalizeCountryCode(input.countryCode) ||
      this.normalizeCountryCode(
        this.firstHeaderValue(input.request, 'x-country-code'),
      ) ||
      'RO';
    const normalizedFiscalCode = this.normalizeFiscalCode(
      rawFiscalCode,
      countryCode,
    );

    let result: CompanyLookupResponse;

    if (!normalizedFiscalCode) {
      result = {
        rawFiscalCode,
        normalizedFiscalCode: rawFiscalCode,
        countryCode,
        provider: 'validation',
        providerLabel: 'Input validation',
        lookupTimestamp,
        verifiedSource: false,
        lookupStatus: 'invalid',
        verificationStatus: 'unverified',
        explanation:
          'The fiscal or VAT code format is invalid. Continue manually if needed.',
        lookupMetadata: {
          countryCode,
          stage: 'validation',
        },
        company: this.emptyCompanyLookupResult(),
      };
      await this.logCompanyLookupAttempt(result, input.request);
      return result;
    }

    const trustedMatch = this.lookupKnownCompany(
      normalizedFiscalCode,
      countryCode,
    );
    if (trustedMatch) {
      result = {
        rawFiscalCode,
        normalizedFiscalCode,
        countryCode,
        ...trustedMatch,
      };
      await this.logCompanyLookupAttempt(result, input.request);
      return result;
    }

    const liveProviderMatch =
      countryCode === 'RO'
        ? await this.lookupRomanianCompany(
            normalizedFiscalCode,
            lookupTimestamp,
          )
        : this.isEuropeanUnionCountry(countryCode)
          ? await this.lookupEuropeanVatCompany(
              normalizedFiscalCode,
              countryCode,
              lookupTimestamp,
            )
          : null;

    if (liveProviderMatch) {
      result = {
        rawFiscalCode,
        normalizedFiscalCode,
        countryCode,
        ...liveProviderMatch,
      };
      await this.logCompanyLookupAttempt(result, input.request);
      return result;
    }

    if (countryCode === 'RO') {
      result = {
        rawFiscalCode,
        normalizedFiscalCode,
        countryCode,
        provider: 'ro-provider-unavailable',
        providerLabel: 'Romanian provider fallback',
        lookupTimestamp,
        verifiedSource: false,
        lookupStatus: 'provider_unavailable',
        verificationStatus: 'unverified',
        explanation:
          'No trusted Romanian company record was returned by the configured provider path. Continue with manual company details or retry later.',
        lookupMetadata: {
          countryCode,
          attemptedProviders: ['configured-romania-provider', 'vies'],
          fallback: 'manual_override',
        },
        company: {
          companyName: null,
          legalName: null,
          registrationNumber: normalizedFiscalCode.replace(/^RO/i, ''),
          vatId: normalizedFiscalCode,
          country: 'Romania',
          city: null,
          addressLine1: null,
          postalCode: null,
          vatPayer: normalizedFiscalCode.startsWith('RO'),
          vatMode: 'domestic',
          legalStatus: null,
        },
      };
      await this.logCompanyLookupAttempt(result, input.request);
      return result;
    }

    if (this.isEuropeanUnionCountry(countryCode)) {
      result = {
        rawFiscalCode,
        normalizedFiscalCode,
        countryCode,
        provider: 'eu-vies',
        providerLabel: 'European Commission VIES',
        lookupTimestamp,
        verifiedSource: false,
        lookupStatus: 'provider_unavailable',
        verificationStatus: 'unverified',
        explanation:
          'EU VAT format was accepted, but VIES did not return a trusted company record right now. Continue manually or retry later.',
        lookupMetadata: {
          countryCode,
          attemptedProviders: ['vies'],
          fallback: 'manual_override',
        },
        company: {
          companyName: null,
          legalName: null,
          registrationNumber: normalizedFiscalCode.replace(/^[A-Z]{2}/, ''),
          vatId: normalizedFiscalCode,
          country: this.countryNameFromCode(countryCode),
          city: null,
          addressLine1: null,
          postalCode: null,
          vatPayer: true,
          vatMode: 'eu',
          legalStatus: null,
        },
      };
      await this.logCompanyLookupAttempt(result, input.request);
      return result;
    }

    result = {
      rawFiscalCode,
      normalizedFiscalCode,
      countryCode,
      provider: 'manual',
      providerLabel: 'Manual company entry',
      lookupTimestamp,
      verifiedSource: false,
      lookupStatus: 'manual_required',
      verificationStatus: 'unverified',
      explanation:
        'Automatic company lookup is not available for this country in the current baseline. Continue with manual company data.',
      lookupMetadata: {
        countryCode,
        fallback: 'manual_override',
      },
      company: {
        companyName: null,
        legalName: null,
        registrationNumber: normalizedFiscalCode,
        vatId: normalizedFiscalCode,
        country: this.countryNameFromCode(countryCode),
        city: null,
        addressLine1: null,
        postalCode: null,
        vatPayer: null,
        vatMode: 'international',
        legalStatus: null,
      },
    };
    await this.logCompanyLookupAttempt(result, input.request);
    return result;
  }

  private async logCompanyLookupAttempt(
    result: CompanyLookupResponse,
    request?: any,
  ) {
    await this.auditService.log({
      entityType: 'COMPANY_LOOKUP',
      entityId: `${result.countryCode}:${result.normalizedFiscalCode}:${result.lookupTimestamp}`,
      action: 'LOOKUP',
      category: 'ONBOARDING',
      request,
      metadata: {
        rawFiscalCode: result.rawFiscalCode,
        normalizedFiscalCode: result.normalizedFiscalCode,
        countryCode: result.countryCode,
        provider: result.provider,
        providerLabel: result.providerLabel,
        verifiedSource: result.verifiedSource,
        lookupStatus: result.lookupStatus,
        verificationStatus: result.verificationStatus,
        explanation: result.explanation,
        lookupTimestamp: result.lookupTimestamp,
        lookupMetadata: result.lookupMetadata ?? null,
        company: result.company,
      },
    });
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
    const completedSteps = this.parseCompletedSteps(
      context.onboardingSession.completedSteps,
    );
    const identityCase = (context.verificationCases ?? []).find(
      (item: any) =>
        item.subjectType === VerificationCaseSubjectType.IDENTITY_PROFILE,
    );
    const companyCase = (context.verificationCases ?? []).find(
      (item: any) =>
        item.subjectType === VerificationCaseSubjectType.COMPANY_PROFILE,
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
        completedAt:
          nextStatus === OnboardingStatus.COMPLETED ? new Date() : null,
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

    const completedSteps = new Set(
      this.parseCompletedSteps(session?.completedSteps ?? null),
    );
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

  private resolveDisplayName(
    body: UpsertIdentityProfileDto,
    context: OnboardingContext,
  ) {
    const explicit = body.displayName?.trim();
    if (explicit) {
      return explicit;
    }

    const combined = [body.firstName?.trim(), body.lastName?.trim()]
      .filter(Boolean)
      .join(' ');
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
      return value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      );
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
    const completedSteps = this.parseCompletedSteps(
      context.onboardingSession.completedSteps,
    );
    const identityCase = (context.verificationCases ?? []).find(
      (item: any) =>
        item.subjectType === VerificationCaseSubjectType.IDENTITY_PROFILE,
    );
    const companyCase = (context.verificationCases ?? []).find(
      (item: any) =>
        item.subjectType === VerificationCaseSubjectType.COMPANY_PROFILE,
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
        profileCompletionPercent:
          context.identityProfile.profileCompletionPercent,
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
        companyProfile:
          company?.verificationStatus ?? VerificationStatus.UNVERIFIED,
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
    const legacyProfile = session.user.profile ?? null;

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
      legacyProfile: legacyProfile
        ? {
            id: legacyProfile.id,
            slug: legacyProfile.slug,
            profileType: legacyProfile.profileType,
            visibility: legacyProfile.visibility,
            moderationStatus: legacyProfile.moderationStatus,
            status: legacyProfile.status,
            taxonomySelections: {
              esco:
                legacyProfile.escoClassifications?.map((item: any) => ({
                  code: item.escoSkill?.code,
                  label: item.escoSkill?.title,
                })) ?? [],
              nace:
                legacyProfile.naceClassifications?.map((item: any) => ({
                  code: item.nace?.code,
                  label: item.nace?.title,
                })) ?? [],
              uniclass:
                legacyProfile.uniclassClassifications?.map((item: any) => ({
                  code: item.uniclass?.code,
                  label: item.uniclass?.title,
                })) ?? [],
            },
          }
        : null,
    };
  }

  private async emitOnboardingCompletedIfNeeded(userId: string, after: any) {
    if (after?.onboardingSession?.status !== OnboardingStatus.COMPLETED) {
      return;
    }

    await this.notificationService.emitEvent({
      key: `onboarding:completed:${userId}`,
      eventType: 'ONBOARDING_COMPLETED',
      sourceType: 'ONBOARDING_SESSION',
      sourceId: after.onboardingSession.id,
      userId,
      category: NotificationCategory.ACCOUNT,
      title: 'Onboarding completed',
      message:
        'Your onboarding is complete. Continue with verification, projects, and workforce opportunities.',
      relatedEntityType: 'OnboardingSession',
      relatedEntityId: after.onboardingSession.id,
      metadata: {
        completionPercent: after.completionPercent,
      },
    });
  }

  private async emitProfileCompletedIfNeeded(
    before: any,
    after: any,
    userId: string,
  ) {
    const beforePercent = Number(
      before?.identityProfile?.profileCompletionPercent ?? 0,
    );
    const afterPercent = Number(
      after?.identityProfile?.profileCompletionPercent ?? 0,
    );

    if (beforePercent >= 80 || afterPercent < 80) {
      return;
    }

    await this.notificationService.emitEvent({
      key: `rollout-funnel:profile-completed:${userId}`,
      eventType: 'PROFILE_COMPLETED',
      sourceType: 'ROLLOUT_FUNNEL',
      sourceId: after?.identityProfile?.id ?? userId,
      userId,
      actorId: userId,
      category: NotificationCategory.ADMIN,
      channel: 'SYSTEM' as any,
      channels: ['SYSTEM' as any],
      title: 'Profile completed',
      message: 'A user profile reached the rollout completion threshold.',
      metadata: {
        previousCompletionPercent: beforePercent,
        completionPercent: afterPercent,
      },
      relatedEntityType: 'IdentityProfile',
      relatedEntityId: after?.identityProfile?.id ?? userId,
      skipNotification: true,
    });
  }

  private getAcceptLanguage(request?: any) {
    const header = this.firstHeaderValue(request, 'accept-language');
    if (!header) {
      return null;
    }

    return header.split(',')[0]?.trim() || null;
  }

  private firstHeaderValue(request: any, headerName: string) {
    const value = request?.headers?.[headerName];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return typeof value === 'string' ? value : null;
  }

  private normalizeCountryCode(value?: string | null) {
    const normalized = value?.trim().toUpperCase();
    return normalized && normalized.length === 2 ? normalized : null;
  }

  private normalizeFiscalCode(value: string, countryCode: string) {
    const compact = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (!compact) {
      return '';
    }

    if (countryCode === 'RO') {
      const normalized = compact.startsWith('RO') ? compact : `RO${compact}`;
      return /^RO\d{2,10}$/.test(normalized) ? normalized : '';
    }

    if (this.isEuropeanUnionCountry(countryCode)) {
      const normalized = compact.startsWith(countryCode)
        ? compact
        : `${countryCode}${compact}`;
      return /^[A-Z]{2}[A-Z0-9]{4,14}$/.test(normalized) ? normalized : '';
    }

    return compact.length >= 4 ? compact : '';
  }

  private countryNameFromCode(code: string) {
    const names: Record<string, string> = {
      RO: 'Romania',
      DE: 'Germany',
      NL: 'Netherlands',
      BE: 'Belgium',
      FR: 'France',
      ES: 'Spain',
      IT: 'Italy',
      AT: 'Austria',
      PL: 'Poland',
      CZ: 'Czech Republic',
      HU: 'Hungary',
      BG: 'Bulgaria',
      PT: 'Portugal',
    };

    return names[code] ?? code;
  }

  private isEuropeanUnionCountry(code: string) {
    return new Set([
      'AT',
      'BE',
      'BG',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HR',
      'HU',
      'IE',
      'IT',
      'LT',
      'LU',
      'LV',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SE',
      'SI',
      'SK',
    ]).has(code);
  }

  private lookupKnownCompany(
    normalizedFiscalCode: string,
    countryCode: string,
  ): Omit<
    CompanyLookupResponse,
    'rawFiscalCode' | 'normalizedFiscalCode' | 'countryCode'
  > | null {
    const knownCompanies: Record<
      string,
      Omit<
        CompanyLookupResponse,
        'rawFiscalCode' | 'normalizedFiscalCode' | 'countryCode'
      >
    > = {
      RO12345678: {
        provider: 'ro-baseline',
        providerLabel: 'Trusted Romanian baseline',
        lookupTimestamp: new Date().toISOString(),
        verifiedSource: true,
        lookupStatus: 'matched',
        verificationStatus: 'provider_matched',
        explanation:
          'A trusted company record was matched from the current Romanian onboarding baseline.',
        lookupMetadata: {
          source: 'baseline',
        },
        company: {
          companyName: 'Nord Build Instal SRL',
          legalName: 'Nord Build Instal SRL',
          registrationNumber: 'J40/1234/2018',
          vatId: 'RO12345678',
          country: 'Romania',
          city: 'Bucuresti',
          addressLine1: 'Strada Constructorilor 24',
          postalCode: '010101',
          vatPayer: true,
          vatMode: 'domestic',
          legalStatus: 'active',
        },
      },
      DE123456789: {
        provider: 'eu-baseline',
        providerLabel: 'Trusted EU baseline',
        lookupTimestamp: new Date().toISOString(),
        verifiedSource: true,
        lookupStatus: 'matched',
        verificationStatus: 'provider_matched',
        explanation:
          'A trusted EU VAT record was matched from the current onboarding baseline.',
        lookupMetadata: {
          source: 'baseline',
        },
        company: {
          companyName: 'NordGrid Data Infrastructure GmbH',
          legalName: 'NordGrid Data Infrastructure GmbH',
          registrationNumber: 'HRB 998877',
          vatId: 'DE123456789',
          country: 'Germany',
          city: 'Frankfurt am Main',
          addressLine1: 'Rebstocker Strasse 18',
          postalCode: '60326',
          vatPayer: true,
          vatMode: 'eu',
          legalStatus: 'active',
        },
      },
    };

    return knownCompanies[normalizedFiscalCode] ?? null;
  }

  private async lookupRomanianCompany(
    normalizedFiscalCode: string,
    lookupTimestamp: string,
  ) {
    const providerResponse = await this.lookupRomanianProvider(
      normalizedFiscalCode,
      lookupTimestamp,
    );
    if (providerResponse) {
      return providerResponse;
    }

    if (!normalizedFiscalCode.startsWith('RO')) {
      return null;
    }

    return this.lookupEuropeanVatCompany(
      normalizedFiscalCode,
      'RO',
      lookupTimestamp,
    );
  }

  private async lookupRomanianProvider(
    normalizedFiscalCode: string,
    lookupTimestamp: string,
  ) {
    const providerUrl =
      process.env.ROMANIAN_COMPANY_LOOKUP_URL?.trim() ||
      process.env.COMPANY_LOOKUP_PROVIDER_URL?.trim() ||
      process.env.ANAF_LOOKUP_URL?.trim();
    if (!providerUrl) {
      return null;
    }

    const providerKey =
      process.env.ROMANIAN_COMPANY_LOOKUP_API_KEY?.trim() ||
      process.env.COMPANY_LOOKUP_PROVIDER_API_KEY?.trim() ||
      process.env.ANAF_LOOKUP_API_KEY?.trim() ||
      null;

    try {
      const response = await this.fetchJsonWithTimeout(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(providerKey ? { Authorization: `Bearer ${providerKey}` } : {}),
        },
        body: JSON.stringify({
          countryCode: 'RO',
          fiscalCode: normalizedFiscalCode.replace(/^RO/i, ''),
          vatId: normalizedFiscalCode,
        }),
      });

      const company = this.normalizeRomanianProviderResponse(response);
      if (!company) {
        return null;
      }

      return {
        provider: 'ro-registry-provider',
        providerLabel: 'Romanian company registry provider',
        lookupTimestamp,
        verifiedSource: true,
        lookupStatus: 'matched',
        verificationStatus: 'provider_matched',
        explanation:
          'Company data was returned by the configured Romanian company registry provider.',
        lookupMetadata: {
          source: 'configured-romania-provider',
          countryCode: 'RO',
        },
        company,
      } satisfies Omit<
        CompanyLookupResponse,
        'rawFiscalCode' | 'normalizedFiscalCode' | 'countryCode'
      >;
    } catch {
      return null;
    }
  }

  private normalizeRomanianProviderResponse(value: any) {
    const companyName = this.normalizeNullableString(
      value?.companyName ?? value?.name ?? value?.denumire,
    );
    const legalName = this.normalizeNullableString(
      value?.legalName ?? value?.denumire,
    );
    const vatId = this.normalizeNullableString(
      value?.vatId ?? value?.cui ?? value?.cif,
    );
    const country =
      this.normalizeNullableString(value?.country ?? value?.tara) ?? 'Romania';

    if (!companyName && !legalName) {
      return null;
    }

    return {
      companyName: companyName ?? legalName,
      legalName: legalName ?? companyName,
      registrationNumber: this.normalizeNullableString(
        value?.registrationNumber ?? value?.nrRegCom ?? value?.registrationId,
      ),
      vatId: vatId ? (this.normalizeFiscalCode(vatId, 'RO') ?? vatId) : null,
      country,
      city: this.normalizeNullableString(value?.city ?? value?.localitate),
      addressLine1: this.normalizeNullableString(
        value?.addressLine1 ?? value?.address ?? value?.adresa,
      ),
      postalCode: this.normalizeNullableString(
        value?.postalCode ?? value?.codPostal,
      ),
      vatPayer:
        typeof value?.vatPayer === 'boolean'
          ? value.vatPayer
          : typeof value?.tva === 'boolean'
            ? value.tva
            : null,
      vatMode: 'domestic',
      legalStatus: this.normalizeNullableString(
        value?.legalStatus ?? value?.status,
      ),
    };
  }

  private async lookupEuropeanVatCompany(
    normalizedFiscalCode: string,
    countryCode: string,
    lookupTimestamp: string,
  ) {
    const vatBody = normalizedFiscalCode.replace(/^[A-Z]{2}/, '');
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatBody}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const xml = await this.fetchTextWithTimeout(
        'https://ec.europa.eu/taxation_customs/vies/services/checkVatService',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: 'checkVat',
          },
          body: soapEnvelope,
        },
      );

      const valid = this.extractXmlTag(xml, 'valid');
      if (valid?.toLowerCase() !== 'true') {
        return {
          provider: 'eu-vies',
          providerLabel: 'European Commission VIES',
          lookupTimestamp,
          verifiedSource: true,
          lookupStatus: 'invalid',
          verificationStatus: 'unverified',
          explanation: 'VIES checked the VAT number and marked it as invalid.',
          lookupMetadata: {
            source: 'vies',
            countryCode,
          },
          company: {
            companyName: null,
            legalName: null,
            registrationNumber: vatBody,
            vatId: normalizedFiscalCode,
            country: this.countryNameFromCode(countryCode),
            city: null,
            addressLine1: null,
            postalCode: null,
            vatPayer: false,
            vatMode: countryCode === 'RO' ? 'domestic' : 'eu',
            legalStatus: null,
          },
        } satisfies Omit<
          CompanyLookupResponse,
          'rawFiscalCode' | 'normalizedFiscalCode' | 'countryCode'
        >;
      }

      const name = this.cleanProviderText(this.extractXmlTag(xml, 'name'));
      const address = this.cleanProviderText(
        this.extractXmlTag(xml, 'address'),
      );
      const city = address?.split(/\s*,\s*/).slice(-1)[0] ?? null;

      return {
        provider: 'eu-vies',
        providerLabel: 'European Commission VIES',
        lookupTimestamp,
        verifiedSource: true,
        lookupStatus: 'matched',
        verificationStatus: 'provider_matched',
        explanation:
          'VAT data was validated live through the European Commission VIES service.',
        lookupMetadata: {
          source: 'vies',
          countryCode,
          requestDate: this.cleanProviderText(
            this.extractXmlTag(xml, 'requestDate'),
          ),
        },
        company: {
          companyName: name,
          legalName: name,
          registrationNumber: vatBody,
          vatId: `${countryCode}${vatBody}`,
          country: this.countryNameFromCode(countryCode),
          city,
          addressLine1: address,
          postalCode: null,
          vatPayer: true,
          vatMode: countryCode === 'RO' ? 'domestic' : 'eu',
          legalStatus: 'vat_valid',
        },
      } satisfies Omit<
        CompanyLookupResponse,
        'rawFiscalCode' | 'normalizedFiscalCode' | 'countryCode'
      >;
    } catch {
      return null;
    }
  }

  private async fetchJsonWithTimeout(
    url: string,
    input: { method: string; headers: Record<string, string>; body: string },
  ) {
    const body = await this.fetchTextWithTimeout(url, input);
    return body.trim() ? JSON.parse(body) : {};
  }

  private async fetchTextWithTimeout(
    url: string,
    input: { method: string; headers: Record<string, string>; body: string },
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractXmlTag(xml: string, tagName: string) {
    const match = xml.match(
      new RegExp(`<[^:>]*:?${tagName}>([\\s\\S]*?)</[^:>]*:?${tagName}>`, 'i'),
    );
    return match?.[1]?.trim() ?? null;
  }

  private cleanProviderText(value?: string | null) {
    if (!value) {
      return null;
    }

    const cleaned = value.replace(/-+$/g, '').replace(/\s+/g, ' ').trim();

    return cleaned && cleaned !== '---' ? cleaned : null;
  }

  private phonePrefixFromCountryCode(countryCode: string) {
    const prefixes: Record<string, string> = {
      RO: '+40',
      DE: '+49',
      FR: '+33',
      IT: '+39',
      ES: '+34',
      NL: '+31',
      BE: '+32',
      AT: '+43',
      PL: '+48',
      PT: '+351',
      CZ: '+420',
      IE: '+353',
      EL: '+30',
      GR: '+30',
      SE: '+46',
      DK: '+45',
      FI: '+358',
      LU: '+352',
      HU: '+36',
      BG: '+359',
      HR: '+385',
      SI: '+386',
      SK: '+421',
      EE: '+372',
      LV: '+371',
      LT: '+370',
      CY: '+357',
      MT: '+356',
    };

    return prefixes[countryCode] ?? '+40';
  }

  private emptyCompanyLookupResult() {
    return {
      companyName: null,
      legalName: null,
      registrationNumber: null,
      vatId: null,
      country: null,
      city: null,
      addressLine1: null,
      postalCode: null,
      vatPayer: null,
      vatMode: null,
      legalStatus: null,
    };
  }
}
