import { Injectable, Logger } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { PrismaService } from '../prisma/prisma.service';

type GeminiHistory = { role: 'user' | 'model'; parts: string }[];

type AgentExecutionInput = {
  agentType: AgentType;
  userMessage: string;
  history?: GeminiHistory;
  contextBlocks?: string[];
  temperatureOverride?: number;
};

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const DEFAULT_AGENT_DEFINITIONS: Array<{
  name: string;
  type: AgentType;
  description: string;
  accessMode: 'PUBLIC_LIMITED' | 'AUTHENTICATED_USER' | 'ADMIN_SECURED';
  publicEnabled: boolean;
  temperature: number;
  systemPrompt: string;
  policyJson: Record<string, unknown>;
}> = [
  {
    name: 'Relu Public Assistant',
    type: 'CHATBOT_PUBLIC',
    description:
      'Answers only generic OpenStaff platform questions without using secured profile, project, or contract data.',
    accessMode: 'PUBLIC_LIMITED',
    publicEnabled: true,
    temperature: 0.3,
    systemPrompt:
      'You are Relu AI in restricted public mode. Answer only generic OpenStaff platform questions, onboarding basics, public taxonomy concepts, and safe marketplace guidance. Never reveal or infer private user, profile, project, contract, message, moderation, or compliance data. If asked for protected data, say authentication is required.',
    policyJson: {
      allowSecuredContext: false,
      allowedDomains: ['public-platform-help', 'public-taxonomy-help'],
      blockedDomains: [
        'private-profile-data',
        'project-private-data',
        'contract-sensitive-data',
        'messages',
      ],
    },
  },
  {
    name: 'Relu Onboarding Assistant',
    type: 'ONBOARDING_ASSISTANT',
    description:
      'Guides authenticated users through account, profile, and compliance onboarding.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.35,
    systemPrompt:
      'You are Relu AI for authenticated onboarding. Use only secured OpenStaff data supplied in context. Produce concise next-step guidance, highlight missing fields, and never expose data from any other user.',
    policyJson: {
      allowSecuredContext: true,
      allowedDomains: ['own-profile', 'own-onboarding', 'own-compliance'],
    },
  },
  {
    name: 'Relu Profile Completion Assistant',
    type: 'PROFILE_COMPLETION_ASSISTANT',
    description:
      'Suggests profile improvements, missing data, and better public positioning for the current user.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.4,
    systemPrompt:
      'You are Relu AI for profile completion. Improve clarity, completeness, and trust signals using only the current user profile context. Never reference other user data.',
    policyJson: {
      allowSecuredContext: true,
      allowedDomains: ['own-profile', 'own-documents', 'own-classifications'],
    },
  },
  {
    name: 'Relu Project Interpreter',
    type: 'PROJECT_JOB_INTERPRETER',
    description:
      'Interprets projects and jobs into structured summaries, taxonomy suggestions, and risks.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.25,
    systemPrompt:
      'You are Relu AI for project and job interpretation. Convert OpenStaff project or job inputs into structured JSON with summary, taxonomy suggestions, required skills, certifications, and key risks. Use only supplied secured context.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Matching Engine',
    type: 'MATCHING_ENGINE',
    description:
      'Scores profile-to-project and project-to-profile relevance using OpenStaff data only.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.2,
    systemPrompt:
      'You are Relu AI for OpenStaff matching. Evaluate compatibility using only supplied OpenStaff profile/project/job context. Return structured reasons, gaps, and recommendations.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Eligibility Engine',
    type: 'ELIGIBILITY_ENGINE',
    description:
      'Computes and explains eligibility percentage for a user or profile against a project or job.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.2,
    systemPrompt:
      'You are Relu AI for eligibility scoring. Explain fit percentage, missing items, and readiness using only supplied OpenStaff context.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Certification Gap Detector',
    type: 'CERTIFICATION_GAP_DETECTOR',
    description:
      'Detects missing certifications and compliance gaps for a profile relative to a project or role.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.2,
    systemPrompt:
      'You are Relu AI for certification gap analysis. Compare required and available certifications, then return only the missing, optional, and satisfied items.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Test Generator',
    type: 'TEST_FORM_GENERATOR',
    description:
      'Generates structured assessment questions from secured OpenStaff project/job context.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.35,
    systemPrompt:
      'You are Relu AI for test generation. Create concise, role-relevant screening questions from supplied OpenStaff context. Return structured JSON.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Recommendation Engine',
    type: 'RECOMMENDATION_ENGINE',
    description:
      'Recommends candidate profiles or project opportunities using only secured OpenStaff context.',
    accessMode: 'AUTHENTICATED_USER',
    publicEnabled: false,
    temperature: 0.25,
    systemPrompt:
      'You are Relu AI for recommendations. Rank only the supplied OpenStaff options and explain why they fit.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Contract Lifecycle Monitor',
    type: 'CONTRACT_LIFECYCLE_MONITOR',
    description:
      'Monitors contract lifecycle, deadlines, milestones, and risk signals for admins and owners.',
    accessMode: 'ADMIN_SECURED',
    publicEnabled: false,
    temperature: 0.2,
    systemPrompt:
      'You are Relu AI for contract lifecycle monitoring. Detect deadlines, milestone risks, and status anomalies from supplied OpenStaff contract context only.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
  {
    name: 'Relu Notification Generator',
    type: 'NOTIFICATION_GENERATOR',
    description:
      'Generates safe notification copy for onboarding, matching, eligibility, and contract events.',
    accessMode: 'ADMIN_SECURED',
    publicEnabled: false,
    temperature: 0.3,
    systemPrompt:
      'You are Relu AI for notification generation. Produce short, clear user-facing notification titles and messages from supplied OpenStaff event summaries.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
      maxMessageLength: 220,
    },
  },
  {
    name: 'Relu Compliance Monitor',
    type: 'COMPLIANCE_MONITOR',
    description:
      'Reviews compliance-related content and risk notes for admin and compliance teams.',
    accessMode: 'ADMIN_SECURED',
    publicEnabled: false,
    temperature: 0.2,
    systemPrompt:
      'You are Relu AI for compliance monitoring. Summarize compliance risks and required actions using only secured OpenStaff context.',
    policyJson: {
      allowSecuredContext: true,
      outputFormat: 'json',
    },
  },
];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY ?? '';
    if (!apiKey) {
      if (this.runtimeConfig.isAiFallbackEnabled()) {
        this.logger.warn(
          'GEMINI_API_KEY not set. Gemini requests will use explicit fallbacks.',
        );
      } else {
        this.logger.warn(
          'GEMINI_API_KEY not set. Gemini requests requiring AI will return unavailable responses.',
        );
      }
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getAgentConfig(type: AgentType | string) {
    await this.ensureDefaultAgents();
    return this.prisma.geminiAgent.findFirst({
      where: { type: type as AgentType, enabled: true },
    });
  }

  async callGemini(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.7,
    history: GeminiHistory = [],
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY ?? '';

    if (!apiKey) {
      if (!this.runtimeConfig.isAiFallbackEnabled()) {
        throw new Error(
          'GEMINI_API_KEY is not configured and AI fallback is disabled.',
        );
      }
      return this.fallbackTextResponse(userMessage);
    }

    const model = this.genAI.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({
      history: history.map((item) => ({
        role: item.role,
        parts: [{ text: item.parts }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }

  async executeAgent(input: AgentExecutionInput) {
    const agent = await this.getAgentConfig(input.agentType);

    if (!agent) {
      const fallback = this.fallbackTextResponse(input.userMessage);
      return {
        agentName: 'Fallback',
        response: fallback,
        raw: fallback,
      };
    }

    const promptParts = [
      ...(input.contextBlocks ?? []),
      input.userMessage,
    ].filter(Boolean);
    const response = await this.callGemini(
      agent.systemPrompt,
      promptParts.join('\n\n'),
      input.temperatureOverride ?? agent.temperature,
      input.history ?? [],
    );

    return {
      agent,
      agentName: agent.name,
      response,
      raw: response,
    };
  }

  async chat(message: string, history: GeminiHistory = [], actorId?: string) {
    const execution = await this.executeAgent({
      agentType: 'CHATBOT_PUBLIC',
      userMessage: message,
      history,
      contextBlocks: ['Mode: restricted public assistant'],
      temperatureOverride: 0.3,
    });

    return {
      response: execution.response,
      agentName: execution.agentName,
      actorId: actorId ?? null,
    };
  }

  async analyzeDocument(fileUrl: string, documentType: string) {
    try {
      const execution = await this.executeAgent({
        agentType: 'DOCUMENT_OCR',
        userMessage: `Analyze document type "${documentType}" from secure file reference "${fileUrl}" and return structured JSON with extracted entities, dates, and confidence.`,
      });
      return this.parseJsonOrFallback(execution.response, {
        extracted: [],
        confidence: 0,
      });
    } catch (error) {
      this.logger.error('Gemini analyzeDocument error', error as Error);
      return { extracted: [], confidence: 0 };
    }
  }

  async scoreApplication(jobId: string, actorId: string) {
    const [job, actor] = await Promise.all([
      this.prisma.job.findUnique({ where: { id: jobId } }),
      this.prisma.actor.findUnique({
        where: { id: actorId },
        include: { companyProfile: true },
      }),
    ]);

    if (!job || !actor) {
      throw new Error('Job sau actor negasit');
    }

    const execution = await this.executeAgent({
      agentType: 'MATCHING_ENGINE',
      userMessage:
        'Score this application and return JSON with score, reasons, and recommendation.',
      contextBlocks: [
        `JOB: ${job.title}`,
        `Job category: ${job.category}`,
        `Job NACE: ${job.naceCode}`,
        `Job ESCO: ${job.escoRequired.join(', ')}`,
        `Actor: ${actor.displayName}`,
        `Actor NACE: ${actor.naceCode}`,
        `Actor ESCO: ${actor.escoOccupations.join(', ')}`,
        `Experience years: ${actor.experienceYears}`,
        `Verified: ${actor.isVerified}`,
      ],
      temperatureOverride: 0.2,
    });

    const result = this.parseJsonOrFallback(execution.response, {
      score: 0,
      reasons: ['Matching engine fallback response'],
      recommendation: 'Manual review required',
    });

    await this.prisma.application.updateMany({
      where: { jobId, actorId },
      data: { reluScore: Number(result.score ?? 0) },
    });

    return result;
  }

  async generateTestForm(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job negasit');
    }

    const execution = await this.executeAgent({
      agentType: 'TEST_FORM_GENERATOR',
      userMessage:
        'Generate structured screening questions as JSON with question, intent, and scoring guidance.',
      contextBlocks: [
        `Job title: ${job.title}`,
        `Category: ${job.category}`,
        `NACE: ${job.naceCode}`,
        `ESCO: ${job.escoRequired.join(', ')}`,
        `Description: ${job.description}`,
      ],
      temperatureOverride: 0.35,
    });

    const form = this.parseJsonOrFallback(execution.response, {
      questions: [],
      error: 'Generare esuata',
    });

    await this.prisma.job.update({
      where: { id: jobId },
      data: { reluTestForm: form as any, reluProcessed: true },
    });

    return form;
  }

  async pcbAssist(prompt: string, context?: string) {
    const execution = await this.executeAgent({
      agentType: 'PCB_DESIGN_ASSISTANT',
      userMessage: prompt,
      contextBlocks: context ? [context] : [],
    });

    return { response: execution.response, agentName: execution.agentName };
  }

  async generateContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        job: true,
        employer: { include: { companyProfile: true } },
        contractor: { include: { companyProfile: true } },
      },
    });

    if (!contract) {
      throw new Error('Contract negasit');
    }

    const execution = await this.executeAgent({
      agentType: 'CONTRACT_GENERATOR',
      userMessage:
        'Generate a contract markdown draft based only on the supplied secured OpenStaff contract context.',
      contextBlocks: [
        `Employer: ${contract.employer.displayName}`,
        `Contractor: ${contract.contractor.displayName}`,
        `Project: ${contract.job.title}`,
        `Value: ${contract.value} ${contract.currency}`,
        `Start: ${contract.startDate}`,
        `End: ${contract.endDate}`,
        `Platform fee: ${contract.transactionFee} ${contract.currency}`,
      ],
    });

    return { contractMarkdown: execution.response, contractId };
  }

  async complianceCheck(content: string) {
    const execution = await this.executeAgent({
      agentType: 'COMPLIANCE_MONITOR',
      userMessage:
        'Review the supplied content and return structured compliance findings.',
      contextBlocks: [content],
      temperatureOverride: 0.2,
    });

    return this.parseJsonOrFallback(execution.response, {
      issues: [],
      risk_level: 'UNKNOWN',
      recommendations: [],
    });
  }

  async listAgents() {
    await this.ensureDefaultAgents();
    return this.prisma.geminiAgent.findMany({
      orderBy: [{ accessMode: 'asc' }, { type: 'asc' }],
    });
  }

  async updateAgent(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      model: string;
      accessMode: 'PUBLIC_LIMITED' | 'AUTHENTICATED_USER' | 'ADMIN_SECURED';
      systemPrompt: string;
      policyJson: Record<string, unknown> | null;
      temperature: number;
      enabled: boolean;
      publicEnabled: boolean;
      maxContextItems: number;
      webhookUrl: string | null;
    }>,
  ) {
    return this.prisma.geminiAgent.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.model !== undefined ? { model: data.model } : {}),
        ...(data.accessMode !== undefined
          ? { accessMode: data.accessMode as any }
          : {}),
        ...(data.systemPrompt !== undefined
          ? { systemPrompt: data.systemPrompt }
          : {}),
        ...(data.policyJson !== undefined
          ? { policyJson: data.policyJson as any }
          : {}),
        ...(data.temperature !== undefined
          ? { temperature: data.temperature }
          : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.publicEnabled !== undefined
          ? { publicEnabled: data.publicEnabled }
          : {}),
        ...(data.maxContextItems !== undefined
          ? { maxContextItems: data.maxContextItems }
          : {}),
        ...(data.webhookUrl !== undefined
          ? { webhookUrl: data.webhookUrl }
          : {}),
      },
    });
  }

  private async ensureDefaultAgents() {
    await Promise.all(
      DEFAULT_AGENT_DEFINITIONS.map((definition) =>
        this.prisma.geminiAgent.upsert({
          where: {
            name_type: {
              name: definition.name,
              type: definition.type,
            },
          },
          update: {
            description: definition.description,
            accessMode: definition.accessMode as any,
            publicEnabled: definition.publicEnabled,
            policyJson: definition.policyJson as any,
            systemPrompt: definition.systemPrompt,
            temperature: definition.temperature,
            model: DEFAULT_GEMINI_MODEL,
          },
          create: {
            name: definition.name,
            type: definition.type,
            description: definition.description,
            accessMode: definition.accessMode as any,
            systemPrompt: definition.systemPrompt,
            policyJson: definition.policyJson as any,
            publicEnabled: definition.publicEnabled,
            temperature: definition.temperature,
            model: DEFAULT_GEMINI_MODEL,
            enabled: true,
            maxContextItems: 12,
          },
        }),
      ),
    );
  }

  private parseJsonOrFallback<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value.replace(/```json|```/g, '').trim()) as T;
    } catch {
      return fallback;
    }
  }

  private fallbackTextResponse(userMessage: string) {
    if (!this.runtimeConfig.isAiFallbackEnabled()) {
      return 'Relu AI is currently unavailable because no model provider is configured.';
    }
    return `Relu AI fallback response: ${userMessage.slice(0, 280)}`;
  }
}
