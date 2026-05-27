import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectConditionScope,
  ProjectConditionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectConditionDto } from './dto/create-project-condition.dto';
import { UpdateProjectConditionDto } from './dto/update-project-condition.dto';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectConditionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly projectResponseMapper: ProjectResponseMapper,
  ) {}

  async findAll(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);

    const conditions = await this.prisma.projectCondition.findMany({
      where: { projectId: project.id },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return conditions.map((condition) =>
      this.projectResponseMapper.toConditionResponse(condition),
    );
  }

  async create(
    projectId: string,
    body: CreateProjectConditionDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);

    if (!body.title?.trim() || !body.content?.trim()) {
      throw new BadRequestException('Condition title and content are required');
    }

    const scope = body.scope ?? ProjectConditionScope.PROJECT;

    if (scope === ProjectConditionScope.JOB_REQUEST && !body.jobRequestId) {
      throw new BadRequestException(
        'jobRequestId is required for JOB_REQUEST scope',
      );
    }

    if (body.jobRequestId) {
      await this.ensureJobRequestBelongsToProject(
        project.id,
        body.jobRequestId,
      );
    }

    const condition = await this.prisma.projectCondition.create({
      data: {
        project: {
          connect: {
            id: project.id,
          },
        },
        ...(body.jobRequestId
          ? {
              jobRequest: {
                connect: {
                  id: body.jobRequestId,
                },
              },
            }
          : {}),
        type: body.type ?? ProjectConditionType.CUSTOM,
        scope,
        title: body.title.trim(),
        clauseKey: body.clauseKey?.trim(),
        content: body.content.trim(),
        isMandatory: body.isMandatory ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return this.projectResponseMapper.toConditionResponse(condition);
  }

  async update(
    projectId: string,
    conditionId: string,
    body: UpdateProjectConditionDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const existing = await this.prisma.projectCondition.findFirst({
      where: {
        id: conditionId,
        projectId: project.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Project condition not found');
    }

    if (body.jobRequestId) {
      await this.ensureJobRequestBelongsToProject(
        project.id,
        body.jobRequestId,
      );
    }

    if (
      body.scope === ProjectConditionScope.JOB_REQUEST &&
      body.jobRequestId === undefined &&
      !existing.jobRequestId
    ) {
      throw new BadRequestException(
        'jobRequestId is required for JOB_REQUEST scope',
      );
    }

    const data: Prisma.ProjectConditionUpdateInput = {};

    if (body.type !== undefined) {
      data.type = body.type;
    }

    if (body.scope !== undefined) {
      data.scope = body.scope;
    }

    if (body.title !== undefined) {
      data.title = body.title.trim();
    }

    if (body.clauseKey !== undefined) {
      data.clauseKey = body.clauseKey?.trim() ?? null;
    }

    if (body.content !== undefined) {
      data.content = body.content.trim();
    }

    if (body.isMandatory !== undefined) {
      data.isMandatory = body.isMandatory;
    }

    if (body.sortOrder !== undefined) {
      data.sortOrder = body.sortOrder;
    }

    if (body.jobRequestId !== undefined) {
      data.jobRequest = body.jobRequestId
        ? { connect: { id: body.jobRequestId } }
        : { disconnect: true };
    }

    const condition = await this.prisma.projectCondition.update({
      where: {
        id: conditionId,
      },
      data,
    });

    return this.projectResponseMapper.toConditionResponse(condition);
  }

  async remove(
    projectId: string,
    conditionId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const existing = await this.prisma.projectCondition.findFirst({
      where: {
        id: conditionId,
        projectId: project.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Project condition not found');
    }

    await this.prisma.projectCondition.delete({
      where: {
        id: conditionId,
      },
    });

    return { success: true };
  }

  private async getProjectForRead(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanReadProject(user, project.createdById);
    return project;
  }

  private async getProjectForWrite(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, project.createdById);
    return project;
  }

  private async ensureJobRequestBelongsToProject(
    projectId: string,
    jobRequestId: string,
  ) {
    const jobRequest = await this.prisma.projectJobRequest.findFirst({
      where: {
        id: jobRequestId,
        projectId,
      },
    });

    if (!jobRequest) {
      throw new NotFoundException('Project job request not found');
    }
  }
}
