import {
  AccountSubscriptionStatus,
  BillingEventStatus,
  BillingEventType,
  NotificationCategory,
  Role,
  SubscriptionPlanCode,
  SubscriptionPlanStatus,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApproveUpgradeRequestDto } from './dto/approve-upgrade-request.dto';
import { ChangeUserSubscriptionDto } from './dto/change-user-subscription.dto';
import { CreateUpgradeRequestDto } from './dto/create-upgrade-request.dto';

type SubscriptionFeatureMap = Record<string, boolean>;
type AuthenticatedUpgradeUser = {
  id: string;
  email: string;
  role: Role;
  displayName: string | null;
  companyName: string | null;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly billingService: BillingService,
    private readonly notificationService: NotificationService,
  ) {}

  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { status: SubscriptionPlanStatus.ACTIVE },
      include: {
        entitlements: {
          orderBy: { featureKey: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return plans.map((plan) => {
      const { features, contactLimit } = this.mapEntitlements(
        plan.entitlements,
      );

      return {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currencyCode,
        contactLimit,
        features,
      };
    });
  }

  async getCurrentSubscriptionSummary(userId: string) {
    const subscription = await this.prisma.accountSubscription.findFirst({
      where: {
        userId,
        status: AccountSubscriptionStatus.ACTIVE,
      },
      include: {
        plan: {
          include: {
            entitlements: {
              orderBy: { featureKey: 'asc' },
            },
          },
        },
      },
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
    });

    if (!subscription) {
      return null;
    }

    const { features, contactLimit } = this.mapEntitlements(
      subscription.plan.entitlements,
    );
    const usageMeter = await this.prisma.usageMeter.findFirst({
      where: {
        userId,
        subscriptionId: subscription.id,
        metricKey: 'PRIVATE_CONTACTS',
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return {
      planCode: subscription.plan.code,
      planName: subscription.plan.name,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      contactLimit,
      contactsUsed: usageMeter?.used ?? 0,
      features,
    };
  }

  async ensureDefaultSubscription(userId: string) {
    const activeSubscription = await this.prisma.accountSubscription.findFirst({
      where: {
        userId,
        status: AccountSubscriptionStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (activeSubscription) {
      return activeSubscription;
    }

    const basicPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: SubscriptionPlanCode.BASIC },
      select: { id: true },
    });

    if (!basicPlan) {
      return null;
    }

    return this.prisma.accountSubscription.create({
      data: {
        userId,
        planId: basicPlan.id,
        status: AccountSubscriptionStatus.ACTIVE,
      },
      select: { id: true },
    });
  }

  async resolveOptionalUserFromAuthorizationHeader(
    authorizationHeader?: string,
  ) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);

      if (!payload?.sub) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              companyName: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName ?? null,
        companyName: user.profile?.companyName ?? null,
      };
    } catch {
      return null;
    }
  }

  async createUpgradeRequest(
    input: CreateUpgradeRequestDto,
    authUser?: AuthenticatedUpgradeUser | null,
  ) {
    const requestedPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.requestedPlanCode },
      select: {
        id: true,
        code: true,
        status: true,
      },
    });

    if (
      !requestedPlan ||
      requestedPlan.status !== SubscriptionPlanStatus.ACTIVE
    ) {
      throw new BadRequestException('Requested plan does not exist.');
    }

    if (requestedPlan.code === SubscriptionPlanCode.BASIC) {
      throw new BadRequestException('BASIC cannot be requested as an upgrade.');
    }

    const resolvedEmail = authUser?.email ?? input.email?.trim();

    if (!resolvedEmail) {
      throw new BadRequestException(
        'Email is required for unauthenticated upgrade requests.',
      );
    }

    const currentSubscription = authUser
      ? await this.prisma.accountSubscription.findFirst({
          where: {
            userId: authUser.id,
            status: AccountSubscriptionStatus.ACTIVE,
          },
          include: {
            plan: {
              select: {
                code: true,
              },
            },
          },
          orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
        })
      : null;

    const upgradeRequest = await this.prisma.subscriptionUpgradeRequest.create({
      data: {
        userId: authUser?.id,
        currentPlanCode: currentSubscription?.plan.code ?? null,
        requestedPlanCode: requestedPlan.code,
        name: input.name?.trim() || authUser?.displayName || null,
        email: resolvedEmail,
        companyName: input.companyName?.trim() || authUser?.companyName || null,
        phone: input.phone?.trim() || null,
        message: input.message?.trim() || null,
        source: input.source ?? 'PRICING',
        status: 'PENDING',
        metadata: authUser
          ? {
              authenticated: true,
              role: authUser.role,
            }
          : {
              authenticated: false,
            },
      },
      select: {
        id: true,
        status: true,
        requestedPlanCode: true,
      },
    });

    await this.notificationService.emitEvent({
      key: `rollout-funnel:upgrade-requested:${upgradeRequest.id}`,
      eventType: 'UPGRADE_REQUESTED',
      sourceType: 'ROLLOUT_FUNNEL',
      sourceId: upgradeRequest.id,
      userId: authUser?.id ?? null,
      actorId: authUser?.id ?? null,
      category: NotificationCategory.ADMIN,
      channel: 'SYSTEM' as any,
      channels: ['SYSTEM' as any],
      title: 'Upgrade request recorded',
      message: `A ${requestedPlan.code} upgrade request was submitted.`,
      metadata: {
        requestedPlanCode: requestedPlan.code,
        source: input.source ?? 'PRICING',
        authenticated: Boolean(authUser?.id),
      },
      relatedEntityType: 'SubscriptionUpgradeRequest',
      relatedEntityId: upgradeRequest.id,
      skipNotification: true,
    });

    return {
      ...upgradeRequest,
      message: 'Upgrade request received',
    };
  }

  async listAdminUpgradeRequests() {
    return this.prisma.subscriptionUpgradeRequest.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        email: true,
        name: true,
        companyName: true,
        currentPlanCode: true,
        requestedPlanCode: true,
        status: true,
        source: true,
      },
    });
  }

  async updateUpgradeRequestStatus(id: string, status: string) {
    const existingRequest =
      await this.prisma.subscriptionUpgradeRequest.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existingRequest) {
      throw new NotFoundException('Upgrade request not found.');
    }

    return this.prisma.subscriptionUpgradeRequest.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        createdAt: true,
        email: true,
        name: true,
        companyName: true,
        currentPlanCode: true,
        requestedPlanCode: true,
        status: true,
        source: true,
      },
    });
  }

  async approveUpgradeRequest(
    id: string,
    input: ApproveUpgradeRequestDto,
    actorUserId?: string | null,
  ) {
    const upgradeRequest =
      await this.prisma.subscriptionUpgradeRequest.findUnique({
        where: { id },
      });

    if (!upgradeRequest) {
      throw new NotFoundException('Upgrade request not found.');
    }

    if (
      upgradeRequest.status === 'APPROVED' ||
      upgradeRequest.status === 'CLOSED'
    ) {
      throw new BadRequestException(
        'Upgrade request cannot be approved from its current status.',
      );
    }

    if (!upgradeRequest.userId) {
      throw new BadRequestException('Upgrade request is not linked to a user');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: upgradeRequest.requestedPlanCode as SubscriptionPlanCode },
      include: {
        entitlements: {
          orderBy: { featureKey: 'asc' },
        },
      },
    });

    if (!plan || plan.status !== SubscriptionPlanStatus.ACTIVE) {
      throw new BadRequestException('Requested plan does not exist.');
    }

    const previousSubscription =
      await this.prisma.accountSubscription.findFirst({
        where: {
          userId: upgradeRequest.userId,
          status: AccountSubscriptionStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
        orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      });

    const result = await this.prisma.$transaction(async (tx) => {
      if (previousSubscription) {
        await tx.accountSubscription.update({
          where: { id: previousSubscription.id },
          data: {
            status: AccountSubscriptionStatus.CANCELED,
            canceledAt: new Date(),
          },
        });
      }

      const nextSubscription = await tx.accountSubscription.create({
        data: {
          userId: upgradeRequest.userId!,
          planId: plan.id,
          status: AccountSubscriptionStatus.ACTIVE,
        },
        include: {
          plan: {
            include: {
              entitlements: {
                orderBy: { featureKey: 'asc' },
              },
            },
          },
        },
      });

      await tx.usageMeter.upsert({
        where: {
          userId_metricKey: {
            userId: upgradeRequest.userId!,
            metricKey: 'PRIVATE_CONTACTS',
          },
        },
        update: {
          subscriptionId: nextSubscription.id,
          used: 0,
          periodStart: new Date(),
          periodEnd: null,
        },
        create: {
          userId: upgradeRequest.userId!,
          subscriptionId: nextSubscription.id,
          metricKey: 'PRIVATE_CONTACTS',
          used: 0,
          periodStart: new Date(),
          periodEnd: null,
        },
      });

      const updatedRequest = await tx.subscriptionUpgradeRequest.update({
        where: { id: upgradeRequest.id },
        data: {
          status: 'APPROVED',
          metadata: {
            ...(upgradeRequest.metadata as Record<string, unknown> | null),
            approvalNote: input.note ?? null,
            approvedAt: new Date().toISOString(),
            approvedByUserId: actorUserId ?? null,
          },
        },
      });

      const billingEvent = await tx.billingEvent.create({
        data: {
          userId: upgradeRequest.userId!,
          subscriptionId: nextSubscription.id,
          type: BillingEventType.SUBSCRIPTION_UPGRADE,
          amount: plan.priceMonthly,
          currency: plan.currencyCode,
          status:
            (input.billingStatus as BillingEventStatus | undefined) ??
            BillingEventStatus.PENDING,
          description: `Approved upgrade request for ${plan.code}`,
          metadata: {
            upgradeRequestId: upgradeRequest.id,
            note: input.note ?? null,
            previousPlanCode: previousSubscription?.plan.code ?? null,
            nextPlanCode: plan.code,
          },
        },
      });

      return {
        request: updatedRequest,
        subscription: nextSubscription,
        billingEvent,
      };
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'SubscriptionUpgradeRequest',
      entityId: upgradeRequest.id,
      action: 'APPROVE',
      before: {
        status: upgradeRequest.status,
        currentPlanCode: upgradeRequest.currentPlanCode,
        requestedPlanCode: upgradeRequest.requestedPlanCode,
      },
      after: {
        status: result.request.status,
        planCode: result.subscription.plan.code,
        subscriptionId: result.subscription.id,
        billingEventId: result.billingEvent.id,
      },
      metadata: {
        note: input.note ?? null,
        billingStatus: input.billingStatus ?? 'PENDING',
      },
    });

    const invoice = await this.billingService.generateInvoice(
      {
        userId: upgradeRequest.userId!,
        billingEventIds: [result.billingEvent.id],
        dueDays: 14,
      },
      actorUserId,
    );

    await this.notificationService.emitEvent({
      key: `subscription-upgrade:approved:${upgradeRequest.id}`,
      eventType: 'SUBSCRIPTION_UPGRADE_APPROVED',
      sourceType: 'SUBSCRIPTION_UPGRADE_REQUEST',
      sourceId: upgradeRequest.id,
      userId: upgradeRequest.userId!,
      category: NotificationCategory.BILLING,
      title: 'Subscription upgraded',
      message: `Your plan was upgraded to ${result.subscription.plan.name}.`,
      relatedEntityType: 'SubscriptionUpgradeRequest',
      relatedEntityId: upgradeRequest.id,
      metadata: {
        previousPlanCode: previousSubscription?.plan.code ?? null,
        requestedPlanCode: result.subscription.plan.code,
        billingEventId: result.billingEvent.id,
        invoiceId: invoice.id,
        approvedByUserId: actorUserId ?? null,
      },
    });

    return {
      request: this.toUpgradeRequestResponse(result.request),
      subscription: await this.getCurrentSubscriptionSummary(
        upgradeRequest.userId!,
      ),
      billingEvent: {
        id: result.billingEvent.id,
        type: result.billingEvent.type,
        amount: result.billingEvent.amount,
        currency: result.billingEvent.currency,
        status: result.billingEvent.status,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        status: invoice.status,
        total: invoice.total,
        taxAmount: invoice.taxAmount,
      },
    };
  }

  async changeUserSubscription(
    userId: string,
    input: ChangeUserSubscriptionDto,
    actorUserId?: string | null,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.planCode as SubscriptionPlanCode },
    });

    if (!plan || plan.status !== SubscriptionPlanStatus.ACTIVE) {
      throw new BadRequestException('Requested plan does not exist.');
    }

    const previousSubscription =
      await this.prisma.accountSubscription.findFirst({
        where: {
          userId,
          status: AccountSubscriptionStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
        orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      });

    const result = await this.prisma.$transaction(async (tx) => {
      if (previousSubscription) {
        await tx.accountSubscription.update({
          where: { id: previousSubscription.id },
          data: {
            status: AccountSubscriptionStatus.CANCELED,
            canceledAt: new Date(),
          },
        });
      }

      const nextSubscription = await tx.accountSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: AccountSubscriptionStatus.ACTIVE,
        },
      });

      await tx.usageMeter.upsert({
        where: {
          userId_metricKey: {
            userId,
            metricKey: 'PRIVATE_CONTACTS',
          },
        },
        update: {
          subscriptionId: nextSubscription.id,
          used: 0,
          periodStart: new Date(),
          periodEnd: null,
        },
        create: {
          userId,
          subscriptionId: nextSubscription.id,
          metricKey: 'PRIVATE_CONTACTS',
          used: 0,
          periodStart: new Date(),
          periodEnd: null,
        },
      });

      const billingEvent = await tx.billingEvent.create({
        data: {
          userId,
          subscriptionId: nextSubscription.id,
          type: BillingEventType.MANUAL_ADJUSTMENT,
          amount: plan.priceMonthly,
          currency: plan.currencyCode,
          status: BillingEventStatus.PENDING,
          description: `Manual subscription change to ${plan.code}`,
          metadata: {
            note: input.note ?? null,
            previousPlanCode: previousSubscription?.plan.code ?? null,
            nextPlanCode: plan.code,
          },
        },
      });

      return { nextSubscription, billingEvent };
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'AccountSubscription',
      entityId: result.nextSubscription.id,
      action: 'MANUAL_CHANGE',
      before: previousSubscription
        ? {
            subscriptionId: previousSubscription.id,
            planCode: previousSubscription.plan.code,
            status: previousSubscription.status,
          }
        : null,
      after: {
        subscriptionId: result.nextSubscription.id,
        planCode: plan.code,
        status: result.nextSubscription.status,
        billingEventId: result.billingEvent.id,
      },
      metadata: {
        userId,
        note: input.note ?? null,
      },
    });

    return this.getCurrentSubscriptionSummary(userId);
  }

  async findBillingEventsForUser(userId: string) {
    return this.prisma.billingEvent.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });
  }

  private toUpgradeRequestResponse(request: {
    id: string;
    createdAt: Date;
    email: string;
    name: string | null;
    companyName: string | null;
    currentPlanCode: string | null;
    requestedPlanCode: string;
    status: string;
    source: string;
  }) {
    return {
      id: request.id,
      createdAt: request.createdAt,
      email: request.email,
      name: request.name,
      companyName: request.companyName,
      currentPlanCode: request.currentPlanCode,
      requestedPlanCode: request.requestedPlanCode,
      status: request.status,
      source: request.source,
    };
  }

  private mapEntitlements(
    entitlements: Array<{
      featureKey: string;
      enabled: boolean;
      limitInt: number | null;
    }>,
  ): { features: SubscriptionFeatureMap; contactLimit: number } {
    const features: SubscriptionFeatureMap = {};
    let contactLimit = 0;

    for (const entitlement of entitlements) {
      if (entitlement.featureKey === 'PRIVATE_CONTACTS_PER_MONTH') {
        contactLimit = entitlement.limitInt ?? 0;
        continue;
      }

      features[this.toFeatureFlagKey(entitlement.featureKey)] =
        entitlement.enabled;
    }

    return { features, contactLimit };
  }

  private toFeatureFlagKey(featureKey: string) {
    return featureKey
      .toLowerCase()
      .split('_')
      .map((segment, index) =>
        index === 0
          ? segment
          : `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
      )
      .join('');
  }
}
