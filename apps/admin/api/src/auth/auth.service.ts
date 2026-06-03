import {
  AccountSubscriptionStatus,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  NotificationChannel,
  Prisma,
  ProfileType,
  Role,
  SubscriptionPlanCode,
} from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { NotificationCategory } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { TrustService } from '../trust/trust.service';
import { getFirebaseAdminAuth } from './firebase-admin';

type RegisterPayload = {
  email: string;
  password: string;
  displayName?: string;
  actorType?: ActorType;
  profileType?: ProfileType;
  companyName?: string;
  vatNumber?: string;
  countryCode?: string;
  languageCode?: string;
  timezone?: string;
  phone?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type TwoFactorChallengePurpose =
  | 'SETUP'
  | 'LOGIN'
  | 'DISABLE'
  | 'RECOVERY_CODES_REGENERATION'
  | 'SUSPICIOUS_LOGIN';

type TwoFactorChallengeResponse = {
  challengeRequired: true;
  challengeId: string;
  purpose: 'LOGIN';
  deliveryChannel: 'EMAIL';
  maskedDestination: string;
  expiresInSeconds: number;
};

type PasswordResetEligibilityStatus =
  | 'eligible_password_reset'
  | 'not_found'
  | 'disabled'
  | 'external_auth_only'
  | 'missing_email'
  | 'unknown_auth_state';

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
  onboardingCurrentStep: string | null;
  onboardingCompletedSteps: string[];
  identityState: {
    hasProfessionalIdentity: boolean;
    hasCompanyIdentity: boolean;
    selectedIdentityType: 'PROFESSIONAL' | 'COMPANY' | 'BOTH' | null;
    identityProfileStatus: string | null;
    companyProfileStatus: string | null;
  };
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
  private static readonly PASSWORD_RESET_EVENT_TYPE =
    'PASSWORD_RESET_REQUESTED';
  private static readonly PASSWORD_RESET_SOURCE_TYPE = 'PASSWORD_RESET';
  private static readonly PASSWORD_RESET_EXPIRY_MINUTES = 30;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly trustService: TrustService,
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
    const role = Role.PROFESSIONAL;
    const displayName =
      this.normalizeOptionalString(data.displayName) ??
      normalizedEmail.split('@')[0] ??
      'OpenStaff User';
    const companyName = this.normalizeOptionalString(data.companyName);
    const vatNumber = this.normalizeOptionalString(
      data.vatNumber,
    )?.toUpperCase();
    const countryCode = this.normalizeOptionalString(
      data.countryCode,
    )?.toUpperCase();
    const languageCode = this.normalizeOptionalString(
      data.languageCode,
    )?.toLowerCase();
    const timezone = this.normalizeOptionalString(data.timezone);
    const phone = this.normalizeOptionalString(data.phone);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role,
        approvalStatus: AccountApprovalStatus.APPROVED,
        accountStatus: AccountLifecycleStatus.LIVE,
        approvedAt: new Date(),
      },
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
      message:
        'Your OpenStaff account was created successfully. Choose an identity path to continue onboarding.',
      relatedEntityType: 'User',
      relatedEntityId: user.id,
      metadata: {
        email: normalizedEmail,
        role,
        displayName,
        companyName,
        vatNumber,
        countryCode,
        languageCode,
        timezone,
        phone,
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
        actorType: data.actorType ?? null,
        role,
        companyName,
        countryCode,
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
      include: {
        profile: true,
        twoFactorSettings: true,
      },
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

    const settings = await this.ensureTwoFactorSettings(user.id);
    if (this.requiresTwoFactorChallenge(settings)) {
      return this.issueLoginTwoFactorChallenge(user, settings, request);
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
    return this.trustService.requestPasswordReset(email, request);
  }

  async resetPassword(token: string, nextPassword: string, request?: any) {
    return this.trustService.resetPassword(token, nextPassword, request);
  }

  async requestAccountRecovery(
    email: string,
    reason?: 'GENERAL' | 'LOCKED' | 'COMPROMISED',
    note?: string,
    request?: any,
  ) {
    return this.trustService.requestAccountRecovery(
      email,
      reason,
      note,
      request,
    );
  }

  async completeAccountRecovery(
    token: string,
    nextPassword: string,
    request?: any,
  ) {
    return this.trustService.completeAccountRecovery(
      token,
      nextPassword,
      request,
    );
  }

  async getTwoFactorStatus(userId: string) {
    const settings = await this.ensureTwoFactorSettings(userId);

    return {
      enabled: settings.enabled,
      emailOtpEnabled: settings.emailOtpEnabled,
      adminEnforced: settings.adminEnforced,
      lockedUntil: settings.lockoutUntil?.toISOString() ?? null,
      lastChallengeVerifiedAt:
        settings.lastChallengeVerifiedAt?.toISOString() ?? null,
      lastRecoveryCodesRegeneratedAt:
        settings.lastRecoveryCodesRegeneratedAt?.toISOString() ?? null,
      recoveryCodesRemaining: this.countRemainingRecoveryCodes(
        settings.recoveryCodesJson,
      ),
      failedAttemptCount: settings.failedAttemptCount,
    };
  }

  async setupTwoFactor(userId: string, request?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorSettings: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.ensureTwoFactorSettings(user.id);
    const challenge = await this.createTwoFactorChallenge(
      user.id,
      settings.id,
      user.email,
      'SETUP',
      request,
    );

    await this.sendTwoFactorEmail(user.email, {
      eventType: 'TWO_FACTOR_SETUP_CONFIRMATION',
      sourceId: challenge.id,
      userId: user.id,
      subjectRo: 'Confirmare activare autentificare in doi pasi',
      subjectEn: 'Confirm your two-factor authentication setup',
      title: 'Two-factor authentication setup',
      message:
        'Use the short-lived one-time code from this message to enable two-factor authentication.',
      code: challenge.plainCode,
      expiresAt: challenge.expiresAt,
      metadata: {
        purpose: 'SETUP',
      },
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_SETUP',
      sourceId: challenge.id,
      message: 'Two-factor authentication setup challenge issued',
      request,
    });

    return {
      success: true,
      challengeId: challenge.id,
      deliveryChannel: 'EMAIL',
      maskedDestination: this.maskEmail(user.email),
      expiresInSeconds: this.getTwoFactorOtpTtlSeconds(),
    };
  }

  async verifyTwoFactorSetup(
    userId: string,
    challengeId: string,
    code: string,
    request?: any,
  ) {
    const settings = await this.ensureTwoFactorSettings(userId);
    await this.verifyTwoFactorOtp({
      userId,
      challengeId,
      code,
      expectedPurpose: 'SETUP',
      settings,
      request,
    });

    const recoveryCodes = this.generateRecoveryCodes();
    await this.prisma.userTwoFactorSettings.update({
      where: { userId },
      data: {
        enabled: true,
        emailOtpEnabled: true,
        setupVerifiedAt: new Date(),
        lastChallengeVerifiedAt: new Date(),
        failedAttemptCount: 0,
        lockoutUntil: null,
        recoveryCodesJson: this.toRecoveryCodesJson(recoveryCodes),
        lastRecoveryCodesRegeneratedAt: new Date(),
      },
    });

    await this.auditService.logSecurityEvent({
      userId,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_SETUP',
      sourceId: challengeId,
      message: 'Two-factor authentication enabled successfully',
      request,
    });

    return {
      success: true,
      message: 'Two-factor authentication is now enabled.',
      recoveryCodes,
    };
  }

  async disableTwoFactor(userId: string, password: string, request?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorSettings: true },
    });

    if (!user || !user.twoFactorSettings) {
      throw new NotFoundException('Two-factor settings not found');
    }

    if (user.twoFactorSettings.adminEnforced) {
      throw new ForbiddenException(
        'Two-factor authentication is required by an administrator',
      );
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password confirmation failed');
    }

    await this.prisma.$transaction([
      this.prisma.userTwoFactorChallenge.updateMany({
        where: {
          userId,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: {
          invalidatedAt: new Date(),
        },
      }),
      this.prisma.userTwoFactorSettings.update({
        where: { userId },
        data: {
          enabled: false,
          recoveryCodesJson: Prisma.JsonNull,
          lockoutUntil: null,
          failedAttemptCount: 0,
        },
      }),
    ]);

    await this.auditService.logSecurityEvent({
      userId,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_DISABLE',
      sourceId: userId,
      message: 'Two-factor authentication disabled by user',
      request,
    });

    return {
      success: true,
      message: 'Two-factor authentication was disabled.',
    };
  }

  async regenerateRecoveryCodes(userId: string, request?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorSettings: true },
    });

    if (!user || !user.twoFactorSettings?.enabled) {
      throw new ForbiddenException(
        'Two-factor authentication is not enabled for this account',
      );
    }

    const recoveryCodes = this.generateRecoveryCodes();
    await this.prisma.userTwoFactorSettings.update({
      where: { userId },
      data: {
        recoveryCodesJson: this.toRecoveryCodesJson(recoveryCodes),
        lastRecoveryCodesRegeneratedAt: new Date(),
      },
    });

    await this.sendTwoFactorEmail(user.email, {
      eventType: 'TWO_FACTOR_RECOVERY_CODES_REGENERATED',
      sourceId: userId,
      userId,
      subjectRo: 'Codurile de recuperare OpenStaff au fost regenerate',
      subjectEn: 'Your OpenStaff recovery codes were regenerated',
      title: 'Recovery codes regenerated',
      message:
        'Your previous recovery codes are no longer valid. Review the new set in your account security settings.',
      metadata: {
        purpose: 'RECOVERY_CODES_REGENERATION',
      },
    });

    await this.auditService.logSecurityEvent({
      userId,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_RECOVERY_CODES',
      sourceId: userId,
      message: 'Recovery codes regenerated',
      request,
    });

    return {
      success: true,
      message: 'New recovery codes were generated successfully.',
      recoveryCodes,
    };
  }

  async verifyTwoFactorChallenge(
    challengeId: string,
    code: string,
    request?: any,
  ) {
    const challenge = await this.prisma.userTwoFactorChallenge.findUnique({
      where: { id: challengeId },
      include: {
        settings: true,
        user: true,
      },
    });

    if (!challenge || !challenge.settings) {
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    if (challenge.purpose !== 'LOGIN') {
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    await this.verifyTwoFactorOtp({
      userId: challenge.userId,
      challengeId,
      code,
      expectedPurpose: 'LOGIN',
      settings: challenge.settings,
      request,
    });

    await this.prisma.user.update({
      where: { id: challenge.userId },
      data: {
        accountStatus: AccountLifecycleStatus.LIVE,
        lastLoginAt: new Date(),
      },
    });

    await this.auditService.logSecurityEvent({
      userId: challenge.userId,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_LOGIN',
      sourceId: challengeId,
      message: 'Two-factor login challenge completed successfully',
      request,
    });

    return this.buildAuthResponse(challenge.userId, request);
  }

  async resendTwoFactorChallenge(challengeId: string, request?: any) {
    const existing = await this.prisma.userTwoFactorChallenge.findUnique({
      where: { id: challengeId },
      include: {
        settings: true,
        user: true,
      },
    });

    if (!existing || !existing.settings || !existing.user) {
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    if (
      existing.consumedAt ||
      existing.invalidatedAt ||
      existing.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    if (existing.resendCount >= 3) {
      throw new ForbiddenException(
        'Two-factor resend limit reached. Start login again.',
      );
    }

    await this.prisma.userTwoFactorChallenge.update({
      where: { id: existing.id },
      data: {
        invalidatedAt: new Date(),
        resendCount: {
          increment: 1,
        },
      },
    });

    const nextChallenge = await this.createTwoFactorChallenge(
      existing.userId,
      existing.settings.id,
      existing.user.email,
      'LOGIN',
      request,
    );

    await this.sendTwoFactorEmail(existing.user.email, {
      eventType: 'TWO_FACTOR_LOGIN_OTP_SENT',
      sourceId: nextChallenge.id,
      userId: existing.userId,
      subjectRo: 'Cod de autentificare OpenStaff',
      subjectEn: 'Your OpenStaff login code',
      title: 'Two-factor login code',
      message: 'Use this short-lived code to complete your login.',
      code: nextChallenge.plainCode,
      expiresAt: nextChallenge.expiresAt,
      metadata: {
        purpose: 'LOGIN',
      },
    });

    return {
      success: true,
      challengeId: nextChallenge.id,
      deliveryChannel: 'EMAIL',
      maskedDestination: this.maskEmail(existing.user.email),
      expiresInSeconds: this.getTwoFactorOtpTtlSeconds(),
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
      throw new UnauthorizedException(
        'Firebase account does not provide an email',
      );
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: decoded.uid }, { email: normalizedEmail }],
      },
      select: { id: true },
    });

    if (!user) {
      const generatedPassword = await bcrypt.hash(
        `firebase-${decoded.uid}-${Date.now()}`,
        10,
      );

      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          firebaseUid: decoded.uid,
          password: generatedPassword,
          role: claimedRole ?? Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
          approvedAt: new Date(),
        },
        select: { id: true },
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

  private async buildUserSummary(
    userId: string,
  ): Promise<AuthenticatedUserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        identityProfile: true,
        identityCompanyProfiles: {
          orderBy: { createdAt: 'asc' },
        },
        onboardingSession: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayName =
      user.profile?.displayName?.trim() ||
      user.identityProfile?.displayName?.trim() ||
      user.email.split('@')[0] ||
      'OpenStaff User';
    const completedSteps = this.parseCompletedSteps(
      user.onboardingSession?.completedSteps,
    );
    const hasCompanyProfile = user.identityCompanyProfiles.length > 0;
    const selectedIdentityType = this.resolveSelectedIdentityType(
      completedSteps,
      Boolean(user.identityProfile),
      hasCompanyProfile,
    );
    const actorType = hasCompanyProfile
      ? ActorType.COMPANY
      : this.mapProfileTypeToActorType(user.profile?.profileType);
    const onboardingDone =
      user.onboardingSession?.status === 'COMPLETED' ||
      Boolean(user.identityProfile?.onboardingCompletedAt);
    const subscription = await this.buildCurrentSubscriptionSummary(user.id);

    return {
      id: user.id,
      email: user.email,
      displayName,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      actorType,
      onboardingStep: this.resolveOnboardingStep(
        user.onboardingSession?.currentStep,
        onboardingDone,
      ),
      onboardingDone,
      onboardingCurrentStep: user.onboardingSession?.currentStep ?? null,
      onboardingCompletedSteps: completedSteps,
      identityState: {
        hasProfessionalIdentity: Boolean(user.identityProfile),
        hasCompanyIdentity: hasCompanyProfile,
        selectedIdentityType,
        identityProfileStatus: user.identityProfile?.verificationStatus ?? null,
        companyProfileStatus:
          user.identityCompanyProfiles[0]?.verificationStatus ?? null,
      },
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
    entitlements: Array<{
      featureKey: string;
      enabled: boolean;
      limitInt: number | null;
    }>,
  ) {
    const features: Record<string, boolean> = {};
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

  private async ensureTwoFactorSettings(userId: string) {
    return this.prisma.userTwoFactorSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        enabled: false,
        emailOtpEnabled: true,
        adminEnforced: false,
      },
    });
  }

  private requiresTwoFactorChallenge(settings: {
    enabled: boolean;
    adminEnforced: boolean;
    lockoutUntil: Date | null;
  }) {
    if (settings.lockoutUntil && settings.lockoutUntil.getTime() > Date.now()) {
      throw new ForbiddenException(
        'Two-factor authentication is temporarily locked. Please try again later.',
      );
    }

    return settings.enabled || settings.adminEnforced;
  }

  private async issueLoginTwoFactorChallenge(
    user: {
      id: string;
      email: string;
      twoFactorSettings?: {
        id: string;
        enabled: boolean;
        adminEnforced: boolean;
      } | null;
    },
    settings: {
      id: string;
      enabled: boolean;
      adminEnforced: boolean;
    },
    request?: any,
  ): Promise<TwoFactorChallengeResponse> {
    const challenge = await this.createTwoFactorChallenge(
      user.id,
      settings.id,
      user.email,
      'LOGIN',
      request,
    );

    const isSuspicious = await this.isSuspiciousLoginAttempt(user.id, request);
    if (isSuspicious) {
      const securityEvent = await this.auditService.logSecurityEvent({
        userId: user.id,
        type: 'SUSPICIOUS_ACTIVITY',
        category: 'AUTH',
        sourceType: 'TWO_FACTOR_LOGIN',
        sourceId: challenge.id,
        message: 'Suspicious login attempt requires two-factor confirmation',
        severity: 'WARNING',
        request,
      });

      await this.trustService.requestSuspiciousLoginConfirmation(
        user.id,
        securityEvent.id,
        request,
      );
    }

    await this.sendTwoFactorEmail(user.email, {
      eventType: 'TWO_FACTOR_LOGIN_OTP_SENT',
      sourceId: challenge.id,
      userId: user.id,
      subjectRo: 'Cod de autentificare OpenStaff',
      subjectEn: 'Your OpenStaff login code',
      title: 'Two-factor login code',
      message:
        'Use this short-lived one-time code to complete your OpenStaff login.',
      code: challenge.plainCode,
      expiresAt: challenge.expiresAt,
      metadata: {
        purpose: 'LOGIN',
        suspiciousLogin: isSuspicious,
      },
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_LOGIN',
      sourceId: challenge.id,
      message: 'Two-factor login challenge issued',
      metadata: {
        suspiciousLogin: isSuspicious,
      },
      request,
    });

    return {
      challengeRequired: true,
      challengeId: challenge.id,
      purpose: 'LOGIN',
      deliveryChannel: 'EMAIL',
      maskedDestination: this.maskEmail(user.email),
      expiresInSeconds: this.getTwoFactorOtpTtlSeconds(),
    };
  }

  private async createTwoFactorChallenge(
    userId: string,
    settingsId: string,
    email: string,
    purpose: TwoFactorChallengePurpose,
    request?: any,
  ) {
    const code = this.generateOtpCode();
    const codeHash = this.hashTwoFactorCode(code);
    const expiresAt = new Date(
      Date.now() + this.getTwoFactorOtpTtlSeconds() * 1000,
    );

    await this.prisma.userTwoFactorChallenge.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
        invalidatedAt: null,
      },
      data: {
        invalidatedAt: new Date(),
      },
    });

    const challenge = await this.prisma.userTwoFactorChallenge.create({
      data: {
        userId,
        settingsId,
        purpose,
        codeHash,
        emailAddress: email,
        expiresAt,
        maxAttempts: this.getTwoFactorMaxAttempts(),
        metadata: {
          ttlSeconds: this.getTwoFactorOtpTtlSeconds(),
        },
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      targetUserId: userId,
      entityType: 'TWO_FACTOR_CHALLENGE',
      entityId: challenge.id,
      action: `ISSUED_${purpose}`,
      category: 'AUTH',
      metadata: {
        purpose,
        expiresAt: expiresAt.toISOString(),
      },
      request,
    });

    return {
      id: challenge.id,
      expiresAt,
      plainCode: code,
    };
  }

  private async verifyTwoFactorOtp(input: {
    userId: string;
    challengeId: string;
    code: string;
    expectedPurpose: TwoFactorChallengePurpose;
    settings: {
      id: string;
      userId: string;
      failedAttemptCount: number;
      lockoutUntil: Date | null;
      recoveryCodesJson: Prisma.JsonValue | null;
    };
    request?: any;
  }) {
    const challenge = await this.prisma.userTwoFactorChallenge.findUnique({
      where: { id: input.challengeId },
    });

    if (
      !challenge ||
      challenge.userId !== input.userId ||
      challenge.purpose !== input.expectedPurpose
    ) {
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    if (
      input.settings.lockoutUntil &&
      input.settings.lockoutUntil.getTime() > Date.now()
    ) {
      throw new ForbiddenException(
        'Two-factor authentication is temporarily locked. Please try again later.',
      );
    }

    if (
      challenge.invalidatedAt ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() < Date.now()
    ) {
      await this.auditService.logSecurityEvent({
        userId: input.userId,
        type: 'MFA_EVENT',
        category: 'AUTH',
        sourceType: 'TWO_FACTOR_VERIFY',
        sourceId: input.challengeId,
        message:
          'Two-factor challenge verification failed because the code was expired or already used',
        severity: 'WARNING',
        request: input.request,
      });
      throw new UnauthorizedException(
        'This two-factor challenge is invalid or has expired',
      );
    }

    const codeNormalized = input.code.trim().replace(/\s+/g, '').toUpperCase();
    const otpMatches =
      this.hashTwoFactorCode(codeNormalized) === challenge.codeHash;

    if (otpMatches) {
      await this.prisma.$transaction([
        this.prisma.userTwoFactorChallenge.update({
          where: { id: challenge.id },
          data: {
            consumedAt: new Date(),
          },
        }),
        this.prisma.userTwoFactorSettings.update({
          where: { userId: input.userId },
          data: {
            failedAttemptCount: 0,
            lockoutUntil: null,
            lastChallengeVerifiedAt: new Date(),
          },
        }),
      ]);
      return;
    }

    const recoveryCodeConsumed = await this.tryConsumeRecoveryCode(
      input.userId,
      input.settings.recoveryCodesJson,
      codeNormalized,
    );

    if (recoveryCodeConsumed) {
      await this.prisma.$transaction([
        this.prisma.userTwoFactorChallenge.update({
          where: { id: challenge.id },
          data: {
            consumedAt: new Date(),
          },
        }),
        this.prisma.userTwoFactorSettings.update({
          where: { userId: input.userId },
          data: {
            failedAttemptCount: 0,
            lockoutUntil: null,
            lastChallengeVerifiedAt: new Date(),
            lastRecoveryCodeUsedAt: new Date(),
          },
        }),
      ]);
      return;
    }

    const nextAttemptCount = challenge.attemptCount + 1;
    const nextFailedAttemptCount = input.settings.failedAttemptCount + 1;
    const maxAttempts = challenge.maxAttempts || this.getTwoFactorMaxAttempts();
    const shouldLock =
      nextAttemptCount >= maxAttempts ||
      nextFailedAttemptCount >= this.getTwoFactorMaxAttempts();
    const lockoutUntil = shouldLock
      ? new Date(Date.now() + this.getTwoFactorLockoutMinutes() * 60_000)
      : null;

    await this.prisma.$transaction([
      this.prisma.userTwoFactorChallenge.update({
        where: { id: challenge.id },
        data: {
          attemptCount: {
            increment: 1,
          },
          ...(shouldLock ? { invalidatedAt: new Date() } : {}),
        },
      }),
      this.prisma.userTwoFactorSettings.update({
        where: { userId: input.userId },
        data: {
          failedAttemptCount: {
            increment: 1,
          },
          ...(shouldLock ? { lockoutUntil } : {}),
        },
      }),
    ]);

    await this.auditService.logSecurityEvent({
      userId: input.userId,
      type: shouldLock ? 'RATE_LIMIT_TRIGGERED' : 'MFA_EVENT',
      category: 'AUTH',
      sourceType: 'TWO_FACTOR_VERIFY',
      sourceId: input.challengeId,
      message: shouldLock
        ? 'Two-factor verification lockout triggered after repeated failures'
        : 'Two-factor verification failed because code did not match',
      severity: shouldLock ? 'CRITICAL' : 'WARNING',
      metadata: {
        attemptCount: nextAttemptCount,
        failedAttemptCount: nextFailedAttemptCount,
        lockoutUntil: lockoutUntil?.toISOString() ?? null,
      },
      request: input.request,
    });

    if (shouldLock) {
      throw new ForbiddenException(
        'Too many invalid two-factor attempts. Please try again later.',
      );
    }

    throw new UnauthorizedException('Invalid two-factor code');
  }

  private async tryConsumeRecoveryCode(
    userId: string,
    recoveryCodesJson: Prisma.JsonValue | null,
    code: string,
  ) {
    const recoveryCodes = this.parseRecoveryCodes(recoveryCodesJson);
    const codeHash = this.hashTwoFactorCode(code);
    const index = recoveryCodes.findIndex(
      (item) => item.codeHash === codeHash && !item.usedAt,
    );

    if (index < 0) {
      return false;
    }

    recoveryCodes[index] = {
      ...recoveryCodes[index],
      usedAt: new Date().toISOString(),
    };

    await this.prisma.userTwoFactorSettings.update({
      where: { userId },
      data: {
        recoveryCodesJson: recoveryCodes as Prisma.InputJsonValue,
      },
    });

    return true;
  }

  private parseRecoveryCodes(value: Prisma.JsonValue | null) {
    if (!Array.isArray(value)) {
      return [] as Array<{
        label: string;
        codeHash: string;
        usedAt: string | null;
      }>;
    }

    return value
      .filter(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item) => {
        const candidate = item as Record<string, unknown>;
        return {
          label:
            typeof candidate.label === 'string'
              ? candidate.label
              : 'Recovery code',
          codeHash:
            typeof candidate.codeHash === 'string' ? candidate.codeHash : '',
          usedAt:
            typeof candidate.usedAt === 'string' ? candidate.usedAt : null,
        };
      })
      .filter((item) => Boolean(item.codeHash));
  }

  private toRecoveryCodesJson(codes: string[]) {
    return codes.map((code, index) => ({
      label: `RC-${index + 1}`,
      codeHash: this.hashTwoFactorCode(code),
      usedAt: null,
    })) as Prisma.InputJsonValue;
  }

  private countRemainingRecoveryCodes(value: Prisma.JsonValue | null) {
    return this.parseRecoveryCodes(value).filter((item) => !item.usedAt).length;
  }

  private generateRecoveryCodes() {
    return Array.from(
      { length: 8 },
      () =>
        `${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`,
    );
  }

  private generateOtpCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashTwoFactorCode(code: string) {
    return createHash('sha256')
      .update(
        `${this.getTwoFactorPepper()}::${code.trim().replace(/\s+/g, '').toUpperCase()}`,
      )
      .digest('hex');
  }

  private async sendTwoFactorEmail(
    email: string,
    input: {
      eventType: string;
      sourceId: string;
      userId: string;
      subjectRo: string;
      subjectEn: string;
      title: string;
      message: string;
      code?: string;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    },
  ) {
    const expiresLabel = input.expiresAt?.toISOString() ?? null;
    const emailText = input.code
      ? [
          `${input.title}`,
          '',
          `Romanian: Foloseste codul ${input.code} pentru a continua. Codul expira la ${expiresLabel}.`,
          `English: Use code ${input.code} to continue. This code expires at ${expiresLabel}.`,
        ].join('\n')
      : [
          `${input.title}`,
          '',
          'Romanian: Acesta este un mesaj operational OpenStaff legat de securitatea contului tau.',
          'English: This is an OpenStaff operational security message for your account.',
        ].join('\n');
    const emailHtml = input.code
      ? `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <h1 style="font-size:22px;margin-bottom:16px">${input.title}</h1>
          <p><strong>RO:</strong> Foloseste codul <span style="font-size:22px;letter-spacing:4px">${input.code}</span> pentru a continua.</p>
          <p><strong>EN:</strong> Use code <span style="font-size:22px;letter-spacing:4px">${input.code}</span> to continue.</p>
          ${expiresLabel ? `<p>Expires / Expira: <strong>${expiresLabel}</strong></p>` : ''}
        </div>
      `.trim()
      : `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <h1 style="font-size:22px;margin-bottom:16px">${input.title}</h1>
          <p>RO: Acesta este un mesaj operational OpenStaff legat de securitatea contului tau.</p>
          <p>EN: This is an OpenStaff operational security message for your account.</p>
        </div>
      `.trim();

    await this.notificationService.emitEvent({
      key: `2fa-email:${input.eventType}:${input.sourceId}`,
      eventType: input.eventType,
      sourceType: 'TWO_FACTOR',
      sourceId: input.sourceId,
      userId: input.userId,
      category: NotificationCategory.ACCOUNT,
      channel: NotificationChannel.EMAIL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      title: input.title,
      message: input.message,
      relatedEntityType: 'UserTwoFactorChallenge',
      relatedEntityId: input.sourceId,
      metadata: {
        ...(input.metadata ?? {}),
        email,
        emailSubject: `${input.subjectRo} / ${input.subjectEn}`,
        emailText,
        emailHtml,
      },
    });
  }

  private async isSuspiciousLoginAttempt(userId: string, request?: any) {
    const context = this.auditService.extractRequestContext(request);
    const fingerprintHash = createHash('sha256')
      .update(
        `${context.userAgent ?? 'unknown'}|${context.ipAddress ?? 'unknown'}`,
      )
      .digest('hex');

    const known = await this.prisma.userDeviceFingerprint.findUnique({
      where: {
        userId_fingerprintHash: {
          userId,
          fingerprintHash,
        },
      },
      select: { id: true },
    });

    return !known;
  }

  private maskEmail(value: string) {
    const [localPart, domain] = value.split('@');
    if (!domain) {
      return 'hidden';
    }
    const first = localPart?.slice(0, 1) ?? '*';
    const tail = localPart && localPart.length > 1 ? localPart.slice(-1) : '*';
    return `${first}***${tail}@${domain}`;
  }

  private getTwoFactorOtpTtlSeconds() {
    return Number(process.env.TWO_FACTOR_OTP_TTL_SECONDS ?? 600);
  }

  private getTwoFactorMaxAttempts() {
    return Number(process.env.TWO_FACTOR_MAX_ATTEMPTS ?? 5);
  }

  private getTwoFactorLockoutMinutes() {
    return Number(process.env.TWO_FACTOR_LOCKOUT_MINUTES ?? 15);
  }

  private getTwoFactorPepper() {
    return (
      process.env.TWO_FACTOR_PEPPER?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      'openstaff-two-factor-dev-pepper'
    );
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

  private buildPasswordResetRequestResponse() {
    return {
      success: true,
      message:
        'If an account matches that email, OpenStaff will try to deliver a secure reset link shortly. Please also check Spam or Junk.',
      expiresInMinutes: AuthService.PASSWORD_RESET_EXPIRY_MINUTES,
    };
  }

  private getPasswordResetEligibility(
    user: {
      id: string;
      email: string;
      password: string;
      firebaseUid: string | null;
      approvalStatus: AccountApprovalStatus;
      accountStatus: AccountLifecycleStatus;
    } | null,
  ): PasswordResetEligibilityStatus {
    if (!user) {
      return 'not_found';
    }

    if (!user.email?.trim()) {
      return 'missing_email';
    }

    if (
      user.accountStatus === AccountLifecycleStatus.SUSPENDED ||
      user.approvalStatus === AccountApprovalStatus.REJECTED
    ) {
      return 'disabled';
    }

    const hasPassword = Boolean(user.password?.trim());
    if (user.firebaseUid && !hasPassword) {
      return 'external_auth_only';
    }

    if (hasPassword) {
      return 'eligible_password_reset';
    }

    return 'unknown_auth_state';
  }

  private maskEmailForLogs(value: string) {
    const [localPart, domain] = value.split('@');
    if (!domain) {
      return 'invalid-email';
    }

    const first = localPart?.slice(0, 1) ?? '*';
    return `${first}***@${domain}`;
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetEmailSubject(locale?: string | null) {
    return String(locale ?? '')
      .toLowerCase()
      .startsWith('ro')
      ? 'Resetare parola OpenStaff'
      : 'Reset your OpenStaff password';
  }

  private buildPasswordResetEmailText(input: {
    locale?: string | null;
    resetUrl: string;
    expiresAt: Date;
  }) {
    const expiresLabel = input.expiresAt.toISOString();
    if (
      String(input.locale ?? '')
        .toLowerCase()
        .startsWith('ro')
    ) {
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
    if (
      String(input.locale ?? '')
        .toLowerCase()
        .startsWith('ro')
    ) {
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

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
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

  private parseCompletedSteps(value: unknown) {
    if (!Array.isArray(value)) {
      return [] as string[];
    }

    return value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );
  }

  private resolveSelectedIdentityType(
    completedSteps: string[],
    hasProfessionalIdentity: boolean,
    hasCompanyIdentity: boolean,
  ): 'PROFESSIONAL' | 'COMPANY' | 'BOTH' | null {
    if (completedSteps.includes('identity-type:both')) {
      return 'BOTH';
    }

    if (completedSteps.includes('identity-type:company')) {
      return 'COMPANY';
    }

    if (completedSteps.includes('identity-type:professional')) {
      return 'PROFESSIONAL';
    }

    if (hasProfessionalIdentity && hasCompanyIdentity) {
      return 'BOTH';
    }

    if (hasCompanyIdentity) {
      return 'COMPANY';
    }

    return null;
  }

  private resolveOnboardingStep(currentStep?: string | null, done?: boolean) {
    if (done) {
      return 5;
    }

    switch (currentStep) {
      case 'identity-type':
        return 1;
      case 'identity':
        return 2;
      case 'company':
        return 3;
      case 'completion':
        return 4;
      default:
        return 0;
    }
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
