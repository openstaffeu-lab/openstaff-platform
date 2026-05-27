import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { ReluService } from '../relu/relu.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reluService: ReluService,
  ) {}

  async findAll(query: Record<string, any>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.region ? { regionCode: query.region } : {}),
      ...(query.nace ? { naceCode: query.nace } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data: items, page, limit, total };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        actor: true,
        applications: true,
        contracts: true,
        reviews: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getStats() {
    const [totalJobs, liveJobs, pendingJobs, draftJobs, completedJobs] =
      await Promise.all([
        this.prisma.job.count(),
        this.prisma.job.count({ where: { status: 'LIVE' } }),
        this.prisma.job.count({ where: { status: 'PENDING_VERIFICATION' } }),
        this.prisma.job.count({ where: { status: 'DRAFT' } }),
        this.prisma.job.count({ where: { status: 'COMPLETED' } }),
      ]);

    return {
      totalJobs,
      liveJobs,
      pendingJobs,
      draftJobs,
      completedJobs,
    };
  }

  async create(body: CreateJobDto, actor: any) {
    const resolvedActor = await this.resolveActor(actor);

    if (!resolvedActor) {
      throw new ForbiddenException('Authenticated actor required');
    }

    const job = await this.prisma.job.create({
      data: {
        actorId: resolvedActor.id,
        title: body.title,
        description: body.description,
        category: body.category,
        naceCode: body.naceCode,
        escoRequired: body.escoRequired ?? [],
        uniclassCode: body.uniclassCode,
        status: 'DRAFT',
        location: body.location,
        regionCode: body.regionCode,
        countryCode: body.countryCode ?? 'RO',
        currency: body.currency ?? 'RON',
        budget: body.budget,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        mediaUrls: body.mediaUrls ?? [],
      },
    });

    void this.reluService.processJob({
      jobId: job.id,
      actorId: resolvedActor.id,
      source: 'jobs.create',
    });

    return job;
  }

  async update(id: string, body: UpdateJobDto, actor: any) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    const resolvedActor = await this.resolveActor(actor);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.isAdmin(resolvedActor) && job.actorId !== resolvedActor?.id) {
      throw new ForbiddenException(
        'Only the owner or an admin can update this job',
      );
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        naceCode: body.naceCode,
        escoRequired: body.escoRequired,
        uniclassCode: body.uniclassCode,
        status: body.status,
        location: body.location,
        regionCode: body.regionCode,
        countryCode: body.countryCode,
        currency: body.currency,
        budget: body.budget,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        mediaUrls: body.mediaUrls,
      },
    });
  }

  async updateStatus(id: string, body: UpdateJobStatusDto) {
    return this.prisma.job.update({
      where: { id },
      data: { status: body.status },
    });
  }

  async listApplications(id: string, actor: any) {
    const resolvedActor = await this.resolveActor(actor);
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            actor: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!this.isAdmin(resolvedActor) && job.actorId !== resolvedActor?.id) {
      throw new ForbiddenException(
        'Only the owner or an admin can list applications',
      );
    }

    return job.applications;
  }

  async apply(id: string, body: ApplyJobDto, actor: any) {
    const resolvedActor = await this.resolveActor(actor);

    if (!resolvedActor) {
      throw new ForbiddenException('Authenticated actor required');
    }

    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_actorId: {
          jobId: id,
          actorId: resolvedActor.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Application already exists for this actor and job',
      );
    }

    const matchedUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: resolvedActor.email },
          { firebaseUid: resolvedActor.firebaseUid },
        ],
      },
      select: { id: true },
    });

    const application = await this.prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          jobId: id,
          actorId: resolvedActor.id,
          candidateUserId: matchedUser?.id,
          status: 'PENDING',
          currentStage: ApplicationStage.APPLIED,
          message: body.message,
          stageChangedAt: new Date(),
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: created.id,
          fromStage: null,
          toStage: ApplicationStage.APPLIED,
          note: 'Application submitted.',
        },
      });

      const applications = await tx.application.findMany({
        where: { jobId: id },
        select: { currentStage: true },
      });

      await tx.hiringPipeline.upsert({
        where: { jobId: id },
        update: {
          totalApplicants: applications.length,
          totalShortlisted: applications.filter(
            (item) => item.currentStage === ApplicationStage.SHORTLISTED,
          ).length,
          totalHired: applications.filter(
            (item) => item.currentStage === ApplicationStage.HIRED,
          ).length,
        },
        create: {
          jobId: id,
          status: 'ACTIVE',
          totalApplicants: applications.length,
          totalShortlisted: applications.filter(
            (item) => item.currentStage === ApplicationStage.SHORTLISTED,
          ).length,
          totalHired: applications.filter(
            (item) => item.currentStage === ApplicationStage.HIRED,
          ).length,
        },
      });

      return created;
    });

    void this.reluService.scoreApplication({
      jobId: id,
      actorId: resolvedActor.id,
      applicationId: application.id,
      source: 'jobs.apply',
    });

    return application;
  }

  private isAdmin(actor: any) {
    return ['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(actor?.role);
  }

  private async resolveActor(actor: any) {
    if (!actor) {
      return null;
    }

    if (actor.id && actor.id !== 'dev-actor-001') {
      return actor;
    }

    if (actor.firebaseUid) {
      return this.prisma.actor.findUnique({
        where: { firebaseUid: actor.firebaseUid },
      });
    }

    return actor;
  }
}
