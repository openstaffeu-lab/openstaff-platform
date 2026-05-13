import {
  AccountSubscriptionStatus,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
  Role,
  SubscriptionPlanCode,
} from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { getFirebaseAdminAuth } from './firebase-admin';

type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  actorType: ActorType;
  profileType?: ProfileType;
};

type LoginPayload = {
  email: string;
  password: string;
};

type AuthenticatedUserSummary = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  approvalStatus: AccountApprovalStatus;
  accountStatus: AccountLifecycleStatus;
  actorType: ActorType;
  onboardingStep: number;
  onboardingDone: boolean;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    companyName: string | null;
    profileType: ProfileType;
    visibility: string;
    moderationStatus: string;
    status: string;
  } | null;
  subscription: {
    planCode: SubscriptionPlanCode;
    planName: string;
    status: AccountSubscriptionStatus;
    startedAt: Date;
    expiresAt: Date | null;
    contactLimit: number;
    contactsUsed: number;
    features: Record<string, boolean>;
  } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterPayload) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const profileType = data.profileType ?? this.mapActorTypeToProfileType(data.actorType);
    const role = this.mapProfileTypeToRole(profileType);
    const displayName = data.displayName.trim();
    const slug = await this.generateUniqueProfileSlug(displayName);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role,
          approvalStatus: AccountApprovalStatus.PENDING,
          accountStatus: AccountLifecycleStatus.OFFLINE,
        },
      });

      await tx.profile.create({
        data: {
          userId: createdUser.id,
          slug,
          profileType,
          displayName,
          visibility: ProfileVisibility.PRIVATE,
          moderationStatus: ProfileModerationStatus.PENDING,
          status: ProfileLifecycleStatus.OFFLINE,
        },
      });

      return createdUser;
    });

    await this.ensureDefaultSubscriptionForUser(user.id);

    return this.buildAuthResponse(user.id);
  }

  async login(data: LoginPayload) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.approvalStatus === AccountApprovalStatus.REJECTED) {
      throw new ForbiddenException('Your account has been rejected');
    }

    if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountStatus: AccountLifecycleStatus.LIVE,
        lastLoginAt: new Date(),
      },
    });

    await this.ensureDefaultSubscriptionForUser(user.id);

    return this.buildAuthResponse(user.id);
  }

  async getCurrentUser(userId: string) {
    return this.buildUserSummary(userId);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        refreshTokenHash: true,
        accountStatus: true,
      },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is not active');
    }

    if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user.id);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
      },
    });
  }

  async firebaseExchange(idToken: string) {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    const normalizedEmail = decoded.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new UnauthorizedException('Firebase account does not provide an email');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: decoded.uid }, { email: normalizedEmail }],
      },
      select: { id: true },
    });

    if (!user) {
      const displayName = decoded.name?.trim() || normalizedEmail.split('@')[0];
      const slug = await this.generateUniqueProfileSlug(displayName);
      const generatedPassword = await bcrypt.hash(
        `firebase-${decoded.uid}-${Date.now()}`,
        10,
      );

      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            firebaseUid: decoded.uid,
            password: generatedPassword,
            role: Role.PROFESSIONAL,
            approvalStatus: AccountApprovalStatus.PENDING,
            accountStatus: AccountLifecycleStatus.OFFLINE,
          },
          select: { id: true },
        });

        await tx.profile.create({
          data: {
            userId: createdUser.id,
            slug,
            displayName,
            profileType: ProfileType.PROFESSIONAL,
            visibility: ProfileVisibility.PRIVATE,
            moderationStatus: ProfileModerationStatus.PENDING,
            status: ProfileLifecycleStatus.OFFLINE,
          },
        });

        return createdUser;
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decoded.uid,
          lastLoginAt: new Date(),
        },
      });
    }

    await this.ensureDefaultSubscriptionForUser(user.id);

    return this.buildAuthResponse(user.id);
  }

  private async buildAuthResponse(userId: string) {
    const user = await this.buildUserSummary(userId);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private async buildUserSummary(userId: string): Promise<AuthenticatedUserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayName =
      user.profile?.displayName?.trim() || user.email.split('@')[0] || 'OpenStaff User';
    const actorType = this.mapProfileTypeToActorType(user.profile?.profileType);
    const onboardingDone = Boolean(user.profile);
    const subscription = await this.buildCurrentSubscriptionSummary(user.id);

    return {
      id: user.id,
      email: user.email,
      displayName,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      actorType,
      onboardingStep: onboardingDone ? 1 : 0,
      onboardingDone,
      profile: user.profile
        ? {
            id: user.profile.id,
            slug: user.profile.slug,
            displayName: user.profile.displayName,
            companyName: user.profile.companyName,
            profileType: user.profile.profileType,
            visibility: user.profile.visibility,
            moderationStatus: user.profile.moderationStatus,
            status: user.profile.status,
          }
        : null,
      subscription,
    };
  }

  private async buildCurrentSubscriptionSummary(userId: string) {
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

  private async ensureDefaultSubscriptionForUser(userId: string) {
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

  private mapEntitlements(
    entitlements: Array<{ featureKey: string; enabled: boolean; limitInt: number | null }>,
  ) {
    const features: Record<string, boolean> = {};
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

  private async signAccessToken(user: AuthenticatedUserSummary) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        accountStatus: user.accountStatus,
      },
      {
        secret: this.getJwtSecret(),
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any,
      },
    );
  }

  private async signRefreshToken(user: AuthenticatedUserSummary) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as any,
      },
    );
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        type?: string;
      }>(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private getJwtSecret() {
    return process.env.JWT_SECRET ?? 'SUPER_SECRET_KEY';
  }

  private getRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET ?? this.getJwtSecret();
  }

  private async generateUniqueProfileSlug(value: string) {
    const normalized = this.slugify(value);
    let slug = normalized;
    let index = 2;

    while (
      await this.prisma.profile.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${normalized}-${index}`;
      index += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    return (
      value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `profile-${Date.now()}`
    );
  }

  private mapActorTypeToProfileType(actorType: ActorType) {
    switch (actorType) {
      case ActorType.COMPANY:
        return ProfileType.CONTRACTOR;
      case ActorType.PUBLIC_INSTITUTION:
        return ProfileType.INVESTOR;
      case ActorType.INDIVIDUAL:
      default:
        return ProfileType.PROFESSIONAL;
    }
  }

  private mapProfileTypeToRole(profileType: ProfileType) {
    if (
      profileType === ProfileType.CONTRACTOR ||
      profileType === ProfileType.SUBCONTRACTOR ||
      profileType === ProfileType.SUPPLIER ||
      profileType === ProfileType.GENERAL_CONTRACTOR
    ) {
      return Role.CONTRACTOR;
    }

    if (profileType === ProfileType.INVESTOR) {
      return Role.EMPLOYER;
    }

    return Role.PROFESSIONAL;
  }

  private mapProfileTypeToActorType(profileType?: ProfileType | null) {
    if (!profileType) {
      return ActorType.INDIVIDUAL;
    }

    if (
      profileType === ProfileType.CONTRACTOR ||
      profileType === ProfileType.SUBCONTRACTOR ||
      profileType === ProfileType.SUPPLIER ||
      profileType === ProfileType.GENERAL_CONTRACTOR ||
      profileType === ProfileType.TRAINING_COMPANY
    ) {
      return ActorType.COMPANY;
    }

    if (profileType === ProfileType.INVESTOR) {
      return ActorType.PUBLIC_INSTITUTION;
    }

    return ActorType.INDIVIDUAL;
  }
}
