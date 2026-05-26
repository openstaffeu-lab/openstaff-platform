import {
  AgentType,
  Prisma,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
  ProjectStatus,
  ProjectVisibility,
  PublicModerationStatus,
  PublicPostType,
  ReluAccessMode,
  NotificationCategory,
  ReluProcessingDomain,
  ReluResultStatus,
  ReluSourceType,
  ReluTaskStatus,
  Role,
  TaxonomyType,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { GeminiService } from '../gemini/gemini.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedUser = {
  sub: string;
  email: string;
  role: string;
};

type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: string;
};

type ReluTaskPayload = {
  capability: string;
  accessMode: ReluAccessMode;
  title: string;
  requestedByUserId?: string | null;
  contextEntityType?: string | null;
  contextEntityId?: string | null;
  inputSummary?: Record<string, unknown>;
};

type ProfileContext = Prisma.ProfileGetPayload<{
  include: {
    user: {
      include: {
        identityProfile: true;
      };
    };
    country: true;
    region: true;
    city: true;
    languages: { include: { language: true } };
    documents: true;
    escoClassifications: { include: { escoSkill: true } };
    naceClassifications: { include: { nace: true } };
    uniclassClassifications: { include: { uniclass: true } };
    professionalProfile: true;
    contractorProfile: true;
  };
}>;

type ProjectContext = Prisma.ProjectGetPayload<{
  include: {
    country: true;
    region: true;
    city: true;
    primaryLanguage: true;
    aiInterpretation: true;
    escoClassifications: { include: { escoSkill: true } };
    naceClassifications: { include: { nace: true } };
    uniclassClassifications: { include: { uniclass: true } };
    jobRequests: {
      include: {
        language: true;
        escoClassifications: { include: { escoSkill: true } };
        naceClassifications: { include: { nace: true } };
        uniclassClassifications: { include: { uniclass: true } };
      };
    };
    documents: true;
    conditions: true;
  };
}>;

type PublicPostContext = Prisma.PublicPostGetPayload<{
  include: {
    authorUser: true;
    authorProfile: true;
    country: true;
    region: true;
    city: true;
    media: true;
    documents: true;
    externalLinks: true;
  };
}>;

type ContractContext = Prisma.ProjectContractGetPayload<{
  include: {
    project: true;
    profile: true;
    milestones: true;
    invoices: true;
    payments: true;
  };
}>;

type ReluMatchRequest = {
  profileId?: string;
  limit?: number;
};

type SecuredOperationalResultInput<T> = {
  sourceType: ReluSourceType;
  sourceId?: string | null;
  userId?: string | null;
  domain: ReluProcessingDomain;
  resultKind: 'classification' | 'match' | 'recommendation';
  targetSourceType?: ReluSourceType | null;
  targetSourceId?: string | null;
  inputSnapshot?: unknown;
  outputData?: (result: T) => Record<string, unknown>;
  explanation?: (result: T) => string | null;
  score?: (result: T) => number | null;
  compatibilityPercent?: (result: T) => number | null;
  recommendedAction?: (result: T) => string | null;
  auditAction?: string;
};

