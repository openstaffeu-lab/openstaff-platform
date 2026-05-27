import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildSuccessResponse, logEndpointError } from '../common/api-response';

@Injectable()
export class PrivateMessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations() {
    try {
      const conversations = await this.prisma.privateConversation.findMany({
        include: {
          post: true,
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(conversations);
    } catch (error) {
      logEndpointError('PrivateMessagingService.listConversations', error);
      throw error;
    }
  }

  async listConversationsForAdmin() {
    return this.listConversations();
  }

  async createConversation(body: Record<string, unknown>, userId: string) {
    const data = {
      postId: typeof body.postId === 'string' ? body.postId : '',
      requesterName:
        typeof body.requesterName === 'string'
          ? body.requesterName
          : 'Approved OpenStaff User',
      ownerName:
        typeof body.ownerName === 'string'
          ? body.ownerName
          : 'Public post owner',
      status: typeof body.status === 'string' ? body.status : 'OPEN',
    };

    await this.assertPrivateContactAllowance(userId);

    try {
      const conversation = await this.prisma.privateConversation.create({
        data: {
          postId: data.postId,
          requesterName: data.requesterName,
          ownerName: data.ownerName,
          status: data.status as any,
        },
        include: {
          post: true,
          messages: true,
        },
      });

      await this.incrementPrivateContactUsage(userId);

      return buildSuccessResponse(conversation);
    } catch (error) {
      logEndpointError('PrivateMessagingService.createConversation', error);
      throw error;
    }
  }

  async listMessages(conversationId: string) {
    try {
      const messages = await this.prisma.privateMessage.findMany({
        where: { conversationId },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return buildSuccessResponse(messages);
    } catch (error) {
      logEndpointError('PrivateMessagingService.listMessages', error);
      throw error;
    }
  }

  async createMessage(conversationId: string, body: Record<string, unknown>) {
    const data = {
      conversationId,
      senderName:
        typeof body.senderName === 'string'
          ? body.senderName
          : 'Approved OpenStaff User',
      message:
        typeof body.message === 'string'
          ? body.message
          : 'New private message from OpenStaff.',
      status: typeof body.status === 'string' ? body.status : 'SENT',
    };

    try {
      const message = await this.prisma.privateMessage.create({
        data: {
          conversationId,
          senderName: data.senderName,
          message: data.message,
          status: data.status as any,
        },
      });

      return buildSuccessResponse(message);
    } catch (error) {
      logEndpointError('PrivateMessagingService.createMessage', error);
      throw error;
    }
  }

  async updateConversationStatus(id: string, status: string) {
    try {
      const conversation = await this.prisma.privateConversation.update({
        where: { id },
        data: {
          status: status as any,
        },
        include: {
          post: true,
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return buildSuccessResponse(conversation);
    } catch (error) {
      logEndpointError(
        'PrivateMessagingService.updateConversationStatus',
        error,
      );
      throw error;
    }
  }

  async updateMessageStatus(id: string, status: string) {
    try {
      const message = await this.prisma.privateMessage.update({
        where: { id },
        data: {
          status: status as any,
        },
      });

      return buildSuccessResponse(message);
    } catch (error) {
      logEndpointError('PrivateMessagingService.updateMessageStatus', error);
      throw error;
    }
  }

  private async assertPrivateContactAllowance(userId: string) {
    const activeSubscription = await this.prisma.accountSubscription.findFirst({
      where: {
        userId,
        status: AccountSubscriptionStatus.ACTIVE,
      },
      include: {
        plan: {
          include: {
            entitlements: true,
          },
        },
      },
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
    });

    if (!activeSubscription) {
      throw new ForbiddenException(
        'An active OpenStaff subscription is required to start a private conversation.',
      );
    }

    const contactEntitlement = activeSubscription.plan.entitlements.find(
      (entitlement) => entitlement.featureKey === 'PRIVATE_CONTACTS_PER_MONTH',
    );

    if (!contactEntitlement?.enabled) {
      throw new ForbiddenException(
        'Your current plan does not allow private conversations.',
      );
    }

    const contactLimit = contactEntitlement.limitInt ?? 0;

    if (contactLimit === 0) {
      return;
    }

    const meter = await this.prisma.usageMeter.findFirst({
      where: {
        userId,
        subscriptionId: activeSubscription.id,
        metricKey: 'PRIVATE_CONTACTS',
      },
    });

    if ((meter?.used ?? 0) >= contactLimit) {
      throw new ForbiddenException(
        'Private contact limit reached for your current subscription.',
      );
    }
  }

  private async incrementPrivateContactUsage(userId: string) {
    const activeSubscription = await this.prisma.accountSubscription.findFirst({
      where: {
        userId,
        status: AccountSubscriptionStatus.ACTIVE,
      },
      select: {
        id: true,
      },
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
    });

    if (!activeSubscription) {
      return;
    }

    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    await this.prisma.usageMeter.upsert({
      where: {
        userId_metricKey: {
          userId,
          metricKey: 'PRIVATE_CONTACTS',
        },
      },
      update: {
        used: {
          increment: 1,
        },
        subscriptionId: activeSubscription.id,
        periodStart,
        periodEnd,
      },
      create: {
        userId,
        subscriptionId: activeSubscription.id,
        metricKey: 'PRIVATE_CONTACTS',
        used: 1,
        periodStart,
        periodEnd,
      },
    });
  }
}
