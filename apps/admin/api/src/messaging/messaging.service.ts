import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationParticipantRole,
  ConversationType,
  MessageType,
  NotificationSeverity,
  ProjectInvitationStatus,
  ProjectProposalStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async listConversations(
    user: AuthenticatedUser,
    query?: { projectId?: string; contractId?: string; disputeId?: string; type?: string },
  ) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.sub,
          },
        },
        ...(query?.projectId ? { projectId: query.projectId } : {}),
        ...(query?.contractId ? { contractId: query.contractId } : {}),
        ...(query?.disputeId ? { disputeId: query.disputeId } : {}),
        ...(query?.type ? { type: query.type as ConversationType } : {}),
      },
      include: this.conversationInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return conversations.map((conversation) => this.toConversationResponse(conversation, user.sub));
  }

  async createConversation(body: CreateConversationDto, user: AuthenticatedUser) {
    if (body.type === 'DIRECT') {
      if (!body.participantUserIds?.length) {
        throw new BadRequestException('Direct conversations require at least one participant');
      }

      const participantUserIds = Array.from(new Set([user.sub, ...body.participantUserIds]));
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: participantUserIds,
          },
        },
      });

      if (users.length !== participantUserIds.length) {
        throw new NotFoundException('One or more direct conversation users were not found');
      }

      const existingDirectConversation = await this.findExistingDirectConversation(
        participantUserIds,
      );

      if (existingDirectConversation) {
        return this.toConversationResponse(existingDirectConversation, user.sub);
      }

      const conversation = await this.prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          participants: {
            create: participantUserIds.map((userId) => ({
              userId,
              role: this.mapUserToConversationRole(
                users.find((item) => item.id === userId)?.role ?? 'PROFESSIONAL',
              ),
            })),
          },
        },
        include: this.conversationInclude,
      });

      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'PROJECT') {
      if (!body.projectId) {
        throw new BadRequestException('Project conversations require a projectId');
      }

      const conversation = await this.ensureProjectConversation(body.projectId, user.sub);
      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'CONTRACT') {
      if (!body.contractId) {
        throw new BadRequestException('Contract conversations require a contractId');
      }

      const conversation = await this.ensureContractConversation(body.contractId, user.sub);
      return this.toConversationResponse(conversation, user.sub);
    }

    if (!body.disputeId) {
      throw new BadRequestException('Dispute conversations require a disputeId');
    }

    const conversation = await this.ensureDisputeConversation(body.disputeId, user.sub);
    return this.toConversationResponse(conversation, user.sub);
  }

  async listMessages(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      include: this.messageInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async createMessage(conversationId: string, body: CreateMessageDto, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const content = body.content.trim();

    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.sub,
        type: (body.type ?? MessageType.TEXT) as MessageType,
        content,
        metadataJson: this.serialize(body.metadataJson),
        reads: {
          create: {
            userId: user.sub,
          },
        },
      },
      include: this.messageInclude,
    });

    const recipients = conversation.participants.filter((participant) => participant.userId !== user.sub);
    for (const recipient of recipients) {
      await this.notificationService.createInAppNotification({
        key: `message:${message.id}:${recipient.userId}`,
        userId: recipient.userId,
        type: 'MESSAGE_RECEIVED',
        severity: NotificationSeverity.INFO,
        title: 'New message received',
        message: `You have a new ${conversation.type.toLowerCase()} conversation message.`,
        relatedEntityType: 'Conversation',
        relatedEntityId: conversation.id,
        scheduledFor: new Date(),
      });
    }

    return this.toMessageResponse(message);
  }

  async markRead(messageId: string, user: AuthenticatedUser) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.conversation.participants.some((participant) => participant.userId === user.sub)) {
      throw new ForbiddenException('You do not have access to this message');
    }

    const read = await this.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: user.sub,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId: user.sub,
      },
    });

    return {
      id: read.id,
      messageId: read.messageId,
      userId: read.userId,
      readAt: read.readAt,
    };
  }

  async ensureProjectConversation(projectId: string, actorUserId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        invitations: {
          where: {
            status: {
              in: [
                ProjectInvitationStatus.SENT,
                ProjectInvitationStatus.VIEWED,
                ProjectInvitationStatus.ACCEPTED,
              ],
            },
          },
          include: {
            profile: true,
          },
        },
        proposals: {
          where: {
            status: ProjectProposalStatus.ACCEPTED,
          },
          include: {
            profile: true,
          },
        },
        contracts: {
          include: {
            profile: true,
          },
        },
        workerAssignments: {
          include: {
            worker: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        projectId,
        type: ConversationType.PROJECT,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          projectId,
          type: ConversationType.PROJECT,
        },
        include: this.conversationInclude,
      });
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    participantMap.set(project.createdById, ConversationParticipantRole.OWNER);

    for (const invitation of project.invitations) {
      participantMap.set(
        invitation.profile.userId,
        this.mapProfileToConversationRole(invitation.profile.profileType),
      );
    }

    for (const proposal of project.proposals) {
      participantMap.set(
        proposal.profile.userId,
        this.mapProfileToConversationRole(proposal.profile.profileType),
      );
    }

    for (const contract of project.contracts) {
      participantMap.set(
        contract.profile.userId,
        this.mapProfileToConversationRole(contract.profile.profileType),
      );
    }

    for (const assignment of project.workerAssignments) {
      if (assignment.worker.userId) {
        participantMap.set(assignment.worker.userId, ConversationParticipantRole.WORKER);
      }
    }

    await this.syncParticipants(conversation.id, participantMap);
    conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    if (actorUserId && !participantMap.has(actorUserId) && actorUserId !== project.createdById) {
      throw new ForbiddenException('You are not a participant in this project conversation');
    }

    return conversation;
  }

  async ensureContractConversation(contractId: string, actorUserId?: string) {
    const contract = await this.prisma.projectContract.findUnique({
      where: { id: contractId },
      include: {
        project: true,
        profile: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        contractId,
        type: ConversationType.CONTRACT,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          projectId: contract.projectId,
          contractId: contract.id,
          type: ConversationType.CONTRACT,
        },
        include: this.conversationInclude,
      });
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    participantMap.set(contract.project.createdById, ConversationParticipantRole.OWNER);
    participantMap.set(
      contract.profile.userId,
      this.mapProfileToConversationRole(contract.profile.profileType),
    );

    await this.syncParticipants(conversation.id, participantMap);
    conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    if (actorUserId && !participantMap.has(actorUserId)) {
      throw new ForbiddenException('You are not a participant in this contract conversation');
    }

    return conversation;
  }

  async ensureDisputeConversation(disputeId: string, actorUserId?: string) {
    const dispute = await this.prisma.projectDispute.findUnique({
      where: { id: disputeId },
      include: {
        project: true,
        contract: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        disputeId,
        type: ConversationType.DISPUTE,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          projectId: dispute.projectId,
          contractId: dispute.contractId,
          disputeId: dispute.id,
          type: ConversationType.DISPUTE,
        },
        include: this.conversationInclude,
      });
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    participantMap.set(dispute.project.createdById, ConversationParticipantRole.OWNER);
    participantMap.set(
      dispute.contract.profile.userId,
      this.mapProfileToConversationRole(dispute.contract.profile.profileType),
    );
    participantMap.set(dispute.openedById, ConversationParticipantRole.CONTRACTOR);

    await this.syncParticipants(conversation.id, participantMap);
    conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    if (actorUserId && !participantMap.has(actorUserId)) {
      throw new ForbiddenException('You are not a participant in this dispute conversation');
    }

    return conversation;
  }

  async addSystemMessage(input: {
    type: ConversationType;
    projectId?: string;
    contractId?: string;
    disputeId?: string;
    actorUserId: string;
    content: string;
    metadata?: unknown;
  }) {
    const conversation =
      input.type === ConversationType.PROJECT
        ? await this.ensureProjectConversation(input.projectId!, input.actorUserId)
        : input.type === ConversationType.CONTRACT
          ? await this.ensureContractConversation(input.contractId!, input.actorUserId)
          : await this.ensureDisputeConversation(input.disputeId!, input.actorUserId);

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: input.actorUserId,
        type: MessageType.SYSTEM,
        content: input.content,
        metadataJson: this.serialize(input.metadata),
        reads: {
          create: {
            userId: input.actorUserId,
          },
        },
      },
      include: this.messageInclude,
    });

    for (const participant of conversation.participants.filter((item) => item.userId !== input.actorUserId)) {
      await this.notificationService.createInAppNotification({
        key: `system-message:${message.id}:${participant.userId}`,
        userId: participant.userId,
        type: 'SYSTEM_MESSAGE_RECEIVED',
        severity: NotificationSeverity.INFO,
        title: 'Project update',
        message: input.content,
        relatedEntityType: 'Conversation',
        relatedEntityId: conversation.id,
        scheduledFor: new Date(),
      });
    }

    return this.toMessageResponse(message);
  }

  private async findExistingDirectConversation(participantUserIds: string[]) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.DIRECT,
        participants: {
          some: {
            userId: {
              in: participantUserIds,
            },
          },
        },
      },
      include: this.conversationInclude,
    });

    return (
      conversations.find((conversation) => {
        const ids = conversation.participants.map((participant) => participant.userId).sort();
        const target = [...participantUserIds].sort();
        return ids.length === target.length && ids.every((value, index) => value === target[index]);
      }) ?? null
    );
  }

  private async syncParticipants(
    conversationId: string,
    participants: Map<string, ConversationParticipantRole>,
  ) {
    for (const [userId, role] of participants.entries()) {
      await this.prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        update: {
          role,
        },
        create: {
          conversationId,
          userId,
          role,
        },
      });
    }
  }

  private async getConversationForUser(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private mapUserToConversationRole(role: string) {
    if (role === 'ADMIN') {
      return ConversationParticipantRole.ADMIN;
    }

    return ConversationParticipantRole.CONTRACTOR;
  }

  private mapProfileToConversationRole(profileType: string) {
    if (profileType === 'SUPERVISOR') {
      return ConversationParticipantRole.SUPERVISOR;
    }

    if (profileType === 'PROFESSIONAL') {
      return ConversationParticipantRole.WORKER;
    }

    return ConversationParticipantRole.CONTRACTOR;
  }

  private serialize(value: unknown) {
    if (value === undefined || value === null) {
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

  private toConversationResponse(conversation: any, currentUserId: string) {
    const latestMessage = conversation.messages[0] ? this.toMessageResponse(conversation.messages[0]) : null;
    const unreadCount = conversation.messages.filter(
      (message: any) => !message.reads.some((read: any) => read.userId === currentUserId),
    ).length;

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      contractId: conversation.contractId,
      disputeId: conversation.disputeId,
      type: conversation.type,
      createdAt: conversation.createdAt,
      project: conversation.project
        ? {
            id: conversation.project.id,
            slug: conversation.project.slug,
            name: conversation.project.name,
            status: conversation.project.status,
          }
        : null,
      contract: conversation.contract
        ? {
            id: conversation.contract.id,
            title: conversation.contract.title,
            status: conversation.contract.status,
          }
        : null,
      dispute: conversation.dispute
        ? {
            id: conversation.dispute.id,
            title: conversation.dispute.title,
            status: conversation.dispute.status,
            severity: conversation.dispute.severity,
          }
        : null,
      participants: conversation.participants.map((participant: any) => ({
        id: participant.id,
        userId: participant.userId,
        role: participant.role,
        joinedAt: participant.joinedAt,
        user: participant.user
          ? {
              id: participant.user.id,
              email: participant.user.email,
              role: participant.user.role,
            }
          : null,
      })),
      latestMessage,
      unreadCount,
    };
  }

  private toMessageResponse(message: any) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      metadataJson: this.parseJson(message.metadataJson),
      createdAt: message.createdAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            email: message.sender.email,
            role: message.sender.role,
          }
        : null,
      reads: message.reads.map((read: any) => ({
        id: read.id,
        messageId: read.messageId,
        userId: read.userId,
        readAt: read.readAt,
      })),
    };
  }

  private readonly messageInclude = {
    sender: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    reads: {
      select: {
        id: true,
        messageId: true,
        userId: true,
        readAt: true,
      },
    },
  } as const;

  private readonly conversationInclude = {
    project: {
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
      },
    },
    contract: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
    dispute: {
      select: {
        id: true,
        title: true,
        status: true,
        severity: true,
      },
    },
    participants: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc' as const,
      },
    },
    messages: {
      include: this.messageInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 20,
    },
  } as const;
}
