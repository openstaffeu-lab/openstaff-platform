import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectAIInterpretationStatus,
  ProjectConditionScope,
  ProjectConditionType,
  ProjectEngagementModel,
  ProjectJobRequestStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyProjectAIInterpretationDto } from './dto/apply-project-ai-interpretation.dto';
import { CreateProjectAIInterpretationDto } from './dto/create-project-ai-interpretation.dto';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectAIParserService } from './project-ai-parser.service';
import { ProjectResponseMapper } from './project-response.mapper';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type ParsedTaxonomySuggestion = {
  id: string;
  code: string;
  title: string;
  reason: string;
  matchedKeywords?: string[];
  score?: number;
};

type ParsedAIInterpretationPayload = {
  summary?: string;
  detectedEngagementModel?: string;
  suggestedJobRequests?: Array<{
    title: string;
    reason?: string;
    matchedKeywords?: string[];
  }>;
  suggestedConditions?: Array<{
    type?: string;
    title: string;
    content: string;
    reason?: string;
  }>;
  taxonomySuggestions?: {
    esco?: ParsedTaxonomySuggestion[];
    nace?: ParsedTaxonomySuggestion[];
    uniclass?: ParsedTaxonomySuggestion[];
  };
};

@Injectable()
export class ProjectAIInterpretationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly projectResponseMapper: ProjectResponseMapper,
    private readonly projectAIParserService: ProjectAIParserService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);

    const aiInterpretation =
      await this.prisma.projectAIInterpretation.findUnique({
        where: {
          projectId: project.id,
        },
      });

    return aiInterpretation
      ? this.projectResponseMapper.toAIInterpretationResponse(aiInterpretation)
      : null;
  }

  async findHistory(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);

    const runs = await this.prisma.projectAIInterpretationRun.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return runs.map((run) =>
      this.projectResponseMapper.toAIInterpretationResponse(run),
    );
  }

  async upsert(
    projectId: string,
    body: CreateProjectAIInterpretationDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const attachedDocuments = await this.resolveAttachedDocuments(
      project.id,
      body.documentIds,
    );
    const documentIds = attachedDocuments.length
      ? JSON.stringify(attachedDocuments.map((document) => document.id))
      : body.documentIds !== undefined
        ? JSON.stringify([])
        : undefined;
    const trimmedSourceText = body.sourceText?.trim() ?? null;

    try {
      const [escoSkills, naceCodes, uniclassCodes] = await Promise.all([
        this.prisma.escoSkill.findMany({
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
          orderBy: {
            title: 'asc',
          },
        }),
        this.prisma.nace.findMany({
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
          orderBy: {
            title: 'asc',
          },
        }),
        this.prisma.uniclass.findMany({
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
          orderBy: {
            title: 'asc',
          },
        }),
      ]);

      const analysis = this.projectAIParserService.parse({
        project: {
          id: project.id,
          name: project.name,
          summary: project.summary,
          location: project.location,
        },
        sourceText: trimmedSourceText,
        documents: attachedDocuments.map((document) => ({
          id: document.id,
          fileName: document.fileName,
          mimeType: document.mimeType,
          extractedText: document.extractedText,
          extractionStatus: document.extractionStatus,
        })),
        escoSkills,
        naceCodes,
        uniclassCodes,
      });

      const extractedJson = JSON.stringify({
        ...analysis,
        documents: attachedDocuments.map((document) => ({
          id: document.id,
          fileName: document.fileName,
          mimeType: document.mimeType,
          storageKey: document.storageKey,
          extractionStatus: document.extractionStatus,
          hasExtractedText: Boolean(document.extractedText),
          extractedCharacterCount: document.extractedText?.length ?? 0,
        })),
      });

      const status =
        body.status === ProjectAIInterpretationStatus.OVERRIDDEN
          ? ProjectAIInterpretationStatus.OVERRIDDEN
          : ProjectAIInterpretationStatus.COMPLETED;

      const interpretationRun =
        await this.prisma.projectAIInterpretationRun.create({
          data: {
            project: {
              connect: {
                id: project.id,
              },
            },
            status,
            sourceText: trimmedSourceText,
            extractedJson,
            documentIds,
            confidenceScore: body.confidenceScore,
            modelName: body.modelName?.trim() || 'local-rules-v1',
            modelVersion: body.modelVersion?.trim() || '1.0.0',
            promptVersion:
              body.promptVersion?.trim() || 'deterministic-local-rules',
            reviewNotes: body.reviewNotes?.trim(),
            ...(status === ProjectAIInterpretationStatus.OVERRIDDEN
              ? {
                  reviewedBy: {
                    connect: {
                      id: user.sub,
                    },
                  },
                }
              : {}),
          },
        });

      const aiInterpretation = await this.prisma.projectAIInterpretation.upsert(
        {
          where: {
            projectId: project.id,
          },
          create: {
            project: {
              connect: {
                id: project.id,
              },
            },
            status,
            sourceText: trimmedSourceText,
            extractedJson,
            documentIds,
            confidenceScore: body.confidenceScore,
            modelName: body.modelName?.trim() || 'local-rules-v1',
            modelVersion: body.modelVersion?.trim() || '1.0.0',
            promptVersion:
              body.promptVersion?.trim() || 'deterministic-local-rules',
            reviewNotes: body.reviewNotes?.trim(),
            ...(status === ProjectAIInterpretationStatus.OVERRIDDEN
              ? {
                  reviewedBy: {
                    connect: {
                      id: user.sub,
                    },
                  },
                }
              : {}),
          },
          update: {
            status,
            sourceText: trimmedSourceText,
            extractedJson,
            documentIds:
              documentIds ??
              (body.documentIds !== undefined ? JSON.stringify([]) : undefined),
            confidenceScore: body.confidenceScore ?? null,
            modelName: body.modelName?.trim() || 'local-rules-v1',
            modelVersion: body.modelVersion?.trim() || '1.0.0',
            promptVersion:
              body.promptVersion?.trim() || 'deterministic-local-rules',
            reviewNotes: body.reviewNotes?.trim() ?? null,
            reviewedBy:
              status === ProjectAIInterpretationStatus.OVERRIDDEN
                ? {
                    connect: {
                      id: user.sub,
                    },
                  }
                : {
                    disconnect: true,
                  },
          },
        },
      );

      await this.auditService.log({
        actorUserId: user.sub,
        projectId: project.id,
        entityType: 'ProjectAIInterpretation',
        entityId: aiInterpretation.id,
        action: 'PROJECT_AI_INTERPRETATION_RUN_APPENDED',
        category: 'AI',
        after: {
          currentInterpretationId: aiInterpretation.id,
          runId: interpretationRun.id,
          status,
          modelName: aiInterpretation.modelName,
          promptVersion: aiInterpretation.promptVersion,
        },
      });

      return this.projectResponseMapper.toAIInterpretationResponse(
        aiInterpretation,
      );
    } catch (error) {
      const failurePayload = JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Local AI interpretation failed',
        sourceText: trimmedSourceText,
        documentIds: attachedDocuments.map((document) => document.id),
        documents: attachedDocuments.map((document) => ({
          id: document.id,
          fileName: document.fileName,
          extractionStatus: document.extractionStatus,
          hasExtractedText: Boolean(document.extractedText),
        })),
      });

      const failedInterpretationRun =
        await this.prisma.projectAIInterpretationRun.create({
          data: {
            project: {
              connect: {
                id: project.id,
              },
            },
            status: ProjectAIInterpretationStatus.FAILED,
            sourceText: trimmedSourceText,
            extractedJson: failurePayload,
            documentIds,
            modelName: body.modelName?.trim() || 'local-rules-v1',
            modelVersion: body.modelVersion?.trim() || '1.0.0',
            promptVersion:
              body.promptVersion?.trim() || 'deterministic-local-rules',
            reviewNotes:
              body.reviewNotes?.trim() ??
              (error instanceof Error
                ? error.message
                : 'Local AI interpretation failed'),
          },
        });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId: project.id,
        entityType: 'ProjectAIInterpretationRun',
        entityId: failedInterpretationRun.id,
        action: 'PROJECT_AI_INTERPRETATION_FAILED_RUN_APPENDED',
        category: 'AI',
        after: {
          runId: failedInterpretationRun.id,
          status: ProjectAIInterpretationStatus.FAILED,
          preservedCurrentInterpretation: true,
          error:
            error instanceof Error
              ? error.message
              : 'Local AI interpretation failed',
        },
      });

      return this.projectResponseMapper.toAIInterpretationResponse(
        failedInterpretationRun,
      );
    }
  }

  async apply(
    projectId: string,
    body: ApplyProjectAIInterpretationDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        aiInterpretation: true,
        escoClassifications: {
          select: {
            escoSkillId: true,
          },
        },
        naceClassifications: {
          select: {
            naceId: true,
          },
        },
        uniclassClassifications: {
          select: {
            uniclassId: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, project.createdById);

    if (!project.aiInterpretation?.extractedJson) {
      throw new BadRequestException(
        'No AI interpretation is available to apply',
      );
    }

    const parsedPayload = this.parseAIInterpretationPayload(
      project.aiInterpretation.extractedJson,
    );

    const selectedJobRequests = this.selectByIndexes(
      parsedPayload.suggestedJobRequests ?? [],
      body.jobRequestIndexes ?? [],
      'job request',
    );
    const selectedConditions = this.selectByIndexes(
      parsedPayload.suggestedConditions ?? [],
      body.conditionIndexes ?? [],
      'condition',
    );
    const selectedTaxonomyIds = {
      escoIds: this.filterSuggestedTaxonomyIds(
        parsedPayload.taxonomySuggestions?.esco ?? [],
        body.taxonomy?.escoIds ?? [],
        'ESCO',
      ),
      naceIds: this.filterSuggestedTaxonomyIds(
        parsedPayload.taxonomySuggestions?.nace ?? [],
        body.taxonomy?.naceIds ?? [],
        'NACE',
      ),
      uniclassIds: this.filterSuggestedTaxonomyIds(
        parsedPayload.taxonomySuggestions?.uniclass ?? [],
        body.taxonomy?.uniclassIds ?? [],
        'UNICLASS',
      ),
    };

    const nextSummary =
      body.applySummary && parsedPayload.summary?.trim()
        ? parsedPayload.summary.trim()
        : undefined;
    const nextEngagementModel =
      body.applyEngagementModel &&
      this.isSupportedEngagementModel(parsedPayload.detectedEngagementModel)
        ? parsedPayload.detectedEngagementModel
        : undefined;

    const hasChanges =
      Boolean(nextSummary) ||
      Boolean(nextEngagementModel) ||
      selectedJobRequests.length > 0 ||
      selectedConditions.length > 0 ||
      selectedTaxonomyIds.escoIds.length > 0 ||
      selectedTaxonomyIds.naceIds.length > 0 ||
      selectedTaxonomyIds.uniclassIds.length > 0;

    if (!hasChanges) {
      throw new BadRequestException('No AI suggestions were selected to apply');
    }

    const currentEscoIds = project.escoClassifications.map(
      (item) => item.escoSkillId,
    );
    const currentNaceIds = project.naceClassifications.map(
      (item) => item.naceId,
    );
    const currentUniclassIds = project.uniclassClassifications.map(
      (item) => item.uniclassId,
    );

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.ProjectUpdateInput = {};

      if (nextSummary !== undefined) {
        updateData.summary = nextSummary;
      }

      if (nextEngagementModel !== undefined) {
        updateData.engagementModel = nextEngagementModel;
      }

      if (selectedJobRequests.length > 0) {
        updateData.jobRequests = {
          create: selectedJobRequests.map((jobRequest) => ({
            title: jobRequest.title.trim(),
            status: ProjectJobRequestStatus.DRAFT,
            notes: this.limitText(
              `Applied from AI interpretation v1. ${jobRequest.reason?.trim() ?? ''}`.trim(),
              1000,
            ),
          })),
        };
      }

      if (selectedConditions.length > 0) {
        const currentConditionCount = await tx.projectCondition.count({
          where: {
            projectId: project.id,
          },
        });

        updateData.conditions = {
          create: selectedConditions.map((condition, index) => ({
            type: this.toConditionType(condition.type),
            scope: ProjectConditionScope.PROJECT,
            title: condition.title.trim(),
            content: condition.content.trim(),
            isMandatory: true,
            sortOrder: currentConditionCount + index,
            clauseKey: null,
          })),
        };
      }

      const mergedEscoIds = this.mergeUniqueIds(
        currentEscoIds,
        selectedTaxonomyIds.escoIds,
      );
      const mergedNaceIds = this.mergeUniqueIds(
        currentNaceIds,
        selectedTaxonomyIds.naceIds,
      );
      const mergedUniclassIds = this.mergeUniqueIds(
        currentUniclassIds,
        selectedTaxonomyIds.uniclassIds,
      );

      if (selectedTaxonomyIds.escoIds.length > 0) {
        updateData.escoClassifications = {
          deleteMany: {},
          ...(mergedEscoIds.length
            ? {
                create: mergedEscoIds.map((escoSkillId) => ({
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

      if (selectedTaxonomyIds.naceIds.length > 0) {
        updateData.naceClassifications = {
          deleteMany: {},
          ...(mergedNaceIds.length
            ? {
                create: mergedNaceIds.map((naceId) => ({
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

      if (selectedTaxonomyIds.uniclassIds.length > 0) {
        updateData.uniclassClassifications = {
          deleteMany: {},
          ...(mergedUniclassIds.length
            ? {
                create: mergedUniclassIds.map((uniclassId) => ({
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

      await tx.project.update({
        where: {
          id: project.id,
        },
        data: updateData,
      });
    });

    const updatedProject = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: this.projectDetailInclude,
    });

    if (!updatedProject) {
      throw new NotFoundException(
        'Project not found after applying AI suggestions',
      );
    }

    return this.projectResponseMapper.toProjectDetail(updatedProject);
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

  private async resolveAttachedDocuments(
    projectId: string,
    documentIds?: string[],
  ) {
    if (!documentIds) {
      return [];
    }

    if (documentIds.length === 0) {
      return [];
    }

    const documents = await this.prisma.projectDocument.findMany({
      where: {
        projectId,
        id: {
          in: documentIds,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (documents.length !== documentIds.length) {
      throw new BadRequestException(
        'One or more selected documents do not belong to this project',
      );
    }

    return documentIds
      .map((documentId) =>
        documents.find((document) => document.id === documentId),
      )
      .filter((document): document is (typeof documents)[number] =>
        Boolean(document),
      );
  }

  private parseAIInterpretationPayload(value: string) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException(
        'Stored AI interpretation payload is invalid',
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException(
        'Stored AI interpretation payload is invalid',
      );
    }

    return parsed as ParsedAIInterpretationPayload;
  }

  private selectByIndexes<T>(items: T[], indexes: number[], label: string) {
    return indexes.map((index) => {
      const value = items[index];

      if (!value) {
        throw new BadRequestException(
          `Selected ${label} suggestion index ${index} is not available`,
        );
      }

      return value;
    });
  }

  private filterSuggestedTaxonomyIds(
    suggestions: ParsedTaxonomySuggestion[],
    selectedIds: string[],
    label: string,
  ) {
    const suggestionIds = new Set(suggestions.map((item) => item.id));

    return selectedIds.map((id) => {
      if (!suggestionIds.has(id)) {
        throw new BadRequestException(
          `${label} suggestion ${id} is not available in the current AI interpretation`,
        );
      }

      return id;
    });
  }

  private mergeUniqueIds(existingIds: string[], newIds: string[]) {
    return Array.from(new Set([...existingIds, ...newIds]));
  }

  private toConditionType(value?: string) {
    const supportedTypes = new Set<ProjectConditionType>([
      ProjectConditionType.SAFETY,
      ProjectConditionType.PAYMENT,
      ProjectConditionType.INSURANCE,
      ProjectConditionType.TECHNICAL,
      ProjectConditionType.LEGAL,
      ProjectConditionType.CUSTOM,
    ]);

    return value && supportedTypes.has(value as ProjectConditionType)
      ? (value as ProjectConditionType)
      : ProjectConditionType.CUSTOM;
  }

  private isSupportedEngagementModel(
    value?: string,
  ): value is ProjectEngagementModel {
    return (
      value === ProjectEngagementModel.B2B ||
      value === ProjectEngagementModel.B2C ||
      value === ProjectEngagementModel.MIXED
    );
  }

  private limitText(value: string, maxLength: number) {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

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
