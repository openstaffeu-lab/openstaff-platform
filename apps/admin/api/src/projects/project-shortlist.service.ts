import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectShortlistDto } from './dto/create-project-shortlist.dto';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectShortlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
  ) {}

  async list(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForOwner(projectId, user);
    const shortlist = await this.prisma.projectShortlist.findMany({
      where: {
        projectId: project.id,
      },
      include: this.shortlistInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return shortlist.map((item) => this.toShortlistResponse(item));
  }

  async create(
    projectId: string,
    body: CreateProjectShortlistDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForOwner(projectId, user);
    await this.ensureProfileExists(body.profileId);

    const shortlist = await this.prisma.projectShortlist.upsert({
      where: {
        projectId_profileId: {
          projectId: project.id,
          profileId: body.profileId,
        },
      },
      create: {
        projectId: project.id,
        profileId: body.profileId,
        createdById: user.sub,
        matchScore: body.matchScore ?? null,
        notes: body.notes?.trim() ?? null,
      },
      update: {
        createdById: user.sub,
        matchScore: body.matchScore ?? null,
        notes: body.notes?.trim() ?? null,
      },
      include: this.shortlistInclude,
    });

    return this.toShortlistResponse(shortlist);
  }

  async remove(
    projectId: string,
    shortlistId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForOwner(projectId, user);

    const shortlist = await this.prisma.projectShortlist.findFirst({
      where: {
        id: shortlistId,
        projectId: project.id,
      },
    });

    if (!shortlist) {
      throw new NotFoundException('Shortlist entry not found');
    }

    await this.prisma.projectShortlist.delete({
      where: {
        id: shortlist.id,
      },
    });

    return { success: true };
  }

  private async getProjectForOwner(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, project.createdById);
    return project;
  }

  private async ensureProfileExists(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
  }

  private toShortlistResponse(shortlist: any) {
    return {
      id: shortlist.id,
      projectId: shortlist.projectId,
      profileId: shortlist.profileId,
      createdById: shortlist.createdById,
      matchScore: shortlist.matchScore,
      notes: shortlist.notes,
      createdAt: shortlist.createdAt,
      createdBy: shortlist.createdBy,
      profile: {
        id: shortlist.profile.id,
        userId: shortlist.profile.userId,
        profileType: shortlist.profile.profileType,
        displayName: shortlist.profile.displayName,
        companyName: shortlist.profile.companyName,
        summary: shortlist.profile.summary,
        availabilityStatus: shortlist.profile.availabilityStatus,
        supportedEngagementModels: this.parseStringArray(
          shortlist.profile.supportedEngagementModels,
        ),
        geography: {
          country: shortlist.profile.country,
          region: shortlist.profile.region,
          city: shortlist.profile.city,
        },
        counts: {
          documents: shortlist.profile._count.documents,
        },
        escoSkills: shortlist.profile.escoClassifications.map(
          (item: any) => item.escoSkill,
        ),
        naceCodes: shortlist.profile.naceClassifications.map(
          (item: any) => item.nace,
        ),
        uniclassCodes: shortlist.profile.uniclassClassifications.map(
          (item: any) => item.uniclass,
        ),
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

  private readonly shortlistInclude = {
    createdBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    profile: {
      include: {
        country: true,
        region: true,
        city: true,
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
        _count: {
          select: {
            documents: true,
          },
        },
      },
    },
  } as const;
}
