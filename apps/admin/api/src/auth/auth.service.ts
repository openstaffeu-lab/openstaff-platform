import {
  AccountSubscriptionStatus,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  NotificationChannel,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
  Role,
  SubscriptionPlanCode,
  VerificationStatus,
  OnboardingStatus,
} from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { NotificationCategory } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
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
  private static readonly PASSWORD_RESET_EVENT_TYPE = 'PASSWORD_RESET_REQUESTED';
  private static readonly PASSWORD_RESET_SOURCE_TYPE = 'PASSWORD_RESET';
  private static readonly PASSWORD_RESET_EXPIRY_MINUTES = 30;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async register(data: RegisterPayload, request?: any) {
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

      await tx.identityProfile.create({
        data: {
          userId: createdUser.id,
          publicSlug: slug,
          displayName,
          verificationStatus: VerificationStatus.UNVERIFIED,
          profileCompletionPercent: 10,
        },
      });

      await tx.onboardingSession.create({
        data: {
          userId: createdUser.id,
          currentStep: 'welcome',
          completedSteps: [],
          completionPercent: 10,
          status: OnboardingStatus.NOT_STARTED,
        },
      });

      return createdUser;
    });

    await this.ensureDefaultSubscriptionForUser(user.id);
    await this.notificationService.emitEvent({
      key: `account:registered:${user.id}`,
      eventType: 'ACCOUNT_REGISTERED',
      sourceType: 'USER',
      sourceId: user.id,
      userId: user.id,
      category: NotificationCategory.ACCOUNT,
      title: 'Account registered',
      message: 'Your OpenStaff account was created successfully. Complete onboarding to unlock the platform.',
      relatedEntityType: 'User',
      relatedEntityId: user.id,
      metadata: {
        email: normalizedEmail,
        role,
      },
    });

    await this.notificationService.emitEvent({
      key: `rollout-funnel:register-completed:${user.id}`,
      eventType: 'REGISTER_COMPLETED',
      sourceType: 'ROLLOUT_FUNNEL',
      sourceId: user.id,
      userId: user.id,
      actorId: user.id,
      category: NotificationCategory.ADMIN,
      channel: 'SYSTEM' as any,
      channels: ['SYSTEM' as any],
      title: 'Registration completed',
      message: 'A user completed account registration.',
      metadata: {
        actorType: data.actorType,
        role,
      },
      relatedEntityType: 'User',
      relatedEntityId: user.id,
      skipNotification: true,
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'LOGIN_SUCCESS' as any,
      category: 'ACCOUNT',
      sourceType: 'USER',
      sourceId: user.id,
      message: 'Account registered and initial session issued',
      request,
    });

    return this.buildAuthResponse(user.id, request);
  }

  async login(data: LoginPayload, request?: any) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      await this.auditService.logSecurityEvent({
        type: 'LOGIN_FAILED' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: normalizedEmail,
        message: 'Login failed for unknown user',
        metadata: { email: normalizedEmail },
        request,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.approvalStatus === AccountApprovalStatus.REJECTED) {
      await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'SUSPICIOUS_ACTIVITY' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: user.id,
        message: 'Rejected account attempted login',
        request,
      });
      throw new ForbiddenException('Your account has been rejected');
    }

    if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
      await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'SUSPICIOUS_ACTIVITY' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: user.id,
        message: 'Suspended account attempted login',
        request,
      });
      throw new ForbiddenException('Your account is suspended');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'LOGIN_FAILED' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: user.id,
        message: 'Login failed because password did not match',
        request,
      });
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

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'LOGIN_SUCCESS' as any,
      category: 'AUTH',
      sourceType: 'USER',
      sourceId: user.id,
      message: 'User logged in successfully',
      request,
    });

    return this.buildAuthResponse(user.id, request);
  }

  async getCurrentUser(userId: string) {
    return this.buildUserSummary(userId);
  }

  async requestPasswordReset(email: string, request?: any) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        identityProfile: {
          select: {
            language: true,
          },
        },
      },
    });

    if (!user) {
      await this.auditService.logSecurityEvent({
        type: 'PASSWORD_RESET' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: normalizedEmail,
        message: 'Password reset requested for unknown email address',
        severity: 'WARNING' as any,
        request,
      });

      return this.buildPasswordResetRequestResponse();
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + AuthService.PASSWORD_RESET_EXPIRY_MINUTES * 60_000,
    );
    const resetUrl = this.buildPasswordResetUrl(rawToken);

    await this.prisma.notificationEvent.create({
      data: {
        key: `password-reset:${user.id}:${tokenHash}`,
        eventType: AuthService.PASSWORD_RESET_EVENT_TYPE,
        sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
        sourceId: tokenHash,
        userId: user.id,
        category: NotificationCategory.ACCOUNT,
        metadata: {
          email: user.email,
          expiresAt: expiresAt.toISOString(),
          usedAt: null,
          resetUrl,
        } as any,
      },
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'PASSWORD_RESET' as any,
      category: 'AUTH',
      sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
      sourceId: tokenHash,
      message: 'Password reset token issued',
      metadata: {
        expiresAt: expiresAt.toISOString(),
      },
      request,
    });

    const delivery = await this.notificationService.emitEvent({
      key: `password-reset:user:${user.id}:${tokenHash}`,
      eventType: 'PASSWORD_RESET_AVAILABLE',
      sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
      sourceId: tokenHash,
      userId: user.id,
      category: NotificationCategory.ACCOUNT,
      channel: NotificationChannel.EMAIL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      title: 'Password reset requested',
      message:
        'A password reset was requested for your account. Use the secure reset link to choose a new password.',
      metadata: {
        email: user.email,
        resetUrl,
        expiresAt: expiresAt.toISOString(),
        locale: user.identityProfile?.language ?? 'ro',
        emailSubject: this.buildPasswordResetEmailSubject(user.identityProfile?.language),
        emailText: this.buildPasswordResetEmailText({
          locale: user.identityProfile?.language ?? 'ro',
          resetUrl,
          expiresAt,
        }),
        emailHtml: this.buildPasswordResetEmailHtml({
          locale: user.identityProfile?.language ?? 'ro',
          resetUrl,
          expiresAt,
        }),
      },
    });

    const emailDelivery = delivery.deliveries.find(
      (item) => item.channel === NotificationChannel.EMAIL,
    );

    if (emailDelivery) {
      if (emailDelivery.status === 'SENT') {
        this.logger.log(
          `password reset email queued successfully for user=${user.id} delivery=${emailDelivery.id}`,
        );
      } else {
        const failureReason =
          typeof emailDelivery.metadata === 'object' &&
          emailDelivery.metadata !== null &&
          'failureReason' in emailDelivery.metadata
            ? String((emailDelivery.metadata as Record<string, unknown>).failureReason ?? 'unknown')
            : 'unknown';

        this.logger.warn(
          `password reset email delivery failed for user=${user.id} delivery=${emailDelivery.id} reason=${failureReason}`,
        );
      }
    }

    return this.buildPasswordResetRequestResponse();
  }

  async resetPassword(token: string, nextPassword: string, request?: any) {
    const trimmedToken = token.trim();
    const tokenHash = this.hashPasswordResetToken(trimmedToken);
    const resetEvent = await this.prisma.notificationEvent.findFirst({
      where: {
        eventType: AuthService.PASSWORD_RESET_EVENT_TYPE,
        sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
        sourceId: tokenHash,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!resetEvent) {
      await this.auditService.logSecurityEvent({
        type: 'PASSWORD_RESET' as any,
        category: 'AUTH',
        sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
        sourceId: tokenHash,
        message: 'Password reset rejected because token was not found',
        severity: 'WARNING' as any,
        request,
      });
      throw new UnauthorizedException('This password reset link is invalid or has expired');
    }

    const metadata = this.parsePasswordResetMetadata(resetEvent.metadata);
    const expiresAt = metadata.expiresAt ? new Date(metadata.expiresAt) : null;
    const usedAt = metadata.usedAt ? new Date(metadata.usedAt) : null;

    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      await this.auditService.logSecurityEvent({
        userId: resetEvent.userId ?? null,
        type: 'PASSWORD_RESET' as any,
        category: 'AUTH',
        sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
        sourceId: tokenHash,
        message: 'Password reset rejected because token expired',
        severity: 'WARNING' as any,
        request,
      });
      throw new UnauthorizedException('This password reset link is invalid or has expired');
    }

    if (usedAt) {
      await this.auditService.logSecurityEvent({
        userId: resetEvent.userId ?? null,
        type: 'PASSWORD_RESET' as any,
        category: 'AUTH',
        sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
        sourceId: tokenHash,
        message: 'Password reset rejected because token was already used',
        severity: 'WARNING' as any,
        request,
      });
      throw new UnauthorizedException('This password reset link was already used');
    }

    if (!resetEvent.userId) {
      throw new UnauthorizedException('This password reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(nextPassword, 10);

    await this.prisma.user.update({
      where: { id: resetEvent.userId },
      data: {
        password: passwordHash,
        refreshTokenHash: null,
      },
    });

    await this.prisma.notificationEvent.update({
      where: { id: resetEvent.id },
      data: {
        metadata: {
          ...metadata,
          usedAt: new Date().toISOString(),
        } as any,
        status: 'SENT' as any,
        deliveredAt: new Date(),
      },
    });

    await this.auditService.revokeAllSessionsForUser(resetEvent.userId);
    await this.auditService.logSecurityEvent({
      userId: resetEvent.userId,
      type: 'PASSWORD_RESET' as any,
      category: 'AUTH',
      sourceType: AuthService.PASSWORD_RESET_SOURCE_TYPE,
      sourceId: tokenHash,
      message: 'Password reset completed and active sessions were revoked',
      request,
    });

    return {
      success: true,
      message: 'Your password was updated successfully. Please sign in again.',
    };
  }

  async refresh(refreshToken: string, request?: any) {
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
      await this.auditService.logSecurityEvent({
        userId: payload.sub,
        type: 'TOKEN_REFRESH' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: payload.sub,
        message: 'Refresh token rejected because session is not active',
        severity: 'WARNING' as any,
        request,
      });
      throw new UnauthorizedException('Refresh token is not active');
    }

    if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
      await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'SUSPICIOUS_ACTIVITY' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: user.id,
        message: 'Suspended account attempted token refresh',
        request,
      });
      throw new ForbiddenException('Your account is suspended');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!matches) {
      await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'TOKEN_REFRESH' as any,
        category: 'AUTH',
        sourceType: 'USER',
        sourceId: user.id,
        message: 'Refresh token did not match active session hash',
        severity: 'WARNING' as any,
        request,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'TOKEN_REFRESH' as any,
      category: 'AUTH',
      sourceType: 'USER',
      sourceId: user.id,
      message: 'Refresh token rotated successfully',
      request,
    });

    return this.buildAuthResponse(user.id, request);
  }

  async logout(userId: string, request?: any) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
      },
    });

    await this.auditService.revokeAllSessionsForUser(userId);
    await this.auditService.log({
      actorUserId: userId,
      targetUserId: userId,
      entityType: 'USER_SESSION',
      entityId: userId,
      action: 'AUTH_LOGOUT',
      category: 'AUTH',
      metadata: { action: 'logout' },
      request,
    });
  }

  async firebaseExchange(idToken: string, request?: any) {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    const normalizedEmail = decoded.email?.trim().toLowerCase();
    const claimedRole = this.resolveFirebaseRole(decoded);

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
            role: claimedRole ?? Role.PROFESSIONAL,
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

        await tx.identityProfile.create({
          data: {
            userId: createdUser.id,
            publicSlug: slug,
            displayName,
            verificationStatus: VerificationStatus.UNVERIFIED,
            profileCompletionPercent: 10,
          },
        });

        await tx.onboardingSession.create({
          data: {
            userId: createdUser.id,
            currentStep: 'welcome',
            completedSteps: [],
            completionPercent: 10,
            status: OnboardingStatus.NOT_STARTED,
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
          ...(claimedRole ? { role: claimedRole } : {}),
        },
      });
    }

    await this.ensureDefaultSubscriptionForUser(user.id);

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'LOGIN_SUCCESS' as any,
      category: 'AUTH',
      sourceType: 'USER',
      sourceId: user.id,
      message: 'Firebase exchange issued application session',
      request,
    });

    return this.buildAuthResponse(user.id, request);
  }

  async listSessions(userId: string) {
    return this.auditService.listUserSessions(userId);
  }

  async revokeSession(sessionId: string, actor: { sub: string; role: string }) {
    return this.auditService.revokeSession(sessionId, actor);
  }

  private async buildAuthResponse(userId: string, request?: any) {
    const user = await this.buildUserSummary(userId);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
      },
    });

    if (request) {
      await this.auditService.createOrUpdateSession({
        userId: user.id,
        refreshTokenHash,
        request,
      });
    }

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
    const secret = process.env.JWT_SECRET?.trim();

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production.');
    }

    return 'SUPER_SECRET_KEY';
  }

  private getRefreshSecret() {
    const secret = process.env.JWT_REFRESH_SECRET?.trim();

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET must be configured in production.');
    }

    return this.getJwtSecret();
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

  private buildPasswordResetRequestResponse() {
    return {
      success: true,
      message:
        'If an account matches that email, OpenStaff will try to deliver a secure reset link shortly. Please also check Spam or Junk.',
      expiresInMinutes: AuthService.PASSWORD_RESET_EXPIRY_MINUTES,
    };
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetEmailSubject(locale?: string | null) {
    return String(locale ?? '').toLowerCase().startsWith('ro')
      ? 'Resetare parola OpenStaff'
      : 'Reset your OpenStaff password';
  }

  private buildPasswordResetEmailText(input: {
    locale?: string | null;
    resetUrl: string;
    expiresAt: Date;
  }) {
    const expiresLabel = input.expiresAt.toISOString();
    if (String(input.locale ?? '').toLowerCase().startsWith('ro')) {
      return [
        'Ai cerut resetarea parolei pentru contul tau OpenStaff.',
        '',
        `Foloseste acest link securizat: ${input.resetUrl}`,
        `Linkul expira la ${expiresLabel}.`,
        '',
        'Daca nu ai cerut tu aceasta actiune, ignora acest mesaj. OpenStaff nu iti va cere niciodata parola prin email.',
      ].join('\n');
    }

    return [
      'You requested a password reset for your OpenStaff account.',
      '',
      `Use this secure link: ${input.resetUrl}`,
      `This link expires at ${expiresLabel}.`,
      '',
      'If you did not request this reset, ignore this email. OpenStaff will never ask for your password by email.',
    ].join('\n');
  }

  private buildPasswordResetEmailHtml(input: {
    locale?: string | null;
    resetUrl: string;
    expiresAt: Date;
  }) {
    const expiresLabel = input.expiresAt.toISOString();
    if (String(input.locale ?? '').toLowerCase().startsWith('ro')) {
      return `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <h1 style="font-size:22px;margin-bottom:16px">Resetare parola OpenStaff</h1>
          <p>Ai cerut resetarea parolei pentru contul tau OpenStaff.</p>
          <p>
            <a href="${input.resetUrl}" style="display:inline-block;background:#1B2A6B;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px">
              Reseteaza parola
            </a>
          </p>
          <p>Linkul expira la <strong>${expiresLabel}</strong>.</p>
          <p>Daca nu ai cerut tu aceasta actiune, ignora acest email. OpenStaff nu iti va cere niciodata parola prin email.</p>
        </div>
      `.trim();
    }

    return `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:22px;margin-bottom:16px">Reset your OpenStaff password</h1>
        <p>You requested a password reset for your OpenStaff account.</p>
        <p>
          <a href="${input.resetUrl}" style="display:inline-block;background:#1B2A6B;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px">
            Reset password
          </a>
        </p>
        <p>This link expires at <strong>${expiresLabel}</strong>.</p>
        <p>If you did not request this reset, ignore this email. OpenStaff will never ask for your password by email.</p>
      </div>
    `.trim();
  }

  private buildPasswordResetUrl(token: string) {
    const baseUrl =
      process.env.PUBLIC_WEB_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      'https://openstaff.eu';

    return `${baseUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private parsePasswordResetMetadata(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {
        expiresAt: null as string | null,
        usedAt: null as string | null,
      };
    }

    const input = value as Record<string, unknown>;
    return {
      expiresAt: typeof input.expiresAt === 'string' ? input.expiresAt : null,
      usedAt: typeof input.usedAt === 'string' ? input.usedAt : null,
    };
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

  private resolveFirebaseRole(decoded: { [key: string]: unknown }) {
    if (decoded.admin === true) {
      return Role.SUPERADMIN;
    }

    if (typeof decoded.role !== 'string') {
      return null;
    }

    const normalizedRole = decoded.role.trim().toUpperCase();

    if (normalizedRole === Role.SUPERADMIN) {
      return Role.SUPERADMIN;
    }

    if (normalizedRole === Role.ADMIN) {
      return Role.ADMIN;
    }

    return null;
  }
}