@Injectable()
export class ReluService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly audit: AuditService,
    private readonly messagingService: MessagingService,
    private readonly notificationService: NotificationService,
  ) {}

  async listConfig() {
    const agents = await this.gemini.listAgents();

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      description: agent.description,
      model: agent.model,
      accessMode: agent.accessMode,
      temperature: agent.temperature,
      enabled: agent.enabled,
      publicEnabled: agent.publicEnabled,
      maxContextItems: agent.maxContextItems,
      webhookUrl: agent.webhookUrl,
      policyJson: agent.policyJson,
      updatedAt: agent.updatedAt,
    }));
  }

  async updateConfig(
    agentId: string,
    payload: Partial<{
      name: string;
      description: string | null;
      model: string;
      accessMode: ReluAccessMode;
      temperature: number;
      enabled: boolean;
      publicEnabled: boolean;
      maxContextItems: number;
      webhookUrl: string | null;
    }>,
    actor: AuthenticatedUser,
  ) {
    const before = await this.prisma.geminiAgent.findUnique({ where: { id: agentId } });

    if (!before) {
      throw new NotFoundException('Relu agent not found');
    }

    const updated = await this.gemini.updateAgent(agentId, payload);

    await this.audit.log({
      actorUserId: actor.sub,
      entityType: 'GEMINI_AGENT',
      entityId: updated.id,
      action: 'RELU_CONFIG_UPDATED',
      before,
      after: updated,
      metadata: {
        changedKeys: Object.keys(payload),
      },
    });

    return updated;
  }

  async listPromptsPolicies() {
    const agents = await this.gemini.listAgents();

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      accessMode: agent.accessMode,
      enabled: agent.enabled,
      publicEnabled: agent.publicEnabled,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      policyJson: agent.policyJson,
      updatedAt: agent.updatedAt,
    }));
  }

  async updatePromptPolicy(
    agentId: string,
    payload: Partial<{
      description: string | null;
      systemPrompt: string;
      policyJson: Record<string, unknown> | null;
    }>,
    actor: AuthenticatedUser,
  ) {
    const before = await this.prisma.geminiAgent.findUnique({ where: { id: agentId } });

    if (!before) {
      throw new NotFoundException('Relu agent not found');
    }

    const updated = await this.gemini.updateAgent(agentId, payload);

    await this.audit.log({
      actorUserId: actor.sub,
      entityType: 'GEMINI_AGENT',
      entityId: updated.id,
      action: 'RELU_PROMPT_POLICY_UPDATED',
      before,
      after: updated,
      metadata: {
        changedKeys: Object.keys(payload),
      },
    });

    return updated;
  }

  async queueStatus() {
    const [pending, running, completed, failed, recentTasks] = await Promise.all([
      this.prisma.reluTask.count({ where: { status: ReluTaskStatus.PENDING } }),
      this.prisma.reluTask.count({ where: { status: ReluTaskStatus.RUNNING } }),
      this.prisma.reluTask.count({
        where: {
          status: ReluTaskStatus.COMPLETED,
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
      }),
      this.prisma.reluTask.count({
        where: {
          status: ReluTaskStatus.FAILED,
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
      }),
      this.prisma.reluTask.findMany({
        include: {
          requestedBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    return {
      summary: {
        pending,
        running,
        completedLast24Hours: completed,
        failedLast24Hours: failed,
        engineStatus: 'operational',
      },
      tasks: recentTasks.map((task) => ({
        id: task.id,
        capability: task.capability,
        accessMode: task.accessMode,
        status: task.status,
        requestedByUserId: task.requestedByUserId,
        contextEntityType: task.contextEntityType,
        contextEntityId: task.contextEntityId,
        title: task.title,
        inputSummaryJson: task.inputSummaryJson,
        resultSummaryJson: task.resultSummaryJson,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
        requestedBy: task.requestedBy,
      })),
    };
  }

  async ingestPublicPost(postId: string, actor: AuthenticatedUser) {
    this.assertAdminActor(actor);
    const post = await this.getPublicPostContext(postId);
    const task = await this.createTask({
      capability: 'public-post-ingestion',
      accessMode: ReluAccessMode.ADMIN_SECURED,
      requestedByUserId: actor.sub,
      contextEntityType: 'PUBLIC_POST',
      contextEntityId: post.id,
      title: `Relu ingest public post: ${post.title}`,
      inputSummary: {
        postId: post.id,
        slug: post.slug,
        moderationStatus: post.moderationStatus,
      },
    });
    const run = await this.createProcessingRun({
      taskId: task.id,
      sourceType: ReluSourceType.PUBLIC_POST,
      sourceId: post.id,
      userId: post.authorUserId,
      triggeredByUserId: actor.sub,
      domain: ReluProcessingDomain.INGESTION,
      inputSnapshot: this.buildPublicPostSnapshot(post),
    });

    const interpretation = this.buildPublicPostInterpretation(post);
    return this.persistOperationalResult({
      actor,
      task,
      run,
      resultKind: 'classification',
      resultInput: this.buildPublicPostSnapshot(post),
      resultData: interpretation,
      explanation:
        interpretation.explanation ??
        'Public post ingestion completed with deterministic Relu taxonomy extraction.',
      score: interpretation.categoryConfidence ?? 0,
      fallbackMessage: 'Relu ingestion fallback used because Gemini is unavailable.',
      auditAction: 'RELU_PUBLIC_POST_INGESTED',
    });
  }

  async classifyPublicPost(postId: string, actor: AuthenticatedUser) {
    this.assertAdminActor(actor);
    const post = await this.getPublicPostContext(postId);
    const task = await this.createTask({
      capability: 'public-post-classification',
      accessMode: ReluAccessMode.ADMIN_SECURED,
      requestedByUserId: actor.sub,
      contextEntityType: 'PUBLIC_POST',
      contextEntityId: post.id,
      title: `Relu classify public post: ${post.title}`,
      inputSummary: {
        postId: post.id,
        slug: post.slug,
        type: post.type,
      },
    });
    const run = await this.createProcessingRun({
      taskId: task.id,
      sourceType: ReluSourceType.PUBLIC_POST,
      sourceId: post.id,
      userId: post.authorUserId,
      triggeredByUserId: actor.sub,
      domain: ReluProcessingDomain.TAXONOMY,
      inputSnapshot: this.buildPublicPostSnapshot(post),
    });

    const classification = this.buildPublicPostClassification(post);
    const persisted = await this.persistOperationalResult({
      actor,
      task,
      run,
      resultKind: 'classification',
      resultInput: this.buildPublicPostSnapshot(post),
      resultData: classification,
      explanation: classification.explanation,
      score: classification.categoryConfidence ?? 0,
      fallbackMessage: 'Relu taxonomy classification fallback used because Gemini is unavailable.',
      auditAction: 'RELU_PUBLIC_POST_CLASSIFIED',
    });

    await this.prisma.publicPost.update({
      where: { id: post.id },
      data: {
        classificationJson: classification as Prisma.InputJsonValue,
        escoCodesJson: JSON.stringify(classification.escoCandidates.map((item: any) => item.code)),
        naceCodesJson: JSON.stringify(classification.naceCandidates.map((item: any) => item.code)),
        uniclassCodesJson: JSON.stringify(
          classification.uniclassCandidates.map((item: any) => item.code),
        ),
      },
    });

    return persisted;
  }

  async matchPublicPost(postId: string, actor: AuthenticatedUser, request: ReluMatchRequest = {}) {
    const post = await this.getPublicPostContext(postId);
    const profile = await this.getAccessibleProfile(request.profileId?.trim(), actor);
    const task = await this.createTask({
      capability: 'public-post-matching',
      accessMode: this.isAdminRole(actor.role)
        ? ReluAccessMode.ADMIN_SECURED
        : ReluAccessMode.AUTHENTICATED_USER,
      requestedByUserId: actor.sub,
      contextEntityType: 'PUBLIC_POST',
      contextEntityId: post.id,
      title: `Relu match public post: ${post.title}`,
      inputSummary: {
        postId: post.id,
        profileId: profile.id,
      },
    });
    const run = await this.createProcessingRun({
      taskId: task.id,
      sourceType: ReluSourceType.PUBLIC_POST,
      sourceId: post.id,
      userId: profile.userId,
      triggeredByUserId: actor.sub,
      domain: ReluProcessingDomain.MATCH,
      inputSnapshot: {
        post: this.buildPublicPostSnapshot(post),
        profile: this.toProfileSummary(profile),
      },
    });

    const match = this.buildPublicPostMatch(post, profile);
    const persisted = await this.persistOperationalResult({
      actor,
      task,
      run,
      resultKind: 'match',
      resultInput: {
        post: this.buildPublicPostSnapshot(post),
        profile: this.toProfileSummary(profile),
      },
      resultData: match,
      explanation: match.explanation,
      score: match.compatibilityPercent,
      compatibilityPercent: match.compatibilityPercent,
      targetSourceType: ReluSourceType.PROFILE,
      targetSourceId: profile.id,
      fallbackMessage: 'Relu matching fallback used because Gemini is unavailable.',
      auditAction: 'RELU_PUBLIC_POST_MATCHED',
    });

    if (match.recommendedNextAction) {
      const recommendation = await this.prisma.reluRecommendation.create({
        data: {
          runId: run.id,
          sourceType: ReluSourceType.PUBLIC_POST,
          sourceId: post.id,
          userId: profile.userId,
          domain: ReluProcessingDomain.RECOMMENDATION,
          status: persisted.status,
          inputSnapshot: {
            post: this.buildPublicPostSnapshot(post),
            profile: this.toProfileSummary(profile),
          } as Prisma.InputJsonValue,
          outputData: {
            compatibilityPercent: match.compatibilityPercent,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
          } as Prisma.InputJsonValue,
          score: match.compatibilityPercent,
          explanation: match.explanation,
          recommendedAction: match.recommendedNextAction,
          fallbackUsed: persisted.fallbackUsed,
          targetSourceType: ReluSourceType.PROFILE,
          targetSourceId: profile.id,
        },
      });

      await this.messagingService.createReluConversationForRecommendation(
        recommendation.id,
        actor.sub,
        `Relu follow-up: ${post.title}`,
      );

      if (profile.userId) {
        await this.notificationService.emitEvent({
          key: `relu:recommendation:${recommendation.id}`,
          eventType: 'RELU_RECOMMENDATION_GENERATED',
          sourceType: 'RELU_RECOMMENDATION',
          sourceId: recommendation.id,
          userId: profile.userId,
          category: NotificationCategory.RELU,
          title: 'Relu recommendation available',
          message: `Relu generated a recommendation for ${post.title}.`,
          relatedEntityType: 'ReluRecommendation',
          relatedEntityId: recommendation.id,
          metadata: {
            publicPostId: post.id,
            compatibilityPercent: match.compatibilityPercent,
            recommendedAction: match.recommendedNextAction,
          },
        });
      }
    }

    return persisted;
  }

  async getPublicPostResults(postId: string, actor?: AuthenticatedUser | null) {
    const post = await this.getPublicPostContext(postId);

    if (!this.canReadPublicPostResults(post, actor)) {
      throw new ForbiddenException('You do not have access to these Relu results');
    }

    const [runs, classifications, matches, recommendations] = await Promise.all([
      this.prisma.reluProcessingRun.findMany({
        where: {
          sourceType: ReluSourceType.PUBLIC_POST,
          sourceId: post.id,
        },
        include: this.runInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluClassificationResult.findMany({
        where: {
          sourceType: ReluSourceType.PUBLIC_POST,
          sourceId: post.id,
        },
        include: this.classificationInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluMatchResult.findMany({
        where: {
          sourceType: ReluSourceType.PUBLIC_POST,
          sourceId: post.id,
        },
        include: this.matchInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluRecommendation.findMany({
        where: {
          sourceType: ReluSourceType.PUBLIC_POST,
          sourceId: post.id,
        },
        include: this.recommendationInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      sourceType: ReluSourceType.PUBLIC_POST,
      sourceId: post.id,
      runs: runs.map((item) => this.toRunResponse(item)),
      classifications: classifications.map((item) => this.toClassificationResponse(item)),
      matches: matches.map((item) => this.toMatchResponse(item)),
      recommendations: recommendations.map((item) => this.toRecommendationResponse(item)),
    };
  }

  async enrichProfile(profileId: string, actor: AuthenticatedUser) {
    const profile = await this.getAccessibleProfile(profileId?.trim(), actor);
    const task = await this.createTask({
      capability: 'profile-enrichment',
      accessMode: this.isAdminRole(actor.role)
        ? ReluAccessMode.ADMIN_SECURED
        : ReluAccessMode.AUTHENTICATED_USER,
      requestedByUserId: actor.sub,
      contextEntityType: 'PROFILE',
      contextEntityId: profile.id,
      title: `Relu enrich profile: ${profile.displayName}`,
      inputSummary: {
        profileId: profile.id,
        profileType: profile.profileType,
      },
    });
    const run = await this.createProcessingRun({
      taskId: task.id,
      sourceType: ReluSourceType.PROFILE,
      sourceId: profile.id,
      userId: profile.userId,
      triggeredByUserId: actor.sub,
      domain: ReluProcessingDomain.INGESTION,
      inputSnapshot: this.toProfileSummary(profile),
    });

    const enrichment = this.buildProfileEnrichment(profile);
    return this.persistOperationalResult({
      actor,
      task,
      run,
      resultKind: 'classification',
      resultInput: this.toProfileSummary(profile),
      resultData: enrichment,
      explanation: enrichment.explanation,
      score: enrichment.categoryConfidence ?? 0,
      fallbackMessage: 'Relu profile enrichment fallback used because Gemini is unavailable.',
      auditAction: 'RELU_PROFILE_ENRICHED',
    });
  }

  async classifyProfile(profileId: string, actor: AuthenticatedUser) {
    const profile = await this.getAccessibleProfile(profileId?.trim(), actor);
    const task = await this.createTask({
      capability: 'profile-classification',
      accessMode: this.isAdminRole(actor.role)
        ? ReluAccessMode.ADMIN_SECURED
        : ReluAccessMode.AUTHENTICATED_USER,
      requestedByUserId: actor.sub,
      contextEntityType: 'PROFILE',
      contextEntityId: profile.id,
      title: `Relu classify profile: ${profile.displayName}`,
      inputSummary: {
        profileId: profile.id,
        profileType: profile.profileType,
      },
    });
    const run = await this.createProcessingRun({
      taskId: task.id,
      sourceType: ReluSourceType.PROFILE,
      sourceId: profile.id,
      userId: profile.userId,
      triggeredByUserId: actor.sub,
      domain: ReluProcessingDomain.TAXONOMY,
      inputSnapshot: this.toProfileSummary(profile),
    });

    const classification = this.buildProfileClassification(profile);
    return this.persistOperationalResult({
      actor,
      task,
      run,
      resultKind: 'classification',
      resultInput: this.toProfileSummary(profile),
      resultData: classification,
      explanation: classification.explanation,
      score: classification.categoryConfidence ?? 0,
      fallbackMessage: 'Relu profile classification fallback used because Gemini is unavailable.',
      auditAction: 'RELU_PROFILE_CLASSIFIED',
    });
  }

  async getProfileResults(profileId: string, actor: AuthenticatedUser) {
    const profile = await this.getAccessibleProfile(profileId?.trim(), actor);
    const [runs, classifications, matches, recommendations] = await Promise.all([
      this.prisma.reluProcessingRun.findMany({
        where: {
          sourceType: ReluSourceType.PROFILE,
          sourceId: profile.id,
        },
        include: this.runInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluClassificationResult.findMany({
        where: {
          sourceType: ReluSourceType.PROFILE,
          sourceId: profile.id,
        },
        include: this.classificationInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluMatchResult.findMany({
        where: {
          OR: [
            {
              sourceType: ReluSourceType.PROFILE,
              sourceId: profile.id,
            },
            {
              targetSourceType: ReluSourceType.PROFILE,
              targetSourceId: profile.id,
            },
          ],
        },
        include: this.matchInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reluRecommendation.findMany({
        where: {
          OR: [
            {
              sourceType: ReluSourceType.PROFILE,
              sourceId: profile.id,
            },
            {
              targetSourceType: ReluSourceType.PROFILE,
              targetSourceId: profile.id,
            },
          ],
        },
        include: this.recommendationInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      sourceType: ReluSourceType.PROFILE,
      sourceId: profile.id,
      runs: runs.map((item) => this.toRunResponse(item)),
      classifications: classifications.map((item) => this.toClassificationResponse(item)),
      matches: matches.map((item) => this.toMatchResponse(item)),
      recommendations: recommendations.map((item) => this.toRecommendationResponse(item)),
    };
  }

  async listRuns(actor: AuthenticatedUser) {
    this.assertAdminActor(actor);
    const runs = await this.prisma.reluProcessingRun.findMany({
      include: this.runInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return runs.map((item) => this.toRunResponse(item));
  }

  async listResults(actor: AuthenticatedUser) {
    this.assertAdminActor(actor);
    const [classifications, matches, recommendations] = await Promise.all([
      this.prisma.reluClassificationResult.findMany({
        include: this.classificationInclude,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.reluMatchResult.findMany({
        include: this.matchInclude,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.reluRecommendation.findMany({
        include: this.recommendationInclude,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    return [
      ...classifications.map((item) => this.toClassificationResponse(item)),
      ...matches.map((item) => this.toMatchResponse(item)),
      ...recommendations.map((item) => this.toRecommendationResponse(item)),
    ].sort(
      (left: any, right: any) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }

  async updateResultStatus(
    resultId: string,
    status: ReluResultStatus,
    actor: AuthenticatedUser,
  ) {
    this.assertAdminActor(actor);
    const target = await this.findResultRecord(resultId);

    if (!target) {
      throw new NotFoundException('Relu result not found');
    }

    const delegate = target.delegate as any;
    const before = await delegate.findUnique({
      where: { id: resultId },
    });
    const updated = await delegate.update({
      where: { id: resultId },
      data: {
        status,
        reviewedByUserId: actor.sub,
        reviewedAt: new Date(),
      },
      include: target.include as any,
    });

    await this.audit.log({
      actorUserId: actor.sub,
      entityType: target.entityType,
      entityId: resultId,
      action: 'RELU_RESULT_STATUS_UPDATED',
      before,
      after: {
        status,
        reviewedByUserId: actor.sub,
      },
      metadata: {
        resultKind: target.kind,
        correctionLog: true,
      },
    });

    return target.serializer(updated);
  }

  async overrideResult(
    resultId: string,
    override: Record<string, unknown>,
    actor: AuthenticatedUser,
  ) {
    this.assertAdminActor(actor);
    const target = await this.findResultRecord(resultId);

    if (!target) {
      throw new NotFoundException('Relu result not found');
    }

    const patch: Record<string, unknown> = {
      status: ReluResultStatus.OVERRIDDEN,
      overrideData: override as Prisma.InputJsonValue,
      reviewedByUserId: actor.sub,
      reviewedAt: new Date(),
    };

    if (typeof override.explanation === 'string' && override.explanation.trim()) {
      patch.explanation = override.explanation.trim();
    }

    if (typeof override.score === 'number') {
      patch.score = override.score;
    }

    if (target.kind === 'match' && typeof override.compatibilityPercent === 'number') {
      patch.compatibilityPercent = override.compatibilityPercent;
    }

    const delegate = target.delegate as any;
    const before = await delegate.findUnique({
      where: { id: resultId },
    });
    const updated = await delegate.update({
      where: { id: resultId },
      data: patch,
      include: target.include as any,
    });

    await this.audit.log({
      actorUserId: actor.sub,
      entityType: target.entityType,
      entityId: resultId,
      action: 'RELU_RESULT_OVERRIDDEN',
      before,
      after: {
        ...override,
        status: ReluResultStatus.OVERRIDDEN,
        reviewedByUserId: actor.sub,
      },
      metadata: {
        resultKind: target.kind,
        correctionLog: true,
        correctionTrailPreserved: true,
      },
    });

    return target.serializer(updated);
  }

  async publicAssistant(payload: { message?: string; history?: ChatHistoryItem[] }) {
    const message = payload.message?.trim();
    if (!message) {
      throw new BadRequestException('message is required');
    }

    const task = await this.createTask({
      capability: 'public-assistant',
      accessMode: ReluAccessMode.PUBLIC_LIMITED,
      title: `Public assistant request: ${message.slice(0, 60)}`,
      inputSummary: {
        message,
        historyLength: payload.history?.length ?? 0,
      },
    });

    try {
      const execution = await this.gemini.executeAgent({
        agentType: AgentType.CHATBOT_PUBLIC,
        userMessage: message,
        history: payload.history ?? [],
        contextBlocks: [
          'Restricted mode: public visitor.',
          'Use only generic OpenStaff product guidance and public taxonomy concepts.',
          'Never infer, reveal, or summarize protected user, profile, project, contract, message, or moderation data.',
        ],
        temperatureOverride: 0.3,
      });

      const result = {
        mode: 'PUBLIC_LIMITED',
        response: execution.response,
        restrictions: [
          'No private user data',
          'No contract or chat content',
          'No moderation or admin data',
        ],
      };

      await this.completeTask(task.id, result);
      await this.audit.log({
        actorUserId: null,
        entityType: 'RELU_TASK',
        entityId: task.id,
        action: 'RELU_PUBLIC_ASSISTANT',
        after: result,
        metadata: { mode: 'PUBLIC_LIMITED' },
      });

      return { taskId: task.id, ...result };
    } catch (error) {
      await this.failTask(task.id, error);
      throw error;
    }
  }

  async processJob(payload: Record<string, unknown>) {
    const projectId =
      typeof payload.projectId === 'string'
        ? payload.projectId
        : typeof payload.jobId === 'string'
          ? payload.jobId
          : null;

    if (!projectId) {
      return { processed: false, reason: 'projectId_missing' };
    }

    const adminUser = await this.findOperationalAdminUser();

    if (!adminUser) {
      return { processed: false, reason: 'admin_context_unavailable' };
    }

    try {
      return await this.interpretProject(adminUser, { projectId });
    } catch (error) {
      return {
        processed: false,
        reason: this.getErrorMessage(error),
      };
    }
  }

  async scoreApplication(payload: Record<string, unknown>) {
    const projectId =
      typeof payload.projectId === 'string'
        ? payload.projectId
        : typeof payload.jobId === 'string'
          ? payload.jobId
          : null;

    if (!projectId) {
      return {
        score: 0,
        reasons: ['projectId_missing'],
        recommendation: 'Manual review required',
      };
    }

    const adminUser = await this.findOperationalAdminUser();

    if (!adminUser) {
      return {
        score: 0,
        reasons: ['admin_context_unavailable'],
        recommendation: 'Manual review required',
      };
    }

    try {
      return await this.eligibilityPercentage(adminUser, {
        projectId,
      });
    } catch (error) {
      return {
        score: 0,
        reasons: [this.getErrorMessage(error)],
        recommendation: 'Manual review required',
      };
    }
  }

  async onboardingAssistant(
    user: AuthenticatedUser,
    payload: { message?: string },
  ) {
    const profile = await this.getOwnProfile(user.sub);
    const completion = this.calculateProfileCompletion(profile);
    const missingItems = this.getOnboardingMissingItems(profile);

    return this.runSecuredTask({
      user,
      capability: 'onboarding-assistant',
      title: 'Relu onboarding guidance',
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.ONBOARDING_ASSISTANT,
      contextEntityType: 'PROFILE',
      contextEntityId: profile.id,
      inputSummary: {
        profileId: profile.id,
        completionPercentage: completion.percentage,
        missingItems,
      },
      contextBlocks: [
        `Profile summary: ${JSON.stringify(this.toProfileSummary(profile))}`,
        `Onboarding missing items: ${JSON.stringify(missingItems)}`,
      ],
      userMessage:
        payload.message?.trim() ||
        'Guide this user through the next onboarding steps using only their secured OpenStaff profile data.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        completion,
        missingItems,
      }),
      fallbackResult: (error) => ({
        mode: 'AUTHENTICATED_USER',
        response: this.buildOnboardingAssistantFallback(profile, completion.percentage, missingItems, error),
        completion,
        missingItems,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROFILE,
        sourceId: profile.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.INGESTION,
        resultKind: 'classification',
        inputSnapshot: this.toProfileSummary(profile),
        score: (result) => result.completion.percentage,
        explanation: (result) => result.response,
        auditAction: 'RELU_ONBOARDING_ASSISTANT_RESULT_PERSISTED',
      },
    });
  }

  async profileCompletionAssistant(
    user: AuthenticatedUser,
    payload: { message?: string },
  ) {
    const profile = await this.getOwnProfile(user.sub);
    const completion = this.calculateProfileCompletion(profile);
    const publicReadiness = this.getPublicReadiness(profile);

    return this.runSecuredTask({
      user,
      capability: 'profile-completion-assistant',
      title: 'Relu profile completion guidance',
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.PROFILE_COMPLETION_ASSISTANT,
      contextEntityType: 'PROFILE',
      contextEntityId: profile.id,
      inputSummary: {
        profileId: profile.id,
        publicReadiness,
      },
      contextBlocks: [
        `Profile summary: ${JSON.stringify(this.toProfileSummary(profile))}`,
        `Public readiness: ${JSON.stringify(publicReadiness)}`,
      ],
      userMessage:
        payload.message?.trim() ||
        'Suggest how this user can improve profile clarity, trust, and marketplace visibility.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        publicReadiness,
        completion,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROFILE,
        sourceId: profile.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.RECOMMENDATION,
        resultKind: 'recommendation',
        inputSnapshot: this.toProfileSummary(profile),
        score: (result) => result.completion.percentage,
        explanation: (result) => result.response,
        recommendedAction: (result) =>
          result.publicReadiness.moderationStatus === ProfileModerationStatus.APPROVED
            ? 'Keep public profile current and monitor marketplace response.'
            : 'Complete missing readiness items before requesting approval.',
        auditAction: 'RELU_PROFILE_COMPLETION_RESULT_PERSISTED',
      },
    });
  }

  async interpretProject(
    user: AuthenticatedUser,
    payload: { projectId?: string; sourceText?: string },
  ) {
    const sourceText = payload.sourceText?.trim() ?? '';
    const project = payload.projectId
      ? await this.getAccessibleProject(payload.projectId, user)
      : null;

    if (!project && !sourceText) {
      throw new BadRequestException('projectId or sourceText is required');
    }

    const structuredContext = project
      ? {
          project: this.toProjectSummary(project),
          jobRequests: project.jobRequests.map((item) => ({
            title: item.title,
            requiredExperienceYears: item.requiredExperienceYears,
            requiresCertification: item.requiresCertification,
            language: item.language?.name ?? null,
          })),
        }
      : { sourceText };

    return this.runSecuredTask({
      user,
      capability: 'project-job-interpretation',
      title: `Relu project interpretation${project ? `: ${project.name}` : ''}`,
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.PROJECT_JOB_INTERPRETER,
      contextEntityType: project ? 'PROJECT' : 'TEXT',
      contextEntityId: project?.id ?? null,
      inputSummary: structuredContext,
      contextBlocks: [`Project interpretation context: ${JSON.stringify(structuredContext)}`],
      userMessage:
        project
          ? 'Interpret this secured project context into summary, requirements, taxonomy hints, and risks.'
          : `Interpret this project or job description: ${sourceText}`,
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        structuredContext,
      }),
      operationalResult: {
        sourceType: project ? ReluSourceType.PROJECT : ReluSourceType.DOCUMENT,
        sourceId: project?.id ?? null,
        userId: user.sub,
        domain: ReluProcessingDomain.INGESTION,
        resultKind: 'classification',
        inputSnapshot: structuredContext,
        explanation: (result) => result.response,
        auditAction: 'RELU_PROJECT_INTERPRETATION_RESULT_PERSISTED',
      },
    });
  }

  async taxonomyMatch(
    user: AuthenticatedUser,
    payload: { projectId: string; profileId?: string },
  ) {
    const profile = await this.getAccessibleProfile(payload.profileId, user);
    const project = await this.getAccessibleProject(payload.projectId, user);
    const overlap = this.buildTaxonomyOverlap(profile, project);

    return this.runSecuredTask({
      user,
      capability: 'taxonomy-match',
      title: `Relu taxonomy match: ${profile.displayName} <> ${project.name}`,
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.MATCHING_ENGINE,
      contextEntityType: 'PROJECT',
      contextEntityId: project.id,
      inputSummary: {
        projectId: project.id,
        profileId: profile.id,
        overlap,
      },
      contextBlocks: [
        `Profile summary: ${JSON.stringify(this.toProfileSummary(profile))}`,
        `Project summary: ${JSON.stringify(this.toProjectSummary(project))}`,
        `Taxonomy overlap: ${JSON.stringify(overlap)}`,
      ],
      userMessage:
        'Explain the ESCO, NACE, and Uniclass alignment between this profile and project using only secured OpenStaff data.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        overlap,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROJECT,
        sourceId: project.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.MATCH,
        resultKind: 'match',
        targetSourceType: ReluSourceType.PROFILE,
        targetSourceId: profile.id,
        inputSnapshot: {
          profile: this.toProfileSummary(profile),
          project: this.toProjectSummary(project),
          overlap,
        },
        score: () =>
          overlap.escoMatches.length + overlap.naceMatches.length + overlap.uniclassMatches.length,
        explanation: (result) => result.response,
        auditAction: 'RELU_TAXONOMY_MATCH_RESULT_PERSISTED',
      },
    });
  }

  async eligibilityPercentage(
    user: AuthenticatedUser,
    payload: { projectId: string; profileId?: string },
  ) {
    const profile = await this.getAccessibleProfile(payload.profileId, user);
    const project = await this.getAccessibleProject(payload.projectId, user);
    const overlap = this.buildTaxonomyOverlap(profile, project);
    const eligibility = this.calculateEligibility(profile, project, overlap);

    return this.runSecuredTask({
      user,
      capability: 'eligibility-percentage',
      title: `Relu eligibility score: ${profile.displayName} <> ${project.name}`,
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.ELIGIBILITY_ENGINE,
      contextEntityType: 'PROJECT',
      contextEntityId: project.id,
      inputSummary: {
        projectId: project.id,
        profileId: profile.id,
        eligibility,
      },
      contextBlocks: [
        `Eligibility context: ${JSON.stringify({
          profile: this.toProfileSummary(profile),
          project: this.toProjectSummary(project),
          eligibility,
        })}`,
      ],
      userMessage:
        'Explain this eligibility percentage and highlight the strongest fit signals and biggest gaps.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        eligibility,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROJECT,
        sourceId: project.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.MATCH,
        resultKind: 'match',
        targetSourceType: ReluSourceType.PROFILE,
        targetSourceId: profile.id,
        inputSnapshot: {
          profile: this.toProfileSummary(profile),
          project: this.toProjectSummary(project),
          eligibility,
        },
        score: (result) => result.eligibility.percentage,
        compatibilityPercent: (result) => result.eligibility.percentage,
        explanation: (result) => result.response,
        auditAction: 'RELU_ELIGIBILITY_RESULT_PERSISTED',
      },
    });
  }

  async missingCertificationDetection(
    user: AuthenticatedUser,
    payload: { projectId: string; profileId?: string },
  ) {
    const profile = await this.getAccessibleProfile(payload.profileId, user);
    const project = await this.getAccessibleProject(payload.projectId, user);
    const gaps = this.calculateCertificationGaps(profile, project);

    return this.runSecuredTask({
      user,
      capability: 'missing-certification-detection',
      title: `Relu certification gaps: ${profile.displayName} <> ${project.name}`,
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.CERTIFICATION_GAP_DETECTOR,
      contextEntityType: 'PROJECT',
      contextEntityId: project.id,
      inputSummary: {
        projectId: project.id,
        profileId: profile.id,
        gaps,
      },
      contextBlocks: [
        `Certification gap context: ${JSON.stringify({
          projectRequirements: gaps.projectRequirements,
          availableCertifications: gaps.availableCertifications,
          missingCertifications: gaps.missingCertifications,
        })}`,
      ],
      userMessage:
        'Summarize which certifications are satisfied, missing, and optional for this profile and project.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        gaps,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROJECT,
        sourceId: project.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.MODERATION,
        resultKind: 'classification',
        targetSourceType: ReluSourceType.PROFILE,
        targetSourceId: profile.id,
        inputSnapshot: {
          profile: this.toProfileSummary(profile),
          project: this.toProjectSummary(project),
          gaps,
        },
        score: (result) =>
          result.gaps.projectRequirements.length === 0
            ? 100
            : Math.round(
                (result.gaps.satisfiedCertifications.length /
                  result.gaps.projectRequirements.length) *
                  100,
              ),
        explanation: (result) => result.response,
        auditAction: 'RELU_CERTIFICATION_GAP_RESULT_PERSISTED',
      },
    });
  }

  async generateTest(
    user: AuthenticatedUser,
    payload: { projectId: string },
  ) {
    const project = await this.getAccessibleProject(payload.projectId, user);
    const fallbackQuestions = this.buildFallbackQuestions(project);

    return this.runSecuredTask({
      user,
      capability: 'test-generator',
      title: `Relu test generator: ${project.name}`,
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.TEST_FORM_GENERATOR,
      contextEntityType: 'PROJECT',
      contextEntityId: project.id,
      inputSummary: {
        projectId: project.id,
        jobRequestCount: project.jobRequests.length,
      },
      contextBlocks: [
        `Project summary: ${JSON.stringify(this.toProjectSummary(project))}`,
        `Job requests: ${JSON.stringify(
          project.jobRequests.map((jobRequest) => ({
            title: jobRequest.title,
            description: jobRequest.description,
            requiredExperienceYears: jobRequest.requiredExperienceYears,
            requiresCertification: jobRequest.requiresCertification,
          })),
        )}`,
      ],
      userMessage:
        'Generate a concise JSON screening test with questions, intent, and evaluation guidance.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        fallbackQuestions,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROJECT,
        sourceId: project.id,
        userId: project.createdById,
        domain: ReluProcessingDomain.RECOMMENDATION,
        resultKind: 'recommendation',
        inputSnapshot: this.toProjectSummary(project),
        score: (result) => result.fallbackQuestions.length,
        explanation: (result) => result.response,
        recommendedAction: () => 'Review generated screening questions before sending them to candidates.',
        auditAction: 'RELU_TEST_GENERATOR_RESULT_PERSISTED',
      },
    });
  }

  async candidateProjectRecommendation(
    user: AuthenticatedUser,
    payload: { projectId?: string; limit?: number },
  ) {
    const profile = await this.getOwnProfile(user.sub);
    const limit = Math.min(Math.max(payload.limit ?? 5, 1), 10);
    const recommendations = await this.buildRecommendations(profile, payload.projectId, user, limit);

    return this.runSecuredTask({
      user,
      capability: 'candidate-project-recommendation',
      title: 'Relu recommendations',
      accessMode: ReluAccessMode.AUTHENTICATED_USER,
      agentType: AgentType.RECOMMENDATION_ENGINE,
      contextEntityType: payload.projectId ? 'PROJECT' : 'PROFILE',
      contextEntityId: payload.projectId ?? profile.id,
      inputSummary: {
        profileId: profile.id,
        projectId: payload.projectId ?? null,
        recommendationCount: recommendations.length,
      },
      contextBlocks: [
        `Profile summary: ${JSON.stringify(this.toProfileSummary(profile))}`,
        `Recommendations: ${JSON.stringify(recommendations)}`,
      ],
      userMessage:
        'Rank these OpenStaff recommendations and explain the best fits in short, practical language.',
      resultTransformer: (response) => ({
        mode: 'AUTHENTICATED_USER',
        response,
        recommendations,
      }),
      operationalResult: {
        sourceType: ReluSourceType.PROFILE,
        sourceId: profile.id,
        userId: profile.userId,
        domain: ReluProcessingDomain.RECOMMENDATION,
        resultKind: 'recommendation',
        targetSourceType: payload.projectId ? ReluSourceType.PROJECT : null,
        targetSourceId: payload.projectId ?? null,
        inputSnapshot: {
          profile: this.toProfileSummary(profile),
          recommendations,
        },
        score: (result) => result.recommendations[0]?.score ?? 0,
        explanation: (result) => result.response,
        recommendedAction: (result) =>
          result.recommendations[0]
            ? `Review recommended ${result.recommendations[0].entityType.toLowerCase()} ${result.recommendations[0].entityId}.`
            : 'No eligible marketplace recommendation is available yet.',
        auditAction: 'RELU_CANDIDATE_RECOMMENDATION_RESULT_PERSISTED',
      },
    });
  }

  async contractLifecycleMonitoring(
    user: AuthenticatedUser,
    payload: { contractId?: string },
  ) {
    if (!this.isAdminRole(user.role)) {
      throw new ForbiddenException('Admin or superadmin access is required');
    }

    const contracts = await this.getAccessibleContracts(payload.contractId);
    const signals = this.buildContractSignals(contracts);
    const primaryProjectId = contracts[0]?.project?.id ?? null;

    return this.runSecuredTask({
      user,
      capability: 'contract-lifecycle-monitoring',
      title: 'Relu contract lifecycle monitoring',
      accessMode: ReluAccessMode.ADMIN_SECURED,
      agentType: AgentType.CONTRACT_LIFECYCLE_MONITOR,
      contextEntityType: payload.contractId ? 'PROJECT_CONTRACT' : 'CONTRACT_PORTFOLIO',
      contextEntityId: payload.contractId ?? null,
      inputSummary: {
        contractId: payload.contractId ?? null,
        contractCount: contracts.length,
        signals,
      },
      contextBlocks: [
        `Contract signals: ${JSON.stringify(signals)}`,
        `Contracts: ${JSON.stringify(
          contracts.map((contract) => ({
            id: contract.id,
            title: contract.title,
            status: contract.status,
            startDate: contract.startDate,
            endDate: contract.endDate,
            milestoneCount: contract.milestones.length,
            openInvoiceCount: contract.invoices.filter((invoice) => invoice.status !== 'PAID').length,
          })),
        )}`,
      ],
      userMessage:
        'Summarize the contract lifecycle risks, upcoming deadlines, and operational follow-ups.',
      resultTransformer: (response) => ({
        mode: 'ADMIN_SECURED',
        response,
        signals,
      }),
      operationalResult: {
        sourceType: primaryProjectId ? ReluSourceType.PROJECT : ReluSourceType.DOCUMENT,
        sourceId: primaryProjectId,
        userId: user.sub,
        domain: ReluProcessingDomain.MODERATION,
        resultKind: 'recommendation',
        inputSnapshot: {
          contractId: payload.contractId ?? null,
          signals,
        },
        score: (result) =>
          result.signals.reduce(
            (total, signal) =>
              total + signal.overdueMilestones + signal.unpaidInvoices + signal.pendingPayments,
            0,
          ),
        explanation: (result) => result.response,
        recommendedAction: () => 'Review contract lifecycle risks and assign operational follow-up.',
        auditAction: 'RELU_CONTRACT_LIFECYCLE_RESULT_PERSISTED',
      },
    });
  }

  async notificationGenerator(
    user: AuthenticatedUser,
    payload: {
      eventType?: string;
      entityType?: string;
      entityId?: string;
      summary?: string;
    },
  ) {
    if (!this.isAdminRole(user.role)) {
      throw new ForbiddenException('Admin or superadmin access is required');
    }

    const eventType = payload.eventType?.trim();
    if (!eventType) {
      throw new BadRequestException('eventType is required');
    }

    const eventSummary = payload.summary?.trim() || 'No custom event summary supplied.';

    return this.runSecuredTask({
      user,
      capability: 'notification-generator',
      title: `Relu notification generator: ${eventType}`,
      accessMode: ReluAccessMode.ADMIN_SECURED,
      agentType: AgentType.NOTIFICATION_GENERATOR,
      contextEntityType: payload.entityType ?? 'EVENT',
      contextEntityId: payload.entityId ?? null,
      inputSummary: {
        eventType,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
      },
      contextBlocks: [
        `Event type: ${eventType}`,
        `Event summary: ${eventSummary}`,
        'Audience rules: do not expose private data that is not already visible to the intended recipient.',
      ],
      userMessage:
        'Generate structured notification JSON with title, message, severity, and internal rationale.',
      resultTransformer: (response) => ({
        mode: 'ADMIN_SECURED',
        response,
        eventType,
      }),
      operationalResult: {
        sourceType:
          payload.entityType === 'PROJECT' && payload.entityId
            ? ReluSourceType.PROJECT
            : payload.entityType === 'PROFILE' && payload.entityId
              ? ReluSourceType.PROFILE
              : payload.entityType === 'PUBLIC_POST' && payload.entityId
                ? ReluSourceType.PUBLIC_POST
                : ReluSourceType.DOCUMENT,
        sourceId: payload.entityId ?? null,
        userId: user.sub,
        domain: ReluProcessingDomain.RECOMMENDATION,
        resultKind: 'recommendation',
        inputSnapshot: {
          eventType,
          eventSummary,
          entityType: payload.entityType ?? null,
          entityId: payload.entityId ?? null,
        },
        explanation: (result) => result.response,
        recommendedAction: () => 'Review generated copy before sending a user-facing notification.',
        auditAction: 'RELU_NOTIFICATION_GENERATOR_RESULT_PERSISTED',
      },
    });
  }

  private async runSecuredTask<T>(input: {
    user: AuthenticatedUser;
    capability: string;
    title: string;
    accessMode: ReluAccessMode;
    agentType: AgentType;
    contextEntityType?: string | null;
    contextEntityId?: string | null;
    inputSummary?: Record<string, unknown>;
    contextBlocks?: string[];
    userMessage: string;
    resultTransformer: (response: string) => T;
    fallbackResult?: (error: unknown) => T;
    operationalResult?: SecuredOperationalResultInput<T>;
  }) {
    const task = await this.createTask({
      capability: input.capability,
      accessMode: input.accessMode,
      requestedByUserId: input.user.sub,
      title: input.title,
      contextEntityType: input.contextEntityType,
      contextEntityId: input.contextEntityId,
      inputSummary: input.inputSummary,
    });
    const operationalRun = input.operationalResult
      ? await this.createProcessingRun({
          taskId: task.id,
          sourceType: input.operationalResult.sourceType,
          sourceId: input.operationalResult.sourceId ?? task.id,
          userId: input.operationalResult.userId ?? input.user.sub,
          triggeredByUserId: input.user.sub,
          domain: input.operationalResult.domain,
          inputSnapshot: input.operationalResult.inputSnapshot ?? input.inputSummary,
        })
      : null;

    try {
      const execution = await this.gemini.executeAgent({
        agentType: input.agentType,
        userMessage: input.userMessage,
        contextBlocks: input.contextBlocks,
      });

      const result = input.resultTransformer(execution.response);
      await this.completeTask(task.id, result);
      const persistedResult = operationalRun
        ? await this.persistSecuredOperationalResult({
            actor: input.user,
            task,
            run: operationalRun,
            result,
            capability: input.capability,
            config: input.operationalResult!,
            fallbackUsed: false,
          })
        : null;
      await this.audit.log({
        actorUserId: input.user.sub,
        projectId:
          input.contextEntityType === 'PROJECT' ? input.contextEntityId ?? null : null,
        entityType: 'RELU_TASK',
        entityId: task.id,
        action: `RELU_${input.capability.toUpperCase().replace(/-/g, '_')}`,
        after: result,
        metadata: {
          accessMode: input.accessMode,
          contextEntityType: input.contextEntityType ?? null,
          contextEntityId: input.contextEntityId ?? null,
          persistedResultId: persistedResult?.id ?? null,
          persistedResultKind: input.operationalResult?.resultKind ?? null,
        },
      });

      return {
        taskId: task.id,
        persistedResultId: persistedResult?.id ?? null,
        ...result,
      };
    } catch (error) {
      if (input.fallbackResult) {
        const fallback = input.fallbackResult(error);
        await this.completeTask(task.id, fallback);
        const persistedResult = operationalRun
          ? await this.persistSecuredOperationalResult({
              actor: input.user,
              task,
              run: operationalRun,
              result: fallback,
              capability: input.capability,
              config: input.operationalResult!,
              fallbackUsed: true,
              errorMessage: this.getErrorMessage(error),
            })
          : null;
        await this.audit.log({
          actorUserId: input.user.sub,
          projectId:
            input.contextEntityType === 'PROJECT' ? input.contextEntityId ?? null : null,
          entityType: 'RELU_TASK',
          entityId: task.id,
          action: `RELU_${input.capability.toUpperCase().replace(/-/g, '_')}_FALLBACK`,
          after: fallback,
          metadata: {
            message: this.getErrorMessage(error),
            accessMode: input.accessMode,
            contextEntityType: input.contextEntityType ?? null,
            contextEntityId: input.contextEntityId ?? null,
            fallbackUsed: true,
            persistedResultId: persistedResult?.id ?? null,
            persistedResultKind: input.operationalResult?.resultKind ?? null,
          },
        });

        return {
          taskId: task.id,
          persistedResultId: persistedResult?.id ?? null,
          ...fallback,
        };
      }

      await this.failTask(task.id, error);
      if (operationalRun) {
        await this.failOperationalRun(operationalRun.id, error);
      }
      await this.audit.log({
        actorUserId: input.user.sub,
        projectId:
          input.contextEntityType === 'PROJECT' ? input.contextEntityId ?? null : null,
        entityType: 'RELU_TASK',
        entityId: task.id,
        action: `RELU_${input.capability.toUpperCase().replace(/-/g, '_')}_FAILED`,
        metadata: {
          message: this.getErrorMessage(error),
        },
      });
      throw error;
    }
  }

  private buildOnboardingAssistantFallback(
    profile: any,
    completionPercentage: number,
    missingItems: string[],
    error: unknown,
  ) {
    const headline = profile.publicHeadline?.trim() || profile.displayName;
    const primaryAction =
      missingItems[0] ??
      'Review your public summary, taxonomy tags, and uploaded media before sending the profile for moderation.';
    const additionalActions = missingItems.slice(1, 3);
    const degradedReason = this.getErrorMessage(error);

    const lines = [
      `Profilul "${headline}" este la ${completionPercentage}% completare.`,
      `Pasul recomandat acum: ${primaryAction}.`,
    ];

    if (additionalActions.length) {
      lines.push(`Urmatoarele imbunatatiri utile: ${additionalActions.join('; ')}.`);
    }

    lines.push(
      'Sugestiile RELU sunt momentan generate in modul de continuitate, fara a suprascrie datele tale. Poti edita orice camp inainte de salvare sau moderare.',
    );
    lines.push(`Motiv tehnic degradat: ${degradedReason}.`);

    return lines.join(' ');
  }

  private async createTask(input: ReluTaskPayload) {
    return this.prisma.reluTask.create({
      data: {
        capability: input.capability,
        accessMode: input.accessMode,
        status: ReluTaskStatus.RUNNING,
        requestedByUserId: input.requestedByUserId ?? null,
        contextEntityType: input.contextEntityType ?? null,
        contextEntityId: input.contextEntityId ?? null,
        title: input.title,
        inputSummaryJson: input.inputSummary
          ? (input.inputSummary as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  private async completeTask(taskId: string, result: unknown) {
    await this.prisma.reluTask.update({
      where: { id: taskId },
      data: {
        status: ReluTaskStatus.COMPLETED,
        resultSummaryJson: result ? (result as Prisma.InputJsonValue) : Prisma.JsonNull,
        completedAt: new Date(),
      },
    });
  }

  private async failTask(taskId: string, error: unknown) {
    await this.prisma.reluTask.update({
      where: { id: taskId },
      data: {
        status: ReluTaskStatus.FAILED,
        errorMessage: this.getErrorMessage(error),
        completedAt: new Date(),
      },
    });
  }

  private async getOwnProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            identityProfile: true,
          },
        },
        country: true,
        region: true,
        city: true,
        languages: { include: { language: true } },
        documents: true,
        escoClassifications: { include: { escoSkill: true } },
        naceClassifications: { include: { nace: true } },
        uniclassClassifications: { include: { uniclass: true } },
        professionalProfile: true,
        contractorProfile: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for the current user');
    }

    return profile;
  }

  private async getAccessibleProfile(profileId: string | undefined, user: AuthenticatedUser) {
    if (!profileId) {
      return this.getOwnProfile(user.sub);
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          include: {
            identityProfile: true,
          },
        },
        country: true,
        region: true,
        city: true,
        languages: { include: { language: true } },
        documents: true,
        escoClassifications: { include: { escoSkill: true } },
        naceClassifications: { include: { nace: true } },
        uniclassClassifications: { include: { uniclass: true } },
        professionalProfile: true,
        contractorProfile: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (this.isAdminRole(user.role) || profile.userId === user.sub) {
      return profile;
    }

    if (
      profile.visibility === ProfileVisibility.PUBLIC &&
      profile.moderationStatus === ProfileModerationStatus.APPROVED &&
      profile.status === ProfileLifecycleStatus.LIVE
    ) {
      return profile;
    }

    throw new ForbiddenException('You do not have access to this profile');
  }

  private async getAccessibleProject(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        country: true,
        region: true,
        city: true,
        primaryLanguage: true,
        aiInterpretation: true,
        escoClassifications: { include: { escoSkill: true } },
        naceClassifications: { include: { nace: true } },
        uniclassClassifications: { include: { uniclass: true } },
        jobRequests: {
          include: {
            language: true,
            escoClassifications: { include: { escoSkill: true } },
            naceClassifications: { include: { nace: true } },
            uniclassClassifications: { include: { uniclass: true } },
          },
        },
        documents: true,
        conditions: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (this.isAdminRole(user.role) || project.createdById === user.sub) {
      return project;
    }

    if (
      project.visibility === ProjectVisibility.PUBLIC &&
      (project.status === ProjectStatus.PUBLISHED ||
        project.status === ProjectStatus.ACTIVE ||
        project.status === ProjectStatus.COMPLETED)
    ) {
      return project;
    }

    throw new ForbiddenException('You do not have access to this project');
  }

  private async getAccessibleContracts(contractId?: string) {
    return this.prisma.projectContract.findMany({
      where: contractId ? { id: contractId } : undefined,
      include: {
        project: true,
        profile: true,
        milestones: true,
        invoices: true,
        payments: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: contractId ? 1 : 12,
    });
  }

  private calculateProfileCompletion(profile: ProfileContext) {
    const checks = [
      Boolean(profile.displayName),
      Boolean(profile.summary || profile.description),
      Boolean(profile.countryId),
      Boolean(profile.logoUrl || profile.photoUrl),
      profile.languages.length > 0,
      profile.documents.length > 0,
      profile.escoClassifications.length > 0 ||
        profile.naceClassifications.length > 0 ||
        profile.uniclassClassifications.length > 0,
      Boolean(profile.publicHeadline || profile.professionalProfile?.headline),
      Boolean(profile.certificationsText),
    ];

    const completed = checks.filter(Boolean).length;
    return {
      percentage: Math.round((completed / checks.length) * 100),
      completedChecks: completed,
      totalChecks: checks.length,
    };
  }

  private getOnboardingMissingItems(profile: ProfileContext) {
    const items: string[] = [];

    if (!profile.countryId) {
      items.push('Set country, region, and city');
    }
    if (!profile.summary && !profile.description) {
      items.push('Add a company or professional summary');
    }
    if (!profile.logoUrl && !profile.photoUrl) {
      items.push('Upload a logo or profile photo');
    }
    if (profile.languages.length === 0) {
      items.push('Add at least one working language');
    }
    if (profile.documents.length === 0) {
      items.push('Upload at least one supporting document');
    }
    if (
      profile.escoClassifications.length === 0 &&
      profile.naceClassifications.length === 0 &&
      profile.uniclassClassifications.length === 0
    ) {
      items.push('Add ESCO, NACE, or Uniclass classifications');
    }
    if (!profile.certificationsText) {
      items.push('Describe certifications and compliance coverage');
    }

    return items;
  }

  private getPublicReadiness(profile: ProfileContext) {
    return {
      visibility: profile.visibility,
      moderationStatus: profile.moderationStatus,
      lifecycleStatus: profile.status,
      hasBanner: Boolean(profile.bannerUrl),
      hasPortfolio:
        this.parseStringList(profile.portfolioUrlsJson).length > 0 ||
        profile.documents.some((document) => document.assetKind === 'PORTFOLIO'),
      hasHeadline: Boolean(profile.publicHeadline || profile.professionalProfile?.headline),
      hasContact: Boolean(profile.publicEmail || profile.publicPhone),
    };
  }

  private toProfileSummary(profile: ProfileContext) {
    return {
      id: profile.id,
      profileType: profile.profileType,
      displayName: profile.displayName,
      companyName: profile.companyName,
      headline: profile.publicHeadline ?? profile.professionalProfile?.headline ?? null,
      summary: profile.summary,
      location: [profile.country?.name, profile.region?.name, profile.city?.name]
        .filter(Boolean)
        .join(', '),
      certificationsText: profile.certificationsText,
      supportedEngagementModels: this.parseStringList(profile.supportedEngagementModels),
      languages: profile.languages.map((item) => item.language.name),
      esco: profile.escoClassifications.map((item) => item.escoSkill.title),
      nace: profile.naceClassifications.map((item) => item.nace.code),
      uniclass: profile.uniclassClassifications.map((item) => item.uniclass.code),
      yearsExperience: profile.professionalProfile?.yearsExperience ?? null,
      documentsCount: profile.documents.length,
      visibility: profile.visibility,
      moderationStatus: profile.moderationStatus,
      lifecycleStatus: profile.status,
    };
  }

  private toProjectSummary(project: ProjectContext) {
    return {
      id: project.id,
      name: project.name,
      summary: project.summary,
      description: project.description,
      scopeOfWork: project.scopeOfWork,
      engagementModel: project.engagementModel,
      status: project.status,
      visibility: project.visibility,
      location: [project.country?.name, project.region?.name, project.city?.name]
        .filter(Boolean)
        .join(', '),
      budgetMinCents: project.budgetMinCents,
      budgetMaxCents: project.budgetMaxCents,
      currencyCode: project.currencyCode,
      primaryLanguage: project.primaryLanguage?.name ?? null,
      esco: project.escoClassifications.map((item) => item.escoSkill.title),
      nace: project.naceClassifications.map((item) => item.nace.code),
      uniclass: project.uniclassClassifications.map((item) => item.uniclass.code),
      conditions: project.conditions.map((condition) => condition.title),
      jobRequests: project.jobRequests.length,
    };
  }

  private buildTaxonomyOverlap(profile: ProfileContext, project: ProjectContext) {
    const profileEsco = new Set(profile.escoClassifications.map((item) => item.escoSkill.title.toLowerCase()));
    const projectEsco = new Set(project.escoClassifications.map((item) => item.escoSkill.title.toLowerCase()));
    const profileNace = new Set(profile.naceClassifications.map((item) => item.nace.code.toLowerCase()));
    const projectNace = new Set(project.naceClassifications.map((item) => item.nace.code.toLowerCase()));
    const profileUniclass = new Set(
      profile.uniclassClassifications.map((item) => item.uniclass.code.toLowerCase()),
    );
    const projectUniclass = new Set(
      project.uniclassClassifications.map((item) => item.uniclass.code.toLowerCase()),
    );

    return {
      escoMatches: [...profileEsco].filter((value) => projectEsco.has(value)),
      naceMatches: [...profileNace].filter((value) => projectNace.has(value)),
      uniclassMatches: [...profileUniclass].filter((value) => projectUniclass.has(value)),
      profileEscoCount: profileEsco.size,
      projectEscoCount: projectEsco.size,
      profileNaceCount: profileNace.size,
      projectNaceCount: projectNace.size,
      profileUniclassCount: profileUniclass.size,
      projectUniclassCount: projectUniclass.size,
    };
  }

  private calculateEligibility(
    profile: ProfileContext,
    project: ProjectContext,
    overlap: ReturnType<ReluService['buildTaxonomyOverlap']>,
  ) {
    const missingItems: string[] = [];
    let score = 0;
    let total = 5;

    if (overlap.escoMatches.length > 0 || overlap.naceMatches.length > 0 || overlap.uniclassMatches.length > 0) {
      score += 1;
    } else {
      missingItems.push('No taxonomy overlap yet');
    }

    if (profile.languages.length > 0 && project.primaryLanguageId) {
      const hasLanguage = profile.languages.some(
        (item) => item.language.id === project.primaryLanguageId,
      );
      if (hasLanguage) {
        score += 1;
      } else {
        missingItems.push('Primary project language not listed on the profile');
      }
    } else {
      total -= 1;
    }

    if (profile.countryId && project.countryId && profile.countryId === project.countryId) {
      score += 1;
    } else if (project.countryId) {
      missingItems.push('Location mismatch or missing location');
    } else {
      total -= 1;
    }

    const yearsExperience = profile.professionalProfile?.yearsExperience ?? 0;
    const requiredYears = Math.max(
      ...project.jobRequests
        .map((jobRequest) => jobRequest.requiredExperienceYears ?? 0)
        .concat(0),
    );

    if (requiredYears > 0) {
      if (yearsExperience >= requiredYears) {
        score += 1;
      } else {
        missingItems.push(`Experience below required ${requiredYears} years`);
      }
    } else {
      total -= 1;
    }

    const certificationGaps = this.calculateCertificationGaps(profile, project);
    if (certificationGaps.missingCertifications.length === 0) {
      score += 1;
    } else {
      missingItems.push('Certifications still missing');
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return {
      percentage,
      score,
      totalSignals: total,
      missingItems,
      matchedSignals: total - missingItems.length,
    };
  }

  private calculateCertificationGaps(profile: ProfileContext, project: ProjectContext) {
    const availableCertifications = this.parseStringList(profile.certificationsText).map((item) =>
      item.toLowerCase(),
    );

    const projectRequirements = [
      ...project.conditions.map((condition) => condition.title),
      ...project.jobRequests
        .filter((jobRequest) => jobRequest.requiresCertification)
        .map((jobRequest) => `${jobRequest.title} certification requirement`),
    ].filter(Boolean);

    const missingCertifications = projectRequirements.filter((requirement) => {
      const normalizedRequirement = requirement.toLowerCase();
      return !availableCertifications.some((certification) =>
        certification.includes(normalizedRequirement) ||
        normalizedRequirement.includes(certification),
      );
    });

    return {
      projectRequirements,
      availableCertifications,
      missingCertifications,
      satisfiedCertifications: projectRequirements.filter(
        (requirement) => !missingCertifications.includes(requirement),
      ),
    };
  }

  private buildFallbackQuestions(project: ProjectContext) {
    const firstJobRequest = project.jobRequests[0];
    const roleLabel = firstJobRequest?.title ?? project.name;

    return [
      {
        question: `Describe your relevant experience for ${roleLabel}.`,
        intent: 'Assess practical relevance and seniority.',
      },
      {
        question: 'Which certifications or safety credentials do you currently hold?',
        intent: 'Verify baseline compliance readiness.',
      },
      {
        question: 'How would you approach quality and risk management for this scope?',
        intent: 'Evaluate operational judgement.',
      },
    ];
  }

  private async buildRecommendations(
    profile: ProfileContext,
    projectId: string | undefined,
    user: AuthenticatedUser,
    limit: number,
  ) {
    if (
      profile.profileType === ProfileType.CONTRACTOR ||
      profile.profileType === ProfileType.GENERAL_CONTRACTOR ||
      profile.profileType === ProfileType.INVESTOR
    ) {
      const project = projectId ? await this.getAccessibleProject(projectId, user) : null;
      const profiles = await this.prisma.profile.findMany({
        where: {
          visibility: ProfileVisibility.PUBLIC,
          moderationStatus: ProfileModerationStatus.APPROVED,
          status: ProfileLifecycleStatus.LIVE,
          id: { not: profile.id },
        },
        include: {
          professionalProfile: true,
          contractorProfile: true,
          escoClassifications: { include: { escoSkill: true } },
          naceClassifications: { include: { nace: true } },
          uniclassClassifications: { include: { uniclass: true } },
        },
        take: limit * 2,
      });

      return profiles
        .map((candidate) => {
          const score = project
            ? this.scoreProfileForProject(candidate, project)
            : candidate.escoClassifications.length +
              candidate.naceClassifications.length +
              candidate.uniclassClassifications.length;

          return {
            entityType: 'PROFILE',
            entityId: candidate.id,
            title: candidate.displayName,
            subtitle: candidate.publicHeadline ?? candidate.companyName ?? candidate.profileType,
            score,
          };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
    }

    const posts = await this.prisma.publicPost.findMany({
      where: {
        type: { in: [PublicPostType.PROJECT, PublicPostType.SUBCONTRACTOR_POOL] },
        moderationStatus: PublicModerationStatus.APPROVED,
        visibility: 'PUBLIC',
        status: 'LIVE',
      },
      include: {
        country: true,
        region: true,
        city: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit * 2,
    });

    return posts
      .map((post) => ({
        entityType: 'PUBLIC_POST',
        entityId: post.id,
        title: post.title,
        subtitle: `${post.type} - ${post.location}`,
        score: this.scorePublicPostForProfile(post, profile),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private buildContractSignals(contracts: ContractContext[]) {
    const now = Date.now();

    return contracts.map((contract) => {
      const overdueMilestones = contract.milestones.filter(
        (milestone) =>
          milestone.dueDate &&
          milestone.status !== 'COMPLETED' &&
          milestone.dueDate.getTime() < now,
      ).length;

      const unpaidInvoices = contract.invoices.filter((invoice) => invoice.status !== 'PAID').length;
      const pendingPayments = contract.payments.filter((payment) => payment.status !== 'RELEASED').length;

      return {
        contractId: contract.id,
        title: contract.title,
        status: contract.status,
        overdueMilestones,
        unpaidInvoices,
        pendingPayments,
        nextEndDate: contract.endDate,
      };
    });
  }

  private scoreProfileForProject(
    profile: Prisma.ProfileGetPayload<{
      include: {
        professionalProfile: true;
        contractorProfile: true;
        escoClassifications: { include: { escoSkill: true } };
        naceClassifications: { include: { nace: true } };
        uniclassClassifications: { include: { uniclass: true } };
      };
    }>,
    project: ProjectContext,
  ) {
    const profileTags = new Set([
      ...profile.escoClassifications.map((item) => item.escoSkill.title.toLowerCase()),
      ...profile.naceClassifications.map((item) => item.nace.code.toLowerCase()),
      ...profile.uniclassClassifications.map((item) => item.uniclass.code.toLowerCase()),
    ]);
    const projectTags = [
      ...project.escoClassifications.map((item) => item.escoSkill.title.toLowerCase()),
      ...project.naceClassifications.map((item) => item.nace.code.toLowerCase()),
      ...project.uniclassClassifications.map((item) => item.uniclass.code.toLowerCase()),
    ];

    return projectTags.filter((tag) => profileTags.has(tag)).length;
  }

  private scorePublicPostForProfile(
    post: Prisma.PublicPostGetPayload<{ include: { country: true; region: true; city: true } }>,
    profile: ProfileContext,
  ) {
    const postTags = [
      ...this.parseStringList(post.escoCodesJson),
      ...this.parseStringList(post.naceCodesJson),
      ...this.parseStringList(post.uniclassCodesJson),
      ...this.parseStringList(post.languageCodesJson),
    ].map((item) => item.toLowerCase());

    const profileTags = new Set([
      ...profile.escoClassifications.map((item) => item.escoSkill.code.toLowerCase()),
      ...profile.naceClassifications.map((item) => item.nace.code.toLowerCase()),
      ...profile.uniclassClassifications.map((item) => item.uniclass.code.toLowerCase()),
      ...profile.languages.map((item) => item.language.code.toLowerCase()),
    ]);

    let score = postTags.filter((tag) => profileTags.has(tag)).length;

    if (profile.countryId && post.countryId && profile.countryId === post.countryId) {
      score += 1;
    }

    if (post.experienceLabel && profile.professionalProfile?.yearsExperience) {
      score += 1;
    }

    return score;
  }

  private async createProcessingRun(input: {
    taskId?: string | null;
    sourceType: ReluSourceType;
    sourceId: string;
    userId?: string | null;
    triggeredByUserId?: string | null;
    domain: ReluProcessingDomain;
    inputSnapshot?: unknown;
  }) {
    return this.prisma.reluProcessingRun.create({
      data: {
        taskId: input.taskId ?? null,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        userId: input.userId ?? null,
        triggeredByUserId: input.triggeredByUserId ?? null,
        domain: input.domain,
        status: ReluResultStatus.RUNNING,
        inputSnapshot: input.inputSnapshot
          ? (input.inputSnapshot as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  private async failOperationalRun(runId: string, error: unknown) {
    await this.prisma.reluProcessingRun.update({
      where: { id: runId },
      data: {
        status: ReluResultStatus.FAILED,
        errorMessage: this.getErrorMessage(error),
        completedAt: new Date(),
      },
    });
  }

  private async persistSecuredOperationalResult<T>(input: {
    actor: AuthenticatedUser;
    task: { id: string; capability: string };
    run: {
      id: string;
      sourceType: ReluSourceType;
      sourceId: string;
      userId?: string | null;
      domain: ReluProcessingDomain;
    };
    result: T;
    capability: string;
    config: SecuredOperationalResultInput<T>;
    fallbackUsed: boolean;
    errorMessage?: string | null;
  }) {
    const outputData = input.config.outputData
      ? input.config.outputData(input.result)
      : (input.result as Record<string, unknown>);
    const explanation =
      input.config.explanation?.(input.result) ??
      (typeof outputData.response === 'string'
        ? outputData.response.slice(0, 500)
        : `Relu ${input.capability} persisted operationally.`);
    const score = input.config.score?.(input.result) ?? null;
    const compatibilityPercent = input.config.compatibilityPercent?.(input.result) ?? null;
    const recommendedAction = input.config.recommendedAction?.(input.result) ?? null;
    const status = input.fallbackUsed ? ReluResultStatus.FAILED : ReluResultStatus.COMPLETED;

    await this.prisma.reluProcessingRun.update({
      where: { id: input.run.id },
      data: {
        status,
        outputData: outputData as Prisma.InputJsonValue,
        score,
        explanation,
        fallbackUsed: input.fallbackUsed,
        errorMessage: input.errorMessage ?? null,
        completedAt: new Date(),
      },
    });

    let persistedResult: any;
    if (input.config.resultKind === 'classification') {
      persistedResult = await this.prisma.reluClassificationResult.create({
        data: {
          runId: input.run.id,
          sourceType: input.run.sourceType,
          sourceId: input.run.sourceId,
          userId: input.run.userId ?? null,
          domain: input.run.domain,
          status,
          inputSnapshot: (input.config.inputSnapshot ?? input.task) as Prisma.InputJsonValue,
          outputData: outputData as Prisma.InputJsonValue,
          score,
          explanation,
          fallbackUsed: input.fallbackUsed,
          errorMessage: input.errorMessage ?? null,
        },
        include: this.classificationInclude,
      });
    } else if (input.config.resultKind === 'match') {
      persistedResult = await this.prisma.reluMatchResult.create({
        data: {
          runId: input.run.id,
          sourceType: input.run.sourceType,
          sourceId: input.run.sourceId,
          userId: input.run.userId ?? null,
          targetSourceType: input.config.targetSourceType ?? null,
          targetSourceId: input.config.targetSourceId ?? null,
          domain: input.run.domain,
          status,
          inputSnapshot: (input.config.inputSnapshot ?? input.task) as Prisma.InputJsonValue,
          outputData: outputData as Prisma.InputJsonValue,
          score,
          compatibilityPercent,
          explanation,
          fallbackUsed: input.fallbackUsed,
          errorMessage: input.errorMessage ?? null,
        },
        include: this.matchInclude,
      });
    } else {
      persistedResult = await this.prisma.reluRecommendation.create({
        data: {
          runId: input.run.id,
          sourceType: input.run.sourceType,
          sourceId: input.run.sourceId,
          userId: input.run.userId ?? null,
          targetSourceType: input.config.targetSourceType ?? null,
          targetSourceId: input.config.targetSourceId ?? null,
          domain: input.run.domain,
          status,
          inputSnapshot: (input.config.inputSnapshot ?? input.task) as Prisma.InputJsonValue,
          outputData: outputData as Prisma.InputJsonValue,
          score,
          explanation,
          recommendedAction,
          fallbackUsed: input.fallbackUsed,
          errorMessage: input.errorMessage ?? null,
        },
        include: this.recommendationInclude,
      });
    }

    await this.audit.log({
      actorUserId: input.actor.sub,
      entityType:
        input.config.resultKind === 'classification'
          ? 'RELU_CLASSIFICATION_RESULT'
          : input.config.resultKind === 'match'
            ? 'RELU_MATCH_RESULT'
            : 'RELU_RECOMMENDATION',
      entityId: persistedResult.id,
      action:
        input.config.auditAction ??
        `RELU_${input.capability.toUpperCase().replace(/-/g, '_')}_RESULT_PERSISTED`,
      after: {
        runId: input.run.id,
        taskId: input.task.id,
        status,
        fallbackUsed: input.fallbackUsed,
      },
      metadata: {
        correctionTrailPreserved: true,
        sourceType: input.run.sourceType,
        sourceId: input.run.sourceId,
        targetSourceType: input.config.targetSourceType ?? null,
        targetSourceId: input.config.targetSourceId ?? null,
        domain: input.run.domain,
      },
    });

    return persistedResult;
  }

  private async persistOperationalResult(input: {
    actor: AuthenticatedUser;
    task: { id: string; capability: string };
    run: { id: string; sourceType: ReluSourceType; sourceId: string; userId?: string | null; domain: ReluProcessingDomain };
    resultKind: 'classification' | 'match';
    resultInput: unknown;
    resultData: Record<string, unknown>;
    explanation?: string | null;
    score?: number | null;
    compatibilityPercent?: number | null;
    targetSourceType?: ReluSourceType | null;
    targetSourceId?: string | null;
    fallbackMessage: string;
    auditAction: string;
  }) {
    const fallbackUsed = !this.isGeminiAvailable();
    const status = fallbackUsed ? ReluResultStatus.FAILED : ReluResultStatus.COMPLETED;
    const errorMessage = fallbackUsed ? 'GEMINI_API_KEY not set' : null;

    await this.prisma.reluProcessingRun.update({
      where: { id: input.run.id },
      data: {
        status,
        outputData: input.resultData as Prisma.InputJsonValue,
        score: input.score ?? null,
        explanation:
          input.explanation ??
          (fallbackUsed ? input.fallbackMessage : 'Relu processing completed successfully.'),
        fallbackUsed,
        errorMessage,
        completedAt: new Date(),
      },
    });

    let persistedResult: any;
    if (input.resultKind === 'classification') {
      persistedResult = await this.prisma.reluClassificationResult.create({
        data: {
          runId: input.run.id,
          sourceType: input.run.sourceType,
          sourceId: input.run.sourceId,
          userId: input.run.userId ?? null,
          domain: input.run.domain,
          status,
          inputSnapshot: input.resultInput as Prisma.InputJsonValue,
          outputData: input.resultData as Prisma.InputJsonValue,
          score: input.score ?? null,
          explanation:
            input.explanation ??
            (fallbackUsed ? input.fallbackMessage : 'Relu classification completed successfully.'),
          fallbackUsed,
          errorMessage,
        },
        include: this.classificationInclude,
      });
    } else {
      persistedResult = await this.prisma.reluMatchResult.create({
        data: {
          runId: input.run.id,
          sourceType: input.run.sourceType,
          sourceId: input.run.sourceId,
          userId: input.run.userId ?? null,
          targetSourceType: input.targetSourceType ?? null,
          targetSourceId: input.targetSourceId ?? null,
          domain: input.run.domain,
          status,
          inputSnapshot: input.resultInput as Prisma.InputJsonValue,
          outputData: input.resultData as Prisma.InputJsonValue,
          score: input.score ?? null,
          compatibilityPercent: input.compatibilityPercent ?? null,
          explanation:
            input.explanation ??
            (fallbackUsed ? input.fallbackMessage : 'Relu matching completed successfully.'),
          fallbackUsed,
          errorMessage,
        },
        include: this.matchInclude,
      });
    }

    if (fallbackUsed) {
      await this.failTask(input.task.id, input.fallbackMessage);
    } else {
      await this.completeTask(input.task.id, input.resultData);
    }

    await this.audit.log({
      actorUserId: input.actor.sub,
      entityType: input.resultKind === 'classification' ? 'RELU_CLASSIFICATION_RESULT' : 'RELU_MATCH_RESULT',
      entityId: persistedResult.id,
      action: input.auditAction,
      after: {
        runId: input.run.id,
        status,
        fallbackUsed,
      },
      metadata: {
        sourceType: input.run.sourceType,
        sourceId: input.run.sourceId,
        domain: input.run.domain,
      },
    });

    return input.resultKind === 'classification'
      ? this.toClassificationResponse(persistedResult)
      : this.toMatchResponse(persistedResult);
  }

  private isGeminiAvailable() {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  }

  private assertAdminActor(actor: AuthenticatedUser) {
    if (!this.isAdminRole(actor.role)) {
      throw new ForbiddenException('Admin access is required');
    }
  }

  private async getPublicPostContext(postId: string) {
    const post = await this.prisma.publicPost.findUnique({
      where: { id: postId },
      include: {
        authorUser: true,
        authorProfile: true,
        country: true,
        region: true,
        city: true,
        media: true,
        documents: true,
        externalLinks: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Public post not found');
    }

    return post as PublicPostContext;
  }

  private canReadPublicPostResults(post: PublicPostContext, actor?: AuthenticatedUser | null) {
    if (
      post.visibility === 'PUBLIC' &&
      post.moderationStatus === PublicModerationStatus.APPROVED &&
      post.status === 'LIVE'
    ) {
      return true;
    }

    if (!actor) {
      return false;
    }

    if (this.isAdminRole(actor.role)) {
      return true;
    }

    return post.authorUserId === actor.sub;
  }

  private buildPublicPostSnapshot(post: PublicPostContext) {
    return {
      id: post.id,
      slug: post.slug,
      type: post.type,
      title: post.title,
      summary: post.summary,
      description: post.description,
      domain: post.domain,
      location: post.location,
      visibility: post.visibility,
      moderationStatus: post.moderationStatus,
      existingClassification: post.classificationJson,
      escoCodes: this.parseStringList(post.escoCodesJson),
      naceCodes: this.parseStringList(post.naceCodesJson),
      uniclassCodes: this.parseStringList(post.uniclassCodesJson),
      languageCodes: this.parseStringList(post.languageCodesJson),
      certifications: post.certifications,
      mediaCount: post.media.length,
      documentCount: post.documents.length,
      externalLinks: post.externalLinks.map((item) => ({
        id: item.id,
        url: item.url,
        status: item.securityStatus,
      })),
    };
  }

  private buildPublicPostInterpretation(post: PublicPostContext) {
    const base = this.buildPublicPostClassification(post);
    return {
      ...base,
      moderationHints: [
        ...base.moderationHints,
        ...(post.externalLinks.some((item) => String(item.url).startsWith('http://'))
          ? ['External link uses HTTP and should be reviewed.']
          : []),
      ],
      explanation: `Relu interpreted "${post.title}" as a ${post.type.toLowerCase()} opportunity in ${post.domain}.`,
    };
  }

  private buildPublicPostClassification(post: PublicPostContext) {
    const sourceText = [
      post.title,
      post.summary ?? '',
      post.description,
      post.domain,
      post.location,
      post.certifications,
      post.certificationsOffered ?? '',
      ...this.parseStringList(post.escoCodesJson),
      ...this.parseStringList(post.naceCodesJson),
      ...this.parseStringList(post.uniclassCodesJson),
    ]
      .filter(Boolean)
      .join(' ');

    const escoCandidates = this.findTaxonomyCandidates(TaxonomyType.ESCO, sourceText, 5);
    const naceCandidates = this.findTaxonomyCandidates(TaxonomyType.NACE, sourceText, 5);
    const uniclassCandidates = this.findTaxonomyCandidates(TaxonomyType.UNICLASS, sourceText, 5);
    const extractedRequirements = this.extractRequirementsText(sourceText);
    const moderationHints = this.extractModerationHints(post.title, post.description);
    const missingInformation = [
      !post.summary ? 'Short summary is missing.' : null,
      !post.countryId && !post.location ? 'No structured location information is available.' : null,
      !post.certifications ? 'No certification requirements were provided.' : null,
    ].filter((item): item is string => Boolean(item));

    return {
      sourceType: ReluSourceType.PUBLIC_POST,
      sourceId: post.id,
      naceCandidates,
      escoCandidates,
      uniclassCandidates,
      categoryConfidence: this.calculateConfidence(escoCandidates, naceCandidates, uniclassCandidates),
      extractedRequirements,
      locationSignals: this.extractLocationSignals(post.location),
      missingInformation,
      moderationHints,
      explanation: `Relu mapped "${post.title}" to ${naceCandidates[0]?.code ?? 'unmapped NACE'}, ${escoCandidates[0]?.code ?? 'unmapped ESCO'}, and ${uniclassCandidates[0]?.code ?? 'unmapped Uniclass'}.`,
    };
  }

  private buildProfileEnrichment(profile: ProfileContext) {
    const classification = this.buildProfileClassification(profile);
    return {
      ...classification,
      missingInformation: [
        ...classification.missingInformation,
        ...(profile.documents.length === 0 ? ['No supporting profile documents are attached yet.'] : []),
      ],
      explanation: `Relu enriched profile "${profile.displayName}" using public summary, classifications, languages, and supporting documents.`,
    };
  }

  private buildProfileClassification(profile: ProfileContext) {
    const sourceText = [
      profile.displayName,
      profile.companyName ?? '',
      profile.publicHeadline ?? '',
      profile.summary ?? '',
      profile.description ?? '',
      profile.certificationsText ?? '',
      profile.contractorProfile?.tradeFocus ?? '',
      profile.professionalProfile?.headline ?? '',
      ...profile.documents.map((document) => document.extractedText ?? ''),
      ...profile.escoClassifications.map((item) => item.escoSkill.code),
      ...profile.naceClassifications.map((item) => item.nace.code),
      ...profile.uniclassClassifications.map((item) => item.uniclass.code),
    ]
      .filter(Boolean)
      .join(' ');

    const escoCandidates = this.findTaxonomyCandidates(TaxonomyType.ESCO, sourceText, 5);
    const naceCandidates = this.findTaxonomyCandidates(TaxonomyType.NACE, sourceText, 5);
    const uniclassCandidates = this.findTaxonomyCandidates(TaxonomyType.UNICLASS, sourceText, 5);

    return {
      sourceType: ReluSourceType.PROFILE,
      sourceId: profile.id,
      naceCandidates,
      escoCandidates,
      uniclassCandidates,
      categoryConfidence: this.calculateConfidence(escoCandidates, naceCandidates, uniclassCandidates),
      extractedRequirements: this.extractRequirementsText(sourceText),
      locationSignals: this.extractLocationSignals(
        [profile.city?.name, profile.region?.name, profile.country?.name].filter(Boolean).join(', '),
      ),
      missingInformation: [
        !profile.summary ? 'Profile summary is missing.' : null,
        !profile.countryId ? 'Structured country mapping is missing.' : null,
        profile.languages.length === 0 ? 'No working languages are configured.' : null,
      ].filter((item): item is string => Boolean(item)),
      moderationHints: [],
      explanation: `Relu mapped "${profile.displayName}" to dominant ESCO/NACE/Uniclass candidates using profile and document context.`,
    };
  }

  private buildPublicPostMatch(post: PublicPostContext, profile: ProfileContext) {
    const postCodes = {
      esco: this.parseStringList(post.escoCodesJson),
      nace: this.parseStringList(post.naceCodesJson),
      uniclass: this.parseStringList(post.uniclassCodesJson),
      languages: this.parseStringList(post.languageCodesJson),
    };
    const profileCodes = {
      esco: profile.escoClassifications.map((item) => item.escoSkill.code),
      nace: profile.naceClassifications.map((item) => item.nace.code),
      uniclass: profile.uniclassClassifications.map((item) => item.uniclass.code),
      languages: profile.languages.map((item) => item.language.code),
    };

    const matchedSkills = this.intersectStrings(postCodes.esco, profileCodes.esco);
    const missingSkills = postCodes.esco.filter((item) => !profileCodes.esco.includes(item));
    const taxonomyOverlap = {
      esco: matchedSkills,
      nace: this.intersectStrings(postCodes.nace, profileCodes.nace),
      uniclass: this.intersectStrings(postCodes.uniclass, profileCodes.uniclass),
      languages: this.intersectStrings(postCodes.languages, profileCodes.languages),
    };

    const locationFit = this.calculateLocationFit(post, profile);
    const verificationFit =
      profile.user?.identityProfile?.verificationStatus === 'VERIFIED'
        ? 'VERIFIED'
        : 'UNVERIFIED';

    let compatibilityPercent = 30;
    compatibilityPercent += Math.min(25, matchedSkills.length * 8);
    compatibilityPercent += Math.min(15, taxonomyOverlap.nace.length * 6);
    compatibilityPercent += Math.min(15, taxonomyOverlap.uniclass.length * 6);
    compatibilityPercent += locationFit.score;
    compatibilityPercent += taxonomyOverlap.languages.length > 0 ? 10 : 0;
    compatibilityPercent += verificationFit === 'VERIFIED' ? 5 : 0;
    compatibilityPercent = Math.min(100, compatibilityPercent);

    const recommendedNextAction =
      compatibilityPercent >= 75
        ? 'Invite candidate to private conversation.'
        : compatibilityPercent >= 50
          ? 'Request missing certifications and confirm availability.'
          : 'Keep for manual review after profile enrichment.';

    return {
      compatibilityPercent,
      matchedSkills,
      missingSkills,
      taxonomyOverlap,
      locationFit: locationFit.label,
      verificationFit,
      entitlementAwareness: 'No subscription blocking rule applied to Relu scoring.',
      explanation: `Relu found ${matchedSkills.length} matched ESCO skills and a ${locationFit.label.toLowerCase()} location fit for "${profile.displayName}".`,
      recommendedNextAction,
    };
  }

  private calculateLocationFit(post: PublicPostContext, profile: ProfileContext) {
    if (post.cityId && profile.cityId && post.cityId === profile.cityId) {
      return { score: 15, label: 'STRONG' };
    }

    if (post.regionId && profile.regionId && post.regionId === profile.regionId) {
      return { score: 10, label: 'GOOD' };
    }

    if (post.countryId && profile.countryId && post.countryId === profile.countryId) {
      return { score: 6, label: 'PARTIAL' };
    }

    return { score: 0, label: 'WEAK' };
  }

  private findTaxonomyCandidates(type: TaxonomyType, sourceText: string, limit = 5) {
    const normalized = sourceText.toLowerCase();
    const tokens = Array.from(
      new Set(
        normalized
          .split(/[^a-z0-9]+/i)
          .map((item) => item.trim())
          .filter((item) => item.length >= 3),
      ),
    );

    const catalog = this.taxonomyKeywordCatalog[type];

    return catalog
      .map((entry) => {
        const haystack = `${entry.code} ${entry.label} ${entry.labelEn}`.toLowerCase();
        const score = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
        return {
          ...entry,
          confidence: Math.min(1, tokens.length > 0 ? score / Math.max(tokens.length, 1) : 0),
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || right.confidence - left.confidence)
      .slice(0, limit)
      .map(({ code, label, labelEn, confidence }) => ({
        code,
        label,
        labelEn,
        confidence,
      }));
  }

  private extractRequirementsText(sourceText: string) {
    const normalized = sourceText.toLowerCase();
    const rules = [
      { keyword: 'safety', label: 'Safety compliance evidence' },
      { keyword: 'permit', label: 'Permit handling experience' },
      { keyword: 'commissioning', label: 'Commissioning experience' },
      { keyword: 'qa', label: 'Quality assurance experience' },
      { keyword: 'insurance', label: 'Insurance readiness' },
      { keyword: 'fiber', label: 'Fiber / structured cabling experience' },
      { keyword: 'hvac', label: 'HVAC delivery exposure' },
      { keyword: 'automation', label: 'Automation / controls knowledge' },
    ];

    return rules
      .filter((item) => normalized.includes(item.keyword))
      .map((item) => item.label);
  }

  private extractModerationHints(title: string, description: string) {
    const text = `${title} ${description}`.toLowerCase();
    const hints: string[] = [];

    if (text.includes('whatsapp') || text.includes('telegram')) {
      hints.push('Contains direct off-platform contact hint.');
    }

    if (text.includes('urgent payment') || text.includes('wire transfer')) {
      hints.push('Contains financial urgency language that may require review.');
    }

    if (/\bhttp:\/\//i.test(text)) {
      hints.push('Contains insecure HTTP link text.');
    }

    return hints;
  }

  private extractLocationSignals(location: string) {
    return location
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  private calculateConfidence(
    escoCandidates: Array<{ confidence?: number }>,
    naceCandidates: Array<{ confidence?: number }>,
    uniclassCandidates: Array<{ confidence?: number }>,
  ) {
    const values = [
      escoCandidates[0]?.confidence ?? 0,
      naceCandidates[0]?.confidence ?? 0,
      uniclassCandidates[0]?.confidence ?? 0,
    ];

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }

  private intersectStrings(left: string[], right: string[]) {
    const rightSet = new Set(right.map((item) => item.toLowerCase()));
    return left.filter((item) => rightSet.has(item.toLowerCase()));
  }

  private async findResultRecord(resultId: string) {
    const classification = await this.prisma.reluClassificationResult.findUnique({
      where: { id: resultId },
      include: this.classificationInclude,
    });

    if (classification) {
      return {
        kind: 'classification',
        entityType: 'RELU_CLASSIFICATION_RESULT',
        delegate: this.prisma.reluClassificationResult,
        include: this.classificationInclude,
        serializer: (value: any) => this.toClassificationResponse(value),
      } as const;
    }

    const match = await this.prisma.reluMatchResult.findUnique({
      where: { id: resultId },
      include: this.matchInclude,
    });

    if (match) {
      return {
        kind: 'match',
        entityType: 'RELU_MATCH_RESULT',
        delegate: this.prisma.reluMatchResult,
        include: this.matchInclude,
        serializer: (value: any) => this.toMatchResponse(value),
      } as const;
    }

    const recommendation = await this.prisma.reluRecommendation.findUnique({
      where: { id: resultId },
      include: this.recommendationInclude,
    });

    if (recommendation) {
      return {
        kind: 'recommendation',
        entityType: 'RELU_RECOMMENDATION',
        delegate: this.prisma.reluRecommendation,
        include: this.recommendationInclude,
        serializer: (value: any) => this.toRecommendationResponse(value),
      } as const;
    }

    return null;
  }

  private toRunResponse(run: any) {
    return {
      id: run.id,
      taskId: run.taskId,
      sourceType: run.sourceType,
      sourceId: run.sourceId,
      userId: run.userId,
      triggeredByUserId: run.triggeredByUserId,
      domain: run.domain,
      status: run.status,
      inputSnapshot: run.inputSnapshot,
      outputData: run.outputData,
      score: run.score,
      explanation: run.explanation,
      fallbackUsed: run.fallbackUsed,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      completedAt: run.completedAt,
      task: run.task ?? null,
      user: run.user ?? null,
      triggeredBy: run.triggeredBy ?? null,
    };
  }

  private toClassificationResponse(result: any) {
    return {
      kind: 'classification',
      id: result.id,
      runId: result.runId,
      sourceType: result.sourceType,
      sourceId: result.sourceId,
      userId: result.userId,
      domain: result.domain,
      status: result.status,
      inputSnapshot: result.inputSnapshot,
      outputData: result.outputData,
      score: result.score,
      explanation: result.explanation,
      overrideData: result.overrideData,
      fallbackUsed: result.fallbackUsed,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      reviewedAt: result.reviewedAt,
      reviewedBy: result.reviewedBy ?? null,
      run: result.run ? this.toRunResponse(result.run) : null,
    };
  }

  private toMatchResponse(result: any) {
    return {
      kind: 'match',
      id: result.id,
      runId: result.runId,
      sourceType: result.sourceType,
      sourceId: result.sourceId,
      targetSourceType: result.targetSourceType,
      targetSourceId: result.targetSourceId,
      userId: result.userId,
      domain: result.domain,
      status: result.status,
      inputSnapshot: result.inputSnapshot,
      outputData: result.outputData,
      score: result.score,
      compatibilityPercent: result.compatibilityPercent,
      explanation: result.explanation,
      overrideData: result.overrideData,
      fallbackUsed: result.fallbackUsed,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      reviewedAt: result.reviewedAt,
      reviewedBy: result.reviewedBy ?? null,
      run: result.run ? this.toRunResponse(result.run) : null,
    };
  }

  private toRecommendationResponse(result: any) {
    return {
      kind: 'recommendation',
      id: result.id,
      runId: result.runId,
      sourceType: result.sourceType,
      sourceId: result.sourceId,
      targetSourceType: result.targetSourceType,
      targetSourceId: result.targetSourceId,
      userId: result.userId,
      domain: result.domain,
      status: result.status,
      inputSnapshot: result.inputSnapshot,
      outputData: result.outputData,
      score: result.score,
      explanation: result.explanation,
      recommendedAction: result.recommendedAction,
      overrideData: result.overrideData,
      fallbackUsed: result.fallbackUsed,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      reviewedAt: result.reviewedAt,
      reviewedBy: result.reviewedBy ?? null,
      run: result.run ? this.toRunResponse(result.run) : null,
    };
  }

  private readonly runInclude = {
    task: true,
    user: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    triggeredBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } as const;

  private readonly classificationInclude = {
    run: {
      include: {
        task: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } as const;

  private readonly matchInclude = {
    run: {
      include: {
        task: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } as const;

  private readonly recommendationInclude = {
    run: {
      include: {
        task: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } as const;

  private readonly taxonomyKeywordCatalog: Record<
    TaxonomyType,
    Array<{ code: string; label: string; labelEn: string }>
  > = {
    [TaxonomyType.ESCO]: [
      { code: '7412.1', label: 'Electrician', labelEn: 'Electrician' },
      { code: '3114.2', label: 'Electronics technician', labelEn: 'Electronics technician' },
      { code: '7126.1', label: 'Plumber', labelEn: 'Plumber' },
      { code: '2142.4', label: 'Civil engineer', labelEn: 'Civil engineer' },
      { code: '2141.8', label: 'Industrial engineer', labelEn: 'Industrial engineer' },
      { code: '4321.5', label: 'HVAC technician', labelEn: 'HVAC technician' },
      { code: '3513.2', label: 'ICT cabling technician', labelEn: 'ICT cabling technician' },
    ],
    [TaxonomyType.NACE]: [
      { code: '41.20', label: 'Construction of residential and non-residential buildings', labelEn: 'Building construction' },
      { code: '42.22', label: 'Construction of utility projects for electricity and telecommunications', labelEn: 'Utility telecom construction' },
      { code: '43.21', label: 'Electrical installation', labelEn: 'Electrical installation' },
      { code: '43.22', label: 'Plumbing, heat and air-conditioning installation', labelEn: 'HVAC installation' },
      { code: '62.03', label: 'Computer facilities management activities', labelEn: 'ICT operations' },
    ],
    [TaxonomyType.UNICLASS]: [
      { code: 'Pr_65_53', label: 'Communications systems', labelEn: 'Communications systems' },
      { code: 'Pr_75_50', label: 'Electrical systems', labelEn: 'Electrical systems' },
      { code: 'Pr_65_36', label: 'Heating, ventilation and air conditioning systems', labelEn: 'HVAC systems' },
      { code: 'Pr_20_85', label: 'Civil engineering works', labelEn: 'Civil engineering works' },
      { code: 'Pr_75_76', label: 'Security and access systems', labelEn: 'Security systems' },
    ],
  };

  private parseStringList(value: string | null | undefined) {
    return (value ?? '')
      .split(/[\n,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private isAdminRole(role: string) {
    return role === Role.ADMIN || role === Role.SUPERADMIN;
  }

  private async findOperationalAdminUser(): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        role: { in: [Role.ADMIN, Role.SUPERADMIN] },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!user) {
      return null;
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown Relu AI error';
  }
}
