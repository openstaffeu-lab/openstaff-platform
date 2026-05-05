import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectConditionType } from '@prisma/client';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class MatchEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
  ) {}

  async getProjectMatches(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: this.projectMatchInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.projectAccessPolicy.assertCanReadProject(user, project.createdById);

    const profiles = await this.prisma.profile.findMany({
      include: this.profileMatchInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const results = await Promise.all(
      profiles.map(async (profile) =>
        this.scoreProfileAgainstProject(project, null, profile, await this.getEligibility(project.id, profile.id)),
      ),
    );

    return results.sort((left, right) => right.score - left.score);
  }

  async getJobRequestMatches(
    projectId: string,
    jobRequestId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: this.projectMatchInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.projectAccessPolicy.assertCanReadProject(user, project.createdById);

    const jobRequest = project.jobRequests.find((item: any) => item.id === jobRequestId);

    if (!jobRequest) {
      throw new NotFoundException('Project job request not found');
    }

    const profiles = await this.prisma.profile.findMany({
      include: this.profileMatchInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const results = await Promise.all(
      profiles.map(async (profile) =>
        this.scoreProfileAgainstProject(
          project,
          jobRequest,
          profile,
          await this.getEligibility(project.id, profile.id, jobRequest.id),
        ),
      ),
    );

    return results.sort((left, right) => right.score - left.score);
  }

  private scoreProfileAgainstProject(project: any, jobRequest: any, profile: any, eligibility: any) {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];

    const projectEscoIds = new Set(
      jobRequest?.escoClassifications?.length
        ? jobRequest.escoClassifications.map((item: any) => item.escoSkill.id)
        : project.escoClassifications.map((item: any) => item.escoSkill.id),
    );
    const projectNaceIds = new Set(
      project.naceClassifications.map((item: any) => item.nace.id),
    );
    const projectUniclassIds = new Set(
      jobRequest?.uniclassClassifications?.length
        ? jobRequest.uniclassClassifications.map((item: any) => item.uniclass.id)
        : project.uniclassClassifications.map((item: any) => item.uniclass.id),
    );

    const profileEsco = profile.escoClassifications
      .map((item: any) => item.escoSkill)
      .filter((item: any) => projectEscoIds.has(item.id));
    const profileNace = profile.naceClassifications
      .map((item: any) => item.nace)
      .filter((item: any) => projectNaceIds.has(item.id));
    const profileUniclass = profile.uniclassClassifications
      .map((item: any) => item.uniclass)
      .filter((item: any) => projectUniclassIds.has(item.id));

    if (profileEsco.length > 0) {
      score += Math.min(24, profileEsco.length * 8);
      reasons.push(`ESCO overlap: ${profileEsco.map((item: any) => item.code).join(', ')}`);
    } else if (projectEscoIds.size > 0) {
      missingRequirements.push('No ESCO overlap with the requested trade scope');
    }

    if (profileNace.length > 0) {
      score += Math.min(12, profileNace.length * 6);
      reasons.push(`NACE alignment: ${profileNace.map((item: any) => item.code).join(', ')}`);
    }

    if (profileUniclass.length > 0) {
      score += Math.min(12, profileUniclass.length * 6);
      reasons.push(
        `UNICLASS alignment: ${profileUniclass.map((item: any) => item.code).join(', ')}`,
      );
    }

    if (profile.cityId && project.cityId && profile.cityId === project.cityId) {
      score += 15;
      reasons.push('Same city delivery footprint');
    } else if (profile.regionId && project.regionId && profile.regionId === project.regionId) {
      score += 10;
      reasons.push('Same region delivery footprint');
    } else if (
      profile.countryId &&
      project.countryId &&
      profile.countryId === project.countryId
    ) {
      score += 6;
      reasons.push('Same country delivery footprint');
    } else if (project.countryId) {
      missingRequirements.push('Location footprint differs from the project geography');
    }

    const profileLanguageIds = new Set(
      profile.languages.map((item: any) => item.language.id),
    );
    const projectLanguageId = jobRequest?.languageId ?? project.primaryLanguageId;

    if (projectLanguageId && profileLanguageIds.has(projectLanguageId)) {
      score += 10;
      reasons.push('Project language is supported');
    } else if (projectLanguageId) {
      missingRequirements.push('Primary project language is not listed on the profile');
    }

    const supportedEngagementModels = this.parseStringArray(profile.supportedEngagementModels);
    if (supportedEngagementModels.includes(project.engagementModel)) {
      score += 10;
      reasons.push(`Supports ${project.engagementModel} engagement`);
    } else {
      missingRequirements.push(`Does not explicitly support ${project.engagementModel} engagement`);
    }

    const profileKeywordText = [
      profile.summary,
      profile.description,
      profile.certificationsText,
      profile.contractorProfile?.tradeFocus,
      profile.professionalProfile?.headline,
      ...profile.documents.map((document: any) => document.extractedText ?? ''),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const certificationHits = this.countKeywordHits(profileKeywordText, [
      'certification',
      'licensed',
      'qa/qc',
      'commissioning',
      'insurance',
      'safety',
      'permit',
      'inspection',
      'method statement',
    ]);

    if (certificationHits > 0) {
      score += Math.min(10, certificationHits * 2);
      reasons.push('Profile certifications and experience text align with project requirements');
    }

    const domainKeywords = this.extractDomainKeywords(project, jobRequest);
    const domainMatches = domainKeywords.filter((keyword) => profileKeywordText.includes(keyword));

    if (domainMatches.length > 0) {
      score += Math.min(12, domainMatches.length * 3);
      reasons.push(`Profile documents mention ${domainMatches.slice(0, 4).join(', ')}`);
    } else if (profile.documents.length === 0) {
      missingRequirements.push('No profile documents available for text-backed matching');
    } else {
      missingRequirements.push('Profile documents do not strongly reflect this scope yet');
    }

    const projectConditionTypes = new Set(
      project.conditions.map((condition: any) => condition.type),
    );

    if (projectConditionTypes.has(ProjectConditionType.SAFETY) && !profileKeywordText.includes('safety')) {
      missingRequirements.push('Safety capability is not obvious from profile data');
    }

    if (projectConditionTypes.has(ProjectConditionType.INSURANCE) && !profileKeywordText.includes('insurance')) {
      missingRequirements.push('Insurance evidence is not obvious from profile data');
    }

    if (projectConditionTypes.has(ProjectConditionType.COMPLIANCE) && !profileKeywordText.includes('permit')) {
      missingRequirements.push('Compliance and permit handling are not obvious from profile data');
    }

    return {
      profileId: profile.id,
      name: profile.companyName || profile.displayName,
      profileType: profile.profileType,
      score: Math.min(100, score),
      eligibility,
      reasons,
      missingRequirements,
      taxonomyOverlap: {
        esco: profileEsco.map((item: any) => ({ id: item.id, code: item.code, title: item.title })),
        nace: profileNace.map((item: any) => ({ id: item.id, code: item.code, title: item.title })),
        uniclass: profileUniclass.map((item: any) => ({
          id: item.id,
          code: item.code,
          title: item.title,
        })),
      },
      documentCount: profile.documents.length,
    };
  }

  private async getEligibility(projectId: string, profileId: string, jobRequestId?: string) {
    return this.complianceEligibilityService.evaluateProfileForProjectByIds(projectId, profileId, {
      jobRequestId,
    });
  }

  private extractDomainKeywords(project: any, jobRequest: any) {
    const projectText = [
      project.name,
      project.summary ?? '',
      project.description ?? '',
      project.scopeOfWork ?? '',
      jobRequest?.title ?? '',
      jobRequest?.description ?? '',
      jobRequest?.scopeOfWork ?? '',
      jobRequest?.notes ?? '',
      ...project.conditions.map((condition: any) => `${condition.title} ${condition.content}`),
    ]
      .join(' ')
      .toLowerCase();

    const domainKeywords = [
      'hvac',
      'ventilation',
      'electrical',
      'commissioning',
      'automation',
      'site manager',
      'quality',
      'qa/qc',
      'survey',
      'design',
      'maintenance',
      'safety',
      'insurance',
      'permit',
      'method statement',
    ];

    return domainKeywords.filter((keyword) => projectText.includes(keyword));
  }

  private countKeywordHits(text: string, keywords: string[]) {
    return keywords.filter((keyword) => text.includes(keyword)).length;
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

  private readonly projectMatchInclude = {
    conditions: true,
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
    jobRequests: {
      include: {
        language: true,
        escoClassifications: {
          include: {
            escoSkill: true,
          },
        },
        uniclassClassifications: {
          include: {
            uniclass: true,
          },
        },
      },
    },
  } as const;

  private readonly profileMatchInclude = {
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
    documents: true,
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
}
