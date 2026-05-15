import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  BillingEventStatus,
  BillingEventType,
  CompensationType,
  ContractLifecycleStatus,
  NotificationCategory,
  PayrollCycleStatus,
  Prisma,
  Role,
  SettlementBillingStatus,
  SettlementStatus,
  TimesheetStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovePayrollSettlementDto } from './dto/approve-payroll-settlement.dto';
import { CreateCompensationAgreementDto } from './dto/create-compensation-agreement.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { ProcessPayrollCycleDto } from './dto/process-payroll-cycle.dto';
import { RejectPayrollSettlementDto } from './dto/reject-payroll-settlement.dto';

type AuthUser = {
  sub: string;
  email: string;
  role: Role;
};

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly messagingService: MessagingService,
    private readonly notificationService: NotificationService,
  ) {}

  async createCompensationAgreement(body: CreateCompensationAgreementDto, user: AuthUser) {
    const assignment = await this.prisma.workforceAssignment.findUnique({
      where: { id: body.workforceAssignmentId },
      include: this.assignmentInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Workforce assignment not found.');
    }

    const effectiveFrom = this.parseDate(body.effectiveFrom, 'effectiveFrom');
    const effectiveTo = body.effectiveTo
      ? this.parseDate(body.effectiveTo, 'effectiveTo')
      : null;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException('effectiveTo must be after effectiveFrom.');
    }

    const created = await this.prisma.compensationAgreement.create({
      data: {
        workforceAssignmentId: assignment.id,
        compensationType: body.compensationType,
        currency: body.currency.trim().toUpperCase(),
        baseRate: this.toDecimal(body.baseRate),
        overtimeRate:
          body.overtimeRate !== undefined ? this.toDecimal(body.overtimeRate) : null,
        overtimeThresholdHours: body.overtimeThresholdHours ?? null,
        effectiveFrom,
        effectiveTo,
      },
      include: {
        workforceAssignment: {
          include: this.assignmentInclude,
        },
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: assignment.projectId ?? null,
      entityType: 'CompensationAgreement',
      entityId: created.id,
      action: 'CREATE',
      before: null,
      after: this.toCompensationAgreementResponse(created),
      metadata: {
        workforceAssignmentId: assignment.id,
      },
    });

    return this.toCompensationAgreementResponse(created);
  }

  async createPayrollCycle(body: CreatePayrollCycleDto, user: AuthUser) {
    const periodStart = this.parseDate(body.periodStart, 'periodStart');
    const periodEnd = this.parseDate(body.periodEnd, 'periodEnd');

    if (periodEnd < periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart.');
    }

    const existing = await this.prisma.payrollCycle.findFirst({
      where: { periodStart, periodEnd },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('A payroll cycle already exists for this period.');
    }

    const created = await this.prisma.payrollCycle.create({
      data: {
        periodStart,
        periodEnd,
        status: PayrollCycleStatus.OPEN,
      },
      include: this.payrollCycleInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: null,
      entityType: 'PayrollCycle',
      entityId: created.id,
      action: 'CREATE',
      before: null,
      after: this.toPayrollCycleResponse(created),
      metadata: null,
    });

    return this.toPayrollCycleResponse(created);
  }

  async listPayrollCycles(_user: AuthUser, filters?: { status?: PayrollCycleStatus }) {
    const cycles = await this.prisma.payrollCycle.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      include: this.payrollCycleInclude,
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });

    return cycles.map((item) => this.toPayrollCycleResponse(item));
  }

  async getPayrollCycle(id: string, _user: AuthUser) {
    const cycle = await this.prisma.payrollCycle.findUnique({
      where: { id },
      include: this.payrollCycleInclude,
    });

    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found.');
    }

    return this.toPayrollCycleResponse(cycle);
  }

  async processPayrollCycle(id: string, body: ProcessPayrollCycleDto, user: AuthUser) {
    const cycle = await this.prisma.payrollCycle.findUnique({
      where: { id },
      include: {
        settlements: {
          include: {
            lines: true,
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found.');
    }

    if (
      cycle.status === PayrollCycleStatus.LOCKED ||
      cycle.status === PayrollCycleStatus.EXPORTED
    ) {
      throw new BadRequestException('Locked or exported payroll cycles are immutable.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rejectedSettlementIds = cycle.settlements
        .filter((item) => item.status === SettlementStatus.REJECTED)
        .map((item) => item.id);

      if (rejectedSettlementIds.length) {
        await tx.payrollSettlement.deleteMany({
          where: { id: { in: rejectedSettlementIds } },
        });
      }

      const processedTimesheetIds = await this.collectProcessedTimesheetIds(tx);

      const approvedTimesheets = await tx.timesheet.findMany({
        where: {
          status: TimesheetStatus.APPROVED,
          periodEnd: { gte: cycle.periodStart },
          periodStart: { lte: cycle.periodEnd },
          workforceAssignment: {
            status: AssignmentStatus.ACTIVE,
            endedAt: null,
            contract: {
              lifecycleStatus: ContractLifecycleStatus.ACTIVE,
            },
          },
        },
        include: this.timesheetInclude,
        orderBy: [{ userId: 'asc' }, { periodStart: 'asc' }],
      });

      const eligibleTimesheets = approvedTimesheets.filter(
        (item) => !processedTimesheetIds.has(item.id),
      );

      if (!eligibleTimesheets.length) {
        throw new BadRequestException(
          'No approved timesheets are available for payroll processing.',
        );
      }

      const grouped = new Map<string, typeof eligibleTimesheets>();
      for (const timesheet of eligibleTimesheets) {
        const current = grouped.get(timesheet.workforceAssignmentId) ?? [];
        current.push(timesheet);
        grouped.set(timesheet.workforceAssignmentId, current);
      }

      for (const [assignmentId, timesheets] of grouped.entries()) {
        const assignment = timesheets[0].workforceAssignment;
        const agreement = this.pickActiveCompensationAgreement(
          assignment.compensationAgreements,
          cycle.periodStart,
          cycle.periodEnd,
        );

        if (!agreement) {
          throw new BadRequestException(
            `Compensation agreement missing for workforce assignment ${assignmentId}.`,
          );
        }

        const settlementSnapshot = this.buildSettlementSnapshot(
          timesheets,
          agreement,
          cycle.periodStart,
          cycle.periodEnd,
        );

        await tx.payrollSettlement.create({
          data: {
            payrollCycleId: cycle.id,
            workforceAssignmentId: assignment.id,
            userId: assignment.userId,
            approvedTimesheetIds: settlementSnapshot.approvedTimesheetIds,
            regularHours: settlementSnapshot.regularHours,
            overtimeHours: settlementSnapshot.overtimeHours,
            grossAmount: this.toDecimal(settlementSnapshot.grossAmount),
            deductionsAmount: this.toDecimal(settlementSnapshot.deductionsAmount),
            netAmount: this.toDecimal(settlementSnapshot.netAmount),
            currency: settlementSnapshot.currency,
            status: SettlementStatus.PENDING,
            lines: {
              create: settlementSnapshot.lines.map((line) => ({
                description: line.description,
                quantity: line.quantity,
                unitRate: this.toDecimal(line.unitRate),
                amount: this.toDecimal(line.amount),
              })),
            },
          },
        });
      }

      const settlements = await tx.payrollSettlement.findMany({
        where: {
          payrollCycleId: cycle.id,
          status: {
            not: SettlementStatus.REJECTED,
          },
        },
      });

      const totalGrossAmount = settlements.reduce(
        (sum, item) => sum + this.toNumber(item.grossAmount),
        0,
      );

      await tx.payrollCycle.update({
        where: { id: cycle.id },
        data: {
          status: PayrollCycleStatus.PROCESSING,
          processedAt: new Date(),
          totalWorkers: settlements.length,
          totalGrossAmount: this.toDecimal(totalGrossAmount),
        },
      });

      return tx.payrollCycle.findUniqueOrThrow({
        where: { id: cycle.id },
        include: this.payrollCycleInclude,
      });
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: null,
      entityType: 'PayrollCycle',
      entityId: updated.id,
      action: 'PROCESS',
      before: { status: cycle.status },
      after: this.toPayrollCycleResponse(updated),
      metadata: {
        note: this.normalizeNullableString(body.note),
      },
    });

    return this.toPayrollCycleResponse(updated);
  }

  async listSettlements(
    _user: AuthUser,
    filters?: { q?: string; status?: SettlementStatus; cycleId?: string },
  ) {
    const where: Prisma.PayrollSettlementWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.cycleId ? { payrollCycleId: filters.cycleId } : {}),
    };

    if (filters?.q?.trim()) {
      const query = filters.q.trim();
      where.OR = [
        { user: { email: { contains: query, mode: 'insensitive' } } },
        {
          workforceAssignment: {
            job: { title: { contains: query, mode: 'insensitive' } },
          },
        },
        {
          workforceAssignment: {
            project: { name: { contains: query, mode: 'insensitive' } },
          },
        },
      ];
    }

    const settlements = await this.prisma.payrollSettlement.findMany({
      where,
      include: this.payrollSettlementInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return settlements.map((item) => this.toPayrollSettlementResponse(item));
  }

  async getSettlement(id: string, _user: AuthUser) {
    const settlement = await this.prisma.payrollSettlement.findUnique({
      where: { id },
      include: this.payrollSettlementInclude,
    });

    if (!settlement) {
      throw new NotFoundException('Payroll settlement not found.');
    }

    return this.toPayrollSettlementResponse(settlement);
  }

  async createBillingEventFromSettlement(id: string, user: AuthUser) {
    const settlement = await this.prisma.payrollSettlement.findUnique({
      where: { id },
      include: this.payrollSettlementInclude,
    });

    if (!settlement) {
      throw new NotFoundException('Payroll settlement not found.');
    }

    this.assertSettlementBillingEligibility(settlement);

    if (settlement.billingLink) {
      throw new BadRequestException('A billing event already exists for this payroll settlement.');
    }

    const previousBillingLinkStatus = 'NOT_BILLED';

    const created = await this.prisma.$transaction(async (tx) => {
      const billingEvent = await tx.billingEvent.create({
        data: {
          userId: settlement.userId,
          type: BillingEventType.WORKFORCE_SETTLEMENT,
          amount: Math.round(this.toNumber(settlement.netAmount)),
          currency: settlement.currency,
          status: BillingEventStatus.PENDING,
          description: `Workforce settlement for ${settlement.workforceAssignment.job.title}`,
          metadata: {
            payrollSettlementId: settlement.id,
            payrollCycleId: settlement.payrollCycleId,
            workforceAssignmentId: settlement.workforceAssignmentId,
            workerUserId: settlement.userId,
            regularHours: settlement.regularHours,
            overtimeHours: settlement.overtimeHours,
            netAmount: this.toNumber(settlement.netAmount),
            grossAmount: this.toNumber(settlement.grossAmount),
            contractId: settlement.workforceAssignment.contract.id,
            projectId: settlement.workforceAssignment.project?.id ?? null,
            jobId: settlement.workforceAssignment.job.id,
          },
        },
      });

      await tx.workforceBillingLink.create({
        data: {
          payrollSettlementId: settlement.id,
          billingEventId: billingEvent.id,
          status: SettlementBillingStatus.BILLING_EVENT_CREATED,
        },
      });

      return tx.payrollSettlement.findUniqueOrThrow({
        where: { id: settlement.id },
        include: this.payrollSettlementInclude,
      });
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: settlement.workforceAssignment.projectId ?? null,
      entityType: 'PayrollSettlement',
      entityId: settlement.id,
      action: 'CREATE_BILLING_EVENT',
      before: {
        billingLinkStatus: previousBillingLinkStatus,
      },
      after: this.toPayrollSettlementResponse(created),
      metadata: {
        billingEventType: BillingEventType.WORKFORCE_SETTLEMENT,
      },
    });

    return this.toPayrollSettlementResponse(created);
  }

  async createBillingEventsForCycle(payrollCycleId: string, user: AuthUser) {
    const cycle = await this.prisma.payrollCycle.findUnique({
      where: { id: payrollCycleId },
      include: {
        settlements: {
          include: this.payrollSettlementInclude,
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found.');
    }

    const eligibleSettlements = cycle.settlements.filter(
      (settlement) =>
        this.isBillableSettlementStatus(settlement.status) && !settlement.billingLink,
    );

    const createdSettlementIds: string[] = [];

    for (const settlement of eligibleSettlements) {
      await this.createBillingEventFromSettlement(settlement.id, user);
      createdSettlementIds.push(settlement.id);
    }

    const refreshedLinks = await this.listBillingLinks(user, { payrollCycleId });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: null,
      entityType: 'PayrollCycle',
      entityId: payrollCycleId,
      action: 'CREATE_BILLING_EVENTS',
      before: {
        settlementCount: cycle.settlements.length,
      },
      after: {
        createdCount: createdSettlementIds.length,
      },
      metadata: {
        createdSettlementIds,
      },
    });

    return {
      payrollCycleId,
      createdCount: createdSettlementIds.length,
      links: refreshedLinks,
    };
  }

  async listBillingLinks(
    _user: AuthUser,
    filters?: {
      payrollCycleId?: string;
      status?: SettlementBillingStatus;
    },
  ) {
    const links = await this.prisma.workforceBillingLink.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.payrollCycleId
          ? {
              payrollSettlement: {
                payrollCycleId: filters.payrollCycleId,
              },
            }
          : {}),
      },
      include: this.workforceBillingLinkInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return links.map((link) => this.toWorkforceBillingLinkResponse(link));
  }

  async approveSettlement(id: string, body: ApprovePayrollSettlementDto, user: AuthUser) {
    const settlement = await this.prisma.payrollSettlement.findUnique({
      where: { id },
      include: this.payrollSettlementInclude,
    });

    if (!settlement) {
      throw new NotFoundException('Payroll settlement not found.');
    }

    if (settlement.payrollCycle.status === PayrollCycleStatus.LOCKED) {
      throw new BadRequestException('Locked payroll cycles are immutable.');
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      throw new BadRequestException('Only pending settlements can be approved.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payrollSettlement.update({
        where: { id: settlement.id },
        data: {
          status: SettlementStatus.APPROVED,
          approvedAt: new Date(),
          approvedByUserId: user.sub,
          rejectionReason: null,
        },
      });

      await this.maybeLockCycle(tx, settlement.payrollCycleId);

      return tx.payrollSettlement.findUniqueOrThrow({
        where: { id: settlement.id },
        include: this.payrollSettlementInclude,
      });
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: settlement.workforceAssignment.projectId ?? null,
      entityType: 'PayrollSettlement',
      entityId: settlement.id,
      action: 'APPROVE',
      before: { status: settlement.status },
      after: this.toPayrollSettlementResponse(updated),
      metadata: {
        note: this.normalizeNullableString(body.note),
      },
    });

    await this.notificationService.emitEvent({
      key: `payroll:settlement:${updated.id}:APPROVED`,
      eventType: 'PAYROLL_SETTLEMENT_APPROVED',
      sourceType: 'PAYROLL_SETTLEMENT',
      sourceId: updated.id,
      userId: updated.userId,
      category: NotificationCategory.PAYROLL,
      title: 'Payroll settlement approved',
      message: 'Your payroll settlement was approved.',
      relatedEntityType: 'PayrollSettlement',
      relatedEntityId: updated.id,
      metadata: {
        payrollCycleId: updated.payrollCycleId,
        netAmount: updated.netAmount,
        currency: updated.currency,
      },
    });

    return this.toPayrollSettlementResponse(updated);
  }

  async rejectSettlement(id: string, body: RejectPayrollSettlementDto, user: AuthUser) {
    const settlement = await this.prisma.payrollSettlement.findUnique({
      where: { id },
      include: this.payrollSettlementInclude,
    });

    if (!settlement) {
      throw new NotFoundException('Payroll settlement not found.');
    }

    if (
      settlement.payrollCycle.status === PayrollCycleStatus.LOCKED ||
      settlement.payrollCycle.status === PayrollCycleStatus.EXPORTED
    ) {
      throw new BadRequestException('Locked or exported payroll cycles are immutable.');
    }

    if (
      settlement.status !== SettlementStatus.PENDING &&
      settlement.status !== SettlementStatus.APPROVED
    ) {
      throw new BadRequestException('Only pending or approved settlements can be rejected.');
    }

    const updated = await this.prisma.payrollSettlement.update({
      where: { id: settlement.id },
      data: {
        status: SettlementStatus.REJECTED,
        rejectionReason: body.reason.trim(),
        approvedAt: null,
        approvedByUserId: null,
      },
      include: this.payrollSettlementInclude,
    });

    await this.prisma.payrollCycle.update({
      where: { id: settlement.payrollCycleId },
      data: {
        status: PayrollCycleStatus.PROCESSING,
        lockedAt: null,
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: settlement.workforceAssignment.projectId ?? null,
      entityType: 'PayrollSettlement',
      entityId: settlement.id,
      action: 'REJECT',
      before: { status: settlement.status },
      after: this.toPayrollSettlementResponse(updated),
      metadata: {
        reason: body.reason.trim(),
      },
    });

    await this.messagingService.createPayrollIssueNotification(
      updated.id,
      user.sub,
      body.reason,
    );

    await this.notificationService.emitEvent({
      key: `payroll:settlement:${updated.id}:REJECTED`,
      eventType: 'PAYROLL_SETTLEMENT_REJECTED',
      sourceType: 'PAYROLL_SETTLEMENT',
      sourceId: updated.id,
      userId: updated.userId,
      category: NotificationCategory.PAYROLL,
      title: 'Payroll settlement rejected',
      message: 'Your payroll settlement needs review before payment preparation can continue.',
      relatedEntityType: 'PayrollSettlement',
      relatedEntityId: updated.id,
      metadata: {
        payrollCycleId: updated.payrollCycleId,
        reason: body.reason.trim(),
      },
    });

    return this.toPayrollSettlementResponse(updated);
  }

  async getMyPayrollOverview(user: AuthUser) {
    const [settlements, agreements, assignments, cycles] = await Promise.all([
      this.prisma.payrollSettlement.findMany({
        where: { userId: user.sub },
        include: this.payrollSettlementInclude,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.compensationAgreement.findMany({
        where: {
          workforceAssignment: {
            userId: user.sub,
          },
        },
        include: {
          workforceAssignment: {
            include: this.assignmentInclude,
          },
        },
        orderBy: [{ effectiveFrom: 'desc' }],
      }),
      this.prisma.workforceAssignment.findMany({
        where: { userId: user.sub },
        include: this.assignmentInclude,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.payrollCycle.findMany({
        where: {
          settlements: {
            some: {
              userId: user.sub,
            },
          },
        },
        include: this.payrollCycleInclude,
        orderBy: [{ periodStart: 'desc' }],
      }),
    ]);

    return {
      assignments: assignments.map((item) => this.toAssignmentSummary(item)),
      compensationAgreements: agreements.map((item) =>
        this.toCompensationAgreementResponse(item),
      ),
      settlements: settlements.map((item) => this.toPayrollSettlementResponse(item)),
      cycles: cycles.map((item) => this.toPayrollCycleResponse(item)),
    };
  }

  async getMyPayrollSettlements(user: AuthUser) {
    const settlements = await this.prisma.payrollSettlement.findMany({
      where: { userId: user.sub },
      include: this.payrollSettlementInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return settlements.map((item) => this.toPayrollSettlementResponse(item));
  }

  private async maybeLockCycle(tx: TxClient, payrollCycleId: string) {
    const settlements = await tx.payrollSettlement.findMany({
      where: { payrollCycleId },
      select: { id: true, status: true },
    });

    if (!settlements.length) {
      return;
    }

    const allApproved = settlements.every((item) =>
      item.status === SettlementStatus.APPROVED ||
      item.status === SettlementStatus.READY_FOR_PAYMENT ||
      item.status === SettlementStatus.PAID,
    );

    if (!allApproved) {
      return;
    }

    await tx.payrollSettlement.updateMany({
      where: {
        payrollCycleId,
        status: SettlementStatus.APPROVED,
      },
      data: {
        status: SettlementStatus.READY_FOR_PAYMENT,
      },
    });

    await tx.payrollCycle.update({
      where: { id: payrollCycleId },
      data: {
        status: PayrollCycleStatus.LOCKED,
        lockedAt: new Date(),
      },
    });
  }

  private assertSettlementBillingEligibility(settlement: any) {
    if (!this.isBillableSettlementStatus(settlement.status)) {
      throw new BadRequestException(
        'Only approved or ready-for-payment settlements can create billing events.',
      );
    }
  }

  private isBillableSettlementStatus(status: SettlementStatus) {
    return (
      status === SettlementStatus.APPROVED ||
      status === SettlementStatus.READY_FOR_PAYMENT
    );
  }

  private async collectProcessedTimesheetIds(tx: TxClient) {
    const settlements = await tx.payrollSettlement.findMany({
      where: {
        status: {
          not: SettlementStatus.REJECTED,
        },
      },
      select: {
        approvedTimesheetIds: true,
      },
    });

    const processed = new Set<string>();
    for (const settlement of settlements) {
      for (const id of this.extractTimesheetIds(settlement.approvedTimesheetIds)) {
        processed.add(id);
      }
    }

    return processed;
  }

  private pickActiveCompensationAgreement(
    agreements: Array<{
      id: string;
      compensationType: CompensationType;
      currency: string;
      baseRate: Prisma.Decimal;
      overtimeRate: Prisma.Decimal | null;
      overtimeThresholdHours: number | null;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    }>,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return (
      agreements
        .filter(
          (agreement) =>
            agreement.effectiveFrom <= periodEnd &&
            (!agreement.effectiveTo || agreement.effectiveTo >= periodStart),
        )
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0] ?? null
    );
  }

  private buildSettlementSnapshot(
    timesheets: Array<any>,
    agreement: {
      compensationType: CompensationType;
      currency: string;
      baseRate: Prisma.Decimal;
      overtimeRate: Prisma.Decimal | null;
      overtimeThresholdHours: number | null;
    },
    periodStart: Date,
    periodEnd: Date,
  ) {
    const totalHours = timesheets.reduce((sum, item) => sum + item.totalHours, 0);
    const explicitOvertimeHours = timesheets.reduce(
      (sum, item) => sum + item.overtimeHours,
      0,
    );
    const thresholdHours = agreement.overtimeThresholdHours ?? null;
    const thresholdOvertime =
      thresholdHours !== null ? Math.max(0, totalHours - thresholdHours) : 0;
    const overtimeHours = Number(
      Math.max(explicitOvertimeHours, thresholdOvertime).toFixed(2),
    );
    const regularHours = Number(Math.max(0, totalHours - overtimeHours).toFixed(2));
    const overtimeRate = this.toNumber(agreement.overtimeRate ?? agreement.baseRate);
    const baseRate = this.toNumber(agreement.baseRate);
    const uniqueWorkDays = new Set(
      timesheets.flatMap((item) =>
        item.entries.map((entry: any) => entry.workDate.toISOString().slice(0, 10)),
      ),
    ).size;

    const lines: Array<{
      description: string;
      quantity: number;
      unitRate: number;
      amount: number;
    }> = [];

    switch (agreement.compensationType) {
      case CompensationType.HOURLY:
        lines.push({
          description: 'Regular hours',
          quantity: regularHours,
          unitRate: baseRate,
          amount: Number((regularHours * baseRate).toFixed(2)),
        });
        break;
      case CompensationType.DAILY:
        lines.push({
          description: 'Worked days',
          quantity: uniqueWorkDays,
          unitRate: baseRate,
          amount: Number((uniqueWorkDays * baseRate).toFixed(2)),
        });
        break;
      case CompensationType.WEEKLY:
        lines.push({
          description: `Weekly base for ${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)}`,
          quantity: 1,
          unitRate: baseRate,
          amount: Number(baseRate.toFixed(2)),
        });
        break;
      case CompensationType.MONTHLY:
        lines.push({
          description: `Monthly base for ${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)}`,
          quantity: 1,
          unitRate: baseRate,
          amount: Number(baseRate.toFixed(2)),
        });
        break;
      case CompensationType.FIXED_PROJECT:
        lines.push({
          description: 'Fixed project compensation snapshot',
          quantity: 1,
          unitRate: baseRate,
          amount: Number(baseRate.toFixed(2)),
        });
        break;
      default:
        break;
    }

    if (overtimeHours > 0) {
      lines.push({
        description: 'Overtime hours',
        quantity: overtimeHours,
        unitRate: overtimeRate,
        amount: Number((overtimeHours * overtimeRate).toFixed(2)),
      });
    }

    const grossAmount = Number(
      lines.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
    );
    const deductionsAmount = 0;
    const netAmount = Number((grossAmount - deductionsAmount).toFixed(2));

    return {
      approvedTimesheetIds: timesheets.map((item) => item.id),
      regularHours,
      overtimeHours,
      grossAmount,
      deductionsAmount,
      netAmount,
      currency: agreement.currency,
      lines,
    };
  }

  private extractTimesheetIds(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private parseDate(value: string, field: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date.`);
    }
    return parsed;
  }

  private normalizeNullableString(value?: string | null) {
    const next = value?.trim();
    return next ? next : null;
  }

  private toDecimal(value: number) {
    return new Prisma.Decimal(value.toFixed(2));
  }

  private toNumber(value: Prisma.Decimal | number | null) {
    if (value === null) {
      return 0;
    }

    return Number(value);
  }

  private toAssignmentSummary(assignment: any) {
    return {
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      startedAt: assignment.startedAt,
      endedAt: assignment.endedAt,
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
      contract: {
        id: assignment.contract.id,
        lifecycleStatus: assignment.contract.lifecycleStatus,
        status: assignment.contract.status,
      },
    };
  }

  private toCompensationAgreementResponse(agreement: any) {
    return {
      id: agreement.id,
      compensationType: agreement.compensationType,
      currency: agreement.currency,
      baseRate: this.toNumber(agreement.baseRate),
      overtimeRate: agreement.overtimeRate ? this.toNumber(agreement.overtimeRate) : null,
      overtimeThresholdHours: agreement.overtimeThresholdHours,
      effectiveFrom: agreement.effectiveFrom,
      effectiveTo: agreement.effectiveTo,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
      assignment: agreement.workforceAssignment
        ? this.toAssignmentSummary(agreement.workforceAssignment)
        : null,
    };
  }

  private toPayrollCycleResponse(cycle: any) {
    const settlements = cycle.settlements ?? [];
    return {
      id: cycle.id,
      periodStart: cycle.periodStart,
      periodEnd: cycle.periodEnd,
      status: cycle.status,
      totalWorkers: cycle.totalWorkers,
      totalGrossAmount: this.toNumber(cycle.totalGrossAmount),
      processedAt: cycle.processedAt,
      lockedAt: cycle.lockedAt,
      exportedAt: cycle.exportedAt,
      createdAt: cycle.createdAt,
      updatedAt: cycle.updatedAt,
      settlementCount: settlements.length,
      pendingSettlementCount: settlements.filter((item: any) => item.status === 'PENDING')
        .length,
      readyForPaymentCount: settlements.filter(
        (item: any) => item.status === 'READY_FOR_PAYMENT',
      ).length,
      settlements: settlements.map((item: any) => this.toPayrollSettlementResponse(item)),
    };
  }

  private toPayrollSettlementResponse(settlement: any) {
    const attendanceRecords =
      settlement.workforceAssignment?.attendanceRecords?.filter((item: any) => {
        const cycleStart = settlement.payrollCycle.periodStart.getTime();
        const cycleEnd = settlement.payrollCycle.periodEnd.getTime();
        const checkIn = item.checkInAt.getTime();
        return checkIn >= cycleStart && checkIn <= cycleEnd;
      }) ?? [];

    const attendanceHours = attendanceRecords.reduce((sum: number, item: any) => {
      if (!item.checkOutAt) {
        return sum;
      }

      return (
        sum +
        (item.checkOutAt.getTime() - item.checkInAt.getTime()) / 1000 / 60 / 60
      );
    }, 0);

    return {
      id: settlement.id,
      approvedTimesheetIds: this.extractTimesheetIds(settlement.approvedTimesheetIds),
      regularHours: settlement.regularHours,
      overtimeHours: settlement.overtimeHours,
      grossAmount: this.toNumber(settlement.grossAmount),
      deductionsAmount: this.toNumber(settlement.deductionsAmount),
      netAmount: this.toNumber(settlement.netAmount),
      currency: settlement.currency,
      status: settlement.status,
      approvedAt: settlement.approvedAt,
      paidAt: settlement.paidAt,
      rejectionReason: settlement.rejectionReason,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      payrollCycle: {
        id: settlement.payrollCycle.id,
        periodStart: settlement.payrollCycle.periodStart,
        periodEnd: settlement.payrollCycle.periodEnd,
        status: settlement.payrollCycle.status,
      },
      user: {
        id: settlement.user.id,
        email: settlement.user.email,
        identityProfile: settlement.user.identityProfile
          ? {
              id: settlement.user.identityProfile.id,
              publicSlug: settlement.user.identityProfile.publicSlug,
              displayName: settlement.user.identityProfile.displayName,
              verificationStatus:
                settlement.user.identityProfile.verificationStatus,
            }
          : null,
      },
      assignment: this.toAssignmentSummary(settlement.workforceAssignment),
      lines: settlement.lines.map((line: any) => ({
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unitRate: this.toNumber(line.unitRate),
        amount: this.toNumber(line.amount),
        createdAt: line.createdAt,
      })),
      approvedByUser: settlement.approvedByUser
        ? {
            id: settlement.approvedByUser.id,
            email: settlement.approvedByUser.email,
            role: settlement.approvedByUser.role,
          }
        : null,
      attendanceSummary: {
        recordCount: attendanceRecords.length,
        totalTrackedHours: Number(attendanceHours.toFixed(2)),
      },
      billingLink: settlement.billingLink
        ? this.toWorkforceBillingLinkResponse(settlement.billingLink)
        : null,
    };
  }

  private toWorkforceBillingLinkResponse(link: any) {
    return {
      id: link.id,
      status: link.status,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      payrollSettlementId: link.payrollSettlementId,
      billingEvent: link.billingEvent
        ? {
            id: link.billingEvent.id,
            type: link.billingEvent.type,
            status: link.billingEvent.status,
            amount: link.billingEvent.amount,
            currency: link.billingEvent.currency,
            description: link.billingEvent.description,
            metadata: link.billingEvent.metadata,
          }
        : null,
      billingInvoice: link.billingInvoice
        ? {
            id: link.billingInvoice.id,
            invoiceNumber: link.billingInvoice.invoiceNumber,
            invoiceType: link.billingInvoice.invoiceType,
            status: link.billingInvoice.status,
            total: this.toNumber(link.billingInvoice.total),
            currency: link.billingInvoice.currency,
            paidAt: link.billingInvoice.paidAt,
          }
        : null,
      settlement: link.payrollSettlement
        ? {
            id: link.payrollSettlement.id,
            status: link.payrollSettlement.status,
            netAmount: this.toNumber(link.payrollSettlement.netAmount),
            grossAmount: this.toNumber(link.payrollSettlement.grossAmount),
            currency: link.payrollSettlement.currency,
            payrollCycleId: link.payrollSettlement.payrollCycleId,
            user: {
              id: link.payrollSettlement.user.id,
              email: link.payrollSettlement.user.email,
            },
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
    contract: true,
  } satisfies Prisma.WorkforceAssignmentInclude;

  private readonly timesheetInclude = {
    entries: true,
    project: true,
    user: {
      include: {
        identityProfile: true,
      },
    },
    workforceAssignment: {
      include: {
        user: {
          include: {
            identityProfile: true,
          },
        },
        project: true,
        job: true,
        contract: true,
        compensationAgreements: {
          orderBy: { effectiveFrom: 'desc' },
        },
        attendanceRecords: true,
      },
    },
  } satisfies Prisma.TimesheetInclude;

  private readonly payrollSettlementInclude = {
    payrollCycle: true,
    user: {
      include: {
        identityProfile: true,
      },
    },
    approvedByUser: true,
    lines: true,
    workforceAssignment: {
      include: {
        user: {
          include: {
            identityProfile: true,
          },
        },
        project: true,
        job: true,
        contract: true,
        attendanceRecords: true,
      },
    },
    billingLink: {
      include: {
        billingEvent: true,
        billingInvoice: true,
      },
    },
  } satisfies Prisma.PayrollSettlementInclude;

  private readonly payrollCycleInclude = {
    settlements: {
      include: {
        payrollCycle: true,
        user: {
          include: {
            identityProfile: true,
          },
        },
        approvedByUser: true,
        lines: true,
        workforceAssignment: {
          include: {
            user: {
              include: {
                identityProfile: true,
              },
            },
            project: true,
            job: true,
            contract: true,
            attendanceRecords: true,
          },
        },
        billingLink: {
          include: {
            billingEvent: true,
            billingInvoice: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    },
  } satisfies Prisma.PayrollCycleInclude;

  private readonly workforceBillingLinkInclude = {
    billingEvent: true,
    billingInvoice: true,
    payrollSettlement: {
      include: {
        user: true,
      },
    },
  } satisfies Prisma.WorkforceBillingLinkInclude;
}
