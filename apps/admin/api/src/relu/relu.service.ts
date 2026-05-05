import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class ReluService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async processActor(payload: Record<string, unknown>) {
    return { queued: true, type: 'process-actor', payload };
  }

  async processJob(input: string | Record<string, unknown>) {
    const jobId =
      typeof input === 'string'
        ? input
        : typeof input.jobId === 'string'
          ? input.jobId
          : null;

    if (!jobId) {
      return { processed: false, reason: 'jobId_missing' };
    }

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return { processed: false, reason: 'job_not_found', jobId };
    }

    const summaryPrompt = `
Structureaza aceasta oferta de job pentru platforma OpenStaff:
Titlu: ${job.title}
Categorie: ${job.category}
Descriere: ${job.description}
Buget: ${job.budget} ${job.currency}

Returneaza JSON:
{
  "titluOptimizat": "...",
  "rezumat": "3 fraze clare pentru candidati",
  "competenteNecesare": ["competenta1", "competenta2"],
  "nivelExperienta": "Junior|Mid|Senior",
  "durataEstimata": "X saptamani/luni",
  "beneficii": ["beneficiu1"]
}`;

    let summary = '';
    let testForm: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
    try {
      const rawSummary = await this.gemini.callGemini(
        'Esti Relu AI, motorul de procesare documente OpenStaff.',
        summaryPrompt,
        0.3,
      );
      const cleanSummary = rawSummary.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanSummary);
      summary = JSON.stringify(parsed);
      testForm = (await this.gemini.generateTestForm(jobId)) as Prisma.InputJsonValue;
    } catch {
      summary = `Job procesat: ${job.title}`;
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        reluProcessed: true,
        reluSummary: summary,
        reluTestForm: testForm,
        status: 'PENDING_VERIFICATION',
      },
    });

    const admins = await this.prisma.actor.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
      },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          key: `job-pending-review:${jobId}:${admin.id}`,
          actorId: admin.id,
          userId: null,
          type: 'JOB_PENDING_REVIEW',
          message: `Job nou pentru verificare: "${job.title}"`,
          title: 'Job pending review',
        })),
        skipDuplicates: true,
      });
    }

    return { jobId, processed: true };
  }

  async generateTest(payload: Record<string, unknown>) {
    const jobId = typeof payload.jobId === 'string' ? payload.jobId : null;
    if (!jobId) {
      return { questions: [], error: 'jobId_missing' };
    }

    return this.gemini.generateTestForm(jobId);
  }

  async scoreApplication(input: string | Record<string, unknown>, actorIdArg?: string) {
    const jobId =
      typeof input === 'string'
        ? input
        : typeof input.jobId === 'string'
          ? input.jobId
          : null;
    const actorId =
      typeof input === 'string'
        ? actorIdArg ?? null
        : typeof input.actorId === 'string'
          ? input.actorId
          : actorIdArg ?? null;

    if (!jobId || !actorId) {
      return {
        score: 0,
        reasons: ['jobId sau actorId lipsa'],
        recommendation: 'Verificare manuala necesara',
      };
    }

    return this.gemini.scoreApplication(jobId, actorId);
  }

  async queueStatus() {
    const [pendingJobs, processedToday] = await Promise.all([
      this.prisma.job.count({
        where: { status: 'PENDING_VERIFICATION' },
      }),
      this.prisma.job.count({
        where: {
          reluProcessed: true,
          updatedAt: {
            gte: new Date(Date.now() - 86_400_000),
          },
        },
      }),
    ]);

    return {
      pendingJobs,
      processedToday,
      engineStatus: 'operational',
    };
  }
}
