import {
  AgentType,
  ReluProcessingDomain,
  ReluResultStatus,
  ReluSourceType,
} from '@prisma/client';
import { ReluAiBuilderService } from './relu-ai-builder.service';

function createService(geminiExecuteAgent: jest.Mock) {
  const createdRun = {
    id: 'run-1',
    sourceType: ReluSourceType.PROFILE,
    sourceId: 'superadmin-user',
    domain: ReluProcessingDomain.ESCO,
    status: ReluResultStatus.RUNNING,
  };
  const prisma = {
    reluProcessingRun: {
      create: jest.fn().mockResolvedValue(createdRun),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          ...createdRun,
          ...data,
        }),
      ),
    },
  };
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  const gemini = {
    executeAgent: geminiExecuteAgent,
  };

  return {
    audit,
    gemini,
    prisma,
    service: new ReluAiBuilderService(
      prisma as any,
      audit as any,
      gemini as any,
    ),
  };
}

describe('ReluAiBuilderService EXEC-77A.1 hardening', () => {
  it('creates append-only runs, calls Gemini, persists success, and audits the run', async () => {
    const { audit, gemini, prisma, service } = createService(
      jest.fn().mockResolvedValue({
        agentName: 'Profile Builder',
        response: '{"esco":["7411"]}',
      }),
    );

    const result = await service.suggestEsco(
      { query: 'electrician', limit: 3 },
      'superadmin-user',
    );

    expect(prisma.reluProcessingRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: ReluSourceType.PROFILE,
          sourceId: 'superadmin-user',
          triggeredByUserId: 'superadmin-user',
          domain: ReluProcessingDomain.ESCO,
          status: ReluResultStatus.RUNNING,
        }),
      }),
    );
    expect(gemini.executeAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: AgentType.PROFILE_COMPLETION_ASSISTANT,
        temperatureOverride: 0.2,
      }),
    );
    expect(prisma.reluProcessingRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: ReluResultStatus.COMPLETED,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'superadmin-user',
        entityType: 'RELU_AI_BUILDER_RUN',
        entityId: 'run-1',
        action: 'SUGGEST_ESCO',
      }),
    );
    expect(result.status).toBe(ReluResultStatus.COMPLETED);
  });

  it('persists failed runs and audit records without throwing away the run', async () => {
    const { audit, prisma, service } = createService(
      jest.fn().mockRejectedValue(new Error('GEMINI_API_KEY not configured')),
    );

    const result = await service.suggestGeography(
      { query: 'Bucharest' },
      'superadmin-user',
    );

    expect(prisma.reluProcessingRun.create).toHaveBeenCalledTimes(1);
    expect(prisma.reluProcessingRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: ReluResultStatus.FAILED,
          errorMessage: 'GEMINI_API_KEY not configured',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUGGEST_GEOGRAPHY_FAILED',
        after: expect.objectContaining({
          appendOnly: true,
          status: ReluResultStatus.FAILED,
        }),
      }),
    );
    expect(result.status).toBe(ReluResultStatus.FAILED);
  });
});
