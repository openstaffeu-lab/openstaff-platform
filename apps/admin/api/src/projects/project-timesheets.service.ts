import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationSeverity,
  ProfileType,
  ProjectContractStatus,
  ProjectEngagementModel,
  UserTaskPriority,
  UserTaskStatus,
  UserTaskType,
  WorkerTimesheetStatus,
  WorkerWorkLogStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialRulesService } from './financial-rules.service';
import { GenerateWorkerTimesheetDto } from './dto/generate-worker-timesheet.dto';
import { UpdateWorkerTimesheetStatusDto } from './dto/update-worker-timesheet-status.dto';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

const contractorAccessContractStatuses: ProjectContractStatus[] = [
  ProjectContractStatus.DRAFT,
  ProjectContractStatus.SENT,
  ProjectContractStatus.ACCEPTED,
  ProjectContractStatus.ACTIVE,
  ProjectContractStatus.COMPLETED,
];

const defaultHourlyRateByContractType: Record<ProjectEngagementModel, number> = {
  B2B: 3500,
  B2C: 2200,
  MIXED: 2800,
};

@Injectable()
export class ProjectTimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly financialRulesService: FinancialRulesService,
  ) {}

  async generateTimesheet(
    projectId: string,
    body: GenerateWorkerTimesheetDto,
    user: AuthenticatedUser,
  ) {
    const context = await this.getProjectScopedAccess(projectId, user);
    const periodStart = this.toStartOfDay(body.periodStart);
    const periodEnd = this.toEndOfDay(body.periodEnd);

    if (periodEnd < periodStart) {
      throw new BadRequestException('Timesheet period end must be after period start');
    }

    const worker = await this.prisma.profileWorker.findFirst({
      where: {
        id: body.workerId,
        ...(context.isOwner ? {} : { profileId: context.currentProfile.id }),
      },
      include: {
        profile: true,
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found for timesheet generation');
    }

    const existing = await this.prisma.workerTimesheet.findFirst({
      where: {
        projectId,
        workerId: worker.id,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      throw new BadRequestException('A timesheet already exists for this worker and period');
    }

    const assignments = await this.prisma.projectWorkerAssignment.findMany({
      where: {
        projectId,
        workerId: worker.id,
        ...(body.contractId ? { contractId: body.contractId } : {}),
      },
      include: {
        contract: true,
      },
      orderBy: [{ approvedAt: 'desc' }, { assignedAt: 'desc' }],
    });

    if (assignments.length === 0) {
      throw new BadRequestException('The worker has no project assignment for this timesheet');
    }

    const selectedContractId =
      body.contractId ?? assignments.find((item) => item.contractId)?.contractId ?? null;

    const approvedLogs = await this.prisma.workerWorkLog.findMany({
      where: {
        projectId,
        workerId: worker.id,
        status: WorkerWorkLogStatus.APPROVED,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        assignment: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    const filteredLogs = selectedContractId
      ? approvedLogs.filter((log) => log.assignment?.contractId === selectedContractId)
      : approvedLogs;

    if (filteredLogs.length === 0) {
      throw new BadRequestException(
        'Timesheets can only be generated from approved work logs within the selected period',
      );
    }

    const totalHours = filteredLogs.reduce((sum, log) => sum + log.hoursWorked, 0);
    const thresholdHours = this.getRegularHourThreshold(periodStart, periodEnd);
    const regularHours = Math.min(totalHours, thresholdHours);
    const overtimeHours = Math.max(totalHours - thresholdHours, 0);
    const attendanceCount = await this.prisma.workerAttendance.count({
      where: {
        projectId,
        workerId: worker.id,
        checkInAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const timesheet = await this.prisma.workerTimesheet.create({
      data: {
        projectId,
        contractId: selectedContractId,
        profileId: worker.profileId,
        workerId: worker.id,
        periodStart,
        periodEnd,
        totalHours,
        regularHours,
        overtimeHours,
        status: WorkerTimesheetStatus.DRAFT,
      },
      include: this.timesheetInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerTimesheet',
      entityId: timesheet.id,
      action: 'GENERATE',
      before: null,
      after: this.toTimesheetResponse(timesheet),
      metadata: {
        workerId: worker.id,
        approvedLogIds: filteredLogs.map((log) => log.id),
        attendanceCount,
        thresholdHours,
      },
    });

    return this.toTimesheetResponse(timesheet);
  }

  async listProjectTimesheets(projectId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const timesheets = await this.prisma.workerTimesheet.findMany({
      where: {
        projectId,
        ...(access.isOwner ? {} : { profileId: access.currentProfile.id }),
      },
      include: this.timesheetInclude,
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });

    return timesheets.map((timesheet) => this.toTimesheetResponse(timesheet));
  }

  async getProjectTimesheet(projectId: string, timesheetId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const timesheet = await this.prisma.workerTimesheet.findFirst({
      where: {
        id: timesheetId,
        projectId,
        ...(access.isOwner ? {} : { profileId: access.currentProfile.id }),
      },
      include: this.timesheetInclude,
    });

    if (!timesheet) {
      throw new NotFoundException('Worker timesheet not found');
    }

    return this.toTimesheetResponse(timesheet);
  }

  async updateTimesheetStatus(
    projectId: string,
    timesheetId: string,
    body: UpdateWorkerTimesheetStatusDto,
    user: AuthenticatedUser,
  ) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const timesheet = await this.prisma.workerTimesheet.findFirst({
      where: {
        id: timesheetId,
        projectId,
      },
      include: this.timesheetInclude,
    });

    if (!timesheet) {
      throw new NotFoundException('Worker timesheet not found');
    }

    if (!access.isOwner && access.currentProfile.id !== timesheet.profileId) {
      throw new ForbiddenException('You do not have access to this timesheet');
    }

    if (timesheet.status === WorkerTimesheetStatus.LOCKED) {
      throw new ForbiddenException('Locked timesheets cannot be modified');
    }

    const isContractor = !access.isOwner && access.currentProfile.id === timesheet.profileId;
    const reviewer = access.isOwner;
    let complianceWarnings: string[] = [];

    if (body.status === WorkerTimesheetStatus.SUBMITTED || body.status === WorkerTimesheetStatus.DRAFT) {
      if (!isContractor) {
        throw new ForbiddenException('Only the contractor profile owner can submit or draft a timesheet');
      }
    }

    if (
      body.status === WorkerTimesheetStatus.APPROVED ||
      body.status === WorkerTimesheetStatus.REJECTED ||
      body.status === WorkerTimesheetStatus.LOCKED
    ) {
      if (!reviewer) {
        throw new ForbiddenException('Only the project owner or admin can review timesheets');
      }
    }

    if (body.status === WorkerTimesheetStatus.LOCKED && timesheet.status !== WorkerTimesheetStatus.APPROVED) {
      throw new BadRequestException('Timesheets must be approved before they can be locked');
    }

    if (body.status === WorkerTimesheetStatus.APPROVED) {
      complianceWarnings = await this.collectComplianceWarningsForPeriod(timesheet);
    }

    const updated = await this.prisma.workerTimesheet.update({
      where: { id: timesheet.id },
      data: {
        status: body.status,
        submittedAt:
          body.status === WorkerTimesheetStatus.SUBMITTED
            ? timesheet.submittedAt ?? new Date()
            : body.status === WorkerTimesheetStatus.DRAFT
              ? null
              : timesheet.submittedAt,
        approvedById:
          body.status === WorkerTimesheetStatus.APPROVED || body.status === WorkerTimesheetStatus.REJECTED
            ? user.sub
            : body.status === WorkerTimesheetStatus.DRAFT
              ? null
              : timesheet.approvedById,
        approvedAt:
          body.status === WorkerTimesheetStatus.APPROVED
            ? timesheet.approvedAt ?? new Date()
            : body.status === WorkerTimesheetStatus.REJECTED
              ? null
              : timesheet.approvedAt,
      },
      include: this.timesheetInclude,
    });

    if (body.status === WorkerTimesheetStatus.SUBMITTED) {
      await this.notificationService.createInAppNotification({
        key: `timesheet-submitted:${updated.id}:${updated.updatedAt.toISOString()}`,
        userId: updated.project.createdById,
        type: 'TIMESHEET_SUBMITTED',
        severity: NotificationSeverity.INFO,
        title: 'Worker timesheet submitted',
        message: `${updated.worker.firstName} ${updated.worker.lastName} has a timesheet ready for review.`,
        relatedEntityType: 'WorkerTimesheet',
        relatedEntityId: updated.id,
        scheduledFor: new Date(),
      });
    }

    if (
      body.status === WorkerTimesheetStatus.APPROVED ||
      body.status === WorkerTimesheetStatus.REJECTED ||
      body.status === WorkerTimesheetStatus.LOCKED
    ) {
      await this.notificationService.createInAppNotification({
        key: `timesheet-reviewed:${updated.id}:${body.status}:${updated.updatedAt.toISOString()}`,
        userId: updated.profile.userId,
        profileId: updated.profileId,
        type: 'TIMESHEET_REVIEWED',
        severity: complianceWarnings.length > 0 ? NotificationSeverity.WARNING : NotificationSeverity.INFO,
        title: `Timesheet ${body.status.toLowerCase()}`,
        message:
          body.status === WorkerTimesheetStatus.LOCKED
            ? `Timesheet for ${updated.worker.firstName} ${updated.worker.lastName} has been locked.`
            : `Timesheet for ${updated.worker.firstName} ${updated.worker.lastName} was ${body.status.toLowerCase()}.`,
        relatedEntityType: 'WorkerTimesheet',
        relatedEntityId: updated.id,
        scheduledFor: new Date(),
      });
    }

    if (complianceWarnings.length > 0) {
      await this.prisma.userTask.upsert({
        where: {
          key: `timesheet-compliance-warning:${updated.id}`,
        },
        update: {
          status: UserTaskStatus.OPEN,
          priority: UserTaskPriority.HIGH,
          title: `Review worker compliance for ${updated.worker.firstName} ${updated.worker.lastName}`,
          description: complianceWarnings.join(' | '),
          projectId,
          contractId: updated.contractId,
          profileId: updated.profileId,
          completedAt: null,
        },
        create: {
          key: `timesheet-compliance-warning:${updated.id}`,
          assignedToUserId: updated.project.createdById,
          projectId,
          contractId: updated.contractId,
          profileId: updated.profileId,
          type: UserTaskType.REVIEW_COMPLIANCE,
          title: `Review worker compliance for ${updated.worker.firstName} ${updated.worker.lastName}`,
          description: complianceWarnings.join(' | '),
          status: UserTaskStatus.OPEN,
          priority: UserTaskPriority.HIGH,
        },
      });
    }

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerTimesheet',
      entityId: updated.id,
      action: 'STATUS_CHANGE',
      before: this.toTimesheetResponse(timesheet),
      after: this.toTimesheetResponse(updated),
      metadata: {
        complianceWarnings,
      },
    });

    return {
      ...this.toTimesheetResponse(updated),
      complianceWarnings,
    };
  }

  async calculatePayroll(projectId: string, timesheetId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const timesheet = await this.prisma.workerTimesheet.findFirst({
      where: {
        id: timesheetId,
        projectId,
        ...(access.isOwner ? {} : { profileId: access.currentProfile.id }),
      },
      include: {
        ...this.timesheetInclude,
        contract: {
          include: {
            proposal: true,
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Worker timesheet not found');
    }

    if (
      timesheet.status !== WorkerTimesheetStatus.APPROVED &&
      timesheet.status !== WorkerTimesheetStatus.LOCKED
    ) {
      throw new BadRequestException('Payroll can only be calculated for approved or locked timesheets');
    }

    const workerEligibility = await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
      projectId,
      timesheet.profileId,
      timesheet.workerId,
      {},
    );

    if (workerEligibility.workerEligibility === 'BLOCKED') {
      throw new ForbiddenException(
        `Payroll calculation is blocked. ${[...workerEligibility.blockingReasons, ...workerEligibility.missingItems].join(' | ')}`,
      );
    }

    const taxRule = await this.resolveTaxRule(
      timesheet.project.countryId,
      timesheet.contract?.contractType ?? timesheet.project.engagementModel,
    );

    const currencyCode =
      taxRule?.currencyCode ??
      timesheet.contract?.proposal?.currencyCode ??
      timesheet.project.currencyCode ??
      timesheet.project.country?.currency ??
      'EUR';

    const contractType =
      timesheet.contract?.contractType ?? timesheet.project.engagementModel;
    const hourlyRateCents = defaultHourlyRateByContractType[contractType];
    const regularPayCents = Math.round(timesheet.regularHours * hourlyRateCents);
    const overtimePayCents = Math.round(timesheet.overtimeHours * hourlyRateCents * 1.5);
    const grossPayCents = regularPayCents + overtimePayCents;
    const estimatedTaxCents = Math.round(
      grossPayCents * ((taxRule?.withholdingRate ?? 0) / 100),
    );
    const estimatedSocialContributionCents = Math.round(
      grossPayCents * ((taxRule?.socialContributionRate ?? 0) / 100),
    );
    const employerContributionCents = Math.round(
      grossPayCents * ((taxRule?.employerContributionRate ?? 0) / 100),
    );
    const netPayCents = Math.max(
      0,
      grossPayCents - estimatedTaxCents - estimatedSocialContributionCents,
    );
    const employerCostCents = grossPayCents + employerContributionCents;
    const attendanceCount = await this.prisma.workerAttendance.count({
      where: {
        projectId,
        workerId: timesheet.workerId,
        checkInAt: {
          gte: timesheet.periodStart,
          lte: timesheet.periodEnd,
        },
      },
    });

    const payroll = await this.prisma.workerPayrollCalculation.upsert({
      where: {
        timesheetId: timesheet.id,
      },
      update: {
        currencyCode,
        hourlyRateCents,
        regularPayCents,
        overtimePayCents,
        grossPayCents,
        estimatedTaxCents,
        estimatedSocialContributionCents,
        netPayCents,
        employerCostCents,
        calculationJson: JSON.stringify({
          assumptionVersion: 'phase21-v1',
          hourlyRateSource: 'contract-type-default-placeholder',
          overtimeMultiplier: 1.5,
          thresholdHours: this.getRegularHourThreshold(timesheet.periodStart, timesheet.periodEnd),
          taxRule,
          attendanceCount,
          eligibility: workerEligibility,
        }),
      },
      create: {
        timesheetId: timesheet.id,
        projectId,
        contractId: timesheet.contractId,
        profileId: timesheet.profileId,
        workerId: timesheet.workerId,
        currencyCode,
        hourlyRateCents,
        regularPayCents,
        overtimePayCents,
        grossPayCents,
        estimatedTaxCents,
        estimatedSocialContributionCents,
        netPayCents,
        employerCostCents,
        calculationJson: JSON.stringify({
          assumptionVersion: 'phase21-v1',
          hourlyRateSource: 'contract-type-default-placeholder',
          overtimeMultiplier: 1.5,
          thresholdHours: this.getRegularHourThreshold(timesheet.periodStart, timesheet.periodEnd),
          taxRule,
          attendanceCount,
          eligibility: workerEligibility,
        }),
      },
      include: this.payrollInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerPayrollCalculation',
      entityId: payroll.id,
      action: 'CALCULATE',
      before: null,
      after: this.toPayrollResponse(payroll),
      metadata: {
        timesheetId: timesheet.id,
      },
    });

    return this.toPayrollResponse(payroll);
  }

  async getPayroll(projectId: string, timesheetId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const payroll = await this.prisma.workerPayrollCalculation.findFirst({
      where: {
        projectId,
        timesheetId,
        ...(access.isOwner ? {} : { profileId: access.currentProfile.id }),
      },
      include: this.payrollInclude,
    });

    if (!payroll) {
      throw new NotFoundException('Worker payroll calculation not found');
    }

    return this.toPayrollResponse(payroll);
  }

  async listCurrentProfileTimesheets(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfile(user);
    const timesheets = await this.prisma.workerTimesheet.findMany({
      where: {
        profileId: profile.id,
      },
      include: this.timesheetInclude,
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return timesheets.map((timesheet) => this.toTimesheetResponse(timesheet));
  }

  private async collectComplianceWarningsForPeriod(timesheet: any) {
    const warnings: string[] = [];
    const expiringWorkerDocuments = await this.prisma.workerDocument.findMany({
      where: {
        workerId: timesheet.workerId,
        expiresAt: {
          gte: timesheet.periodStart,
          lte: timesheet.periodEnd,
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    for (const document of expiringWorkerDocuments) {
      warnings.push(`${document.title} expired during the timesheet period.`);
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        id: timesheet.profileId,
      },
      include: {
        actorCertifications: true,
        medicalFitnessCertificates: true,
      },
    });

    if (profile) {
      for (const certification of profile.actorCertifications) {
        if (
          certification.expiresAt &&
          certification.expiresAt >= timesheet.periodStart &&
          certification.expiresAt <= timesheet.periodEnd
        ) {
          warnings.push(`${certification.title} expired during the work period.`);
        }
      }

      for (const medical of profile.medicalFitnessCertificates) {
        if (
          medical.expiresAt &&
          medical.expiresAt >= timesheet.periodStart &&
          medical.expiresAt <= timesheet.periodEnd
        ) {
          warnings.push(`${medical.title} expired during the work period.`);
        }
      }
    }

    return Array.from(new Set(warnings));
  }

  private getRegularHourThreshold(periodStart: Date, periodEnd: Date) {
    const dayCount =
      Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const weeksCovered = Math.max(1, Math.ceil(dayCount / 7));
    return weeksCovered * 40;
  }

  private async resolveTaxRule(countryId: string | null, contractType: ProjectEngagementModel) {
    if (!countryId) {
      return null;
    }

    const exact = await this.prisma.taxRule.findFirst({
      where: {
        countryId,
        appliesTo: contractType,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (exact) {
      return exact;
    }

    if (contractType !== ProjectEngagementModel.MIXED) {
      return this.prisma.taxRule.findFirst({
        where: {
          countryId,
          appliesTo: ProjectEngagementModel.MIXED,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return null;
  }

  private async getProjectScopedAccess(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (this.accessPolicy.isAdmin(user) || project.createdById === user.sub) {
      return {
        project,
        isOwner: true,
        currentProfile: null as any,
      };
    }

    const currentProfile = await this.getCurrentProfile(user);
    const linkedContract = await this.prisma.projectContract.findFirst({
      where: {
        projectId,
        profileId: currentProfile.id,
        status: {
          in: contractorAccessContractStatuses,
        },
      },
    });

    if (!linkedContract) {
      throw new ForbiddenException('You do not have access to this project timesheet workspace');
    }

    return {
      project,
      isOwner: false,
      currentProfile,
    };
  }

  private async getCurrentProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private toStartOfDay(value: string) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private toEndOfDay(value: string) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
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

  private toPayrollResponse(payroll: any) {
    return {
      id: payroll.id,
      timesheetId: payroll.timesheetId,
      projectId: payroll.projectId,
      contractId: payroll.contractId,
      profileId: payroll.profileId,
      workerId: payroll.workerId,
      currencyCode: payroll.currencyCode,
      hourlyRateCents: payroll.hourlyRateCents,
      regularPayCents: payroll.regularPayCents,
      overtimePayCents: payroll.overtimePayCents,
      grossPayCents: payroll.grossPayCents,
      estimatedTaxCents: payroll.estimatedTaxCents,
      estimatedSocialContributionCents: payroll.estimatedSocialContributionCents,
      netPayCents: payroll.netPayCents,
      employerCostCents: payroll.employerCostCents,
      calculationJson: this.parseCalculationJson(payroll.calculationJson),
      createdAt: payroll.createdAt,
    };
  }

  private toTimesheetResponse(timesheet: any) {
    return {
      id: timesheet.id,
      projectId: timesheet.projectId,
      contractId: timesheet.contractId,
      profileId: timesheet.profileId,
      workerId: timesheet.workerId,
      periodStart: timesheet.periodStart,
      periodEnd: timesheet.periodEnd,
      status: timesheet.status,
      totalHours: timesheet.totalHours,
      regularHours: timesheet.regularHours,
      overtimeHours: timesheet.overtimeHours,
      approvedById: timesheet.approvedById,
      submittedAt: timesheet.submittedAt,
      approvedAt: timesheet.approvedAt,
      createdAt: timesheet.createdAt,
      updatedAt: timesheet.updatedAt,
      worker: timesheet.worker
        ? {
            id: timesheet.worker.id,
            profileId: timesheet.worker.profileId,
            firstName: timesheet.worker.firstName,
            lastName: timesheet.worker.lastName,
            fullName: `${timesheet.worker.firstName} ${timesheet.worker.lastName}`.trim(),
            roleTitle: timesheet.worker.roleTitle,
            status: timesheet.worker.status,
          }
        : null,
      profile: timesheet.profile
        ? {
            id: timesheet.profile.id,
            userId: timesheet.profile.userId,
            profileType: timesheet.profile.profileType,
            displayName: timesheet.profile.displayName,
            companyName: timesheet.profile.companyName,
            summary: timesheet.profile.summary,
            availabilityStatus: timesheet.profile.availabilityStatus,
          }
        : null,
      contract: timesheet.contract
        ? {
            id: timesheet.contract.id,
            title: timesheet.contract.title,
            status: timesheet.contract.status,
            contractType: timesheet.contract.contractType,
          }
        : null,
      approvedBy: timesheet.approvedBy
        ? {
            id: timesheet.approvedBy.id,
            email: timesheet.approvedBy.email,
            role: timesheet.approvedBy.role,
          }
        : null,
      payrollCalculation: timesheet.payrollCalculation
        ? this.toPayrollResponse(timesheet.payrollCalculation)
        : null,
    };
  }

  private readonly timesheetInclude = {
    project: {
      select: {
        id: true,
        name: true,
        createdById: true,
        engagementModel: true,
        currencyCode: true,
        countryId: true,
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
    contract: {
      select: {
        id: true,
        title: true,
        status: true,
        contractType: true,
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
        availabilityStatus: true,
      },
    },
    worker: {
      select: {
        id: true,
        profileId: true,
        firstName: true,
        lastName: true,
        roleTitle: true,
        status: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    payrollCalculation: {
      select: {
        id: true,
        timesheetId: true,
        projectId: true,
        contractId: true,
        profileId: true,
        workerId: true,
        currencyCode: true,
        hourlyRateCents: true,
        regularPayCents: true,
        overtimePayCents: true,
        grossPayCents: true,
        estimatedTaxCents: true,
        estimatedSocialContributionCents: true,
        netPayCents: true,
        employerCostCents: true,
        calculationJson: true,
        createdAt: true,
      },
    },
  } as const;

  private readonly payrollInclude = {
    timesheet: true,
  } as const;
}
