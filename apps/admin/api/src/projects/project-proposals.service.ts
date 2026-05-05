import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, ProjectProposalStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectProposalDto } from './dto/create-project-proposal.dto';
import { UpdateProjectProposalStatusDto } from './dto/update-project-proposal-status.dto';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
    private readonly messagingService: MessagingService,
  ) {}

  async create(
    projectId: string,
    body: CreateProjectProposalDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);
    const profile = await this.getCurrentUserProfile(user);
    await this.complianceEligibilityService.assertCanSubmitProposal(project.id, profile.id, user.sub);

    let invitationId: string | null = null;

    if (body.invitationId) {
      const invitation = await this.prisma.projectInvitation.findFirst({
        where: {
          id: body.invitationId,
          projectId: project.id,
          profileId: profile.id,
        },
      });

      if (!invitation) {
        throw new BadRequestException('Invitation does not belong to this project and profile');
      }

      invitationId = invitation.id;
    }

    const proposal = await this.prisma.projectProposal.upsert({
      where: {
        projectId_profileId: {
          projectId: project.id,
          profileId: profile.id,
        },
      },
      create: {
        projectId: project.id,
        profileId: profile.id,
        invitationId,
        submittedById: user.sub,
        status: ProjectProposalStatus.SUBMITTED,
        title: body.title.trim(),
        message: body.message?.trim() ?? null,
        priceCents: body.priceCents ?? null,
        currencyCode: body.currencyCode?.trim() ?? null,
        estimatedStartDate: this.toDate(body.estimatedStartDate) ?? null,
        estimatedEndDate: this.toDate(body.estimatedEndDate) ?? null,
        terms: body.terms?.trim() ?? null,
      },
      update: {
        invitationId,
        submittedById: user.sub,
        status: ProjectProposalStatus.SUBMITTED,
        title: body.title.trim(),
        message: body.message?.trim() ?? null,
        priceCents: body.priceCents ?? null,
        currencyCode: body.currencyCode?.trim() ?? null,
        estimatedStartDate: this.toDate(body.estimatedStartDate) ?? null,
        estimatedEndDate: this.toDate(body.estimatedEndDate) ?? null,
        terms: body.terms?.trim() ?? null,
      },
      include: this.proposalInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: project.id,
      entityType: 'ProjectProposal',
      entityId: proposal.id,
      action: 'UPSERT_SUBMITTED',
      before: null,
      after: this.toProposalResponse(proposal),
      metadata: {
        profileId: profile.id,
        invitationId,
      },
    });

    return this.toProposalResponse(proposal, await this.getEligibilityForProposal(proposal));
  }

  async listForProject(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProject(projectId);
    this.accessPolicy.assertCanReadProject(user, project.createdById);

    const proposals = await this.prisma.projectProposal.findMany({
      where: {
        projectId: project.id,
      },
      include: this.proposalInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const withEligibility = await Promise.all(
      proposals.map(async (item) => this.toProposalResponse(item, await this.getEligibilityForProposal(item))),
    );

    return withEligibility;
  }

  async listForCurrentProfile(user: AuthenticatedUser) {
    const profile = await this.getCurrentUserProfile(user);

    const [invitations, proposals] = await Promise.all([
      this.prisma.projectInvitation.findMany({
        where: {
          profileId: profile.id,
        },
        include: this.invitationInclude,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.projectProposal.findMany({
        where: {
          profileId: profile.id,
        },
        include: this.proposalInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    return {
      profile: {
        id: profile.id,
        profileType: profile.profileType,
        displayName: profile.displayName,
        companyName: profile.companyName,
      },
      invitations: await Promise.all(
        invitations.map(async (item) =>
          this.toInvitationResponse(
            item,
            await this.complianceEligibilityService.evaluateProfileForProjectByIds(
              item.projectId,
              item.profileId,
            ),
          ),
        ),
      ),
      proposals: await Promise.all(
        proposals.map(async (item) =>
          this.toProposalResponse(item, await this.getEligibilityForProposal(item)),
        ),
      ),
    };
  }

  async updateStatus(
    projectId: string,
    proposalId: string,
    body: UpdateProjectProposalStatusDto,
    user: AuthenticatedUser,
  ) {
    const proposal = await this.prisma.projectProposal.findFirst({
      where: {
        id: proposalId,
        projectId,
      },
      include: this.proposalInclude,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const isProjectOwner =
      this.accessPolicy.isAdmin(user) || proposal.project.createdById === user.sub;
    const isSubmitter =
      proposal.profile.userId === user.sub && proposal.submittedById === user.sub;

    if (!isProjectOwner && !isSubmitter) {
      throw new ForbiddenException('You do not have access to update this proposal');
    }

    if (isSubmitter && body.status !== ProjectProposalStatus.WITHDRAWN) {
      throw new BadRequestException('Proposal submitters can only withdraw their own proposal');
    }

    if (isProjectOwner) {
      const allowedOwnerStatuses = new Set<ProjectProposalStatus>([
        ProjectProposalStatus.UNDER_REVIEW,
        ProjectProposalStatus.ACCEPTED,
        ProjectProposalStatus.REJECTED,
      ]);

      if (!allowedOwnerStatuses.has(body.status)) {
        throw new BadRequestException(
          'Project owners can only move proposals to under review, accepted, or rejected',
        );
      }
    }

    const updatedProposal = await this.prisma.projectProposal.update({
      where: {
        id: proposal.id,
      },
      data: {
        status: body.status,
      },
      include: this.proposalInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId: proposal.projectId,
      entityType: 'ProjectProposal',
      entityId: proposal.id,
      action: 'STATUS_CHANGE',
      before: {
        status: proposal.status,
      },
      after: {
        status: updatedProposal.status,
      },
      metadata: {
        proposalId: proposal.id,
      },
    });

    if (body.status === ProjectProposalStatus.ACCEPTED) {
      await this.messagingService.addSystemMessage({
        type: ConversationType.PROJECT,
        projectId: proposal.projectId,
        actorUserId: user.sub,
        content: `Proposal "${updatedProposal.title}" was accepted.`,
        metadata: {
          proposalId: updatedProposal.id,
          profileId: updatedProposal.profileId,
        },
      });
    }

    return this.toProposalResponse(
      updatedProposal,
      await this.getEligibilityForProposal(updatedProposal),
    );
  }

  private async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getCurrentUserProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
        companyName: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for the current user');
    }

    return profile;
  }

  private toProposalResponse(proposal: any, eligibility?: any) {
    return {
      id: proposal.id,
      projectId: proposal.projectId,
      profileId: proposal.profileId,
      invitationId: proposal.invitationId,
      submittedById: proposal.submittedById,
      status: proposal.status,
      title: proposal.title,
      message: proposal.message,
      priceCents: proposal.priceCents,
      currencyCode: proposal.currencyCode,
      estimatedStartDate: proposal.estimatedStartDate,
      estimatedEndDate: proposal.estimatedEndDate,
      terms: proposal.terms,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      submittedBy: proposal.submittedBy,
      project: {
        id: proposal.project.id,
        name: proposal.project.name,
        slug: proposal.project.slug,
        status: proposal.project.status,
        engagementModel: proposal.project.engagementModel,
        location: proposal.project.location,
      },
      profile: {
        id: proposal.profile.id,
        userId: proposal.profile.userId,
        profileType: proposal.profile.profileType,
        displayName: proposal.profile.displayName,
        companyName: proposal.profile.companyName,
        summary: proposal.profile.summary,
        availabilityStatus: proposal.profile.availabilityStatus,
      },
      invitation: proposal.invitation
        ? {
            id: proposal.invitation.id,
            status: proposal.invitation.status,
            message: proposal.invitation.message,
            sentAt: proposal.invitation.sentAt,
            respondedAt: proposal.invitation.respondedAt,
          }
        : null,
      eligibility: eligibility ?? null,
    };
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

  private async getEligibilityForProposal(proposal: any) {
    return this.complianceEligibilityService.evaluateProfileForProjectByIds(
      proposal.projectId,
      proposal.profileId,
    );
  }

  private toDate(value?: string | null) {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private readonly invitationInclude = {
    project: {
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        engagementModel: true,
        location: true,
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

  private readonly proposalInclude = {
    submittedBy: {
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
    invitation: {
      select: {
        id: true,
        status: true,
        message: true,
        sentAt: true,
        respondedAt: true,
      },
    },
  } as const;
}
