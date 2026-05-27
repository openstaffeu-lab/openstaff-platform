import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectAIInterpretationStatus,
  ProjectConditionScope,
  ProjectConditionType,
  ProjectDocumentType,
  ProjectEngagementModel,
  ProjectJobRequestStatus,
  ProjectStatus,
  ProjectVisibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';

type AuthenticatedUser = {
  sub: string;
  role: string;
  email?: string;
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly projectResponseMapper: ProjectResponseMapper,
  ) {}

  async findAll(query: ListProjectsQueryDto, user: AuthenticatedUser) {
    const where: Prisma.ProjectWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.engagementModel) {
      where.engagementModel = query.engagementModel;
    }

    this.accessPolicy.scopeProjectListWhere(user, where, query.createdById);

    const projects = await this.prisma.project.findMany({
      where,
      include: this.projectListInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map((project) =>
      this.projectResponseMapper.toProjectListItem(project),
    );
  }

  async findOne(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: this.projectDetailInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.assertCanReadProjectDetail(
      project.id,
      user,
      project.createdById,
    );
    return this.projectResponseMapper.toProjectDetail(project);
  }

  async create(body: CreateProjectDto, user: AuthenticatedUser) {
    await this.ensureUserExists(user.sub);

    if (!body.name?.trim()) {
      throw new BadRequestException('Project name is required');
    }

    const slug = await this.generateUniqueSlug(body.slug ?? body.name);
    const data = this.buildProjectCreateInput(body, user.sub, slug);

    const project = await this.prisma.project.create({
      data,
      include: this.projectDetailInclude,
    });

    return this.projectResponseMapper.toProjectDetail(project);
  }

  async update(
    projectId: string,
    body: UpdateProjectDto,
    user: AuthenticatedUser,
  ) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, existingProject.createdById);

    const data = await this.buildProjectUpdateInput(body, existingProject.id);
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data,
      include: this.projectDetailInclude,
    });

    return this.projectResponseMapper.toProjectDetail(project);
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Creator user not found');
    }
  }

  private async assertCanReadProjectDetail(
    projectId: string,
    user: AuthenticatedUser,
    projectOwnerId: string,
  ) {
    if (this.accessPolicy.isAdmin(user) || user.sub === projectOwnerId) {
      return;
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const link = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          {
            invitations: {
              some: {
                profileId: profile.id,
              },
            },
          },
          {
            proposals: {
              some: {
                profileId: profile.id,
              },
            },
          },
          {
            contracts: {
              some: {
                profileId: profile.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private buildProjectCreateInput(
    body: CreateProjectDto,
    createdById: string,
    slug: string,
  ): Prisma.ProjectCreateInput {
    const projectStatus = body.status ?? ProjectStatus.DRAFT;
    const engagementModel =
      body.engagementModel ?? ProjectEngagementModel.MIXED;
    const visibility = body.visibility ?? ProjectVisibility.PRIVATE;

    return {
      slug,
      name: body.name.trim(),
      summary: body.summary?.trim(),
      description: body.description?.trim(),
      scopeOfWork: body.scopeOfWork?.trim(),
      engagementModel,
      status: projectStatus,
      visibility,
      location: body.location?.trim(),
      addressLine1: body.addressLine1?.trim(),
      addressLine2: body.addressLine2?.trim(),
      postalCode: body.postalCode?.trim(),
      latitude: body.latitude,
      longitude: body.longitude,
      budgetMinCents: body.budgetMinCents,
      budgetMaxCents: body.budgetMaxCents,
      currencyCode: body.currencyCode?.trim(),
      startDate: this.toDate(body.startDate),
      endDate: this.toDate(body.endDate),
      responseDeadline: this.toDate(body.responseDeadline),
      publishedAt: this.shouldSetPublishedAt(projectStatus, body.publishedAt)
        ? (this.toDate(body.publishedAt) ?? new Date())
        : this.toDate(body.publishedAt),
      archivedAt: this.toDate(body.archivedAt),
      createdBy: {
        connect: {
          id: createdById,
        },
      },
      ...(body.countryId
        ? {
            country: {
              connect: {
                id: body.countryId,
              },
            },
          }
        : {}),
      ...(body.regionId
        ? {
            region: {
              connect: {
                id: body.regionId,
              },
            },
          }
        : {}),
      ...(body.cityId
        ? {
            city: {
              connect: {
                id: body.cityId,
              },
            },
          }
        : {}),
      ...(body.primaryLanguageId
        ? {
            primaryLanguage: {
              connect: {
                id: body.primaryLanguageId,
              },
            },
          }
        : {}),
      ...(body.escoSkillIds?.length
        ? {
            escoClassifications: {
              create: body.escoSkillIds.map((escoSkillId) => ({
                escoSkill: {
                  connect: {
                    id: escoSkillId,
                  },
                },
              })),
            },
          }
        : {}),
      ...(body.naceIds?.length
        ? {
            naceClassifications: {
              create: body.naceIds.map((naceId) => ({
                nace: {
                  connect: {
                    id: naceId,
                  },
                },
              })),
            },
          }
        : {}),
      ...(body.uniclassIds?.length
        ? {
            uniclassClassifications: {
              create: body.uniclassIds.map((uniclassId) => ({
                uniclass: {
                  connect: {
                    id: uniclassId,
                  },
                },
              })),
            },
          }
        : {}),
      ...(body.conditions?.length
        ? {
            conditions: {
              create: body.conditions.map((condition, index) => ({
                type: condition.type ?? ProjectConditionType.CUSTOM,
                scope: ProjectConditionScope.PROJECT,
                title: condition.title.trim(),
                clauseKey: condition.clauseKey?.trim(),
                content: condition.content.trim(),
                isMandatory: condition.isMandatory ?? true,
                sortOrder: condition.sortOrder ?? index,
              })),
            },
          }
        : {}),
      ...(body.documents?.length
        ? {
            documents: {
              create: body.documents.map((document) => ({
                type: document.type ?? ProjectDocumentType.OTHER,
                title: document.title.trim(),
                description: document.description?.trim(),
                fileName: document.fileName.trim(),
                mimeType:
                  document.mimeType?.trim() ?? 'application/octet-stream',
                sizeBytes: document.sizeBytes ?? 0,
                storageProvider: document.storageProvider?.trim() ?? 'manual',
                storageBucket: document.storageBucket?.trim(),
                storageKey:
                  document.storageKey?.trim() ??
                  `project/${slug}/${document.fileName.trim()}`,
                checksumSha256: document.checksumSha256?.trim(),
                isPublic: document.isPublic ?? false,
                uploadedBy: {
                  connect: {
                    id: createdById,
                  },
                },
              })),
            },
          }
        : {}),
      ...(body.aiInterpretation
        ? {
            aiInterpretation: {
              create: {
                status:
                  body.aiInterpretation.status ??
                  ProjectAIInterpretationStatus.PENDING,
                sourceText: body.aiInterpretation.sourceText?.trim(),
                extractedJson: this.stringifyExtractedJson(
                  body.aiInterpretation.extractedJson,
                  body.aiInterpretation.extractedJsonText,
                ),
                confidenceScore: body.aiInterpretation.confidenceScore,
                modelName: body.aiInterpretation.modelName?.trim(),
                modelVersion: body.aiInterpretation.modelVersion?.trim(),
                promptVersion: body.aiInterpretation.promptVersion?.trim(),
                reviewNotes: body.aiInterpretation.reviewNotes?.trim(),
              },
            },
          }
        : {}),
      ...(body.jobRequests?.length
        ? {
            jobRequests: {
              create: body.jobRequests.map((jobRequest) => ({
                title: jobRequest.title.trim(),
                description: jobRequest.description?.trim(),
                scopeOfWork: jobRequest.scopeOfWork?.trim(),
                status: jobRequest.status ?? ProjectJobRequestStatus.DRAFT,
                workerCount: jobRequest.workerCount,
                unit: jobRequest.unit?.trim(),
                budgetMinCents: jobRequest.budgetMinCents,
                budgetMaxCents: jobRequest.budgetMaxCents,
                currencyCode: jobRequest.currencyCode?.trim(),
                requiredExperienceYears: jobRequest.requiredExperienceYears,
                requiresCertification:
                  jobRequest.requiresCertification ?? false,
                startDate: this.toDate(jobRequest.startDate),
                endDate: this.toDate(jobRequest.endDate),
                responseDeadline: this.toDate(jobRequest.responseDeadline),
                notes: jobRequest.notes?.trim(),
                ...(jobRequest.languageId
                  ? {
                      language: {
                        connect: {
                          id: jobRequest.languageId,
                        },
                      },
                    }
                  : {}),
                ...(jobRequest.escoSkillIds?.length
                  ? {
                      escoClassifications: {
                        create: jobRequest.escoSkillIds.map((escoSkillId) => ({
                          escoSkill: {
                            connect: {
                              id: escoSkillId,
                            },
                          },
                        })),
                      },
                    }
                  : {}),
                ...(jobRequest.naceIds?.length
                  ? {
                      naceClassifications: {
                        create: jobRequest.naceIds.map((naceId) => ({
                          nace: {
                            connect: {
                              id: naceId,
                            },
                          },
                        })),
                      },
                    }
                  : {}),
                ...(jobRequest.uniclassIds?.length
                  ? {
                      uniclassClassifications: {
                        create: jobRequest.uniclassIds.map((uniclassId) => ({
                          uniclass: {
                            connect: {
                              id: uniclassId,
                            },
                          },
                        })),
                      },
                    }
                  : {}),
              })),
            },
          }
        : {}),
    };
  }

  private async buildProjectUpdateInput(
    body: UpdateProjectDto,
    projectId: string,
  ): Promise<Prisma.ProjectUpdateInput> {
    const data: Prisma.ProjectUpdateInput = {};

    if (body.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(body.slug, projectId);
    } else if (body.name !== undefined) {
      data.slug = await this.generateUniqueSlug(body.name, projectId);
    }

    if (body.name !== undefined) {
      data.name = body.name.trim();
    }

    if (body.summary !== undefined) {
      data.summary = body.summary?.trim() ?? null;
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() ?? null;
    }

    if (body.scopeOfWork !== undefined) {
      data.scopeOfWork = body.scopeOfWork?.trim() ?? null;
    }

    if (body.engagementModel !== undefined) {
      data.engagementModel = body.engagementModel;
    }

    if (body.status !== undefined) {
      data.status = body.status;

      if (this.shouldSetPublishedAt(body.status, body.publishedAt)) {
        data.publishedAt = this.toDate(body.publishedAt) ?? new Date();
      }
    }

    if (body.visibility !== undefined) {
      data.visibility = body.visibility;
    }

    if (body.location !== undefined) {
      data.location = body.location?.trim() ?? null;
    }

    if (body.addressLine1 !== undefined) {
      data.addressLine1 = body.addressLine1?.trim() ?? null;
    }

    if (body.addressLine2 !== undefined) {
      data.addressLine2 = body.addressLine2?.trim() ?? null;
    }

    if (body.postalCode !== undefined) {
      data.postalCode = body.postalCode?.trim() ?? null;
    }

    if (body.latitude !== undefined) {
      data.latitude = body.latitude ?? null;
    }

    if (body.longitude !== undefined) {
      data.longitude = body.longitude ?? null;
    }

    if (body.budgetMinCents !== undefined) {
      data.budgetMinCents = body.budgetMinCents ?? null;
    }

    if (body.budgetMaxCents !== undefined) {
      data.budgetMaxCents = body.budgetMaxCents ?? null;
    }

    if (body.currencyCode !== undefined) {
      data.currencyCode = body.currencyCode?.trim() ?? null;
    }

    if (body.startDate !== undefined) {
      data.startDate = this.toDate(body.startDate) ?? null;
    }

    if (body.endDate !== undefined) {
      data.endDate = this.toDate(body.endDate) ?? null;
    }

    if (body.responseDeadline !== undefined) {
      data.responseDeadline = this.toDate(body.responseDeadline) ?? null;
    }

    if (body.publishedAt !== undefined) {
      data.publishedAt = this.toDate(body.publishedAt) ?? null;
    }

    if (body.archivedAt !== undefined) {
      data.archivedAt = this.toDate(body.archivedAt) ?? null;
    }

    if (body.countryId !== undefined) {
      data.country = body.countryId
        ? { connect: { id: body.countryId } }
        : { disconnect: true };
    }

    if (body.regionId !== undefined) {
      data.region = body.regionId
        ? { connect: { id: body.regionId } }
        : { disconnect: true };
    }

    if (body.cityId !== undefined) {
      data.city = body.cityId
        ? { connect: { id: body.cityId } }
        : { disconnect: true };
    }

    if (body.primaryLanguageId !== undefined) {
      data.primaryLanguage = body.primaryLanguageId
        ? { connect: { id: body.primaryLanguageId } }
        : { disconnect: true };
    }

    if (body.escoSkillIds !== undefined) {
      data.escoClassifications = {
        deleteMany: {},
        ...(body.escoSkillIds.length
          ? {
              create: body.escoSkillIds.map((escoSkillId) => ({
                escoSkill: {
                  connect: {
                    id: escoSkillId,
                  },
                },
              })),
            }
          : {}),
      };
    }

    if (body.naceIds !== undefined) {
      data.naceClassifications = {
        deleteMany: {},
        ...(body.naceIds.length
          ? {
              create: body.naceIds.map((naceId) => ({
                nace: {
                  connect: {
                    id: naceId,
                  },
                },
              })),
            }
          : {}),
      };
    }

    if (body.uniclassIds !== undefined) {
      data.uniclassClassifications = {
        deleteMany: {},
        ...(body.uniclassIds.length
          ? {
              create: body.uniclassIds.map((uniclassId) => ({
                uniclass: {
                  connect: {
                    id: uniclassId,
                  },
                },
              })),
            }
          : {}),
      };
    }

    return data;
  }

  private async generateUniqueSlug(value: string, excludeProjectId?: string) {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.project.findUnique({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeProjectId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  private slugify(value: string) {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || `project-${Date.now()}`;
  }

  private toDate(value?: string | Date | null) {
    if (!value) {
      return undefined;
    }

    return value instanceof Date ? value : new Date(value);
  }

  private stringifyExtractedJson(
    jsonObject?: Record<string, unknown>,
    jsonText?: string,
  ) {
    if (jsonObject) {
      return JSON.stringify(jsonObject);
    }

    return jsonText;
  }

  private shouldSetPublishedAt(
    status: ProjectStatus,
    publishedAt?: string | Date | null,
  ) {
    return (
      (status === ProjectStatus.PUBLISHED || status === ProjectStatus.ACTIVE) &&
      publishedAt === undefined
    );
  }

  private readonly projectListInclude = {
    createdBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    country: true,
    region: true,
    city: true,
    primaryLanguage: true,
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
      select: {
        id: true,
        status: true,
      },
    },
    aiInterpretation: {
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    },
    _count: {
      select: {
        jobRequests: true,
        conditions: true,
        documents: true,
      },
    },
  } satisfies Prisma.ProjectInclude;

  private readonly projectDetailInclude = {
    createdBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    country: true,
    region: true,
    city: true,
    primaryLanguage: true,
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
        conditions: true,
        documents: true,
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    conditions: {
      orderBy: {
        sortOrder: 'asc' as const,
      },
    },
    documents: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    aiInterpretation: true,
    _count: {
      select: {
        jobRequests: true,
        conditions: true,
        documents: true,
      },
    },
  } satisfies Prisma.ProjectInclude;
}
