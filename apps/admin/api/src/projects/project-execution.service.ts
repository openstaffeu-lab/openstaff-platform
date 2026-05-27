import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplianceAlertSeverity,
  ComplianceAlertType,
  ComplianceDocumentStatus,
  NotificationSeverity,
  ProfileType,
  ProjectContractStatus,
  ProjectWorkerAssignmentStatus,
  UserTaskPriority,
  UserTaskStatus,
  UserTaskType,
  WorkerAttendanceStatus,
  WorkerWorkLogStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInWorkerDto } from './dto/check-in-worker.dto';
import { CheckOutWorkerDto } from './dto/check-out-worker.dto';
import { CreateWorkerWorkLogDto } from './dto/create-worker-work-log.dto';
import { UpdateWorkerWorkLogStatusDto } from './dto/update-worker-work-log-status.dto';
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

@Injectable()
export class ProjectExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async checkIn(
    projectId: string,
    body: CheckInWorkerDto,
    user: AuthenticatedUser,
  ) {
    const context = await this.getExecutionContext(
      projectId,
      user,
      body.workerId,
      body.assignmentId,
    );
    const assignment = context.assignment;

    if (
      !assignment ||
      assignment.status !== ProjectWorkerAssignmentStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only active worker assignments can check in',
      );
    }

    const eligibility =
      await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
        projectId,
        assignment.profileId,
        assignment.workerId,
        {
          jobRequestId: assignment.jobRequestId ?? undefined,
        },
      );

    if (
      eligibility.projectEligibility === 'BLOCKED' ||
      eligibility.projectEligibility === 'NOT_ELIGIBLE' ||
      eligibility.jobRequestEligibility === 'BLOCKED' ||
      eligibility.jobRequestEligibility === 'NOT_ELIGIBLE' ||
      eligibility.workerEligibility === 'BLOCKED' ||
      eligibility.workerEligibility === 'NOT_ELIGIBLE'
    ) {
      await this.registerInvalidExecutionSignals(
        assignment,
        eligibility,
        'CHECK_IN_BLOCKED',
      );
      throw new ForbiddenException(
        `Worker check-in is blocked. ${[...eligibility.blockingReasons, ...eligibility.missingItems].join(' | ')}`,
      );
    }

    const existingOpen = await this.prisma.workerAttendance.findFirst({
      where: {
        projectId,
        workerId: assignment.workerId,
        checkOutAt: null,
        status: WorkerAttendanceStatus.CHECKED_IN,
      },
    });

    if (existingOpen) {
      throw new BadRequestException(
        'This worker already has an open check-in on the project',
      );
    }

    const attendance = await this.prisma.workerAttendance.create({
      data: {
        projectId,
        contractId: assignment.contractId,
        jobRequestId: assignment.jobRequestId,
        workerId: assignment.workerId,
        assignmentId: assignment.id,
        checkInAt: new Date(),
        status: WorkerAttendanceStatus.CHECKED_IN,
        locationLat: body.locationLat ?? null,
        locationLng: body.locationLng ?? null,
      },
      include: this.attendanceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerAttendance',
      entityId: attendance.id,
      action: 'CHECK_IN',
      before: null,
      after: this.toAttendanceResponse(attendance),
      metadata: {
        workerId: assignment.workerId,
        assignmentId: assignment.id,
      },
    });

    return this.toAttendanceResponse(attendance);
  }

  async checkOut(
    projectId: string,
    body: CheckOutWorkerDto,
    user: AuthenticatedUser,
  ) {
    const context = await this.getExecutionContext(
      projectId,
      user,
      body.workerId,
      body.assignmentId,
    );
    const assignment = context.assignment;

    if (
      !assignment ||
      assignment.status === ProjectWorkerAssignmentStatus.BLOCKED
    ) {
      throw new ForbiddenException(
        'Blocked worker assignments cannot check out through this flow',
      );
    }

    const openAttendance = await this.prisma.workerAttendance.findFirst({
      where: {
        projectId,
        workerId: body.workerId,
        assignmentId: assignment?.id ?? undefined,
        checkOutAt: null,
        status: WorkerAttendanceStatus.CHECKED_IN,
      },
      include: this.attendanceInclude,
      orderBy: {
        checkInAt: 'desc',
      },
    });

    if (!openAttendance) {
      throw new BadRequestException('No open check-in exists for this worker');
    }

    const attendance = await this.prisma.workerAttendance.update({
      where: {
        id: openAttendance.id,
      },
      data: {
        checkOutAt: new Date(),
        status: WorkerAttendanceStatus.CHECKED_OUT,
        locationLat: body.locationLat ?? openAttendance.locationLat,
        locationLng: body.locationLng ?? openAttendance.locationLng,
      },
      include: this.attendanceInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerAttendance',
      entityId: attendance.id,
      action: 'CHECK_OUT',
      before: this.toAttendanceResponse(openAttendance),
      after: this.toAttendanceResponse(attendance),
      metadata: {
        workerId: attendance.workerId,
        assignmentId: attendance.assignmentId,
      },
    });

    return this.toAttendanceResponse(attendance);
  }

  async listAttendance(projectId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    await this.reconcileMissingAttendanceTasks(projectId);
    const attendances = await this.prisma.workerAttendance.findMany({
      where: {
        projectId,
        ...(access.isOwner
          ? {}
          : {
              worker: {
                profileId: access.currentProfile?.id,
              },
            }),
      },
      include: this.attendanceInclude,
      orderBy: [{ checkInAt: 'desc' }],
    });

    return attendances.map((attendance) =>
      this.toAttendanceResponse(attendance),
    );
  }

  async createWorkLog(
    projectId: string,
    body: CreateWorkerWorkLogDto,
    user: AuthenticatedUser,
  ) {
    const context = await this.getExecutionContext(
      projectId,
      user,
      body.workerId,
      body.assignmentId,
    );
    const assignment = context.assignment;

    if (!assignment) {
      throw new BadRequestException(
        'A worker assignment is required for work logs in this phase',
      );
    }

    if (
      assignment.status !== ProjectWorkerAssignmentStatus.ACTIVE &&
      assignment.status !== ProjectWorkerAssignmentStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'Work logs can only be created for approved or active assignments',
      );
    }

    if (
      body.jobRequestId &&
      assignment.jobRequestId &&
      body.jobRequestId !== assignment.jobRequestId
    ) {
      throw new BadRequestException(
        'Work log job request does not match the assignment',
      );
    }

    const workLog = await this.prisma.workerWorkLog.create({
      data: {
        projectId,
        jobRequestId: body.jobRequestId ?? assignment.jobRequestId ?? null,
        workerId: assignment.workerId,
        assignmentId: assignment.id,
        date: new Date(body.date),
        hoursWorked: body.hoursWorked,
        description: body.description.trim(),
        status: body.status ?? WorkerWorkLogStatus.SUBMITTED,
      },
      include: this.workLogInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerWorkLog',
      entityId: workLog.id,
      action: 'CREATE',
      before: null,
      after: this.toWorkLogResponse(workLog),
      metadata: {
        workerId: assignment.workerId,
        assignmentId: assignment.id,
      },
    });

    if (workLog.status === WorkerWorkLogStatus.SUBMITTED) {
      await this.notificationService.createInAppNotification({
        key: `work-log-submitted:${workLog.id}:${workLog.updatedAt.toISOString()}`,
        userId: context.project.createdById,
        profileId: null,
        type: 'WORK_LOG_SUBMITTED',
        severity: NotificationSeverity.INFO,
        title: 'Worker work log submitted',
        message: `${workLog.worker.firstName} ${workLog.worker.lastName} submitted a work log for review.`,
        relatedEntityType: 'WorkerWorkLog',
        relatedEntityId: workLog.id,
        scheduledFor: new Date(),
      });
    }

    return this.toWorkLogResponse(workLog);
  }

  async listWorkLogs(projectId: string, user: AuthenticatedUser) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const workLogs = await this.prisma.workerWorkLog.findMany({
      where: {
        projectId,
        ...(access.isOwner
          ? {}
          : {
              worker: {
                profileId: access.currentProfile?.id,
              },
            }),
      },
      include: this.workLogInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return workLogs.map((log) => this.toWorkLogResponse(log));
  }

  async updateWorkLogStatus(
    projectId: string,
    logId: string,
    body: UpdateWorkerWorkLogStatusDto,
    user: AuthenticatedUser,
  ) {
    const workLog = await this.prisma.workerWorkLog.findFirst({
      where: {
        id: logId,
        projectId,
      },
      include: this.workLogInclude,
    });

    if (!workLog) {
      throw new NotFoundException('Worker work log not found');
    }

    const access = await this.getProjectScopedAccess(projectId, user);
    const isReviewer =
      access.isOwner ||
      access.currentProfile?.profileType === ProfileType.SUPERVISOR;
    const isContractor = access.currentProfile?.id === workLog.worker.profileId;

    if (!isReviewer && !isContractor) {
      throw new ForbiddenException(
        'You do not have access to update this work log',
      );
    }

    if (
      body.status === WorkerWorkLogStatus.APPROVED ||
      body.status === WorkerWorkLogStatus.REJECTED
    ) {
      if (!isReviewer) {
        throw new ForbiddenException(
          'Only the project owner or supervisor can review work logs',
        );
      }
    }

    if (
      body.status === WorkerWorkLogStatus.SUBMITTED ||
      body.status === WorkerWorkLogStatus.DRAFT
    ) {
      if (!isContractor && !isReviewer) {
        throw new ForbiddenException(
          'Only the contractor side can submit or draft work logs',
        );
      }
    }

    const updated = await this.prisma.workerWorkLog.update({
      where: { id: workLog.id },
      data: {
        status: body.status,
      },
      include: this.workLogInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'WorkerWorkLog',
      entityId: updated.id,
      action: 'STATUS_CHANGE',
      before: this.toWorkLogResponse(workLog),
      after: this.toWorkLogResponse(updated),
    });

    if (
      body.status === WorkerWorkLogStatus.APPROVED ||
      body.status === WorkerWorkLogStatus.REJECTED
    ) {
      await this.notificationService.createInAppNotification({
        key: `work-log-reviewed:${updated.id}:${updated.updatedAt.toISOString()}`,
        userId: updated.worker.profile.userId,
        profileId: updated.worker.profileId,
        type: 'WORK_LOG_REVIEWED',
        severity: NotificationSeverity.INFO,
        title: `Work log ${body.status === WorkerWorkLogStatus.APPROVED ? 'approved' : 'rejected'}`,
        message: `Your worker work log for ${updated.worker.firstName} ${updated.worker.lastName} was ${body.status.toLowerCase()}.`,
        relatedEntityType: 'WorkerWorkLog',
        relatedEntityId: updated.id,
        scheduledFor: new Date(),
      });
    }

    return this.toWorkLogResponse(updated);
  }

  async listCurrentProfileAttendance(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfile(user);
    const attendances = await this.prisma.workerAttendance.findMany({
      where: {
        worker: {
          profileId: profile.id,
        },
      },
      include: this.attendanceInclude,
      orderBy: [{ checkInAt: 'desc' }],
      take: 50,
    });

    return attendances.map((attendance) =>
      this.toAttendanceResponse(attendance),
    );
  }

  async listCurrentProfileWorkLogs(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfile(user);
    const logs = await this.prisma.workerWorkLog.findMany({
      where: {
        worker: {
          profileId: profile.id,
        },
      },
      include: this.workLogInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return logs.map((log) => this.toWorkLogResponse(log));
  }

  private async reconcileMissingAttendanceTasks(projectId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const activeAssignments =
      await this.prisma.projectWorkerAssignment.findMany({
        where: {
          projectId,
          status: ProjectWorkerAssignmentStatus.ACTIVE,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          profile: {
            select: {
              id: true,
              userId: true,
              displayName: true,
            },
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    for (const assignment of activeAssignments) {
      const attendance = await this.prisma.workerAttendance.findFirst({
        where: {
          assignmentId: assignment.id,
          checkInAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      const taskKey = `attendance-missing:${assignment.projectId}:${assignment.workerId}:${todayStart.toISOString().slice(0, 10)}`;
      if (!attendance) {
        await this.prisma.userTask.upsert({
          where: { key: taskKey },
          update: {
            status: UserTaskStatus.OPEN,
            priority: UserTaskPriority.HIGH,
            title: `Confirm attendance for ${assignment.worker.firstName} ${assignment.worker.lastName}`,
            description:
              'No attendance record exists yet for this active worker assignment today.',
            projectId: assignment.projectId,
            contractId: assignment.contractId,
            profileId: assignment.profileId,
            completedAt: null,
          },
          create: {
            key: taskKey,
            assignedToUserId: assignment.profile.userId,
            projectId: assignment.projectId,
            contractId: assignment.contractId,
            profileId: assignment.profileId,
            type: UserTaskType.CONFIRM_SITE_ATTENDANCE,
            title: `Confirm attendance for ${assignment.worker.firstName} ${assignment.worker.lastName}`,
            description:
              'No attendance record exists yet for this active worker assignment today.',
            status: UserTaskStatus.OPEN,
            priority: UserTaskPriority.HIGH,
            dueDate: todayEnd,
          },
        });
      } else {
        const task = await this.prisma.userTask.findUnique({
          where: { key: taskKey },
        });

        if (task && task.status !== UserTaskStatus.COMPLETED) {
          await this.prisma.userTask.update({
            where: { id: task.id },
            data: {
              status: UserTaskStatus.COMPLETED,
              completedAt: task.completedAt ?? new Date(),
            },
          });
        }
      }
    }
  }

  private async registerInvalidExecutionSignals(
    assignment: any,
    eligibility: any,
    action: 'CHECK_IN_BLOCKED' | 'INVALID_ATTENDANCE',
  ) {
    const workerName =
      `${assignment.worker.firstName} ${assignment.worker.lastName}`.trim();
    const reason = [...eligibility.blockingReasons, ...eligibility.missingItems]
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');

    await this.prisma.userTask.upsert({
      where: {
        key: `invalid-attendance:${assignment.projectId}:${assignment.workerId}:${action}`,
      },
      update: {
        status: UserTaskStatus.OPEN,
        title: `Resolve attendance eligibility for ${workerName}`,
        description:
          reason ||
          'The worker is blocked from attendance due to compliance issues.',
        priority: UserTaskPriority.CRITICAL,
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        profileId: assignment.profileId,
        completedAt: null,
      },
      create: {
        key: `invalid-attendance:${assignment.projectId}:${assignment.workerId}:${action}`,
        assignedToUserId: assignment.profile.userId,
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        profileId: assignment.profileId,
        type: UserTaskType.REVIEW_COMPLIANCE,
        title: `Resolve attendance eligibility for ${workerName}`,
        description:
          reason ||
          'The worker is blocked from attendance due to compliance issues.',
        status: UserTaskStatus.OPEN,
        priority: UserTaskPriority.CRITICAL,
      },
    });

    await this.prisma.complianceAlert.upsert({
      where: {
        key: `attendance-risk:${assignment.projectId}:${assignment.workerId}:${action}`,
      },
      update: {
        status: 'PENDING',
        severity: ComplianceAlertSeverity.CRITICAL,
        message: `${workerName} is blocked from attendance. ${reason}`,
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        profileId: assignment.profileId,
        resolvedAt: null,
      },
      create: {
        key: `attendance-risk:${assignment.projectId}:${assignment.workerId}:${action}`,
        userId: assignment.project.createdById,
        profileId: assignment.profileId,
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        type: ComplianceAlertType.CONTRACT_ELIGIBILITY_RISK,
        severity: ComplianceAlertSeverity.CRITICAL,
        message: `${workerName} is blocked from attendance. ${reason}`,
      },
    });

    await this.notificationService.createInAppNotification({
      key: `attendance-blocked:${assignment.id}:${action}`,
      userId: assignment.project.createdById,
      profileId: null,
      type: 'ATTENDANCE_BLOCKED',
      severity: NotificationSeverity.CRITICAL,
      title: 'Worker attendance blocked',
      message: `${workerName} cannot check in until compliance issues are resolved.`,
      relatedEntityType: 'ProjectWorkerAssignment',
      relatedEntityId: assignment.id,
      scheduledFor: new Date(),
    });
  }

  private async getExecutionContext(
    projectId: string,
    user: AuthenticatedUser,
    workerId: string,
    assignmentId?: string,
  ) {
    const access = await this.getProjectScopedAccess(projectId, user);
    const where = {
      projectId,
      workerId,
      ...(assignmentId ? { id: assignmentId } : {}),
      ...(access.isOwner ? {} : { profileId: access.currentProfile?.id }),
    };

    const assignment = await this.prisma.projectWorkerAssignment.findFirst({
      where,
      include: this.assignmentInclude,
      orderBy: {
        assignedAt: 'desc',
      },
    });

    if (!assignment) {
      throw new NotFoundException('Worker assignment not found');
    }

    return {
      ...access,
      assignment,
    };
  }

  private async getProjectScopedAccess(
    projectId: string,
    user: AuthenticatedUser,
  ) {
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
      throw new ForbiddenException(
        'You do not have access to this project execution workspace',
      );
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

  private toAttendanceResponse(attendance: any) {
    return {
      id: attendance.id,
      projectId: attendance.projectId,
      contractId: attendance.contractId,
      jobRequestId: attendance.jobRequestId,
      workerId: attendance.workerId,
      assignmentId: attendance.assignmentId,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      status: attendance.status,
      locationLat: attendance.locationLat,
      locationLng: attendance.locationLng,
      createdAt: attendance.createdAt,
      worker: attendance.worker
        ? {
            id: attendance.worker.id,
            profileId: attendance.worker.profileId,
            firstName: attendance.worker.firstName,
            lastName: attendance.worker.lastName,
            fullName:
              `${attendance.worker.firstName} ${attendance.worker.lastName}`.trim(),
            roleTitle: attendance.worker.roleTitle,
            status: attendance.worker.status,
          }
        : null,
      assignment: attendance.assignment
        ? {
            id: attendance.assignment.id,
            status: attendance.assignment.status,
          }
        : null,
      jobRequest: attendance.jobRequest
        ? {
            id: attendance.jobRequest.id,
            title: attendance.jobRequest.title,
          }
        : null,
    };
  }

  private toWorkLogResponse(log: any) {
    return {
      id: log.id,
      projectId: log.projectId,
      jobRequestId: log.jobRequestId,
      workerId: log.workerId,
      assignmentId: log.assignmentId,
      date: log.date,
      hoursWorked: log.hoursWorked,
      description: log.description,
      status: log.status,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      worker: log.worker
        ? {
            id: log.worker.id,
            profileId: log.worker.profileId,
            firstName: log.worker.firstName,
            lastName: log.worker.lastName,
            fullName: `${log.worker.firstName} ${log.worker.lastName}`.trim(),
            roleTitle: log.worker.roleTitle,
            status: log.worker.status,
            profile: log.worker.profile
              ? {
                  id: log.worker.profile.id,
                  userId: log.worker.profile.userId,
                  profileType: log.worker.profile.profileType,
                  displayName: log.worker.profile.displayName,
                  companyName: log.worker.profile.companyName,
                  summary: log.worker.profile.summary,
                  availabilityStatus: log.worker.profile.availabilityStatus,
                }
              : null,
          }
        : null,
      assignment: log.assignment
        ? {
            id: log.assignment.id,
            status: log.assignment.status,
          }
        : null,
      jobRequest: log.jobRequest
        ? {
            id: log.jobRequest.id,
            title: log.jobRequest.title,
            status: log.jobRequest.status,
          }
        : null,
    };
  }

  private readonly assignmentInclude = {
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        createdById: true,
      },
    },
    profile: {
      select: {
        id: true,
        userId: true,
        displayName: true,
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
    jobRequest: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
  } as const;

  private readonly attendanceInclude = {
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
    assignment: {
      select: {
        id: true,
        status: true,
      },
    },
    jobRequest: {
      select: {
        id: true,
        title: true,
      },
    },
  } as const;

  private readonly workLogInclude = {
    worker: {
      include: {
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
      },
    },
    assignment: {
      select: {
        id: true,
        status: true,
      },
    },
    jobRequest: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
  } as const;
}
