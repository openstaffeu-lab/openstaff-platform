import { Injectable } from '@nestjs/common';
import {
  AgentType,
  Prisma,
  ReluProcessingDomain,
  ReluResultStatus,
  ReluSourceType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReluAiBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gemini: GeminiService,
  ) {}

  private async executeBuilderRun(
    actorId: string,
    domain: ReluProcessingDomain,
    input: unknown,
    action: string,
  ) {
    const run = await this.prisma.reluProcessingRun.create({
      data: {
        sourceType: ReluSourceType.PROFILE,
        sourceId: actorId,
        triggeredByUserId: actorId,
        domain,
        status: ReluResultStatus.RUNNING,
        inputSnapshot: this.toJsonValue(input),
      },
    });

    try {
      const execution = await this.gemini.executeAgent({
        agentType: this.agentTypeForDomain(domain),
        userMessage: this.buildUserMessage(domain, input),
        contextBlocks: [
          'Mode: secured RELU AI Builder backend endpoint.',
          'Return concise JSON-oriented suggestions. Do not mutate records.',
        ],
        temperatureOverride: 0.2,
      });
      const outputData = {
        prototype: false,
        domain,
        actorId,
        input,
        agentName: execution.agentName,
        response: execution.response,
      };

      const updatedRun = await this.prisma.reluProcessingRun.update({
        where: { id: run.id },
        data: {
          status: ReluResultStatus.COMPLETED,
          outputData: this.toJsonValue(outputData),
          explanation: execution.response.slice(0, 500),
          completedAt: new Date(),
        },
      });

      await this.audit.log({
        actorUserId: actorId,
        entityType: 'RELU_AI_BUILDER_RUN',
        entityId: run.id,
        action,
        after: {
          status: updatedRun.status,
          domain,
          appendOnly: true,
          geminiUsed: true,
        },
      });

      return {
        id: run.id,
        domain,
        status: updatedRun.status,
        outputData,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      const outputData = {
        prototype: false,
        domain,
        actorId,
        input,
        error: message,
      };

      const failedRun = await this.prisma.reluProcessingRun.update({
        where: { id: run.id },
        data: {
          status: ReluResultStatus.FAILED,
          outputData: this.toJsonValue(outputData),
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      await this.audit.log({
        actorUserId: actorId,
        entityType: 'RELU_AI_BUILDER_RUN',
        entityId: run.id,
        action: `${action}_FAILED`,
        after: {
          status: failedRun.status,
          domain,
          appendOnly: true,
          geminiUsed: true,
          errorMessage: message,
        },
      });

      return {
        id: run.id,
        domain,
        status: failedRun.status,
        outputData,
      };
    }
  }

  async suggestTaxonomy(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.TAXONOMY,
      { type: 'taxonomy', input: dto },
      'SUGGEST_TAXONOMY',
    );
  }

  async suggestEsco(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.ESCO,
      { type: 'esco', input: dto },
      'SUGGEST_ESCO',
    );
  }

  async suggestNace(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.NACE,
      { type: 'nace', input: dto },
      'SUGGEST_NACE',
    );
  }

  async suggestUniclass(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.UNICLASS,
      { type: 'uniclass', input: dto },
      'SUGGEST_UNICLASS',
    );
  }

  async classifyIntent(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.INTENT,
      { type: 'intent', input: dto },
      'CLASSIFY_INTENT',
    );
  }

  async generateSummary(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.SUMMARY,
      { type: 'summary', input: dto },
      'GENERATE_SUMMARY',
    );
  }

  async suggestGeography(dto: unknown, actorId: string) {
    return this.executeBuilderRun(
      actorId,
      ReluProcessingDomain.GEOGRAPHY,
      { type: 'geography', input: dto },
      'SUGGEST_GEOGRAPHY',
    );
  }

  private agentTypeForDomain(domain: ReluProcessingDomain) {
    if (domain === ReluProcessingDomain.INTENT) {
      return AgentType.ONBOARDING_ASSISTANT;
    }

    return AgentType.PROFILE_COMPLETION_ASSISTANT;
  }

  private buildUserMessage(domain: ReluProcessingDomain, input: unknown) {
    return JSON.stringify({
      task: `RELU_AI_BUILDER_${domain}`,
      input,
    });
  }

  private toJsonValue(value: unknown) {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error
      ? error.message
      : 'Unknown RELU builder error';
  }
}
