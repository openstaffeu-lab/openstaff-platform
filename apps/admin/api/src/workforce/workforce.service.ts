import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStage,
  AssignmentStatus,
  ContractLifecycleEventType,
  ContractLifecycleStatus,
  ContractStatus,
  Prisma,
  Role,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateContractDto } from './dto/activate-contract.dto';
import { CreateWorkforceAssignmentDto } from './dto/create-workforce-assignment.dto';
import { SuspendContractDto } from './dto/suspend-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';

type AuthUser = {
  sub: string;
  email: string;
  role: Role;
};

type TxClient = Prisma.TransactionClient;

@Injectable()
export class WorkforceService {
  private static readonly ADMIN_ROLES = new Set<Role>([
    Role.ADMIN,
    Role.SUPERADMIN,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(body: CreateWorkforceAssignmentDto, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id: body.applicationId },
      include: {
        actor: true,
        job: {
          include: {
            actor: true,
          },
        },
        candidateUser: {
          include: { identityProfile: true },
        },
        workforceAssignment: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.assertRecruiterAccess(application.job, user);

    if (application.currentStage !== ApplicationStage.HIRED) {
      throw new BadRequestException('Only HIRED applications can become workforce assignments.');
    }

    if (!application.candidateUserId) {
      throw new BadRequestException('The hired application is not linked to a platform user.');
    }

    if (application.workforceAssignment) {
      throw new BadRequestException('A workforce assignment already exists for this application.');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: body.contractId },
      include: {
        lifecycleEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.jobId !== application.jobId) {
      throw new BadRequestException('Contract must belong to the same job as the hired application.');
    }

    if (contract.contractorId !== application.actorId) {
      throw new BadRequestException('Contract contractor must match the hired candidate actor.');
    }

    this.assertContractMutable(contract.lifecycleStatus);

    if (body.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: body.projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await this.ensureCreatedEvent(tx, contract.id, user.sub, {
        source: 'assignment.create',
      });

      const assignment = await tx.workforceAssignment.create({
        data: {
          userId: application.candidateUserId!,
          projectId: body.projectId ?? null,
          jobId: application.jobId,
          contractId: contract.id,
          applicationId: application.id,
          status: AssignmentStatus.PENDING,
        },
        include: this.assignmentInclude,
      });

      return assignment;
    });

    return this.toAssignmentResponse(created);
  }

  async listAssignments(
    user: AuthUser,
    filters?: {
      q?: string;
      status?: string;
      contractStatus?: string;
    },
  ) {
    const recruiterActor = await this.findActorForUser(user);
    const where: Prisma.WorkforceAssignmentWhereInput = {
      ...(filters?.status ? { status: filters.status as AssignmentStatus } : {}),
      ...(filters?.contractStatus
        ? { contract: { lifecycleStatus: filters.contractStatus as ContractLifecycleStatus } }
        : {}),
      ...(this.isAdmin(user.role)
        ? {}
        : recruiterActor
          ? { job: { actorId: recruiterActor.id } }
          : { jobId: '__no_match__' }),
    };

    if (filters?.q?.trim()) {
      const query = filters.q.trim();
      where.OR = [
        { job: { title: { contains: query, mode: 'insensitive' } } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        {
          user: {
            identityProfile: {
              displayName: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const assignments = await this.prisma.workforceAssignment.findMany({
      where,
      include: this.assignmentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return assignments.map((assignment) => this.toAssignmentResponse(assignment));
  }

  async getAssignment(id: string, user: AuthUser) {
    const assignment = await this.prisma.workforceAssignment.findUnique({
      where: { id },
      include: {
        ...this.assignmentInclude,
        contract: {
          include: {
            employer: true,
            contractor: true,
            lifecycleEvents: {
              include: {
                actorUser: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Workforce assignment not found');
    }

    await this.assertRecruiterAccess(assignment.job, user);

    return {
      ...this.toAssignmentResponse(assignment),
      timeline: assignment.contract.lifecycleEvents.map((item) =>
        this.toLifecycleEventResponse(item),
      ),
    };
  }

  async sendContract(id: string, user: AuthUser) {
    const contract = await this.getManagedContract(id, user);
    this.assertContractMutable(contract.lifecycleStatus);

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.ensureCreatedEvent(tx, contract.id, user.sub, {
        source: 'contract.send',
      });

      await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.PENDING_SIGN,
          lifecycleStatus: ContractLifecycleStatus.PENDING_SIGNATURE,
        },
      });

      await this.createLifecycleEvent(tx, contract.id, ContractLifecycleEventType.SENT, user.sub, {
        previousLifecycleStatus: contract.lifecycleStatus,
      });

      return tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
        include: this.contractInclude,
      });
    });

    return this.toContractLifecycleResponse(updated);
  }

  async activateContract(id: string, user: AuthUser, body: ActivateContractDto) {
    const contract = await this.getManagedContract(id, user);
    this.assertContractMutable(contract.lifecycleStatus);

    const assignments = contract.workforceAssignments;
    if (!assignments.length) {
      throw new BadRequestException('Contract must have at least one workforce assignment before activation.');
    }

    const unverified = assignments.find(
      (item) =>
        item.user.identityProfile?.verificationStatus !== VerificationStatus.VERIFIED,
    );
    if (unverified) {
      throw new BadRequestException('Only VERIFIED users can become ACTIVE workforce.');
    }

    const activationDate = body.startDate ? new Date(body.startDate) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.ensureCreatedEvent(tx, contract.id, user.sub, {
        source: 'contract.activate',
      });

      await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.ACTIVE,
          lifecycleStatus: ContractLifecycleStatus.ACTIVE,
          startDate: contract.startDate ?? activationDate,
          signedAt: contract.signedAt ?? activationDate,
        },
      });

      await tx.workforceAssignment.updateMany({
        where: { contractId: contract.id },
        data: {
          status: AssignmentStatus.ACTIVE,
          startedAt: activationDate,
          endedAt: null,
        },
      });

      await this.createLifecycleEvent(
        tx,
        contract.id,
        contract.lifecycleStatus === ContractLifecycleStatus.SUSPENDED
          ? ContractLifecycleEventType.REACTIVATED
          : ContractLifecycleEventType.ACTIVATED,
        user.sub,
        {
          note: this.normalizeNullableString(body.note),
          startDate: activationDate.toISOString(),
        },
      );

      return tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
        include: this.contractInclude,
      });
    });

    return this.toContractLifecycleResponse(updated);
  }

  async suspendContract(id: string, user: AuthUser, body: SuspendContractDto) {
    const contract = await this.getManagedContract(id, user);
    this.assertContractMutable(contract.lifecycleStatus);

    if (contract.lifecycleStatus !== ContractLifecycleStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE contracts can be suspended.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contract.id },
        data: {
          lifecycleStatus: ContractLifecycleStatus.SUSPENDED,
        },
      });

