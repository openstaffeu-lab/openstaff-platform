import {
  AccountSubscriptionStatus,
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
import { PrismaService } from '../prisma/prisma.service';
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
      const { features, contactLimit } = this.mapEntitlements(plan.entitlements);

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

    const { features, contactLimit } = this.mapEntitlements(subscription.plan.entitlements);
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

  async resolveOptionalUserFromAuthorizationHeader(authorizationHeader?: string) {
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

    if (!requestedPlan || requestedPlan.status !== SubscriptionPlanStatus.ACTIVE) {
      throw new BadRequestException('Requested plan does not exist.');
    }

    if (requestedPlan.code === SubscriptionPlanCode.BASIC) {
      throw new BadRequestException('BASIC cannot be requested as an upgrade.');
    }

    const resolvedEmail = authUser?.email ?? input.email?.trim();

    if (!resolvedEmail) {
      throw new BadRequestException('Email is required for unauthenticated upgrade requests.');
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
    const existingRequest = await this.prisma.subscriptionUpgradeRequest.findUnique({
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

  private mapEntitlements(
    entitlements: Array<{ featureKey: string; enabled: boolean; limitInt: number | null }>,
  ): { features: SubscriptionFeatureMap; contactLimit: number } {
    const features: SubscriptionFeatureMap = {};
    let contactLimit = 0;

    for (const entitlement of entitlements) {
      if (entitlement.featureKey === 'PRIVATE_CONTACTS_PER_MONTH') {
        contactLimit = entitlement.limitInt ?? 0;
        continue;
      }

      features[this.toFeatureFlagKey(entitlement.featureKey)] = entitlement.enabled;
    }

    return { features, contactLimit };
  }

  private toFeatureFlagKey(featureKey: string) {
    return featureKey
      .toLowerCase()
      .split('_')
      .map((segment, index) =>
        index === 0 ? segment : `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
      )
      .join('');
  }
}
