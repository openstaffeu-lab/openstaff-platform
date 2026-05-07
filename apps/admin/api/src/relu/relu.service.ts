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
  ReluTaskStatus,
  Role,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { GeminiService } from '../gemini/gemini.service';
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

type ContractContext = Prisma.ProjectContractGetPayload<{
  include: {
    project: true;
    profile: true;
    milestones: true;
    invoices: true;
    payments: true;
  };
}>;

@Injectable()
export class ReluService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly audit: AuditService,
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

    try {
      const execution = await this.gemini.executeAgent({
        agentType: input.agentType,
        userMessage: input.userMessage,
        contextBlocks: input.contextBlocks,
      });

      const result = input.resultTransformer(execution.response);
      await this.completeTask(task.id, result);
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
        },
      });

      return { taskId: task.id, ...result };
    } catch (error) {
      await this.failTask(task.id, error);
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
