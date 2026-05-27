import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationType,
  NotificationSeverity,
  Prisma,
  ProjectDisputeEventType,
  ProjectDisputeStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessPolicy } from './project-access.policy';
import { CreateProjectDisputeDto } from './dto/create-project-dispute.dto';
import { CreateProjectDisputeEventDto } from './dto/create-project-dispute-event.dto';
import { UpdateProjectDisputeStatusDto } from './dto/update-project-dispute-status.dto';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly messagingService: MessagingService,
  ) {}

  async create(
    projectId: string,
    contractId: string,
    body: CreateProjectDisputeDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForParty(
      projectId,
      contractId,
      user,
    );

    const [milestone, invoice, payment] = await Promise.all([
      body.milestoneId
        ? this.findMilestone(contract.id, body.milestoneId)
        : Promise.resolve(null),
      body.invoiceId
        ? this.findInvoice(contract.id, body.invoiceId)
        : Promise.resolve(null),
      body.paymentId
        ? this.findPayment(contract.id, body.paymentId)
        : Promise.resolve(null),
    ]);

    const dispute = await this.prisma.projectDispute.create({
      data: {
        projectId: contract.projectId,
        contractId: contract.id,
        milestoneId: milestone?.id ?? null,
        invoiceId: invoice?.id ?? null,
        paymentId: payment?.id ?? null,
        openedById: user.sub,
        againstProfileId: body.againstProfileId ?? null,
        type: body.type,
        severity: body.severity,
        title: body.title.trim(),
        description: body.description.trim(),
      },
      include: this.disputeInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectDispute',
      entityId: dispute.id,
      action: 'CREATE',
      before: null,
      after: this.toDisputeResponse(dispute),
      metadata: {
        contractId: contract.id,
        milestoneId: milestone?.id ?? null,
        invoiceId: invoice?.id ?? null,
        paymentId: payment?.id ?? null,
      },
    });

    await this.notifyDisputeParties(
      contract,
      dispute,
      'DISPUTE_OPENED',
      'Dispute opened',
      `${this.actorLabel(user, contract)} opened dispute "${dispute.title}".`,
    );

    await this.messagingService.addSystemMessage({
      type: ConversationType.DISPUTE,
      disputeId: dispute.id,
      actorUserId: user.sub,
      content: `Dispute "${dispute.title}" was opened.`,
      metadata: {
        disputeId: dispute.id,
        contractId: contract.id,
      },
    });

    return this.toDisputeResponse(dispute);
  }

  async list(projectId: string, contractId: string, user: AuthenticatedUser) {
    const contract = await this.getContractForParty(
      projectId,
      contractId,
      user,
    );
    const disputes = await this.prisma.projectDispute.findMany({
      where: {
        contractId: contract.id,
      },
      include: this.disputeInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  async findOne(
    projectId: string,
    contractId: string,
    disputeId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForParty(
      projectId,
      contractId,
      user,
    );
    const dispute = await this.prisma.projectDispute.findFirst({
      where: {
        id: disputeId,
        contractId: contract.id,
      },
      include: this.disputeInclude,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.toDisputeResponse(dispute);
  }

  async updateStatus(
    projectId: string,
    contractId: string,
    disputeId: string,
    body: UpdateProjectDisputeStatusDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForParty(
      projectId,
      contractId,
      user,
    );
    const dispute = await this.prisma.projectDispute.findFirst({
      where: {
        id: disputeId,
        contractId: contract.id,
      },
      include: this.disputeInclude,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const isOwnerOrAdmin =
      this.accessPolicy.isAdmin(user) ||
      contract.project.createdById === user.sub;
    const isProfileOwner = contract.profile.userId === user.sub;
    const isOpener = dispute.openedById === user.sub;

    if (!isOwnerOrAdmin) {
      const allowedForParty = new Set<ProjectDisputeStatus>([
        ProjectDisputeStatus.UNDER_REVIEW,
        ProjectDisputeStatus.CANCELLED,
      ]);
      if (!(isProfileOwner || isOpener) || !allowedForParty.has(body.status)) {
        throw new ForbiddenException(
          'You do not have permission to change this dispute status',
        );
      }
    }

    if (
      (body.status === ProjectDisputeStatus.RESOLVED ||
        body.status === ProjectDisputeStatus.REJECTED) &&
      !isOwnerOrAdmin
    ) {
      throw new ForbiddenException(
        'Only the project owner or admin can resolve or reject a dispute',
      );
    }

    const updatedDispute = await this.prisma.projectDispute.update({
      where: {
        id: dispute.id,
      },
      data: {
        status: body.status,
        resolutionNotes:
          body.resolutionNotes?.trim() ?? dispute.resolutionNotes,
        resolvedAt:
          body.status === ProjectDisputeStatus.RESOLVED ||
          body.status === ProjectDisputeStatus.REJECTED
            ? (dispute.resolvedAt ?? new Date())
            : body.status === ProjectDisputeStatus.CANCELLED
              ? (dispute.resolvedAt ?? new Date())
              : null,
      },
      include: this.disputeInclude,
    });

    await this.prisma.projectDisputeEvent.create({
      data: {
        disputeId: dispute.id,
        actorUserId: user.sub,
        type:
          body.status === ProjectDisputeStatus.RESOLVED ||
          body.status === ProjectDisputeStatus.REJECTED
            ? ProjectDisputeEventType.RESOLUTION
            : ProjectDisputeEventType.STATUS_CHANGE,
        message:
          body.resolutionNotes?.trim() ||
          `Dispute status moved to ${body.status.replaceAll('_', ' ')}.`,
        metadataJson: JSON.stringify({
          from: dispute.status,
          to: body.status,
        }),
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectDispute',
      entityId: dispute.id,
      action: 'STATUS_CHANGE',
      before: {
        status: dispute.status,
        resolutionNotes: dispute.resolutionNotes,
      },
      after: {
        status: updatedDispute.status,
        resolutionNotes: updatedDispute.resolutionNotes,
      },
      metadata: {
        contractId: contract.id,
      },
    });

    await this.notifyDisputeParties(
      contract,
      updatedDispute,
      'DISPUTE_STATUS_CHANGED',
      'Dispute status updated',
      `${this.actorLabel(user, contract)} changed dispute "${updatedDispute.title}" to ${updatedDispute.status.replaceAll('_', ' ')}.`,
    );

    if (body.status === ProjectDisputeStatus.RESOLVED) {
      await this.messagingService.addSystemMessage({
        type: ConversationType.DISPUTE,
        disputeId: updatedDispute.id,
        actorUserId: user.sub,
        content: `Dispute "${updatedDispute.title}" was resolved.`,
        metadata: {
          disputeId: updatedDispute.id,
          contractId: contract.id,
        },
      });
    }

    return this.toDisputeResponse(updatedDispute);
  }

  async addEvent(
    projectId: string,
    contractId: string,
    disputeId: string,
    body: CreateProjectDisputeEventDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForParty(
      projectId,
      contractId,
      user,
    );
    const dispute = await this.prisma.projectDispute.findFirst({
      where: {
        id: disputeId,
        contractId: contract.id,
      },
      include: this.disputeInclude,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (!this.canCommentOnDispute(contract, dispute, user)) {
      throw new ForbiddenException(
        'You do not have access to add dispute events',
      );
    }

    const event = await this.prisma.projectDisputeEvent.create({
      data: {
        disputeId: dispute.id,
        actorUserId: user.sub,
        type: body.type,
        message: body.message.trim(),
        metadataJson: this.serializeMetadata(body.metadataJson),
      },
      include: this.disputeEventInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectDisputeEvent',
      entityId: event.id,
      action: 'CREATE',
      before: null,
      after: this.toDisputeEventResponse(event),
      metadata: {
        disputeId: dispute.id,
        contractId: contract.id,
      },
    });

    await this.notifyDisputeParties(
      contract,
      dispute,
      'DISPUTE_EVENT_ADDED',
      'Dispute updated',
      `${this.actorLabel(user, contract)} added a ${body.type.replaceAll('_', ' ').toLowerCase()} event to dispute "${dispute.title}".`,
    );

    return this.findOne(projectId, contractId, disputeId, user);
  }

  async hasActiveBlockingDispute(input: {
    contractId: string;
    milestoneId?: string | null;
    invoiceId?: string | null;
    paymentId?: string | null;
  }) {
    const dispute = await this.prisma.projectDispute.findFirst({
      where: {
        contractId: input.contractId,
        status: {
          in: [ProjectDisputeStatus.OPEN, ProjectDisputeStatus.UNDER_REVIEW],
        },
        OR: [
          { paymentId: input.paymentId ?? undefined },
          { invoiceId: input.invoiceId ?? undefined },
          { milestoneId: input.milestoneId ?? undefined },
          {
            paymentId: null,
            invoiceId: null,
            milestoneId: null,
          },
        ],
      },
      include: this.disputeInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return dispute ? this.toDisputeResponse(dispute) : null;
  }

  private async getContractForParty(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.prisma.projectContract.findFirst({
      where: {
        id: contractId,
        projectId,
      },
      include: this.contractInclude,
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isOwnerOrAdmin =
      this.accessPolicy.isAdmin(user) ||
      contract.project.createdById === user.sub;
    const isProfileOwner = contract.profile.userId === user.sub;

    if (!isOwnerOrAdmin && !isProfileOwner) {
      throw new ForbiddenException('You do not have access to this contract');
    }

    return contract;
  }

  private canCommentOnDispute(
    contract: any,
    dispute: any,
    user: AuthenticatedUser,
  ) {
    return (
      this.accessPolicy.isAdmin(user) ||
      contract.project.createdById === user.sub ||
      contract.profile.userId === user.sub ||
      dispute.openedById === user.sub
    );
  }

  private async findMilestone(contractId: string, milestoneId: string) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Linked milestone not found');
    }

    return milestone;
  }

  private async findInvoice(contractId: string, invoiceId: string) {
    const invoice = await this.prisma.projectInvoice.findFirst({
      where: {
        id: invoiceId,
        contractId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Linked invoice not found');
    }

    return invoice;
  }

  private async findPayment(contractId: string, paymentId: string) {
    const payment = await this.prisma.projectPayment.findFirst({
      where: {
        id: paymentId,
        contractId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Linked payment not found');
    }

    return payment;
  }

  private async notifyDisputeParties(
    contract: any,
    dispute: any,
    type: string,
    title: string,
    message: string,
  ) {
    const recipients = new Map<
      string,
      { userId: string; profileId?: string | null }
    >();
    recipients.set(contract.project.createdById, {
      userId: contract.project.createdById,
      profileId: null,
    });
    recipients.set(contract.profile.userId, {
      userId: contract.profile.userId,
      profileId: contract.profile.id,
    });
    recipients.set(dispute.openedById, {
      userId: dispute.openedById,
      profileId: dispute.againstProfileId ?? null,
    });

    for (const [userId, recipient] of recipients) {
      await this.notificationService.createInAppNotification({
        key: `dispute:${type}:${dispute.id}:${userId}:${dispute.updatedAt.toISOString()}`,
        userId: recipient.userId,
        profileId: recipient.profileId ?? null,
        type,
        severity:
          dispute.severity === 'CRITICAL'
            ? NotificationSeverity.CRITICAL
            : dispute.severity === 'HIGH'
              ? NotificationSeverity.WARNING
              : NotificationSeverity.INFO,
        title,
        message,
        relatedEntityType: 'ProjectDispute',
        relatedEntityId: dispute.id,
        scheduledFor: new Date(),
      });
    }
  }

  private actorLabel(user: AuthenticatedUser, contract: any) {
    if (this.accessPolicy.isAdmin(user)) {
      return 'Admin';
    }

    if (contract.project.createdById === user.sub) {
      return 'Project owner';
    }

    if (contract.profile.userId === user.sub) {
      return (
        contract.profile.displayName ||
        contract.profile.companyName ||
        'Contractor'
      );
    }

    return 'Actor';
  }

  private serializeMetadata(value: unknown) {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  private parseJson(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private toDisputeResponse(dispute: any) {
    return {
      id: dispute.id,
      projectId: dispute.projectId,
      contractId: dispute.contractId,
      milestoneId: dispute.milestoneId,
      invoiceId: dispute.invoiceId,
      paymentId: dispute.paymentId,
      openedById: dispute.openedById,
      againstProfileId: dispute.againstProfileId,
      type: dispute.type,
      status: dispute.status,
      severity: dispute.severity,
      title: dispute.title,
      description: dispute.description,
      resolutionNotes: dispute.resolutionNotes,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      resolvedAt: dispute.resolvedAt,
      openedBy: dispute.openedBy
        ? {
            id: dispute.openedBy.id,
            email: dispute.openedBy.email,
            role: dispute.openedBy.role,
          }
        : null,
      againstProfile: dispute.againstProfile
        ? {
            id: dispute.againstProfile.id,
            userId: dispute.againstProfile.userId,
            profileType: dispute.againstProfile.profileType,
            displayName: dispute.againstProfile.displayName,
            companyName: dispute.againstProfile.companyName,
            summary: dispute.againstProfile.summary,
          }
        : null,
      milestone: dispute.milestone
        ? {
            id: dispute.milestone.id,
            title: dispute.milestone.title,
            status: dispute.milestone.status,
          }
        : null,
      invoice: dispute.invoice
        ? {
            id: dispute.invoice.id,
            invoiceNumber: dispute.invoice.invoiceNumber,
            status: dispute.invoice.status,
          }
        : null,
      payment: dispute.payment
        ? {
            id: dispute.payment.id,
            status: dispute.payment.status,
            amountCents: dispute.payment.amountCents,
            currencyCode: dispute.payment.currencyCode,
          }
        : null,
      events: dispute.events.map((event: any) =>
        this.toDisputeEventResponse(event),
      ),
    };
  }

  private toDisputeEventResponse(event: any) {
    return {
      id: event.id,
      disputeId: event.disputeId,
      actorUserId: event.actorUserId,
      type: event.type,
      message: event.message,
      metadataJson: this.parseJson(event.metadataJson),
      createdAt: event.createdAt,
      actorUser: event.actorUser
        ? {
            id: event.actorUser.id,
            email: event.actorUser.email,
            role: event.actorUser.role,
          }
        : null,
    };
  }

  private readonly disputeEventInclude = {
    actorUser: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } satisfies Prisma.ProjectDisputeEventInclude;

  private readonly disputeInclude = {
    openedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    againstProfile: {
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
        companyName: true,
        summary: true,
      },
    },
    milestone: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
    invoice: {
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
      },
    },
    payment: {
      select: {
        id: true,
        status: true,
        amountCents: true,
        currencyCode: true,
      },
    },
    events: {
      include: this.disputeEventInclude,
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
  } satisfies Prisma.ProjectDisputeInclude;

  private readonly contractInclude = {
    project: {
      select: {
        id: true,
        createdById: true,
      },
    },
    profile: {
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
        companyName: true,
        summary: true,
      },
    },
  } satisfies Prisma.ProjectContractInclude;
}