      await tx.workforceAssignment.updateMany({
        where: { contractId: contract.id, status: AssignmentStatus.ACTIVE },
        data: {
          status: AssignmentStatus.PENDING,
        },
      });

      await this.createLifecycleEvent(
        tx,
        contract.id,
        ContractLifecycleEventType.SUSPENDED,
        user.sub,
        {
          reason: this.normalizeNullableString(body.reason),
        },
      );

      return tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
        include: this.contractInclude,
      });
    });

    return this.toContractLifecycleResponse(updated);
  }

  async terminateContract(id: string, user: AuthUser, body: TerminateContractDto) {
    const contract = await this.getManagedContract(id, user);
    this.assertContractMutable(contract.lifecycleStatus);

    const terminatedAt = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.CANCELLED,
          lifecycleStatus: ContractLifecycleStatus.TERMINATED,
          endDate: terminatedAt,
        },
      });

      await tx.workforceAssignment.updateMany({
        where: { contractId: contract.id, status: { not: AssignmentStatus.ENDED } },
        data: {
          status: AssignmentStatus.ENDED,
          endedAt: terminatedAt,
        },
      });

      await this.createLifecycleEvent(
        tx,
        contract.id,
        ContractLifecycleEventType.TERMINATED,
        user.sub,
        {
          reason: this.normalizeNullableString(body.reason),
          terminatedAt: terminatedAt.toISOString(),
        },
      );

      return tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
        include: this.contractInclude,
      });
    });

    return this.toContractLifecycleResponse(updated);
  }

  async getContractTimeline(id: string, user: AuthUser) {
    const contract = await this.getManagedContract(id, user);
    return contract.lifecycleEvents.map((item) => this.toLifecycleEventResponse(item));
  }

  async getMyAssignments(user: AuthUser) {
    const assignments = await this.prisma.workforceAssignment.findMany({
      where: { userId: user.sub },
      include: this.assignmentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      startedAt: assignment.startedAt,
      endedAt: assignment.endedAt,
      contractStatus: assignment.contract.lifecycleStatus,
      lifecycleState: assignment.contract.lifecycleStatus,
      activeProjects: assignment.project
        ? [
            {
              id: assignment.project.id,
              name: assignment.project.name,
              slug: assignment.project.slug,
            },
          ]
        : [],
      job: {
        id: assignment.job.id,
        title: assignment.job.title,
        status: assignment.job.status,
      },
      contract: {
        id: assignment.contract.id,
        lifecycleStatus: assignment.contract.lifecycleStatus,
        status: assignment.contract.status,
        startDate: assignment.contract.startDate,
        endDate: assignment.contract.endDate,
      },
    }));
  }

  private async getManagedContract(id: string, user: AuthUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: this.contractInclude,
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    await this.assertRecruiterAccess(contract.job, user);
    return contract;
  }

  private async assertRecruiterAccess(job: { actorId: string }, user: AuthUser) {
    if (this.isAdmin(user.role)) {
      return;
    }

    const recruiterActor = await this.findActorForUser(user);
    if (!recruiterActor || recruiterActor.id !== job.actorId) {
      throw new ForbiddenException('Only the job owner or an admin can access workforce operations.');
    }
  }

  private async findActorForUser(user: { email: string }) {
    return this.prisma.actor.findFirst({
      where: { email: user.email },
      select: { id: true, email: true, displayName: true },
    });
  }

  private isAdmin(role: Role) {
    return WorkforceService.ADMIN_ROLES.has(role);
  }

  private assertContractMutable(status: ContractLifecycleStatus) {
    if (status === ContractLifecycleStatus.TERMINATED) {
      throw new BadRequestException('Terminated contracts are immutable.');
    }

    if (status === ContractLifecycleStatus.COMPLETED) {
      throw new BadRequestException('Completed contracts are immutable.');
    }
  }

  private async ensureCreatedEvent(
    tx: TxClient,
    contractId: string,
    actorUserId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    const existing = await tx.contractLifecycleEvent.findFirst({
      where: { contractId, eventType: ContractLifecycleEventType.CREATED },
      select: { id: true },
    });

    if (!existing) {
      await this.createLifecycleEvent(
        tx,
        contractId,
        ContractLifecycleEventType.CREATED,
        actorUserId,
        metadata,
      );
    }
  }

  private async createLifecycleEvent(
    tx: TxClient,
    contractId: string,
    eventType: ContractLifecycleEventType,
    actorUserId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await tx.contractLifecycleEvent.create({
      data: {
        contractId,
        eventType,
        actorUserId: actorUserId ?? null,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  }

  private normalizeNullableString(value?: string | null) {
    const next = value?.trim();
    return next ? next : null;
  }

  private toAssignmentResponse(assignment: any) {
    return {
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      startedAt: assignment.startedAt,
      endedAt: assignment.endedAt,
      user: {
        id: assignment.user.id,
        email: assignment.user.email,
        identityProfile: assignment.user.identityProfile
          ? {
              id: assignment.user.identityProfile.id,
              publicSlug: assignment.user.identityProfile.publicSlug,
              displayName: assignment.user.identityProfile.displayName,
              verificationStatus: assignment.user.identityProfile.verificationStatus,
            }
          : null,
      },
      project: assignment.project
        ? {
            id: assignment.project.id,
            name: assignment.project.name,
            slug: assignment.project.slug,
          }
        : null,
      job: {
        id: assignment.job.id,
        title: assignment.job.title,
        status: assignment.job.status,
      },
      application: {
        id: assignment.application.id,
        currentStage: assignment.application.currentStage,
        status: assignment.application.status,
        actor: {
          id: assignment.application.actor.id,
          displayName: assignment.application.actor.displayName,
          email: assignment.application.actor.email,
        },
      },
      contract: {
        id: assignment.contract.id,
        status: assignment.contract.status,
        lifecycleStatus: assignment.contract.lifecycleStatus,
        value: assignment.contract.value,
        currency: assignment.contract.currency,
        startDate: assignment.contract.startDate,
        endDate: assignment.contract.endDate,
      },
    };
  }

  private toContractLifecycleResponse(contract: any) {
    return {
      contract: {
        id: contract.id,
        status: contract.status,
        lifecycleStatus: contract.lifecycleStatus,
        signedAt: contract.signedAt,
        startDate: contract.startDate,
        endDate: contract.endDate,
      },
      assignments: contract.workforceAssignments.map((item: any) => ({
        id: item.id,
        status: item.status,
        assignedAt: item.assignedAt,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        userId: item.userId,
      })),
      latestEvent:
        contract.lifecycleEvents.length > 0
          ? this.toLifecycleEventResponse(
              contract.lifecycleEvents[contract.lifecycleEvents.length - 1],
            )
          : null,
    };
  }

  private toLifecycleEventResponse(item: any) {
    return {
      id: item.id,
      eventType: item.eventType,
      metadata: item.metadata,
      createdAt: item.createdAt,
      actorUser: item.actorUser
        ? {
            id: item.actorUser.id,
            email: item.actorUser.email,
            role: item.actorUser.role,
          }
        : null,
    };
  }

  private readonly assignmentInclude = {
    user: {
      include: {
        identityProfile: true,
      },
    },
    project: true,
    job: true,
    application: {
      include: {
        actor: true,
      },
    },
    contract: true,
  } satisfies Prisma.WorkforceAssignmentInclude;

  private readonly contractInclude = {
    job: {
      include: {
        actor: true,
      },
    },
    employer: true,
    contractor: true,
    workforceAssignments: {
      include: {
        user: {
          include: {
            identityProfile: true,
          },
        },
      },
    },
    lifecycleEvents: {
      include: {
        actorUser: true,
      },
      orderBy: { createdAt: 'asc' },
    },
  } satisfies Prisma.ContractInclude;
}
