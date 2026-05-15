import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationParticipantRole,
  ConversationType,
  MessageStatus,
  MessageType,
  NotificationCategory,
  NotificationSeverity,
  Prisma,
  ProjectInvitationStatus,
  ProjectProposalStatus,
  PublicModerationStatus,
  Role,
} from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

type AuthenticatedUser = {
  sub: string;
  role: string;
  email?: string;
};

type ConversationQuery = {
  projectId?: string;
  publicPostId?: string;
  contractId?: string;
  disputeId?: string;
  workforceAssignmentId?: string;
  payrollCycleId?: string;
  payrollSettlementId?: string;
  type?: string;
  q?: string;
  includeArchived?: boolean;
};

type TxClient = Prisma.TransactionClient;

export type MessagingUploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async listConversations(user: AuthenticatedUser, query?: ConversationQuery) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.sub,
            removedAt: null,
            ...(query?.includeArchived ? {} : { isArchived: false }),
          },
        },
        ...(query?.projectId ? { projectId: query.projectId } : {}),
        ...(query?.publicPostId ? { publicPostId: query.publicPostId } : {}),
        ...(query?.contractId ? { contractId: query.contractId } : {}),
        ...(query?.disputeId ? { disputeId: query.disputeId } : {}),
        ...(query?.workforceAssignmentId
          ? { workforceAssignmentId: query.workforceAssignmentId }
          : {}),
        ...(query?.payrollCycleId ? { payrollCycleId: query.payrollCycleId } : {}),
        ...(query?.payrollSettlementId
          ? { payrollSettlementId: query.payrollSettlementId }
          : {}),
        ...(query?.type ? { type: query.type as ConversationType } : {}),
        ...(query?.q?.trim()
          ? {
              OR: [
                { title: { contains: query.q.trim(), mode: 'insensitive' } },
                { lastMessagePreview: { contains: query.q.trim(), mode: 'insensitive' } },
                { project: { name: { contains: query.q.trim(), mode: 'insensitive' } } },
                { publicPost: { title: { contains: query.q.trim(), mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: this.conversationInclude,
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    return conversations.map((conversation) =>
      this.toConversationResponse(conversation, user.sub),
    );
  }

  async listAdminConversations(filters?: {
    type?: string;
    moderationStatus?: string;
    q?: string;
  }) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        ...(filters?.type ? { type: filters.type as ConversationType } : {}),
        ...(filters?.q?.trim()
          ? {
              OR: [
                { title: { contains: filters.q.trim(), mode: 'insensitive' } },
                { lastMessagePreview: { contains: filters.q.trim(), mode: 'insensitive' } },
                { project: { name: { contains: filters.q.trim(), mode: 'insensitive' } } },
                { publicPost: { title: { contains: filters.q.trim(), mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(filters?.moderationStatus
          ? {
              messages: {
                some: {
                  moderationStatus: filters.moderationStatus as PublicModerationStatus,
                },
              },
            }
          : {}),
      },
      include: this.conversationInclude,
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    return conversations.map((conversation) =>
      this.toConversationResponse(conversation, null),
    );
  }

  async listModerationQueue(filters?: { status?: string; q?: string }) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { moderationStatus: { not: PublicModerationStatus.APPROVED } },
          { isFlagged: true },
          {
            attachments: {
              some: {
                status: { not: PublicModerationStatus.APPROVED },
              },
            },
          },
        ],
        ...(filters?.status
          ? { moderationStatus: filters.status as PublicModerationStatus }
          : {}),
        ...(filters?.q?.trim()
          ? {
              OR: [
                { content: { contains: filters.q.trim(), mode: 'insensitive' } },
                {
                  sender: {
                    email: { contains: filters.q.trim(), mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: this.messageInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async getConversation(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    return this.toConversationResponse(conversation, user.sub);
  }

  async createConversation(body: CreateConversationDto, user: AuthenticatedUser) {
    if (body.type === 'DIRECT') {
      return this.createDirectConversation(
        {
          participantUserIds: body.participantUserIds ?? [],
          title: body.title ?? null,
        },
        user,
      );
    }

    if (body.type === 'PROJECT') {
      return this.createProjectConversation(
        {
          projectId: body.projectId ?? null,
          publicPostId: body.publicPostId ?? null,
          participantUserIds: body.participantUserIds ?? [],
          title: body.title ?? null,
        },
        user,
      );
    }

    if (body.type === 'WORKFORCE') {
      if (!body.workforceAssignmentId) {
        throw new BadRequestException('Workforce conversations require a workforceAssignmentId');
      }

      const conversation = await this.createWorkforceConversation(
        body.workforceAssignmentId,
        user.sub,
        body.title ?? null,
      );
      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'PAYROLL') {
      if (!body.payrollSettlementId && !body.payrollCycleId) {
        throw new BadRequestException(
          'Payroll conversations require a payrollSettlementId or payrollCycleId',
        );
      }

      const conversation = body.payrollSettlementId
        ? await this.createPayrollConversationForSettlement(
            body.payrollSettlementId,
            user.sub,
            body.title ?? null,
          )
        : await this.createPayrollConversationForCycle(
            body.payrollCycleId!,
            user.sub,
            body.title ?? null,
          );

      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'RELU') {
      if (!body.reluRecommendationId) {
        throw new BadRequestException('Relu conversations require a reluRecommendationId');
      }

      const conversation = await this.createReluConversationForRecommendation(
        body.reluRecommendationId,
        user.sub,
        body.title ?? null,
      );
      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'CONTRACT') {
      if (!body.contractId) {
        throw new BadRequestException('Contract conversations require a contractId');
      }

      const conversation = await this.ensureContractConversation(body.contractId, user.sub);
      return this.toConversationResponse(conversation, user.sub);
    }

    if (body.type === 'DISPUTE') {
      if (!body.disputeId) {
        throw new BadRequestException('Dispute conversations require a disputeId');
      }

      const conversation = await this.ensureDisputeConversation(body.disputeId, user.sub);
      return this.toConversationResponse(conversation, user.sub);
    }

    throw new BadRequestException('Unsupported conversation type');
  }

  async createDirectConversation(
    input: { participantUserIds: string[]; title?: string | null },
    user: AuthenticatedUser,
  ) {
    const participantUserIds = Array.from(new Set([user.sub, ...input.participantUserIds]));
    if (participantUserIds.length < 2) {
      throw new BadRequestException('Direct conversations require at least two participants');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: participantUserIds },
      },
    });

    if (users.length !== participantUserIds.length) {
      throw new NotFoundException('One or more direct conversation users were not found');
    }

    const existing = await this.findExistingDirectConversation(participantUserIds);
    if (existing) {
      return this.toConversationResponse(existing, user.sub);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        title: input.title?.trim() || null,
        participants: {
          create: participantUserIds.map((userId) => ({
            userId,
            role:
              userId === user.sub
                ? ConversationParticipantRole.OWNER
                : this.mapUserToConversationRole(
                    users.find((item) => item.id === userId)?.role ?? 'PROFESSIONAL',
                  ),
            unreadCount: 0,
            lastReadAt: new Date(),
            lastSeenAt: new Date(),
          })),
        },
      },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(conversation, user.sub);
  }

  async createProjectConversation(
    input: {
      projectId?: string | null;
      publicPostId?: string | null;
      participantUserIds?: string[];
      title?: string | null;
    },
    user: AuthenticatedUser,
  ) {
    if (!input.projectId && !input.publicPostId) {
      throw new BadRequestException('Project conversations require a projectId or publicPostId');
    }

    if (input.projectId) {
      const conversation = await this.ensureProjectConversation(input.projectId, user.sub);
      return this.toConversationResponse(conversation, user.sub);
    }

    const publicPost = await this.prisma.publicPost.findUnique({
      where: { id: input.publicPostId! },
      include: {
        authorUser: true,
      },
    });

    if (!publicPost) {
      throw new NotFoundException('Public post not found');
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    if (publicPost.authorUserId) {
      participantMap.set(publicPost.authorUserId, ConversationParticipantRole.OWNER);
    }
    participantMap.set(user.sub, participantMap.get(user.sub) ?? ConversationParticipantRole.MEMBER);
    for (const participantUserId of input.participantUserIds ?? []) {
      participantMap.set(participantUserId, ConversationParticipantRole.MEMBER);
    }

    if (!participantMap.has(user.sub)) {
      throw new ForbiddenException('You are not allowed to create this project conversation');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        publicPostId: publicPost.id,
        type: ConversationType.PROJECT,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          publicPostId: publicPost.id,
          type: ConversationType.PROJECT,
          title: input.title?.trim() || publicPost.title,
        },
        include: this.conversationInclude,
      });
    }

    await this.syncParticipants(conversation.id, participantMap);
    conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(conversation, user.sub);
  }

  async createWorkforceConversation(
    workforceAssignmentId: string,
    actorUserId?: string,
    title?: string | null,
  ) {
    const assignment = await this.prisma.workforceAssignment.findUnique({
      where: { id: workforceAssignmentId },
      include: {
        user: true,
        project: true,
        job: {
          include: {
            actor: true,
          },
        },
        contract: {
          include: {
            employer: true,
            contractor: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Workforce assignment not found');
    }

    const participantMap = await this.buildWorkforceParticipantMap(assignment, actorUserId);
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        workforceAssignmentId: assignment.id,
        type: ConversationType.WORKFORCE,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          projectId: assignment.projectId ?? null,
          workforceAssignmentId: assignment.id,
          type: ConversationType.WORKFORCE,
          title:
            title?.trim() ||
            assignment.project?.name ||
            assignment.job.title ||
            'Workforce workspace',
        },
        include: this.conversationInclude,
      });
    }

    await this.syncParticipants(conversation.id, participantMap);
    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });
  }

  async listMessages(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        deletedAt: null,
      },
      include: this.messageInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async sendMessage(conversationId: string, body: CreateMessageDto, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const content = body.content?.trim() ?? '';

    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const mentionedUserIds = this.collectMentionedUserIds(
      conversation,
      body.metadataJson as Record<string, unknown> | undefined,
      content,
    );

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.sub,
          type: (body.type ?? MessageType.TEXT) as MessageType,
          status: MessageStatus.SENT,
          content,
          metadataJson: this.serialize({
            ...(this.isObject(body.metadataJson) ? body.metadataJson : {}),
            mentionedUserIds,
          }),
          reads: {
            create: {
              userId: user.sub,
            },
          },
        },
        include: this.messageInclude,
      });

      await this.bumpConversationAfterMessage(tx, conversation.id, created, user.sub);
      return created;
    });

    await this.notifyConversationParticipants(conversation, message, user.sub, mentionedUserIds);
    return this.toMessageResponse(message);
  }

  async uploadAttachmentMessage(
    conversationId: string,
    file: MessagingUploadedFile | undefined,
    body: { content?: string },
    user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Attachment file is required');
    }

    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const safeName = this.sanitizeFileName(file.originalname);
    const storageDir = join(process.cwd(), 'uploads', 'messages', conversation.id);
    const storageKey = join(storageDir, `${Date.now()}-${safeName}`);
    await mkdir(storageDir, { recursive: true });
    await writeFile(storageKey, file.buffer);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.sub,
          type: MessageType.FILE,
          status: MessageStatus.SENT,
          content: body.content?.trim() || file.originalname,
          metadataJson: this.serialize({
            attachmentName: file.originalname,
          }),
          reads: {
            create: {
              userId: user.sub,
            },
          },
        },
        include: this.messageInclude,
      });

      await tx.messageAttachment.create({
        data: {
          messageId: created.id,
          conversationId: conversation.id,
          uploaderId: user.sub,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageProvider: 'LOCAL',
          storageKey,
          canPreview: this.canPreviewMime(file.mimetype),
          status: PublicModerationStatus.PENDING,
        },
      });

      await this.bumpConversationAfterMessage(tx, conversation.id, created, user.sub);
      return tx.message.findUniqueOrThrow({
        where: { id: created.id },
        include: this.messageInclude,
      });
    });

    await this.notifyConversationParticipants(conversation, message, user.sub, []);
    return this.toMessageResponse(message);
  }

  async editMessage(messageId: string, body: { content: string }, user: AuthenticatedUser) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== user.sub) {
      throw new ForbiddenException('Only the sender can edit this message');
    }

    if (message.deletedAt) {
      throw new BadRequestException('Deleted messages cannot be edited');
    }

    const content = body.content.trim();
    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.message.update({
        where: { id: message.id },
        data: {
          content,
          editedAt: new Date(),
        },
        include: this.messageInclude,
      });

      if (message.conversation.messages[0]?.id === message.id) {
        await tx.conversation.update({
          where: { id: message.conversationId },
          data: {
            lastMessagePreview: this.buildPreview(next.type, next.content),
          },
        });
      }

      return next;
    });

    return this.toMessageResponse(updated);
  }

  async deleteMessage(messageId: string, user: AuthenticatedUser) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isSender = message.senderId === user.sub;
    const isAdmin = this.isAdmin(user.role);
    if (!isSender && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.DELETED,
          deletedAt: new Date(),
          deletedByUserId: user.sub,
          content: 'Message deleted',
          metadataJson: this.serialize({
            ...(this.parseJson(message.metadataJson) ?? {}),
            deleted: true,
          }),
        },
        include: this.messageInclude,
      });

      if (message.conversation.messages[0]?.id === message.id) {
        await tx.conversation.update({
          where: { id: message.conversationId },
          data: {
            lastMessagePreview: this.buildPreview(next.type, next.content),
          },
        });
      }

      return next;
    });

    return this.toMessageResponse(updated);
  }

  async markConversationRead(conversationId: string, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: user.sub },
        reads: {
          none: {
            userId: user.sub,
          },
        },
      },
      select: {
        id: true,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      if (unreadMessages.length) {
        await tx.messageRead.createMany({
          data: unreadMessages.map((message) => ({
            messageId: message.id,
            userId: user.sub,
            readAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: user.sub,
          },
        },
        data: {
          unreadCount: 0,
          lastReadAt: new Date(),
          lastSeenAt: new Date(),
          typingStartedAt: null,
        },
      });
    });

    return {
      conversationId: conversation.id,
      unreadCount: 0,
      lastReadAt: new Date(),
    };
  }

  async markRead(messageId: string, user: AuthenticatedUser) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
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

    if (
      !message.conversation.participants.some(
        (participant) => participant.userId === user.sub && !participant.removedAt,
      )
    ) {
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

    await this.recomputeUnreadCount(message.conversationId, user.sub);

    return {
      id: read.id,
      messageId: read.messageId,
      userId: read.userId,
      readAt: read.readAt,
    };
  }

  async addParticipant(
    conversationId: string,
    body: { userId: string; role?: ConversationParticipantRole },
    user: AuthenticatedUser,
  ) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const actor = conversation.participants.find((item) => item.userId === user.sub);

    if (!actor || !this.canManageParticipants(actor.role, user.role)) {
      throw new ForbiddenException('You do not have permission to manage participants');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: targetUser.id,
        },
      },
      update: {
        role:
          body.role ??
          this.mapUserToConversationRole(targetUser.role ?? Role.PROFESSIONAL),
        removedAt: null,
        removedByUserId: null,
        isArchived: false,
        archivedAt: null,
      },
      create: {
        conversationId: conversation.id,
        userId: targetUser.id,
        role:
          body.role ??
          this.mapUserToConversationRole(targetUser.role ?? Role.PROFESSIONAL),
      },
    });

    const updated = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(updated, user.sub);
  }

  async removeParticipant(conversationId: string, participantUserId: string, user: AuthenticatedUser) {
    const conversation = await this.getConversationForUser(conversationId, user.sub);
    const actor = conversation.participants.find((item) => item.userId === user.sub);

    if (!actor || !this.canManageParticipants(actor.role, user.role)) {
      throw new ForbiddenException('You do not have permission to manage participants');
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: participantUserId,
        },
      },
      data: {
        removedAt: new Date(),
        removedByUserId: user.sub,
      },
    });

    const updated = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });

    return this.toConversationResponse(updated, user.sub);
  }

  async moderateMessage(
    messageId: string,
    body: {
      moderationStatus: PublicModerationStatus;
      moderationNotes?: string | null;
      isFlagged?: boolean;
      applyToAttachments?: boolean;
    },
    user: AuthenticatedUser,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        attachments: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.message.update({
        where: { id: message.id },
        data: {
          moderationStatus: body.moderationStatus,
          moderationNotes: body.moderationNotes?.trim() || null,
          isFlagged: body.isFlagged ?? body.moderationStatus === PublicModerationStatus.FLAGGED,
          moderatedAt: new Date(),
          moderatedByUserId: user.sub,
        },
        include: this.messageInclude,
      });

      if (body.applyToAttachments ?? true) {
        await tx.messageAttachment.updateMany({
          where: { messageId: message.id },
          data: {
            status: body.moderationStatus,
            moderationNotes: body.moderationNotes?.trim() || null,
            moderatedAt: new Date(),
            moderatedByUserId: user.sub,
          },
        });
      }

      return tx.message.findUniqueOrThrow({
        where: { id: next.id },
        include: this.messageInclude,
      });
    });

    return this.toMessageResponse(updated);
  }

  async getAttachmentAsset(attachmentId: string, user: AuthenticatedUser) {
    const attachment = await this.prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const hasAccess =
      this.isAdmin(user.role) ||
      attachment.conversation.participants.some(
        (participant) => participant.userId === user.sub && !participant.removedAt,
      );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this attachment');
    }

    if (!existsSync(attachment.storageKey)) {
      throw new NotFoundException('Attachment file not found on disk');
    }

    return {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      canPreview: attachment.canPreview,
      stream: createReadStream(attachment.storageKey),
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
          title: project.name,
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
          title: contract.title,
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
          title: dispute.title,
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

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: input.actorUserId,
          type: MessageType.SYSTEM,
          status: MessageStatus.SENT,
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

      await this.bumpConversationAfterMessage(tx, conversation.id, created, input.actorUserId);
      return created;
    });

    await this.notifyConversationParticipants(conversation, message, input.actorUserId, []);
    return this.toMessageResponse(message);
  }

  async createPayrollConversationForSettlement(
    settlementId: string,
    actorUserId?: string,
    title?: string | null,
  ) {
    const settlement = await this.prisma.payrollSettlement.findUnique({
      where: { id: settlementId },
      include: {
        user: true,
        payrollCycle: true,
        workforceAssignment: {
          include: {
            project: true,
            job: {
              include: {
                actor: true,
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException('Payroll settlement not found');
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    participantMap.set(settlement.userId, ConversationParticipantRole.OWNER);
    if (actorUserId) {
      participantMap.set(actorUserId, ConversationParticipantRole.ADMIN);
    }

    const recruiterUser = await this.findUserByEmail(settlement.workforceAssignment.job.actor.email);
    if (recruiterUser?.id) {
      participantMap.set(recruiterUser.id, ConversationParticipantRole.ADMIN);
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        payrollSettlementId: settlement.id,
        type: ConversationType.PAYROLL,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          projectId: settlement.workforceAssignment.projectId ?? null,
          payrollCycleId: settlement.payrollCycleId,
          payrollSettlementId: settlement.id,
          workforceAssignmentId: settlement.workforceAssignmentId,
          type: ConversationType.PAYROLL,
          title:
            title?.trim() ||
            `Payroll ${settlement.payrollCycle.periodStart.toISOString().slice(0, 10)} - ${settlement.user.email}`,
        },
        include: this.conversationInclude,
      });
    }

    await this.syncParticipants(conversation.id, participantMap);
    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });
  }

  async createPayrollConversationForCycle(
    cycleId: string,
    actorUserId?: string,
    title?: string | null,
  ) {
    const cycle = await this.prisma.payrollCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        payrollCycleId: cycle.id,
        payrollSettlementId: null,
        type: ConversationType.PAYROLL,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          payrollCycleId: cycle.id,
          type: ConversationType.PAYROLL,
          title:
            title?.trim() ||
            `Payroll cycle ${cycle.periodStart.toISOString().slice(0, 10)} - ${cycle.periodEnd.toISOString().slice(0, 10)}`,
        },
        include: this.conversationInclude,
      });
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    if (actorUserId) {
      participantMap.set(actorUserId, ConversationParticipantRole.ADMIN);
      await this.syncParticipants(conversation.id, participantMap);
    }

    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });
  }

  async createReluConversationForRecommendation(
    recommendationId: string,
    actorUserId?: string,
    title?: string | null,
  ) {
    const recommendation = await this.prisma.reluRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new NotFoundException('Relu recommendation not found');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        reluRecommendationId: recommendation.id,
        type: ConversationType.RELU,
      },
      include: this.conversationInclude,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          reluRecommendationId: recommendation.id,
          type: ConversationType.RELU,
          title: title?.trim() || recommendation.recommendedAction || 'Relu follow-up',
        },
        include: this.conversationInclude,
      });
    }

    const participantMap = new Map<string, ConversationParticipantRole>();
    if (recommendation.userId) {
      participantMap.set(recommendation.userId, ConversationParticipantRole.OWNER);
    }
    if (actorUserId) {
      participantMap.set(actorUserId, ConversationParticipantRole.ADMIN);
    }
    if (participantMap.size) {
      await this.syncParticipants(conversation.id, participantMap);
    }

    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: this.conversationInclude,
    });
  }

  async createPayrollIssueNotification(settlementId: string, actorUserId: string, reason?: string | null) {
    const conversation = await this.createPayrollConversationForSettlement(settlementId, actorUserId);
    return this.addMessageToConversation(
      conversation.id,
      {
        senderId: actorUserId,
        type: MessageType.SYSTEM,
        content: reason?.trim()
          ? `Payroll settlement requires follow-up: ${reason.trim()}`
          : 'Payroll settlement requires follow-up.',
        metadata: {
          settlementId,
          trigger: 'payroll.reject',
        },
      },
      actorUserId,
    );
  }

  async createWorkforceUpdateNotification(
    assignmentId: string,
    actorUserId: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    const conversation = await this.createWorkforceConversation(assignmentId, actorUserId);
    return this.addMessageToConversation(
      conversation.id,
      {
        senderId: actorUserId,
        type: MessageType.SYSTEM,
        content,
        metadata,
      },
      actorUserId,
    );
  }

  private async addMessageToConversation(
    conversationId: string,
    input: {
      senderId: string;
      type: MessageType;
      content: string;
      metadata?: Record<string, unknown>;
    },
    actorUserId: string,
  ) {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: this.conversationInclude,
    });

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: input.senderId,
          type: input.type,
          status: MessageStatus.SENT,
          content: input.content,
          metadataJson: this.serialize(input.metadata),
          reads: {
            create: {
              userId: actorUserId,
            },
          },
        },
        include: this.messageInclude,
      });

      await this.bumpConversationAfterMessage(tx, conversationId, created, actorUserId);
      return created;
    });

    await this.notifyConversationParticipants(conversation, message, actorUserId, []);
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
            removedAt: null,
          },
        },
      },
      include: this.conversationInclude,
    });

    return (
      conversations.find((conversation) => {
        const ids = conversation.participants
          .filter((participant) => !participant.removedAt)
          .map((participant) => participant.userId)
          .sort();
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
          removedAt: null,
          removedByUserId: null,
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
            removedAt: null,
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

  private async notifyConversationParticipants(
    conversation: any,
    message: any,
    actorUserId: string,
    mentionedUserIds: string[],
  ) {
    const recipients = conversation.participants.filter(
      (participant: any) => participant.userId !== actorUserId && !participant.removedAt,
    );

    for (const recipient of recipients) {
      await this.notificationService.emitEvent({
        key: `message:${message.id}:${recipient.userId}`,
        eventType: 'NEW_MESSAGE',
        sourceType: 'MESSAGE',
        sourceId: message.id,
        userId: recipient.userId,
        category: NotificationCategory.MESSAGING,
        title: 'New message received',
        message: `You have a new ${conversation.type.toLowerCase()} conversation message.`,
        relatedEntityType: 'Conversation',
        relatedEntityId: conversation.id,
        severity: NotificationSeverity.INFO,
        metadata: {
          conversationType: conversation.type,
          senderId: actorUserId,
        },
      });
    }

    for (const mentionedUserId of mentionedUserIds.filter((item) => item !== actorUserId)) {
      await this.notificationService.emitEvent({
        key: `message-mention:${message.id}:${mentionedUserId}`,
        eventType: 'MESSAGE_MENTION',
        sourceType: 'MESSAGE',
        sourceId: message.id,
        userId: mentionedUserId,
        category: NotificationCategory.MESSAGING,
        title: 'You were mentioned',
        message: `A participant mentioned you in a ${conversation.type.toLowerCase()} conversation.`,
        relatedEntityType: 'Conversation',
        relatedEntityId: conversation.id,
        severity: NotificationSeverity.INFO,
        metadata: {
          conversationType: conversation.type,
          senderId: actorUserId,
        },
      });
    }
  }

  private async bumpConversationAfterMessage(
    tx: TxClient,
    conversationId: string,
    message: { id: string; type: MessageType; content: string },
    actorUserId: string,
  ) {
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: this.buildPreview(message.type, message.content),
      },
    });

    const participants = await tx.conversationParticipant.findMany({
      where: {
        conversationId,
        removedAt: null,
      },
    });

    for (const participant of participants) {
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: participant.userId,
          },
        },
        data:
          participant.userId === actorUserId
            ? {
                lastSeenAt: new Date(),
                lastReadAt: new Date(),
                typingStartedAt: null,
              }
            : {
                unreadCount: {
                  increment: 1,
                },
              },
      });
    }
  }

  private async recomputeUnreadCount(conversationId: string, userId: string) {
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        reads: {
          none: {
            userId,
          },
        },
      },
    });

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        unreadCount,
        lastSeenAt: new Date(),
        lastReadAt: new Date(),
      },
    });
  }

  private async buildWorkforceParticipantMap(assignment: any, actorUserId?: string) {
    const participantMap = new Map<string, ConversationParticipantRole>();
    participantMap.set(assignment.userId, ConversationParticipantRole.WORKER);

    if (assignment.project?.createdById) {
      participantMap.set(assignment.project.createdById, ConversationParticipantRole.OWNER);
    }

    const actorEmails = [
      assignment.job?.actor?.email,
      assignment.contract?.employer?.email,
      assignment.contract?.contractor?.email,
    ].filter((value): value is string => Boolean(value));

    if (actorEmails.length) {
      const users = await this.prisma.user.findMany({
        where: {
          email: { in: actorEmails },
        },
        select: {
          id: true,
          email: true,
        },
      });

      for (const item of users) {
        participantMap.set(item.id, ConversationParticipantRole.ADMIN);
      }
    }

    if (actorUserId) {
      participantMap.set(
        actorUserId,
        participantMap.get(actorUserId) ?? ConversationParticipantRole.ADMIN,
      );
    }

    return participantMap;
  }

  private mapUserToConversationRole(role: string) {
    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      return ConversationParticipantRole.ADMIN;
    }

    if (role === Role.EMPLOYER || role === Role.GENERAL_CONTRACTOR) {
      return ConversationParticipantRole.OWNER;
    }

    return ConversationParticipantRole.MEMBER;
  }

  private mapProfileToConversationRole(profileType: string) {
    if (profileType === 'SUPERVISOR') {
      return ConversationParticipantRole.ADMIN;
    }

    if (profileType === 'PROFESSIONAL') {
      return ConversationParticipantRole.WORKER;
    }

    return ConversationParticipantRole.CONTRACTOR;
  }

  private canManageParticipants(role: ConversationParticipantRole, userRole: string) {
    return (
      this.isAdmin(userRole) ||
      role === ConversationParticipantRole.OWNER ||
      role === ConversationParticipantRole.ADMIN
    );
  }

  private isAdmin(role: string) {
    return role === Role.ADMIN || role === Role.SUPERADMIN;
  }

  private collectMentionedUserIds(
    conversation: any,
    metadataJson: Record<string, unknown> | undefined,
    content: string,
  ) {
    const explicitIds = Array.isArray(metadataJson?.mentionedUserIds)
      ? metadataJson.mentionedUserIds.filter((item): item is string => typeof item === 'string')
      : [];

    const mentionedEmails = Array.from(new Set((content.match(/@([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g) ?? []).map((item) => item.slice(1).toLowerCase())));
    const matchedIds = conversation.participants
      .filter((participant: any) =>
        participant.user?.email
          ? mentionedEmails.includes(participant.user.email.toLowerCase())
          : false,
      )
      .map((participant: any) => participant.userId);

    return Array.from(new Set([...explicitIds, ...matchedIds]));
  }

  private buildPreview(type: MessageType, content: string) {
    if (type === MessageType.FILE) {
      return `Attachment: ${content}`.slice(0, 180);
    }

    if (type === MessageType.SYSTEM) {
      return `System: ${content}`.slice(0, 180);
    }

    return content.slice(0, 180);
  }

  private canPreviewMime(mimeType: string) {
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    );
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
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

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private async findUserByEmail(email?: string | null) {
    if (!email) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });
  }

  private toConversationResponse(conversation: any, currentUserId: string | null) {
    const latestMessage = conversation.messages[0]
      ? this.toMessageResponse(conversation.messages[0])
      : null;
    const currentParticipant = currentUserId
      ? conversation.participants.find((item: any) => item.userId === currentUserId)
      : null;
    const unreadCount =
      currentParticipant?.unreadCount ??
      (currentUserId
        ? conversation.messages.filter(
            (message: any) =>
              message.senderId !== currentUserId &&
              !message.reads.some((read: any) => read.userId === currentUserId),
          ).length
        : 0);

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      publicPostId: conversation.publicPostId,
      contractId: conversation.contractId,
      disputeId: conversation.disputeId,
      workforceAssignmentId: conversation.workforceAssignmentId,
      payrollCycleId: conversation.payrollCycleId,
      payrollSettlementId: conversation.payrollSettlementId,
      reluRecommendationId: conversation.reluRecommendationId,
      type: conversation.type,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      project: conversation.project
        ? {
            id: conversation.project.id,
            slug: conversation.project.slug,
            name: conversation.project.name,
            status: conversation.project.status,
          }
        : null,
      publicPost: conversation.publicPost
        ? {
            id: conversation.publicPost.id,
            slug: conversation.publicPost.slug,
            title: conversation.publicPost.title,
            moderationStatus: conversation.publicPost.moderationStatus,
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
      workforceAssignment: conversation.workforceAssignment
        ? {
            id: conversation.workforceAssignment.id,
            status: conversation.workforceAssignment.status,
          }
        : null,
      payrollCycle: conversation.payrollCycle
        ? {
            id: conversation.payrollCycle.id,
            status: conversation.payrollCycle.status,
            periodStart: conversation.payrollCycle.periodStart,
            periodEnd: conversation.payrollCycle.periodEnd,
          }
        : null,
      payrollSettlement: conversation.payrollSettlement
        ? {
            id: conversation.payrollSettlement.id,
            status: conversation.payrollSettlement.status,
            netAmount: Number(conversation.payrollSettlement.netAmount ?? 0),
            currency: conversation.payrollSettlement.currency,
          }
        : null,
      reluRecommendation: conversation.reluRecommendation
        ? {
            id: conversation.reluRecommendation.id,
            status: conversation.reluRecommendation.status,
            recommendedAction: conversation.reluRecommendation.recommendedAction,
          }
        : null,
      participants: conversation.participants
        .filter((participant: any) => !participant.removedAt)
        .map((participant: any) => ({
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          unreadCount: participant.unreadCount,
          lastReadAt: participant.lastReadAt,
          lastSeenAt: participant.lastSeenAt,
          isMuted: participant.isMuted,
          isArchived: participant.isArchived,
          typingStartedAt: participant.typingStartedAt,
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
      status: message.status,
      content: message.content,
      metadataJson: this.parseJson(message.metadataJson),
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      moderationStatus: message.moderationStatus,
      moderatedAt: message.moderatedAt,
      moderationNotes: message.moderationNotes,
      isFlagged: message.isFlagged,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
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
      attachments: message.attachments.map((attachment: any) => ({
        id: attachment.id,
        conversationId: attachment.conversationId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        canPreview: attachment.canPreview,
        status: attachment.status,
        moderatedAt: attachment.moderatedAt,
        moderationNotes: attachment.moderationNotes,
        createdAt: attachment.createdAt,
      })),
    };
  }

  private readonly attachmentInclude = {
    select: {
      id: true,
      messageId: true,
      conversationId: true,
      uploaderId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      storageProvider: true,
      storageBucket: true,
      storageKey: true,
      canPreview: true,
      status: true,
      moderationNotes: true,
      moderatedAt: true,
      moderatedByUserId: true,
      createdAt: true,
      updatedAt: true,
    },
  } as const;

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
    attachments: this.attachmentInclude,
  } as const;

  private readonly conversationInclude = {
    project: {
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdById: true,
      },
    },
    publicPost: {
      select: {
        id: true,
        slug: true,
        title: true,
        moderationStatus: true,
        authorUserId: true,
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
    workforceAssignment: {
      select: {
        id: true,
        status: true,
      },
    },
    payrollCycle: {
      select: {
        id: true,
        status: true,
        periodStart: true,
        periodEnd: true,
      },
    },
    payrollSettlement: {
      select: {
        id: true,
        status: true,
        netAmount: true,
        currency: true,
      },
    },
    reluRecommendation: {
      select: {
        id: true,
        status: true,
        recommendedAction: true,
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
