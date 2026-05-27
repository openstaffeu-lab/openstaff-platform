import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  AttendanceStatus,
  ContractLifecycleStatus,
  Prisma,
  Role,
  TimesheetStatus,
  VerificationStatus,
  WorkSessionSource,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddTimesheetEntryDto } from './dto/add-timesheet-entry.dto';
import { ApproveTimesheetDto } from './dto/approve-timesheet.dto';
import { AttendanceCheckInDto } from './dto/attendance-checkin.dto';
import { AttendanceCheckOutDto } from './dto/attendance-checkout.dto';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { RejectTimesheetDto } from './dto/reject-timesheet.dto';
import { SubmitTimesheetDto } from './dto/submit-timesheet.dto';

type AuthUser = {
  sub: string;
  email: string;
  role: Role;
};

type TxClient = Prisma.TransactionClient;

@Injectable()
export class TimesheetsService {
  private static readonly ADMIN_ROLES = new Set<Role>([
    Role.ADMIN,
    Role.SUPERADMIN,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTimesheet(body: CreateTimesheetDto, user: AuthUser) {
    const assignment = await this.getOwnedAssignment(
      body.workforceAssignmentId,
      user.sub,
    );
    this.assertTimesheetCreationAllowed(assignment);

    const periodStart = this.parseDate(body.periodStart, 'periodStart');
    const periodEnd = this.parseDate(body.periodEnd, 'periodEnd');
    if (periodEnd < periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart.');
    }

    const existing = await this.prisma.timesheet.findFirst({
      where: {
        workforceAssignmentId: assignment.id,
        periodStart,
        periodEnd,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'A timesheet already exists for this period.',
      );
    }

    const created = await this.prisma.timesheet.create({
      data: {
        workforceAssignmentId: assignment.id,
        userId: assignment.userId,
        projectId: assignment.projectId!,
        periodStart,
        periodEnd,
        status: TimesheetStatus.DRAFT,
      },
      include: this.timesheetInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: created.projectId,
      entityType: 'OperationalTimesheet',
      entityId: created.id,
      action: 'CREATE',
      before: null,
      after: this.toTimesheetResponse(created),
      metadata: {
        workforceAssignmentId: created.workforceAssignmentId,
      },
    });

    return this.toTimesheetResponse(created);
  }

  async addTimesheetEntry(
    id: string,
    body: AddTimesheetEntryDto,
    user: AuthUser,
  ) {
    const timesheet = await this.getOwnedTimesheet(id, user.sub);
    this.assertTimesheetEditable(timesheet.status);

    const workDate = this.parseDate(body.workDate, 'workDate');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          workDate,
          hoursWorked: body.hoursWorked,
          overtimeHours: body.overtimeHours ?? 0,
          notes: this.normalizeNullableString(body.notes),
        },
      });

      if (timesheet.status === TimesheetStatus.REJECTED) {
        await tx.timesheet.update({
          where: { id: timesheet.id },
          data: {
            status: TimesheetStatus.DRAFT,
            rejectionReason: null,
            approvedAt: null,
            approvedByUserId: null,
          },
        });
      }

      await this.recalculateTimesheetTotals(tx, timesheet.id);

      return tx.timesheet.findUniqueOrThrow({
        where: { id: timesheet.id },
        include: this.timesheetInclude,
      });
    });

    return this.toTimesheetResponse(updated);
  }

  async submitTimesheet(id: string, body: SubmitTimesheetDto, user: AuthUser) {
    const timesheet = await this.getOwnedTimesheet(id, user.sub);
    this.assertTimesheetSubmittable(timesheet);

    const updated = await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.timesheet.findUniqueOrThrow({
        where: { id: timesheet.id },
        include: {
          entries: true,
          workforceAssignment: {
            include: {
              contract: true,
              user: {
                include: {
                  identityProfile: true,
                },
              },
            },
          },
        },
      });

      if (!fresh.entries.length) {
        throw new BadRequestException(
          'A timesheet must include at least one entry before submit.',
        );
      }

      this.assertOperationalEligibility(fresh.workforceAssignment, true);

      await this.recalculateTimesheetTotals(tx, timesheet.id);

      await tx.timesheet.update({
        where: { id: timesheet.id },
        data: {
          status: TimesheetStatus.SUBMITTED,
          submittedAt: new Date(),
          rejectionReason: null,
        },
      });

      return tx.timesheet.findUniqueOrThrow({
        where: { id: timesheet.id },
        include: this.timesheetInclude,
      });
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: updated.projectId,
      entityType: 'OperationalTimesheet',
      entityId: updated.id,
      action: 'SUBMIT',
      before: { status: timesheet.status },
      after: { status: updated.status },
      metadata: {
        note: this.normalizeNullableString(body.note),
      },
    });

    return this.toTimesheetResponse(updated);
  }

  async getMyTimesheets(user: AuthUser) {
    const timesheets = await this.prisma.timesheet.findMany({
      where: { userId: user.sub },
      include: this.timesheetInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return timesheets.map((item) => this.toTimesheetResponse(item));
  }

  async checkIn(body: AttendanceCheckInDto, user: AuthUser) {
    const assignment = await this.getOwnedAssignment(
      body.workforceAssignmentId,
      user.sub,
    );
    this.assertAttendanceAllowed(assignment);

    const existingOpen = await this.prisma.attendanceRecord.findFirst({
      where: {
        userId: user.sub,
        status: AttendanceStatus.CHECKED_IN,
        checkOutAt: null,
      },
      select: { id: true },
    });

    if (existingOpen) {
      throw new BadRequestException(
        'Check-out is required before a new check-in.',
      );
    }

    const created = await this.prisma.attendanceRecord.create({
      data: {
        workforceAssignmentId: assignment.id,
        userId: user.sub,
        checkInAt: new Date(),
        status: AttendanceStatus.CHECKED_IN,
        source: body.source ?? WorkSessionSource.MANUAL,
        locationMetadata: this.toPrismaJsonInput(body.locationMetadata),
      },
      include: this.attendanceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: assignment.projectId ?? null,
      entityType: 'AttendanceRecord',
      entityId: created.id,
      action: 'CHECK_IN',
      before: null,
      after: this.toAttendanceResponse(created),
      metadata: {
        source: created.source,
      },
    });

    return this.toAttendanceResponse(created);
  }

  async checkOut(body: AttendanceCheckOutDto, user: AuthUser) {
    const assignment = await this.getOwnedAssignment(
      body.workforceAssignmentId,
      user.sub,
    );

    const openAttendance = await this.prisma.attendanceRecord.findFirst({
      where: {
        workforceAssignmentId: assignment.id,
        userId: user.sub,
        status: AttendanceStatus.CHECKED_IN,
        checkOutAt: null,
      },
      include: this.attendanceInclude,
      orderBy: { checkInAt: 'desc' },
    });

    if (!openAttendance) {
      throw new NotFoundException(
        'No open attendance session found for this assignment.',
      );
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: openAttendance.id },
      data: {
        checkOutAt: new Date(),
        status: AttendanceStatus.CHECKED_OUT,
        locationMetadata: this.toPrismaJsonInput(
          body.locationMetadata !== undefined
            ? body.locationMetadata
            : openAttendance.locationMetadata,
        ),
      },
      include: this.attendanceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: assignment.projectId ?? null,
      entityType: 'AttendanceRecord',
      entityId: updated.id,
      action: 'CHECK_OUT',
      before: this.toAttendanceResponse(openAttendance),
      after: this.toAttendanceResponse(updated),
      metadata: {
        durationHours: this.calculateDurationHours(
          updated.checkInAt,
          updated.checkOutAt,
        ),
      },
    });

    return this.toAttendanceResponse(updated);
  }

  async getMyAttendance(user: AuthUser) {
    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { userId: user.sub },
      include: this.attendanceInclude,
      orderBy: [{ checkInAt: 'desc' }],
    });

    return attendance.map((item) => this.toAttendanceResponse(item));
  }

  async listAdminTimesheets(
    user: AuthUser,
    filters?: { q?: string; status?: TimesheetStatus },
  ) {
    const recruiterActor = await this.findActorForUser(user);
    const where: Prisma.TimesheetWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(this.isAdmin(user.role)
        ? {}
        : recruiterActor
          ? { workforceAssignment: { job: { actorId: recruiterActor.id } } }
          : { id: '__no_match__' }),
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
        { project: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const items = await this.prisma.timesheet.findMany({
      where,
      include: this.timesheetInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((item) => this.toTimesheetResponse(item));
  }

  async getAdminTimesheet(id: string, user: AuthUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: this.timesheetInclude,
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    await this.assertRecruiterAccess(timesheet.workforceAssignment.job, user);
    return this.toTimesheetResponse(timesheet);
  }

  async approveTimesheet(
    id: string,
    body: ApproveTimesheetDto,
    user: AuthUser,
  ) {
    const timesheet = await this.getManagedTimesheet(id, user);

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only SUBMITTED timesheets can be approved.',
      );
    }

    const updated = await this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        status: TimesheetStatus.APPROVED,
        approvedAt: new Date(),
        approvedByUserId: user.sub,
        rejectionReason: null,
      },
      include: this.timesheetInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: updated.projectId,
      entityType: 'OperationalTimesheet',
      entityId: updated.id,
      action: 'APPROVE',
      before: { status: timesheet.status },
      after: { status: updated.status },
      metadata: {
        note: this.normalizeNullableString(body.note),
      },
    });

    return this.toTimesheetResponse(updated);
  }

  async rejectTimesheet(id: string, body: RejectTimesheetDto, user: AuthUser) {
    const timesheet = await this.getManagedTimesheet(id, user);

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only SUBMITTED timesheets can be rejected.',
      );
    }

    const updated = await this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        status: TimesheetStatus.REJECTED,
        approvedAt: null,
        approvedByUserId: null,
        rejectionReason: body.reason.trim(),
      },
      include: this.timesheetInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: updated.projectId,
      entityType: 'OperationalTimesheet',
      entityId: updated.id,
      action: 'REJECT',
      before: { status: timesheet.status },
      after: { status: updated.status },
      metadata: {
        reason: body.reason.trim(),
      },
    });

    return this.toTimesheetResponse(updated);
  }

  async listAdminAttendance(user: AuthUser, filters?: { q?: string }) {
    const recruiterActor = await this.findActorForUser(user);
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(this.isAdmin(user.role)
        ? {}
        : recruiterActor
          ? { workforceAssignment: { job: { actorId: recruiterActor.id } } }
          : { id: '__no_match__' }),
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
      ];
    }

    const items = await this.prisma.attendanceRecord.findMany({
      where,
      include: this.attendanceInclude,
      orderBy: [{ checkInAt: 'desc' }],
    });

    return items.map((item) => this.toAttendanceResponse(item));
  }

  private async getOwnedAssignment(id: string, userId: string) {
    const assignment = await this.prisma.workforceAssignment.findUnique({
      where: { id },
      include: this.assignmentInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Workforce assignment not found');
    }

    if (assignment.userId !== userId) {
      throw new ForbiddenException('You do not own this workforce assignment.');
    }

    return assignment;
  }

  private async getOwnedTimesheet(id: string, userId: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: this.timesheetInclude,
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.userId !== userId) {
      throw new ForbiddenException('You do not own this timesheet.');
    }

    return timesheet;
  }

  private async getManagedTimesheet(id: string, user: AuthUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: this.timesheetInclude,
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    await this.assertRecruiterAccess(timesheet.workforceAssignment.job, user);
    return timesheet;
  }

  private assertTimesheetCreationAllowed(assignment: any) {
    if (!assignment.projectId) {
      throw new BadRequestException(
        'Timesheets require a workforce assignment linked to a project.',
      );
    }

    this.assertOperationalEligibility(assignment, true);
  }

  private assertAttendanceAllowed(assignment: any) {
    this.assertOperationalEligibility(assignment, false);
  }

  private assertOperationalEligibility(
    assignment: any,
    requireProject: boolean,
  ) {
    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException(
        'Only ACTIVE assignments can perform this operation.',
      );
    }

    if (requireProject && !assignment.projectId) {
      throw new BadRequestException(
        'An assignment project is required for timesheet operations.',
      );
    }

    const lifecycleStatus = assignment.contract.lifecycleStatus;
    if (lifecycleStatus !== ContractLifecycleStatus.ACTIVE) {
      throw new BadRequestException(
        'Only ACTIVE contracts can perform this operation.',
      );
    }

    if (
      assignment.user.identityProfile?.verificationStatus !==
      VerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Verification must remain valid for workforce execution.',
      );
    }
  }

  private assertTimesheetEditable(status: TimesheetStatus) {
    if (status === TimesheetStatus.APPROVED) {
      throw new BadRequestException('Approved timesheets are immutable.');
    }

    if (status === TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(
        'Submitted timesheets lock entries until reviewed.',
      );
    }
  }

  private assertTimesheetSubmittable(timesheet: any) {
    if (timesheet.status === TimesheetStatus.APPROVED) {
      throw new BadRequestException('Approved timesheets are immutable.');
    }

    if (timesheet.status === TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Timesheet already submitted.');
    }
  }

  private async recalculateTimesheetTotals(tx: TxClient, timesheetId: string) {
    const entries = await tx.timesheetEntry.findMany({
      where: { timesheetId },
      select: { hoursWorked: true, overtimeHours: true },
    });

    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0,
    );
    const overtimeHours = entries.reduce(
      (sum, entry) => sum + entry.overtimeHours,
      0,
    );

    await tx.timesheet.update({
      where: { id: timesheetId },
      data: {
        totalHours,
        overtimeHours,
      },
    });
  }

  private async assertRecruiterAccess(
    job: { actorId: string },
    user: AuthUser,
  ) {
    if (this.isAdmin(user.role)) {
      return;
    }

    const recruiterActor = await this.findActorForUser(user);
    if (!recruiterActor || recruiterActor.id !== job.actorId) {
      throw new ForbiddenException(
        'Only the job owner or an admin can access this operational data.',
      );
    }
  }

  private async findActorForUser(user: { email: string }) {
    return this.prisma.actor.findFirst({
      where: { email: user.email },
      select: { id: true, email: true, displayName: true },
    });
  }

  private isAdmin(role: Role) {
    return TimesheetsService.ADMIN_ROLES.has(role);
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

  private toPrismaJsonInput(
    value?: Prisma.JsonValue | Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  private calculateDurationHours(checkInAt: Date, checkOutAt?: Date | null) {
    if (!checkOutAt) {
      return null;
    }

    return Number(
      ((checkOutAt.getTime() - checkInAt.getTime()) / 1000 / 60 / 60).toFixed(
        2,
      ),
    );
  }

  private toTimesheetResponse(timesheet: any) {
    return {
      id: timesheet.id,
      periodStart: timesheet.periodStart,
      periodEnd: timesheet.periodEnd,
      totalHours: timesheet.totalHours,
      overtimeHours: timesheet.overtimeHours,
      status: timesheet.status,
      submittedAt: timesheet.submittedAt,
      approvedAt: timesheet.approvedAt,
      rejectionReason: timesheet.rejectionReason,
      createdAt: timesheet.createdAt,
      updatedAt: timesheet.updatedAt,
      user: {
        id: timesheet.user.id,
        email: timesheet.user.email,
        identityProfile: timesheet.user.identityProfile
          ? {
              id: timesheet.user.identityProfile.id,
              publicSlug: timesheet.user.identityProfile.publicSlug,
              displayName: timesheet.user.identityProfile.displayName,
              verificationStatus:
                timesheet.user.identityProfile.verificationStatus,
            }
          : null,
      },
      project: {
        id: timesheet.project.id,
        name: timesheet.project.name,
        slug: timesheet.project.slug,
      },
      assignment: {
        id: timesheet.workforceAssignment.id,
        status: timesheet.workforceAssignment.status,
        assignedAt: timesheet.workforceAssignment.assignedAt,
        startedAt: timesheet.workforceAssignment.startedAt,
        endedAt: timesheet.workforceAssignment.endedAt,
      },
      contract: {
        id: timesheet.workforceAssignment.contract.id,
        lifecycleStatus: timesheet.workforceAssignment.contract.lifecycleStatus,
        status: timesheet.workforceAssignment.contract.status,
      },
      job: {
        id: timesheet.workforceAssignment.job.id,
        title: timesheet.workforceAssignment.job.title,
        status: timesheet.workforceAssignment.job.status,
      },
      entries: timesheet.entries.map((entry: any) => ({
        id: entry.id,
        workDate: entry.workDate,
        hoursWorked: entry.hoursWorked,
        overtimeHours: entry.overtimeHours,
        notes: entry.notes,
        createdAt: entry.createdAt,
      })),
      approvedByUser: timesheet.approvedByUser
        ? {
            id: timesheet.approvedByUser.id,
            email: timesheet.approvedByUser.email,
            role: timesheet.approvedByUser.role,
          }
        : null,
    };
  }

  private toAttendanceResponse(attendance: any) {
    return {
      id: attendance.id,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      status: attendance.status,
      source: attendance.source,
      locationMetadata: attendance.locationMetadata,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      durationHours: this.calculateDurationHours(
        attendance.checkInAt,
        attendance.checkOutAt,
      ),
      user: {
        id: attendance.user.id,
        email: attendance.user.email,
      },
      assignment: {
        id: attendance.workforceAssignment.id,
        status: attendance.workforceAssignment.status,
      },
      contract: {
        id: attendance.workforceAssignment.contract.id,
        lifecycleStatus:
          attendance.workforceAssignment.contract.lifecycleStatus,
      },
      job: {
        id: attendance.workforceAssignment.job.id,
        title: attendance.workforceAssignment.job.title,
      },
      project: attendance.workforceAssignment.project
        ? {
            id: attendance.workforceAssignment.project.id,
            name: attendance.workforceAssignment.project.name,
            slug: attendance.workforceAssignment.project.slug,
          }
        : null,
    };
  }

  private readonly assignmentInclude = {
    contract: true,
    job: {
      include: {
        actor: true,
      },
    },
    project: true,
    user: {
      include: {
        identityProfile: true,
      },
    },
  } satisfies Prisma.WorkforceAssignmentInclude;

  private readonly timesheetInclude = {
    user: {
      include: {
        identityProfile: true,
      },
    },
    project: true,
    approvedByUser: true,
    entries: {
      orderBy: { workDate: 'asc' },
    },
    workforceAssignment: {
      include: {
        contract: true,
        job: {
          include: {
            actor: true,
          },
        },
      },
    },
  } satisfies Prisma.TimesheetInclude;

  private readonly attendanceInclude = {
    user: true,
    workforceAssignment: {
      include: {
        contract: true,
        job: true,
        project: true,
      },
    },
  } satisfies Prisma.AttendanceRecordInclude;
}
