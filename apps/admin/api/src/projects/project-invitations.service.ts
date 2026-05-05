import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectInvitationStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectInvitationDto } from './dto/create-project-invitation.dto';
import { UpdateProjectInvitationStatusDto } from './dto/update-project-invitation-status.dto';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
  ) {}

  async list(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForOwner(projectId, user);
    const invitations = await this.prisma.projectInvitation.findMany({
      where: {
        projectId: project.id,
      },
      include: this.invitationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      invitations.map(async (item) =>
        this.toInvitationResponse(
          item,
          await this.complianceEligibilityService.evaluateProfileForProjectByIds(
            item.projectId,
            item.profileId,
          ),
        ),
      ),
    );
  }

  async create(
    projectId: string,
    body: CreateProjectInvitationDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForOwner(projectId, user);
    await this.ensureProfileExists(body.profileId);

    const nextStatus = body.status ?? ProjectInvitationStatus.SENT;
    const invitation = await this.prisma.projectInvitation.upsert({
      where: {
        projectId_profileId: {
          projectId: project.id,
          profileId: body.profileId,
        },
      },
      create: {
        projectId: project.id,
        profileId: body.profileId,
        createdById: user.sub,
        message: body.message?.trim() ?? null,
        status: nextStatus,
        sentAt: nextStatus === ProjectInvitationStatus.SENT ? new Date() : null,
      },
      update: {
        createdById: user.sub,
        message: body.message?.trim() ?? null,
        status: nextStatus,
        sentAt:
          nextStatus === ProjectInvitationStatus.SENT ? new Date() : undefined,
        respondedAt: this.isResponseStatus(nextStatus) ? new Date() : null,
      },
      include: this.invitationInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: project.id,
      entityType: 'ProjectInvitation',
      entityId: invitation.id,
      action: 'UPSERT',
      before: null,
      after: this.toInvitationResponse(invitation),
      metadata: {
        profileId: invitation.profileId,
      },
    });

    return this.toInvitationResponse(
      invitation,
      await this.complianceEligibilityService.evaluateProfileForProjectByIds(
        invitation.projectId,
        invitation.profileId,
      ),
    );
  }

  async updateStatus(
    projectId: string,
    invitationId: string,
    body: UpdateProjectInvitationStatusDto,
    user: AuthenticatedUser,
  ) {
    const invitation = await this.prisma.projectInvitation.findFirst({
      where: {
        id: invitationId,
        projectId,
      },
      include: this.invitationInclude,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const isProjectOwner = this.accessPolicy.isAdmin(user) || invitation.project.createdById === user.sub;
    const isInvitedProfileOwner = invitation.profile.userId === user.sub;

    if (!isProjectOwner && !isInvitedProfileOwner) {
      throw new ForbiddenException('You do not have access to update this invitation');
    }

    if (isInvitedProfileOwner) {
      const allowedProfileStatuses = new Set<ProjectInvitationStatus>([
        ProjectInvitationStatus.VIEWED,
        ProjectInvitationStatus.ACCEPTED,
        ProjectInvitationStatus.DECLINED,
      ]);

      if (!allowedProfileStatuses.has(body.status)) {
        throw new BadRequestException('Profile owners can only view, accept, or decline invitations');
      }

      if (body.status === ProjectInvitationStatus.ACCEPTED) {
        await this.complianceEligibilityService.assertCanAcceptInvitation(
          invitation.projectId,
          invitation.profileId,
          user.sub,
        );
      }
    }

    const updatedInvitation = await this.prisma.projectInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: body.status,
        message: body.message?.trim() ?? invitation.message,
        sentAt:
          body.status === ProjectInvitationStatus.SENT
            ? invitation.sentAt ?? new Date()
            : invitation.sentAt,
        respondedAt: this.isResponseStatus(body.status) ? new Date() : null,
      },
      include: this.invitationInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: invitation.projectId,
      entityType: 'ProjectInvitation',
      entityId: invitation.id,
      action: 'STATUS_CHANGE',
      before: {
        status: invitation.status,
        message: invitation.message,
      },
      after: {
        status: updatedInvitation.status,
        message: updatedInvitation.message,
      },
      metadata: {
        profileId: invitation.profileId,
      },
    });

    return this.toInvitationResponse(
      updatedInvitation,
      await this.complianceEligibilityService.evaluateProfileForProjectByIds(
        updatedInvitation.projectId,
        updatedInvitation.profileId,
      ),
    );
  }

  private async getProjectForOwner(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, project.createdById);
    return project;
  }

  private async ensureProfileExists(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
  }

  private isResponseStatus(status: ProjectInvitationStatus) {
    return (
      status === ProjectInvitationStatus.ACCEPTED ||
      status === ProjectInvitationStatus.DECLINED
    );
  }

  private toInvitationResponse(invitation: any, eligibility?: any) {
    return {
      id: invitation.id,
      projectId: invitation.projectId,
      profileId: invitation.profileId,
      createdById: invitation.createdById,
      status: invitation.status,
      message: invitation.message,
      sentAt: invitation.sentAt,
      respondedAt: invitation.respondedAt,
      createdAt: invitation.createdAt,
      createdBy: invitation.createdBy,
      project: {
        id: invitation.project.id,
        name: invitation.project.name,
        slug: invitation.project.slug,
        status: invitation.project.status,
        engagementModel: invitation.project.engagementModel,
        location: invitation.project.location,
      },
      profile: {
        id: invitation.profile.id,
        userId: invitation.profile.userId,
        profileType: invitation.profile.profileType,
        displayName: invitation.profile.displayName,
        companyName: invitation.profile.companyName,
        summary: invitation.profile.summary,
        availabilityStatus: invitation.profile.availabilityStatus,
      },
      eligibility: eligibility ?? null,
    };
  }

  private readonly invitationInclude = {
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
        location: true,
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
        availabilityStatus: true,
      },
    },
  } as const;
}
