import { ProjectAIInterpretationStatus } from '@prisma/client';
import { ProjectAIInterpretationsService } from './project-ai-interpretations.service';

const user = { sub: 'admin-user', role: 'ADMIN' };
const project = {
  id: 'project-1',
  name: 'Hospital retrofit',
  summary: 'MEP works',
  location: 'Bucharest',
  createdById: 'owner-1',
};

function createService(parserParse: jest.Mock) {
  const prisma = {
    project: {
      findUnique: jest.fn().mockResolvedValue(project),
    },
    projectDocument: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    escoSkill: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    nace: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    uniclass: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    projectAIInterpretationRun: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id:
            data.status === ProjectAIInterpretationStatus.FAILED
              ? 'failed-run'
              : 'success-run',
          projectId: project.id,
          createdAt: new Date('2026-05-26T10:00:00.000Z'),
          ...data,
        }),
      ),
      findMany: jest.fn(),
    },
    projectAIInterpretation: {
      upsert: jest.fn().mockImplementation(({ create, update }) =>
        Promise.resolve({
          id: 'current-interpretation',
          projectId: project.id,
          createdAt: new Date('2026-05-26T10:01:00.000Z'),
          updatedAt: new Date('2026-05-26T10:01:00.000Z'),
          ...create,
          ...update,
        }),
      ),
    },
  };
  const accessPolicy = {
    assertCanReadProject: jest.fn(),
    assertCanWriteProject: jest.fn(),
  };
  const mapper = {
    toAIInterpretationResponse: jest.fn((interpretation) => interpretation),
  };
  const parser = {
    parse: parserParse,
  };
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  return {
    prisma,
    service: new ProjectAIInterpretationsService(
      prisma as any,
      accessPolicy as any,
      mapper as any,
      parser as any,
      audit as any,
    ),
  };
}

describe('ProjectAIInterpretationsService append-only history', () => {
  it('appends a history run before updating the current successful interpretation', async () => {
    const { prisma, service } = createService(
      jest.fn().mockReturnValue({
        summary: 'Electrical and HVAC scope detected',
        suggestedJobRequests: [],
        suggestedConditions: [],
        taxonomySuggestions: {},
      }),
    );

    const result = await service.upsert(
      project.id,
      { sourceText: 'Need electricians', confidenceScore: 0.91 },
      user,
    );

    expect(prisma.projectAIInterpretationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          project: { connect: { id: project.id } },
          status: ProjectAIInterpretationStatus.COMPLETED,
          confidenceScore: 0.91,
        }),
      }),
    );
    expect(prisma.projectAIInterpretation.upsert).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('current-interpretation');
  });

  it('records failed reruns without overwriting the previous current success', async () => {
    const { prisma, service } = createService(
      jest.fn(() => {
        throw new Error('parser unavailable');
      }),
    );

    const result = await service.upsert(
      project.id,
      { sourceText: 'rerun text', modelName: 'local-rules-v1' },
      user,
    );

    expect(prisma.projectAIInterpretationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProjectAIInterpretationStatus.FAILED,
          reviewNotes: 'parser unavailable',
        }),
      }),
    );
    expect(prisma.projectAIInterpretation.upsert).not.toHaveBeenCalled();
    expect(result.id).toBe('failed-run');
  });
});
