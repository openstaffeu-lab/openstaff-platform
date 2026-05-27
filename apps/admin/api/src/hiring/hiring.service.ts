import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationDecision,
  ApplicationStage,
  AppStatus,
  HiringPipelineStatus,
  NotificationCategory,
  Prisma,
  Role,
} from '@prisma/client';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApproveApplicationDto } from './dto/approve-application.dto';
import { MoveApplicationStageDto } from './dto/move-application-stage.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { ShortlistApplicationDto } from './dto/shortlist-application.dto';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class HiringService {
  private static readonly FINAL_REVIEW_STAGES = new Set<ApplicationStage>([
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
    ApplicationStage.HIRED,
  ]);

  private static readonly CLOSED_PIPELINE_STAGES = new Set<ApplicationStage>([
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
  ]);

  private static readonly ADMIN_ROLES = new Set<Role>([
    Role.ADMIN,
    Role.SUPERADMIN,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    private readonly notificationService: NotificationService,
  ) {}

  async listPipelines(
    user: { sub: string; email: string; role: Role },
    filters?: { q?: string; status?: HiringPipelineStatus },
  ) {
    const recruiterActor = await this.findActorForUser(user);
    const isAdmin = this.isAdmin(user.role);

    const where: Prisma.HiringPipelineWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(isAdmin
        ? {}
        : recruiterActor
          ? { job: { actorId: recruiterActor.id } }
          : { jobId: '__no_match__' }),
    };

    if (filters?.q?.trim()) {
      const query = filters.q.trim();
      where.OR = [
        { job: { title: { contains: query, mode: 'insensitive' } } },
        {
          job: {
            actor: { displayName: { contains: query, mode: 'insensitive' } },
          },
        },
      ];
    }

    const items = await this.prisma.hiringPipeline.findMany({
      where,
      include: {
        job: {
          include: {
            actor: true,
            applications: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((item) => ({
      id: item.id,
      status: item.status,
      totalApplicants: item.totalApplicants,
      totalShortlisted: item.totalShortlisted,
      totalHired: item.totalHired,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      job: {
        id: item.job.id,
        title: item.job.title,
        status: item.job.status,
        actor: {
          id: item.job.actor.id,
          displayName: item.job.actor.displayName,
          email: item.job.actor.email,
        },
      },
      groupedCounts: this.groupStageCounts(item.job.applications),
    }));
  }

  async getJobPipeline(
    jobId: string,
    user: { sub: string; email: string; role: Role },
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        actor: true,
        applications: {
          include: {
            actor: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        hiringPipeline: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.assertRecruiterAccess(job, user);

    const pipeline = job.hiringPipeline ?? (await this.syncPipeline(jobId));
    const candidateUsers = await this.loadCandidateUsers(job.applications);

    const groupedApplicants = Object.values(ApplicationStage).map((stage) => ({
      stage,
      applicants: job.applications
        .filter((application) => application.currentStage === stage)
        .map((application) =>
          this.toPipelineApplicationSummary(
            application,
            candidateUsers.get(
              application.candidateUserId ?? application.actor.email,
            ),
          ),
        ),
    }));

    return {
      pipeline: this.toPipelineSummary(pipeline, job),
      counters: {
        totalApplicants: pipeline.totalApplicants,
        totalShortlisted: pipeline.totalShortlisted,
        totalHired: pipeline.totalHired,
      },
      shortlistStats: {
        current: pipeline.totalShortlisted,
      },
      hiredStats: {
        current: pipeline.totalHired,
      },
      applicantsByStage: groupedApplicants,
    };
  }

  async getApplicationDetail(
    id: string,
    user: { sub: string; email: string; role: Role },
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        actor: true,
        job: {
          include: { actor: true, hiringPipeline: true },
        },
        candidateUser: {
          include: { identityProfile: true },
        },
        stageHistory: {
          include: { changedByUser: true },
          orderBy: { createdAt: 'asc' },
        },
        hiringDecisions: {
          include: { decidedByUser: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.assertRecruiterAccess(application.job, user);

    const candidateUser =
      application.candidateUser ??
      (await this.findUserByActor(application.actor));

    return {
      application: this.toApplicationSummary(application),
      candidateIdentitySummary: {
        actor: {
          id: application.actor.id,
          displayName: application.actor.displayName,
          email: application.actor.email,
          actorType: application.actor.actorType,
          isVerified: application.actor.isVerified,
        },
        identityProfile: candidateUser?.identityProfile
          ? {
              id: candidateUser.identityProfile.id,
              publicSlug: candidateUser.identityProfile.publicSlug,
              displayName: candidateUser.identityProfile.displayName,
              verificationStatus:
                candidateUser.identityProfile.verificationStatus,
              profileCompletionPercent:
                candidateUser.identityProfile.profileCompletionPercent,
            }
          : null,
        user: candidateUser
          ? {
              id: candidateUser.id,
              email: candidateUser.email,
              role: candidateUser.role,
            }
          : null,
      },
      stageHistory: application.stageHistory.map((item) => ({
        id: item.id,
        fromStage: item.fromStage,
        toStage: item.toStage,
        note: item.note,
        createdAt: item.createdAt,
        changedByUser: item.changedByUser
          ? {
              id: item.changedByUser.id,
              email: item.changedByUser.email,
              role: item.changedByUser.role,
            }
          : null,
      })),
      decisions: application.hiringDecisions.map((item) => ({
        id: item.id,
        decision: item.decision,
        reason: item.reason,
        createdAt: item.createdAt,
        decidedByUser: item.decidedByUser
          ? {
              id: item.decidedByUser.id,
              email: item.decidedByUser.email,
              role: item.decidedByUser.role,
            }
          : null,
      })),
    };
  }

  async moveApplicationStage(
    id: string,
    user: { sub: string; email: string; role: Role },
    body: MoveApplicationStageDto,
  ) {
    const application = await this.getManagedApplication(id, user);

    if (HiringService.FINAL_REVIEW_STAGES.has(body.targetStage)) {
      throw new BadRequestException(
        'Use the dedicated shortlist, approve, reject or withdraw actions for final stages.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await this.updateStage(
        tx,
        application,
        body.targetStage,
        user.sub,
        body.note,
      );
      await this.syncPipeline(application.jobId, tx);
      return tx.application.findUniqueOrThrow({
        where: { id: next.id },
        include: this.applicationInclude,
      });
    });

    if (updated.candidateUserId) {
      await this.notificationService.emitEvent({
        key: `hiring:stage:${updated.id}:${updated.currentStage}`,
        eventType: 'HIRING_STAGE_CHANGED',
        sourceType: 'APPLICATION',
        sourceId: updated.id,
        userId: updated.candidateUserId,
        category: NotificationCategory.PROJECTS,
        title: 'Application stage updated',
        message: `Your application for ${updated.job.title} moved to ${updated.currentStage}.`,
        relatedEntityType: 'Application',
        relatedEntityId: updated.id,
        metadata: {
          stage: updated.currentStage,
          jobId: updated.jobId,
        },
      });

      const recruiterUser = await this.findUserByActor(updated.job.actor);
      if (recruiterUser?.id && recruiterUser.id !== updated.candidateUserId) {
        await this.messagingService.createDirectConversation(
          {
            participantUserIds: [updated.candidateUserId],
            title: `Hiring follow-up: ${updated.job.title}`,
          },
          {
            sub: recruiterUser.id,
            email: recruiterUser.email,
            role: recruiterUser.role,
          },
        );
      }
    }

    return this.toManagedApplicationResponse(updated);
  }

  async shortlistApplication(
    id: string,
    user: { sub: string; email: string; role: Role },
    body: ShortlistApplicationDto,
  ) {
    const application = await this.getManagedApplication(id, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await this.updateStage(
        tx,
        application,
        ApplicationStage.SHORTLISTED,
        user.sub,
        body.note,
        AppStatus.REVIEWED,
      );
      await this.syncPipeline(application.jobId, tx);
      return tx.application.findUniqueOrThrow({
        where: { id: next.id },
        include: this.applicationInclude,
      });
    });

    if (updated.candidateUserId) {
      await this.notificationService.emitEvent({
        key: `hiring:stage:${updated.id}:${updated.currentStage}`,
        eventType: 'HIRING_STAGE_CHANGED',
        sourceType: 'APPLICATION',
        sourceId: updated.id,
        userId: updated.candidateUserId,
        category: NotificationCategory.PROJECTS,
        title: 'Application shortlisted',
        message: `Your application for ${updated.job.title} was shortlisted.`,
        relatedEntityType: 'Application',
        relatedEntityId: updated.id,
        metadata: {
          stage: updated.currentStage,
          jobId: updated.jobId,
        },
      });
    }

    return this.toManagedApplicationResponse(updated);
  }

  async approveApplication(
    id: string,
    user: { sub: string; email: string; role: Role },
    body: ApproveApplicationDto,
  ) {
    const application = await this.getManagedApplication(id, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await this.updateStage(
        tx,
        application,
        ApplicationStage.HIRED,
        user.sub,
        body.reason,
        AppStatus.ACCEPTED,
      );

      await tx.hiringDecision.create({
        data: {
          applicationId: application.id,
          decision: ApplicationDecision.APPROVED,
          decidedByUserId: user.sub,
          reason: this.normalizeNullableString(body.reason),
        },
      });

      await this.syncPipeline(application.jobId, tx);
      return tx.application.findUniqueOrThrow({
        where: { id: next.id },
        include: this.applicationInclude,
      });
    });

    if (updated.candidateUserId) {
      await this.notificationService.emitEvent({
        key: `hiring:decision:${updated.id}:APPROVED`,
        eventType: 'HIRING_STAGE_CHANGED',
        sourceType: 'APPLICATION',
        sourceId: updated.id,
        userId: updated.candidateUserId,
        category: NotificationCategory.PROJECTS,
        title: 'Application approved',
        message: `You were hired for ${updated.job.title}.`,
        relatedEntityType: 'Application',
        relatedEntityId: updated.id,
        metadata: {
          stage: updated.currentStage,
          decision: ApplicationDecision.APPROVED,
          jobId: updated.jobId,
        },
      });
    }

    return this.toManagedApplicationResponse(updated);
  }

  async rejectApplication(
    id: string,
    user: { sub: string; email: string; role: Role },
    body: RejectApplicationDto,
  ) {
    const application = await this.getManagedApplication(id, user);

    if (application.currentStage === ApplicationStage.HIRED) {
      throw new BadRequestException(
        'Hired applications cannot be rejected afterwards.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await this.updateStage(
        tx,
        application,
        ApplicationStage.REJECTED,
        user.sub,
        body.reason,
        AppStatus.REJECTED,
      );

      await tx.hiringDecision.create({
        data: {
          applicationId: application.id,
          decision: ApplicationDecision.REJECTED,
          decidedByUserId: user.sub,
          reason: this.normalizeNullableString(body.reason),
        },
      });

      await this.syncPipeline(application.jobId, tx);
      return tx.application.findUniqueOrThrow({
        where: { id: next.id },
        include: this.applicationInclude,
      });
    });

    if (updated.candidateUserId) {
      await this.notificationService.emitEvent({
        key: `hiring:decision:${updated.id}:REJECTED`,
        eventType: 'HIRING_STAGE_CHANGED',
        sourceType: 'APPLICATION',
        sourceId: updated.id,
        userId: updated.candidateUserId,
        category: NotificationCategory.PROJECTS,
        title: 'Application updated',
        message: `Your application for ${updated.job.title} was rejected.`,
        relatedEntityType: 'Application',
        relatedEntityId: updated.id,
        metadata: {
          stage: updated.currentStage,
          decision: ApplicationDecision.REJECTED,
          jobId: updated.jobId,
        },
      });
    }

    return this.toManagedApplicationResponse(updated);
  }

  async getMyApplications(user: { sub: string; email: string; role: Role }) {
    const applications = await this.prisma.application.findMany({
      where: {
        OR: [{ candidateUserId: user.sub }, { actor: { email: user.email } }],
      },
      include: {
        job: {
          include: { actor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      currentStage: item.currentStage,
      status: item.status,
      message: item.message,
      stageChangedAt: item.stageChangedAt,
      withdrawnAt: item.withdrawnAt,
      recruiterStatus:
        item.currentStage === ApplicationStage.REJECTED
          ? 'REJECTED'
          : item.currentStage === ApplicationStage.HIRED
            ? 'HIRED'
            : item.currentStage,
      job: {
        id: item.job.id,
        title: item.job.title,
        status: item.job.status,
        ownerDisplayName: item.job.actor.displayName,
      },
    }));
  }

  async withdrawApplication(
    id: string,
    user: { sub: string; email: string; role: Role },
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        actor: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const isOwner =
      application.candidateUserId === user.sub ||
      application.actor.email === user.email;

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the owner can withdraw this application.',
      );
    }

    if (application.currentStage === ApplicationStage.HIRED) {
      throw new BadRequestException('Hired applications cannot be withdrawn.');
    }

    if (application.currentStage === ApplicationStage.WITHDRAWN) {
      throw new BadRequestException('Application already withdrawn.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await this.updateStage(
        tx,
        application,
        ApplicationStage.WITHDRAWN,
        user.sub,
        'Candidate withdrew the application.',
        application.status,
      );
      await tx.application.update({
        where: { id: application.id },
        data: { withdrawnAt: new Date() },
      });
      await this.syncPipeline(application.jobId, tx);
      return tx.application.findUniqueOrThrow({
        where: { id: next.id },
        include: this.applicationInclude,
      });
    });

    return this.toManagedApplicationResponse(updated);
  }

  async initializeApplicationFromLegacyFlow(
    applicationId: string,
    actorEmail: string,
  ) {
    const matchedUser = await this.prisma.user.findFirst({
      where: { email: actorEmail },
      select: { id: true },
    });

    await this.prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { id: applicationId },
        data: {
          candidateUserId: matchedUser?.id,
          currentStage: ApplicationStage.APPLIED,
          stageChangedAt: new Date(),
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          fromStage: null,
          toStage: ApplicationStage.APPLIED,
          note: 'Application submitted.',
        },
      });

      await this.syncPipeline(application.jobId, tx);
    });
  }

  private async getManagedApplication(
    id: string,
    user: { sub: string; email: string; role: Role },
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: { actor: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.assertRecruiterAccess(application.job, user);
    return application;
  }

  private async assertRecruiterAccess(
    job: { actorId: string },
    user: { sub: string; email: string; role: Role },
  ) {
    if (this.isAdmin(user.role)) {
      return;
    }

    const recruiterActor = await this.findActorForUser(user);
    if (!recruiterActor || recruiterActor.id !== job.actorId) {
      throw new ForbiddenException(
        'Only the job owner or an admin can access this pipeline.',
      );
    }
  }

  private async findActorForUser(user: { email: string }) {
    return this.prisma.actor.findFirst({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
  }

  private async findUserByActor(actor: { email: string }) {
    return this.prisma.user.findFirst({
      where: { email: actor.email },
      include: { identityProfile: true },
    });
  }

  private async loadCandidateUsers(
    applications: Array<{
      candidateUserId: string | null;
      actor: { email: string };
    }>,
  ) {
    const userIds = applications
      .map((item) => item.candidateUserId)
      .filter((value): value is string => Boolean(value));
    const emails = applications.map((item) => item.actor.email);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length ? [{ id: { in: userIds } }] : []),
          ...(emails.length ? [{ email: { in: emails } }] : []),
        ],
      },
      include: { identityProfile: true },
    });

    return new Map(
      users.flatMap((item) => [
        [item.id, item] as const,
        [item.email, item] as const,
      ]),
    );
  }

  private groupStageCounts(
    applications: Array<{ currentStage: ApplicationStage }>,
  ) {
    return Object.values(ApplicationStage).map((stage) => ({
      stage,
      count: applications.filter((item) => item.currentStage === stage).length,
    }));
  }

  private toPipelineSummary(
    pipeline: {
      id: string;
      status: HiringPipelineStatus;
      totalApplicants: number;
      totalShortlisted: number;
      totalHired: number;
      createdAt: Date;
      updatedAt: Date;
    },
    job: {
      id: string;
      title: string;
      status: string;
      actor: { id: string; displayName: string; email: string };
    },
  ) {
    return {
      id: pipeline.id,
      status: pipeline.status,
      totalApplicants: pipeline.totalApplicants,
      totalShortlisted: pipeline.totalShortlisted,
      totalHired: pipeline.totalHired,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        actor: job.actor,
      },
    };
  }

  private toPipelineApplicationSummary(application: any, candidateUser?: any) {
    return {
      id: application.id,
      createdAt: application.createdAt,
      currentStage: application.currentStage,
      status: application.status,
      reluScore: application.reluScore,
      message: application.message,
      stageChangedAt: application.stageChangedAt,
      actor: {
        id: application.actor.id,
        displayName: application.actor.displayName,
        email: application.actor.email,
        actorType: application.actor.actorType,
      },
      identityProfile: candidateUser?.identityProfile
        ? {
            publicSlug: candidateUser.identityProfile.publicSlug,
            displayName: candidateUser.identityProfile.displayName,
            verificationStatus:
              candidateUser.identityProfile.verificationStatus,
            profileCompletionPercent:
              candidateUser.identityProfile.profileCompletionPercent,
          }
        : null,
    };
  }

  private toApplicationSummary(application: any) {
    return {
      id: application.id,
      createdAt: application.createdAt,
      currentStage: application.currentStage,
      status: application.status,
      reluScore: application.reluScore,
      message: application.message,
      stageChangedAt: application.stageChangedAt,
      withdrawnAt: application.withdrawnAt,
      job: {
        id: application.job.id,
        title: application.job.title,
        status: application.job.status,
      },
    };
  }

  private toManagedApplicationResponse(application: any) {
    return {
      application: this.toApplicationSummary(application),
      latestDecision:
        application.hiringDecisions[application.hiringDecisions.length - 1] ??
        null,
      latestStageEntry:
        application.stageHistory[application.stageHistory.length - 1] ?? null,
    };
  }

  private async updateStage(
    tx: TxClient,
    application: {
      id: string;
      jobId: string;
      currentStage: ApplicationStage;
      status: AppStatus;
    },
    targetStage: ApplicationStage,
    changedByUserId: string,
    note?: string,
    nextStatus?: AppStatus,
  ) {
    if (application.currentStage === ApplicationStage.WITHDRAWN) {
      throw new BadRequestException('Withdrawn applications are immutable.');
    }

    if (
      application.currentStage === ApplicationStage.REJECTED &&
      targetStage !== ApplicationStage.REJECTED
    ) {
      throw new BadRequestException(
        'Rejected applications cannot move back to active stages.',
      );
    }

    if (
      application.currentStage === ApplicationStage.HIRED &&
      targetStage !== ApplicationStage.HIRED
    ) {
      throw new BadRequestException(
        'Hired applications are already finalized.',
      );
    }

    if (application.currentStage === targetStage) {
      return tx.application.findUniqueOrThrow({
        where: { id: application.id },
      });
    }

    const updated = await tx.application.update({
      where: { id: application.id },
      data: {
        currentStage: targetStage,
        stageChangedAt: new Date(),
        status: nextStatus ?? application.status,
      },
    });

    await tx.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        fromStage: application.currentStage,
        toStage: targetStage,
        changedByUserId,
        note: this.normalizeNullableString(note),
      },
    });

    return updated;
  }

  private async syncPipeline(jobId: string, tx?: TxClient) {
    const client = tx ?? this.prisma;
    const applications = await client.application.findMany({
      where: { jobId },
      select: {
        currentStage: true,
      },
    });

    return client.hiringPipeline.upsert({
      where: { jobId },
      update: {
        totalApplicants: applications.length,
        totalShortlisted: applications.filter(
          (item) => item.currentStage === ApplicationStage.SHORTLISTED,
        ).length,
        totalHired: applications.filter(
          (item) => item.currentStage === ApplicationStage.HIRED,
        ).length,
        status:
          applications.some(
            (item) => item.currentStage === ApplicationStage.HIRED,
          ) ||
          applications.some(
            (item) =>
              !HiringService.CLOSED_PIPELINE_STAGES.has(item.currentStage),
          )
            ? HiringPipelineStatus.ACTIVE
            : HiringPipelineStatus.CLOSED,
      },
      create: {
        jobId,
        totalApplicants: applications.length,
        totalShortlisted: applications.filter(
          (item) => item.currentStage === ApplicationStage.SHORTLISTED,
        ).length,
        totalHired: applications.filter(
          (item) => item.currentStage === ApplicationStage.HIRED,
        ).length,
        status: HiringPipelineStatus.ACTIVE,
      },
    });
  }

  private normalizeNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private isAdmin(role: Role) {
    return HiringService.ADMIN_ROLES.has(role);
  }

  private readonly applicationInclude = {
    job: {
      include: {
        actor: true,
      },
    },
    actor: true,
    stageHistory: {
      include: { changedByUser: true },
      orderBy: { createdAt: 'asc' as const },
    },
    hiringDecisions: {
      include: { decidedByUser: true },
      orderBy: { createdAt: 'asc' as const },
    },
  } satisfies Prisma.ApplicationInclude;
}
