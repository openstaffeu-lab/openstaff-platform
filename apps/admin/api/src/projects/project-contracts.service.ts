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
  ProjectContractStatus,
  ProjectEscrowStatus,
  ProjectInvoiceStatus,
  ProjectMilestoneStatus,
  ProjectPaymentStatus,
  ProjectProposalStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectContractDto } from './dto/create-project-contract.dto';
import { CreateProjectInvoiceDto } from './dto/create-project-invoice.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { CreateProjectPaymentRequestDto } from './dto/create-project-payment-request.dto';
import { UpdateProjectContractStatusDto } from './dto/update-project-contract-status.dto';
import { UpdateProjectEscrowDto } from './dto/update-project-escrow.dto';
import { UpdateProjectInvoiceStatusDto } from './dto/update-project-invoice-status.dto';
import { UpdateProjectMilestoneStatusDto } from './dto/update-project-milestone-status.dto';
import { UpdateProjectPaymentStatusDto } from './dto/update-project-payment-status.dto';
import { FinancialRulesService } from './financial-rules.service';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectDisputesService } from './project-disputes.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly financialRulesService: FinancialRulesService,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly messagingService: MessagingService,
    private readonly projectDisputesService: ProjectDisputesService,
  ) {}

  async createFromProposal(
    projectId: string,
    proposalId: string,
    body: CreateProjectContractDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForOwner(projectId, user);
    const proposal = await this.prisma.projectProposal.findFirst({
      where: {
        id: proposalId,
        projectId: project.id,
      },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            companyName: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProjectProposalStatus.ACCEPTED) {
      throw new BadRequestException(
        'A contract can only be created from an accepted proposal',
      );
    }

    const existingContract = await this.prisma.projectContract.findFirst({
      where: {
        proposalId: proposal.id,
      },
    });

    if (existingContract) {
      throw new BadRequestException(
        'A contract already exists for this proposal',
      );
    }

    await this.complianceEligibilityService.assertCanCreateContract(
      project.id,
      proposal.profileId,
      user.sub,
    );

    const contract = await this.prisma.projectContract.create({
      data: {
        projectId: project.id,
        proposalId: proposal.id,
        profileId: proposal.profileId,
        createdById: user.sub,
        status: ProjectContractStatus.DRAFT,
        contractType: body.contractType ?? project.engagementModel,
        title: body.title?.trim() || `${project.name} commercial agreement`,
        scopeSummary:
          body.scopeSummary?.trim() ||
          proposal.message?.trim() ||
          project.summary?.trim() ||
          null,
        commercialTerms:
          body.commercialTerms?.trim() ?? proposal.terms?.trim() ?? null,
        paymentTerms:
          body.paymentTerms?.trim() ??
          this.defaultPaymentTerms(proposal.priceCents, proposal.currencyCode),
        safetyTerms:
          body.safetyTerms?.trim() ??
          'Follow project safety clauses, site induction rules, PPE obligations, and incident reporting requirements.',
        insuranceTerms:
          body.insuranceTerms?.trim() ??
          'Provide valid insurance and certifications required by project conditions before active site access.',
        startDate:
          this.toDate(body.startDate) ?? proposal.estimatedStartDate ?? null,
        endDate: this.toDate(body.endDate) ?? proposal.estimatedEndDate ?? null,
        escrowAccount: {
          create: {
            projectId: project.id,
            status: ProjectEscrowStatus.NOT_FUNDED,
            currencyCode:
              proposal.currencyCode ?? project.currencyCode ?? 'EUR',
            totalAmountCents: proposal.priceCents ?? 0,
            fundedAmountCents: 0,
            releasedAmountCents: 0,
          },
        },
      },
      include: this.contractInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: project.id,
      entityType: 'ProjectContract',
      entityId: contract.id,
      action: 'CREATE_FROM_PROPOSAL',
      before: null,
      after: this.toContractResponse(contract),
      metadata: {
        proposalId: proposal.id,
        profileId: proposal.profileId,
      },
    });

    await this.messagingService.addSystemMessage({
      type: ConversationType.CONTRACT,
      contractId: contract.id,
      actorUserId: user.sub,
      content: `Contract "${contract.title}" was created from accepted proposal "${contract.proposal.title}".`,
      metadata: {
        contractId: contract.id,
        proposalId: contract.proposalId,
        profileId: contract.profileId,
      },
    });

    return this.toContractResponse(contract);
  }

  async list(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const currentProfile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });
    const isOwner =
      this.accessPolicy.isAdmin(user) || project.createdById === user.sub;

    if (!isOwner && !currentProfile) {
      throw new ForbiddenException(
        'You do not have access to this contract workspace',
      );
    }

    const contracts = await this.prisma.projectContract.findMany({
      where: {
        projectId: project.id,
        ...(isOwner
          ? {}
          : {
              profileId: currentProfile?.id,
            }),
      },
      include: this.contractInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return contracts.map((contract) => this.toContractResponse(contract));
  }

  async findOne(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForRead(projectId, user);
    const contract = await this.prisma.projectContract.findFirst({
      where: {
        id: contractId,
        projectId: project.id,
      },
      include: this.contractInclude,
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return this.toContractResponse(contract);
  }

  async updateStatus(
    projectId: string,
    contractId: string,
    body: UpdateProjectContractStatusDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForOwner(
      projectId,
      contractId,
      user,
    );
    const updatedContract = await this.prisma.projectContract.update({
      where: {
        id: contract.id,
      },
      data: {
        status: body.status,
      },
      include: this.contractInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectContract',
      entityId: contract.id,
      action: 'STATUS_CHANGE',
      before: {
        status: contract.status,
      },
      after: {
        status: updatedContract.status,
      },
    });

    return this.toContractResponse(updatedContract);
  }

  async getEscrow(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);

    if (!contract.escrowAccount) {
      throw new NotFoundException('Escrow account not found');
    }

    return this.toEscrowResponse(contract.escrowAccount);
  }

  async updateEscrow(
    projectId: string,
    contractId: string,
    body: UpdateProjectEscrowDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForOwner(
      projectId,
      contractId,
      user,
    );

    if (!contract.escrowAccount) {
      throw new NotFoundException('Escrow account not found');
    }

    const nextTotal =
      body.totalAmountCents ?? contract.escrowAccount.totalAmountCents;
    const nextFunded =
      body.fundedAmountCents ?? contract.escrowAccount.fundedAmountCents;
    const nextReleased =
      body.releasedAmountCents ?? contract.escrowAccount.releasedAmountCents;

    if (nextFunded > nextTotal) {
      throw new BadRequestException('Funded amount cannot exceed total amount');
    }

    if (nextReleased > nextFunded) {
      throw new BadRequestException(
        'Released amount cannot exceed funded amount',
      );
    }

    const escrow = await this.prisma.projectEscrowAccount.update({
      where: {
        contractId: contract.id,
      },
      data: {
        status: body.status ?? undefined,
        currencyCode: body.currencyCode?.trim() ?? undefined,
        totalAmountCents: body.totalAmountCents ?? undefined,
        fundedAmountCents: body.fundedAmountCents ?? undefined,
        releasedAmountCents: body.releasedAmountCents ?? undefined,
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectEscrowAccount',
      entityId: escrow.id,
      action: 'UPDATE',
      before: contract.escrowAccount,
      after: escrow,
      metadata: {
        contractId: contract.id,
      },
    });

    return this.toEscrowResponse(escrow);
  }

  async createMilestone(
    projectId: string,
    contractId: string,
    body: CreateProjectMilestoneDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForOwner(
      projectId,
      contractId,
      user,
    );
    const milestone = await this.prisma.projectMilestone.create({
      data: {
        projectId: contract.projectId,
        contractId: contract.id,
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        amountCents: body.amountCents,
        dueDate: this.toDate(body.dueDate) ?? null,
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectMilestone',
      entityId: milestone.id,
      action: 'CREATE',
      before: null,
      after: milestone,
      metadata: {
        contractId: contract.id,
      },
    });

    return this.toMilestoneResponse(milestone);
  }

  async listMilestones(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);
    const milestones = await this.prisma.projectMilestone.findMany({
      where: {
        contractId: contract.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return milestones.map((milestone) => this.toMilestoneResponse(milestone));
  }

  async updateMilestoneStatus(
    projectId: string,
    contractId: string,
    milestoneId: string,
    body: UpdateProjectMilestoneStatusDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForOwner(
      projectId,
      contractId,
      user,
    );
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        contractId: contract.id,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (body.status === ProjectMilestoneStatus.RELEASED) {
      const activeDispute =
        await this.projectDisputesService.hasActiveBlockingDispute({
          contractId: contract.id,
          milestoneId: milestone.id,
        });

      if (activeDispute) {
        throw new BadRequestException(
          `Milestone release is blocked by dispute "${activeDispute.title}" (${activeDispute.status.replaceAll('_', ' ')}).`,
        );
      }
    }

    const updatedMilestone = await this.prisma.projectMilestone.update({
      where: {
        id: milestone.id,
      },
      data: {
        status: body.status,
        completedAt:
          body.completedAt !== undefined
            ? (this.toDate(body.completedAt) ?? null)
            : body.status === 'COMPLETED' || body.status === 'RELEASED'
              ? (milestone.completedAt ?? new Date())
              : null,
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectMilestone',
      entityId: milestone.id,
      action: 'STATUS_CHANGE',
      before: milestone,
      after: updatedMilestone,
      metadata: {
        contractId: contract.id,
      },
    });

    return this.toMilestoneResponse(updatedMilestone);
  }

  async createFinancialSnapshot(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForOwner(
      projectId,
      contractId,
      user,
    );
    const country = contract.project.country;
    const exactRule = country
      ? await this.prisma.taxRule.findFirst({
          where: {
            countryId: country.id,
            appliesTo: contract.contractType,
            isActive: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })
      : null;
    const mixedFallbackRule =
      country && contract.contractType !== 'MIXED' && !exactRule
        ? await this.prisma.taxRule.findFirst({
            where: {
              countryId: country.id,
              appliesTo: 'MIXED',
              isActive: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          })
        : null;
    const applicableRule = exactRule ?? mixedFallbackRule;

    const calculation = this.financialRulesService.calculate({
      contractType: contract.contractType,
      baseAmountCents:
        contract.proposal.priceCents ??
        contract.escrowAccount?.totalAmountCents ??
        0,
      country: country
        ? {
            id: country.id,
            code: country.code,
            name: country.name,
            currency: country.currency,
            vatRate: country.vatRate,
          }
        : null,
      taxRule: applicableRule
        ? {
            id: applicableRule.id,
            name: applicableRule.name,
            code: applicableRule.code,
            appliesTo: applicableRule.appliesTo,
            vatRate: applicableRule.vatRate,
            withholdingRate: applicableRule.withholdingRate,
            socialContributionRate: applicableRule.socialContributionRate,
            employerContributionRate: applicableRule.employerContributionRate,
            currencyCode: applicableRule.currencyCode,
            notes: applicableRule.notes,
          }
        : null,
      proposalCurrencyCode: contract.proposal.currencyCode,
    });

    const snapshot = await this.prisma.contractFinancialSnapshot.create({
      data: {
        contractId: contract.id,
        projectId: contract.projectId,
        profileId: contract.profileId,
        countryId: country?.id ?? null,
        contractType: contract.contractType,
        currencyCode: calculation.currencyCode,
        grossAmountCents: calculation.grossAmountCents,
        vatAmountCents: calculation.vatAmountCents,
        netAmountCents: calculation.netAmountCents,
        platformFeeCents: calculation.platformFeeCents,
        escrowRequiredAmountCents: calculation.escrowRequiredAmountCents,
        workerGrossPayCents: calculation.workerGrossPayCents,
        workerNetPayCents: calculation.workerNetPayCents,
        employerCostCents: calculation.employerCostCents,
        calculationJson: JSON.stringify(calculation.calculationJson),
      },
      include: this.financialSnapshotInclude,
    });

    return this.toFinancialSnapshotResponse(snapshot);
  }

  async getFinancialSnapshot(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);
    const snapshot = await this.prisma.contractFinancialSnapshot.findFirst({
      where: {
        contractId: contract.id,
      },
      include: this.financialSnapshotInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return snapshot ? this.toFinancialSnapshotResponse(snapshot) : null;
  }

  async createInvoice(
    projectId: string,
    contractId: string,
    body: CreateProjectInvoiceDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForActor(
      projectId,
      contractId,
      user,
    );
    this.assertContractProfileOwner(contract, user);

    await this.complianceEligibilityService.assertCanCreateInvoice(
      contract.projectId,
      contract.profileId,
      user.sub,
    );

    const milestone = body.milestoneId
      ? await this.prisma.projectMilestone.findFirst({
          where: {
            id: body.milestoneId,
            contractId: contract.id,
          },
        })
      : null;

    if (body.milestoneId && !milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone && body.amountCents !== milestone.amountCents) {
      throw new BadRequestException(
        'Invoice amount must match the linked milestone amount',
      );
    }

    const latestSnapshot = contract.financialSnapshots[0] ?? null;
    const currencyCode =
      body.currencyCode?.trim() ||
      latestSnapshot?.currencyCode ||
      contract.proposal.currencyCode ||
      contract.escrowAccount?.currencyCode ||
      'EUR';
    const vatCents =
      body.vatCents ??
      this.calculateDefaultVatCents(
        body.amountCents,
        latestSnapshot?.grossAmountCents ?? null,
        latestSnapshot?.vatAmountCents ?? null,
      );
    const invoice = await this.prisma.projectInvoice.create({
      data: {
        projectId: contract.projectId,
        contractId: contract.id,
        milestoneId: milestone?.id ?? null,
        profileId: contract.profileId,
        issuedById: user.sub,
        invoiceNumber: await this.generateInvoiceNumber(),
        status: ProjectInvoiceStatus.DRAFT,
        currencyCode,
        amountCents: body.amountCents,
        vatCents,
        totalCents: body.amountCents + vatCents,
        description:
          body.description?.trim() ??
          milestone?.description?.trim() ??
          milestone?.title?.trim() ??
          contract.title,
        dueDate: this.toDate(body.dueDate) ?? null,
      },
      include: this.invoiceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectInvoice',
      entityId: invoice.id,
      action: 'CREATE',
      before: null,
      after: this.toInvoiceResponse(invoice),
      metadata: {
        contractId: contract.id,
        milestoneId: milestone?.id ?? null,
      },
    });

    return this.toInvoiceResponse(invoice);
  }

  async listInvoices(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);
    const invoices = await this.prisma.projectInvoice.findMany({
      where: {
        contractId: contract.id,
      },
      include: this.invoiceInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices.map((invoice) => this.toInvoiceResponse(invoice));
  }

  async updateInvoiceStatus(
    projectId: string,
    contractId: string,
    invoiceId: string,
    body: UpdateProjectInvoiceStatusDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForActor(
      projectId,
      contractId,
      user,
    );
    const invoice = await this.prisma.projectInvoice.findFirst({
      where: {
        id: invoiceId,
        contractId: contract.id,
      },
      include: this.invoiceInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (body.status === ProjectInvoiceStatus.ISSUED) {
      this.assertContractProfileOwner(contract, user);
      if (invoice.status !== ProjectInvoiceStatus.DRAFT) {
        throw new BadRequestException('Only draft invoices can be issued');
      }
    } else if (body.status === ProjectInvoiceStatus.CANCELLED) {
      this.assertContractProfileOwner(contract, user);
      if (invoice.status === ProjectInvoiceStatus.PAID) {
        throw new BadRequestException('Paid invoices cannot be cancelled');
      }
    } else if (body.status === ProjectInvoiceStatus.PAID) {
      if (
        !this.accessPolicy.isAdmin(user) &&
        user.sub !== contract.project.createdById
      ) {
        throw new ForbiddenException(
          'Only the project owner or admin can mark invoices paid directly',
        );
      }
    } else {
      throw new BadRequestException('Unsupported invoice status transition');
    }

    const updatedInvoice = await this.prisma.projectInvoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: body.status,
        issuedAt:
          body.status === ProjectInvoiceStatus.ISSUED
            ? (this.toDate(body.issuedAt) ?? invoice.issuedAt ?? new Date())
            : invoice.issuedAt,
        paidAt:
          body.status === ProjectInvoiceStatus.PAID
            ? (this.toDate(body.paidAt) ?? invoice.paidAt ?? new Date())
            : body.status === ProjectInvoiceStatus.CANCELLED
              ? null
              : invoice.paidAt,
      },
      include: this.invoiceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectInvoice',
      entityId: invoice.id,
      action:
        body.status === ProjectInvoiceStatus.ISSUED ? 'ISSUE' : 'STATUS_CHANGE',
      before: this.toInvoiceResponse(invoice),
      after: this.toInvoiceResponse(updatedInvoice),
      metadata: {
        contractId: contract.id,
      },
    });

    if (body.status === ProjectInvoiceStatus.ISSUED) {
      await this.notificationService.createInAppNotification({
        key: `invoice-issued:${updatedInvoice.id}:${updatedInvoice.updatedAt.toISOString()}`,
        userId: contract.project.createdById,
        type: 'INVOICE_ISSUED',
        severity: NotificationSeverity.INFO,
        title: 'Invoice issued',
        message: `${contract.profile.displayName || contract.profile.companyName || 'Contractor'} issued invoice ${updatedInvoice.invoiceNumber}.`,
        relatedEntityType: 'ProjectInvoice',
        relatedEntityId: updatedInvoice.id,
        scheduledFor: new Date(),
      });
    }

    return this.toInvoiceResponse(updatedInvoice);
  }

  async listPayments(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);
    const payments = await this.prisma.projectPayment.findMany({
      where: {
        contractId: contract.id,
      },
      include: this.paymentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => this.toPaymentResponse(payment));
  }

  async requestPayment(
    projectId: string,
    contractId: string,
    body: CreateProjectPaymentRequestDto,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForActor(
      projectId,
      contractId,
      user,
    );
    this.assertContractProfileOwner(contract, user);

    await this.complianceEligibilityService.assertCanRequestPayment(
      contract.projectId,
      contract.profileId,
      user.sub,
    );

    if (!contract.escrowAccount) {
      throw new NotFoundException('Escrow account not found');
    }

    const invoice = await this.prisma.projectInvoice.findFirst({
      where: {
        id: body.invoiceId,
        contractId: contract.id,
      },
      include: this.invoiceInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== ProjectInvoiceStatus.ISSUED) {
      throw new BadRequestException(
        'Only issued invoices can be used for payment requests',
      );
    }

    const existingPayment = await this.prisma.projectPayment.findFirst({
      where: {
        invoiceId: invoice.id,
        status: {
          in: [
            ProjectPaymentStatus.REQUESTED,
            ProjectPaymentStatus.APPROVED,
            ProjectPaymentStatus.RELEASED,
          ],
        },
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'A payment already exists for this invoice',
      );
    }

    const payment = await this.prisma.projectPayment.create({
      data: {
        projectId: contract.projectId,
        contractId: contract.id,
        invoiceId: invoice.id,
        escrowAccountId: contract.escrowAccount.id,
        profileId: contract.profileId,
        amountCents: invoice.totalCents,
        currencyCode: invoice.currencyCode,
        status: ProjectPaymentStatus.REQUESTED,
        requestedAt: new Date(),
      },
      include: this.paymentInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: contract.projectId,
      entityType: 'ProjectPayment',
      entityId: payment.id,
      action: 'REQUEST',
      before: null,
      after: this.toPaymentResponse(payment),
      metadata: {
        contractId: contract.id,
        invoiceId: invoice.id,
      },
    });

    await this.notificationService.createInAppNotification({
      key: `payment-requested:${payment.id}:${payment.updatedAt.toISOString()}`,
      userId: contract.project.createdById,
      type: 'PAYMENT_REQUESTED',
      severity: NotificationSeverity.INFO,
      title: 'Payment requested',
      message: `${contract.profile.displayName || contract.profile.companyName || 'Contractor'} requested payment for invoice ${invoice.invoiceNumber}.`,
      relatedEntityType: 'ProjectPayment',
      relatedEntityId: payment.id,
      scheduledFor: new Date(),
    });

    return this.toPaymentResponse(payment);
  }

  async updatePaymentStatus(
    paymentId: string,
    body: UpdateProjectPaymentStatusDto,
    user: AuthenticatedUser,
  ) {
    const payment = await this.prisma.projectPayment.findUnique({
      where: {
        id: paymentId,
      },
      include: this.paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    this.accessPolicy.assertCanWriteProject(user, payment.project.createdById);

    if (body.status === ProjectPaymentStatus.APPROVED) {
      if (payment.status !== ProjectPaymentStatus.REQUESTED) {
        throw new BadRequestException(
          'Only requested payments can be approved',
        );
      }

      if (
        payment.invoice.milestone &&
        payment.invoice.milestone.status !== ProjectMilestoneStatus.COMPLETED &&
        payment.invoice.milestone.status !== ProjectMilestoneStatus.RELEASED
      ) {
        throw new BadRequestException(
          'Milestone-linked invoices can only be approved after the milestone is completed',
        );
      }

      const updatedPayment = await this.prisma.projectPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: ProjectPaymentStatus.APPROVED,
          approvedAt:
            this.toDate(body.approvedAt) ?? payment.approvedAt ?? new Date(),
        },
        include: this.paymentInclude,
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId: payment.projectId,
        entityType: 'ProjectPayment',
        entityId: payment.id,
        action: 'APPROVE',
        before: this.toPaymentResponse(payment),
        after: this.toPaymentResponse(updatedPayment),
        metadata: {
          contractId: payment.contractId,
          invoiceId: payment.invoiceId,
        },
      });

      await this.notificationService.createInAppNotification({
        key: `payment-approved:${updatedPayment.id}:${updatedPayment.updatedAt.toISOString()}`,
        userId: payment.profile.userId,
        profileId: payment.profileId,
        type: 'PAYMENT_APPROVED',
        severity: NotificationSeverity.INFO,
        title: 'Payment approved',
        message: `Payment for invoice ${payment.invoice.invoiceNumber} has been approved.`,
        relatedEntityType: 'ProjectPayment',
        relatedEntityId: updatedPayment.id,
        scheduledFor: new Date(),
      });

      return this.toPaymentResponse(updatedPayment);
    }

    if (body.status === ProjectPaymentStatus.RELEASED) {
      if (payment.status !== ProjectPaymentStatus.APPROVED) {
        throw new BadRequestException('Only approved payments can be released');
      }

      const activeDispute =
        await this.projectDisputesService.hasActiveBlockingDispute({
          contractId: payment.contractId,
          invoiceId: payment.invoiceId,
          paymentId: payment.id,
          milestoneId: payment.invoice.milestoneId,
        });

      if (activeDispute) {
        throw new BadRequestException(
          `Payment release is blocked by dispute "${activeDispute.title}" (${activeDispute.status.replaceAll('_', ' ')}).`,
        );
      }

      const nextReleased =
        payment.escrowAccount.releasedAmountCents + payment.amountCents;
      if (nextReleased > payment.escrowAccount.fundedAmountCents) {
        throw new BadRequestException(
          'Escrow release would exceed funded escrow amount',
        );
      }

      const updatedPayment = await this.prisma.$transaction(async (tx) => {
        const updatedEscrow = await tx.projectEscrowAccount.update({
          where: {
            id: payment.escrowAccount.id,
          },
          data: {
            releasedAmountCents: nextReleased,
            status: this.resolveEscrowStatusAfterRelease(
              payment.escrowAccount.totalAmountCents,
              payment.escrowAccount.fundedAmountCents,
              nextReleased,
            ),
          },
        });

        const nextPayment = await tx.projectPayment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: ProjectPaymentStatus.RELEASED,
            releasedAt:
              this.toDate(body.releasedAt) ?? payment.releasedAt ?? new Date(),
          },
          include: this.paymentInclude,
        });

        await tx.projectInvoice.update({
          where: {
            id: payment.invoiceId,
          },
          data: {
            status: ProjectInvoiceStatus.PAID,
            paidAt: nextPayment.releasedAt ?? new Date(),
          },
        });

        if (payment.invoice.milestoneId) {
          await tx.projectMilestone.update({
            where: {
              id: payment.invoice.milestoneId,
            },
            data: {
              status: ProjectMilestoneStatus.RELEASED,
              completedAt: payment.invoice.milestone?.completedAt ?? new Date(),
            },
          });
        }

        return {
          payment: nextPayment,
          escrow: updatedEscrow,
        };
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId: payment.projectId,
        entityType: 'ProjectPayment',
        entityId: payment.id,
        action: 'RELEASE',
        before: this.toPaymentResponse(payment),
        after: this.toPaymentResponse(updatedPayment.payment),
        metadata: {
          contractId: payment.contractId,
          invoiceId: payment.invoiceId,
          escrowId: updatedPayment.escrow.id,
        },
      });

      await this.notificationService.createInAppNotification({
        key: `payment-released:${updatedPayment.payment.id}:${updatedPayment.payment.updatedAt.toISOString()}`,
        userId: payment.profile.userId,
        profileId: payment.profileId,
        type: 'PAYMENT_RELEASED',
        severity: NotificationSeverity.INFO,
        title: 'Payment released',
        message: `Escrow funds for invoice ${payment.invoice.invoiceNumber} have been released.`,
        relatedEntityType: 'ProjectPayment',
        relatedEntityId: updatedPayment.payment.id,
        scheduledFor: new Date(),
      });

      await this.messagingService.addSystemMessage({
        type: ConversationType.CONTRACT,
        contractId: payment.contractId,
        actorUserId: user.sub,
        content: `Payment for invoice ${payment.invoice.invoiceNumber} was released.`,
        metadata: {
          paymentId: updatedPayment.payment.id,
          invoiceId: payment.invoiceId,
          contractId: payment.contractId,
        },
      });

      return this.toPaymentResponse(updatedPayment.payment);
    }

    if (body.status === ProjectPaymentStatus.FAILED) {
      if (
        payment.status !== ProjectPaymentStatus.REQUESTED &&
        payment.status !== ProjectPaymentStatus.APPROVED
      ) {
        throw new BadRequestException(
          'Only requested or approved payments can fail',
        );
      }

      const updatedPayment = await this.prisma.projectPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: ProjectPaymentStatus.FAILED,
        },
        include: this.paymentInclude,
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId: payment.projectId,
        entityType: 'ProjectPayment',
        entityId: payment.id,
        action: 'FAIL',
        before: this.toPaymentResponse(payment),
        after: this.toPaymentResponse(updatedPayment),
      });

      return this.toPaymentResponse(updatedPayment);
    }

    throw new BadRequestException('Unsupported payment status transition');
  }

  private async getProjectForRead(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanReadProject(user, project.createdById);
    return project;
  }

  private async getProjectForOwner(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);
    this.accessPolicy.assertCanWriteProject(user, project.createdById);
    return project;
  }

  private async getContractForRead(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    await this.getProjectForRead(projectId, user);
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

    return contract;
  }

  private async getContractForOwner(
    projectId: string,
    contractId: string,
    user: AuthenticatedUser,
  ) {
    const contract = await this.getContractForRead(projectId, contractId, user);
    this.accessPolicy.assertCanWriteProject(user, contract.project.createdById);
    return contract;
  }

  private async getContractForActor(
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

    const isOwner =
      this.accessPolicy.isAdmin(user) ||
      contract.project.createdById === user.sub;
    const isContractProfileOwner = contract.profile.userId === user.sub;

    if (!isOwner && !isContractProfileOwner) {
      throw new ForbiddenException('You do not have access to this contract');
    }

    return contract;
  }

  private assertContractProfileOwner(contract: any, user: AuthenticatedUser) {
    if (contract.profile.userId !== user.sub) {
      throw new ForbiddenException(
        'Only the contract profile owner can perform this action',
      );
    }
  }

  private async generateInvoiceNumber() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const count = await this.prisma.projectInvoice.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calculateDefaultVatCents(
    amountCents: number,
    snapshotGrossAmountCents: number | null,
    snapshotVatAmountCents: number | null,
  ) {
    if (
      !snapshotGrossAmountCents ||
      !snapshotVatAmountCents ||
      snapshotGrossAmountCents <= 0
    ) {
      return 0;
    }

    const vatRate = snapshotVatAmountCents / snapshotGrossAmountCents;
    return Math.round(amountCents * vatRate);
  }

  private resolveEscrowStatusAfterRelease(
    totalAmountCents: number,
    fundedAmountCents: number,
    releasedAmountCents: number,
  ) {
    if (fundedAmountCents <= 0) {
      return ProjectEscrowStatus.NOT_FUNDED;
    }

    if (releasedAmountCents >= fundedAmountCents) {
      return ProjectEscrowStatus.RELEASED;
    }

    if (fundedAmountCents >= totalAmountCents && totalAmountCents > 0) {
      return ProjectEscrowStatus.FUNDED;
    }

    return ProjectEscrowStatus.PARTIALLY_FUNDED;
  }

  private toContractResponse(contract: any) {
    return {
      id: contract.id,
      projectId: contract.projectId,
      proposalId: contract.proposalId,
      profileId: contract.profileId,
      createdById: contract.createdById,
      status: contract.status,
      contractType: contract.contractType,
      title: contract.title,
      scopeSummary: contract.scopeSummary,
      commercialTerms: contract.commercialTerms,
      paymentTerms: contract.paymentTerms,
      safetyTerms: contract.safetyTerms,
      insuranceTerms: contract.insuranceTerms,
      startDate: contract.startDate,
      endDate: contract.endDate,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      createdBy: contract.createdBy,
      project: {
        id: contract.project.id,
        name: contract.project.name,
        slug: contract.project.slug,
        status: contract.project.status,
        engagementModel: contract.project.engagementModel,
      },
      proposal: {
        id: contract.proposal.id,
        status: contract.proposal.status,
        title: contract.proposal.title,
        priceCents: contract.proposal.priceCents,
        currencyCode: contract.proposal.currencyCode,
        message: contract.proposal.message,
        terms: contract.proposal.terms,
        estimatedStartDate: contract.proposal.estimatedStartDate,
        estimatedEndDate: contract.proposal.estimatedEndDate,
      },
      profile: {
        id: contract.profile.id,
        userId: contract.profile.userId,
        profileType: contract.profile.profileType,
        displayName: contract.profile.displayName,
        companyName: contract.profile.companyName,
        summary: contract.profile.summary,
      },
      escrow: contract.escrowAccount
        ? this.toEscrowResponse(contract.escrowAccount)
        : null,
      milestones: contract.milestones.map((milestone: any) =>
        this.toMilestoneResponse(milestone),
      ),
      financialSnapshot: contract.financialSnapshots[0]
        ? this.toFinancialSnapshotResponse(contract.financialSnapshots[0])
        : null,
      invoices: contract.invoices.map((invoice: any) =>
        this.toInvoiceResponse(invoice),
      ),
      payments: contract.payments.map((payment: any) =>
        this.toPaymentResponse(payment),
      ),
      disputes: contract.disputes.map((dispute: any) =>
        this.toDisputeResponse(dispute),
      ),
    };
  }

  private toEscrowResponse(escrow: any) {
    return {
      id: escrow.id,
      projectId: escrow.projectId,
      contractId: escrow.contractId,
      status: escrow.status,
      currencyCode: escrow.currencyCode,
      totalAmountCents: escrow.totalAmountCents,
      fundedAmountCents: escrow.fundedAmountCents,
      releasedAmountCents: escrow.releasedAmountCents,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
    };
  }

  private toMilestoneResponse(milestone: any) {
    return {
      id: milestone.id,
      projectId: milestone.projectId,
      contractId: milestone.contractId,
      title: milestone.title,
      description: milestone.description,
      amountCents: milestone.amountCents,
      status: milestone.status,
      dueDate: milestone.dueDate,
      completedAt: milestone.completedAt,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };
  }

  private toFinancialSnapshotResponse(snapshot: any) {
    return {
      id: snapshot.id,
      contractId: snapshot.contractId,
      projectId: snapshot.projectId,
      profileId: snapshot.profileId,
      countryId: snapshot.countryId,
      contractType: snapshot.contractType,
      currencyCode: snapshot.currencyCode,
      grossAmountCents: snapshot.grossAmountCents,
      vatAmountCents: snapshot.vatAmountCents,
      netAmountCents: snapshot.netAmountCents,
      platformFeeCents: snapshot.platformFeeCents,
      escrowRequiredAmountCents: snapshot.escrowRequiredAmountCents,
      workerGrossPayCents: snapshot.workerGrossPayCents,
      workerNetPayCents: snapshot.workerNetPayCents,
      employerCostCents: snapshot.employerCostCents,
      calculationJson: this.parseCalculationJson(snapshot.calculationJson),
      createdAt: snapshot.createdAt,
      country: snapshot.country
        ? {
            id: snapshot.country.id,
            code: snapshot.country.code,
            name: snapshot.country.name,
            currency: snapshot.country.currency,
            vatRate: snapshot.country.vatRate,
          }
        : null,
    };
  }

  private toInvoiceResponse(invoice: any) {
    return {
      id: invoice.id,
      projectId: invoice.projectId,
      contractId: invoice.contractId,
      milestoneId: invoice.milestoneId,
      profileId: invoice.profileId,
      issuedById: invoice.issuedById,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currencyCode: invoice.currencyCode,
      amountCents: invoice.amountCents,
      vatCents: invoice.vatCents,
      totalCents: invoice.totalCents,
      description: invoice.description,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      profile: invoice.profile
        ? {
            id: invoice.profile.id,
            userId: invoice.profile.userId,
            profileType: invoice.profile.profileType,
            displayName: invoice.profile.displayName,
            companyName: invoice.profile.companyName,
            summary: invoice.profile.summary,
          }
        : null,
      issuedBy: invoice.issuedBy
        ? {
            id: invoice.issuedBy.id,
            email: invoice.issuedBy.email,
            role: invoice.issuedBy.role,
          }
        : null,
      milestone: invoice.milestone
        ? this.toMilestoneResponse(invoice.milestone)
        : null,
      payments: invoice.payments
        ? invoice.payments.map((payment: any) =>
            this.toPaymentResponse(payment),
          )
        : [],
    };
  }

  private toPaymentResponse(payment: any) {
    return {
      id: payment.id,
      projectId: payment.projectId,
      contractId: payment.contractId,
      invoiceId: payment.invoiceId,
      escrowAccountId: payment.escrowAccountId,
      profileId: payment.profileId,
      amountCents: payment.amountCents,
      currencyCode: payment.currencyCode,
      status: payment.status,
      requestedAt: payment.requestedAt,
      approvedAt: payment.approvedAt,
      releasedAt: payment.releasedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      profile: payment.profile
        ? {
            id: payment.profile.id,
            userId: payment.profile.userId,
            profileType: payment.profile.profileType,
            displayName: payment.profile.displayName,
            companyName: payment.profile.companyName,
            summary: payment.profile.summary,
          }
        : null,
      invoice: payment.invoice
        ? {
            id: payment.invoice.id,
            invoiceNumber: payment.invoice.invoiceNumber,
            status: payment.invoice.status,
            totalCents: payment.invoice.totalCents,
            currencyCode: payment.invoice.currencyCode,
            milestoneId: payment.invoice.milestoneId,
          }
        : null,
    };
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
      events: dispute.events.map((event: any) => ({
        id: event.id,
        disputeId: event.disputeId,
        actorUserId: event.actorUserId,
        type: event.type,
        message: event.message,
        metadataJson: this.parseCalculationJson(event.metadataJson),
        createdAt: event.createdAt,
        actorUser: event.actorUser
          ? {
              id: event.actorUser.id,
              email: event.actorUser.email,
              role: event.actorUser.role,
            }
          : null,
      })),
    };
  }

  private parseCalculationJson(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private defaultPaymentTerms(
    priceCents: number | null,
    currencyCode: string | null,
  ) {
    if (priceCents && priceCents > 0) {
      return `Escrow target ${currencyCode ?? 'EUR'} ${(
        priceCents / 100
      ).toFixed(2)}; release by approved milestones.`;
    }

    return 'Escrow to be funded and released against approved milestones.';
  }

  private toDate(value?: string | null) {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private readonly financialSnapshotInclude = {
    country: true,
  } as const;

  private readonly invoiceInclude = {
    milestone: true,
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
    issuedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    payments: {
      include: {
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalCents: true,
            currencyCode: true,
            milestoneId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
  } satisfies Prisma.ProjectInvoiceInclude;

  private readonly paymentInclude = {
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
    invoice: {
      include: {
        milestone: true,
      },
    },
    escrowAccount: true,
    project: {
      select: {
        id: true,
        createdById: true,
      },
    },
  } satisfies Prisma.ProjectPaymentInclude;

  private readonly contractInclude = {
    createdBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    project: {
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        engagementModel: true,
        createdById: true,
        country: {
          select: {
            id: true,
            code: true,
            name: true,
            currency: true,
            vatRate: true,
          },
        },
      },
    },
    proposal: {
      select: {
        id: true,
        status: true,
        title: true,
        priceCents: true,
        currencyCode: true,
        message: true,
        terms: true,
        estimatedStartDate: true,
        estimatedEndDate: true,
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
    escrowAccount: true,
    milestones: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    invoices: {
      include: this.invoiceInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    payments: {
      include: this.paymentInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    disputes: {
      include: {
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
          include: {
            actorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc' as const,
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    financialSnapshots: {
      include: this.financialSnapshotInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 1,
    },
  } satisfies Prisma.ProjectContractInclude;
}
