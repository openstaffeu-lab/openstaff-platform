import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectJobRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectJobRequestDto } from './dto/create-project-job-request.dto';
import { UpdateProjectJobRequestDto } from './dto/update-project-job-request.dto';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectJobRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly projectResponseMapper: ProjectResponseMapper,
  ) {}

  async findAll(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);

    const jobRequests = await this.prisma.projectJobRequest.findMany({
      where: { projectId: project.id },
      include: this.include,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return jobRequests.map((jobRequest) =>
      this.projectResponseMapper.toJobRequestResponse(jobRequest),
    );
  }

  async create(
    projectId: string,
    body: CreateProjectJobRequestDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);

    if (!body.title?.trim()) {
      throw new BadRequestException('Job request title is required');
    }

    const jobRequest = await this.prisma.projectJobRequest.create({
      data: {
        project: {
          connect: {
            id: project.id,
          },
        },
        title: body.title.trim(),
        description: body.description?.trim(),
        scopeOfWork: body.scopeOfWork?.trim(),
        status: body.status ?? ProjectJobRequestStatus.DRAFT,
        workerCount: body.workerCount,
        unit: body.unit?.trim(),
        budgetMinCents: body.budgetMinCents,
        budgetMaxCents: body.budgetMaxCents,
        currencyCode: body.currencyCode?.trim(),
        requiredExperienceYears: body.requiredExperienceYears,
        requiresCertification: body.requiresCertification ?? false,
        startDate: this.toDate(body.startDate),
        endDate: this.toDate(body.endDate),
        responseDeadline: this.toDate(body.responseDeadline),
        notes: body.notes?.trim(),
        ...(body.languageId
          ? {
              language: {
                connect: {
                  id: body.languageId,
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
      },
      include: this.include,
    });

    return this.projectResponseMapper.toJobRequestResponse(jobRequest);
  }

  async update(
    projectId: string,
    jobRequestId: string,
    body: UpdateProjectJobRequestDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const existing = await this.prisma.projectJobRequest.findFirst({
      where: {
        id: jobRequestId,
        projectId: project.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Project job request not found');
    }

    const data: Prisma.ProjectJobRequestUpdateInput = {};

    if (body.title !== undefined) {
      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() ?? null;
    }

    if (body.scopeOfWork !== undefined) {
      data.scopeOfWork = body.scopeOfWork?.trim() ?? null;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.workerCount !== undefined) {
      data.workerCount = body.workerCount ?? null;
    }

    if (body.unit !== undefined) {
      data.unit = body.unit?.trim() ?? null;
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

    if (body.requiredExperienceYears !== undefined) {
      data.requiredExperienceYears = body.requiredExperienceYears ?? null;
    }

    if (body.requiresCertification !== undefined) {
      data.requiresCertification = body.requiresCertification;
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

    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() ?? null;
    }

    if (body.languageId !== undefined) {
      data.language = body.languageId
        ? { connect: { id: body.languageId } }
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

    const jobRequest = await this.prisma.projectJobRequest.update({
      where: { id: jobRequestId },
      data,
      include: this.include,
    });

    return this.projectResponseMapper.toJobRequestResponse(jobRequest);
  }

  async remove(
    projectId: string,
    jobRequestId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const existing = await this.prisma.projectJobRequest.findFirst({
      where: {
        id: jobRequestId,
        projectId: project.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Project job request not found');
    }

    await this.prisma.projectJobRequest.delete({
      where: {
        id: jobRequestId,
      },
    });

    return { success: true };
  }

  private async getProjectForRead(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanReadProject(user, project.createdById);
    return project;
  }

  private async getProjectForWrite(projectId: string, user: AuthenticatedUser) {
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

  private toDate(value?: string | null) {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private readonly include = {
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
  } satisfies Prisma.ProjectJobRequestInclude;
}
