import {
  AccountApprovalStatus,
  AccountLifecycleStatus,
  NotificationCategory,
  NotificationChannel,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  Prisma,
  VerificationCaseStatus,
} from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminTrustActionDto } from './dto/admin-trust-action.dto';

type TrustTokenPurpose =
  | 'PASSWORD_RESET'
  | 'ACCOUNT_RECOVERY'
  | 'EMAIL_OWNERSHIP'
  | 'SUSPICIOUS_LOGIN_CONFIRMATION';

type TrustEmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

type TrustTokenRecord = {
  id: string;
  userId: string | null;
  email: string | null;
  expiresAt: string;
  consumedAt: string | null;
  link: string;
  purpose: TrustTokenPurpose;
  metadata: Record<string, unknown>;
};

@Injectable()
export class TrustService {
  private static readonly PURPOSE_EVENT_TYPE = 'TRUST_TOKEN_ISSUED';

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async requestPasswordReset(email: string, request?: any) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        identityProfile: true,
      },
    });

    if (!user) {
      await this.auditService.logSecurityEvent({
        type: 'PASSWORD_RESET',
        category: 'AUTH',
        sourceType: 'TRUST',
        sourceId: normalizedEmail,
        message: 'Password reset requested for unknown email',
        severity: 'WARNING',
        request,
      });
      return this.buildRequestAcceptedResponse();
    }

    const trustToken = await this.issueTrustToken({
      userId: user.id,
      email: user.email,
      purpose: 'PASSWORD_RESET',
      expiresInMinutes: 30,
      linkPath: '/reset-password',
      metadata: {
        locale: user.identityProfile?.language ?? 'ro',
      },
    });

    const template = this.buildPasswordResetTemplate(
      trustToken.link,
      trustToken.expiresAt,
    );
    await this.dispatchTrustEmail({
      userId: user.id,
      email: user.email,
      eventType: 'PASSWORD_RESET_AVAILABLE',
      title: 'Password reset requested',
      message:
        'A password reset was requested for your account. Use the secure link from this message to choose a new password.',
      relatedEntityId: trustToken.id,
      purpose: trustToken.purpose,
      template,
      metadata: trustToken.metadata,
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'PASSWORD_RESET',
      category: 'AUTH',
      sourceType: trustToken.purpose,
      sourceId: trustToken.id,
      message: 'Password reset token issued',
      metadata: {
        expiresAt: trustToken.expiresAt,
      },
      request,
    });

    return this.buildRequestAcceptedResponse();
  }

  async resetPassword(token: string, nextPassword: string, request?: any) {
    const trustToken = await this.consumeTrustToken('PASSWORD_RESET', token);
    if (!trustToken.userId) {
      throw new UnauthorizedException(
        'This password reset link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(nextPassword, 10);
    await this.prisma.user.update({
      where: { id: trustToken.userId },
      data: {
        password: passwordHash,
        refreshTokenHash: null,
      },
    });

    await this.auditService.revokeAllSessionsForUser(trustToken.userId);
    await this.auditService.logSecurityEvent({
      userId: trustToken.userId,
      type: 'PASSWORD_RESET',
      category: 'AUTH',
      sourceType: trustToken.purpose,
      sourceId: trustToken.id,
      message: 'Password reset completed',
      request,
    });

    return {
      success: true,
      message: 'Your password was updated successfully. Please sign in again.',
    };
  }

  async requestAccountRecovery(
    email: string,
    reason: 'GENERAL' | 'LOCKED' | 'COMPROMISED' = 'GENERAL',
    note?: string,
    request?: any,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { identityProfile: true },
    });

    if (!user) {
      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        category: 'AUTH',
        sourceType: 'ACCOUNT_RECOVERY',
        sourceId: normalizedEmail,
        message: 'Account recovery requested for unknown email',
        severity: 'WARNING',
        request,
      });
      return this.buildRequestAcceptedResponse();
    }

    const securityEvent = await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'SUSPICIOUS_ACTIVITY',
      category: 'AUTH',
      sourceType: 'ACCOUNT_RECOVERY',
      sourceId: user.id,
      message: `Account recovery requested (${reason})`,
      severity: reason === 'COMPROMISED' ? 'CRITICAL' : 'WARNING',
      metadata: {
        reason,
        note: note?.trim() || null,
      },
      request,
    });

    const trustToken = await this.issueTrustToken({
      userId: user.id,
      email: user.email,
      purpose: 'ACCOUNT_RECOVERY',
      expiresInMinutes: 45,
      linkPath: '/reset-password',
      linkParams: { mode: 'recovery' },
      metadata: {
        reason,
        note: note?.trim() || null,
        securityEventId: securityEvent.id,
        locale: user.identityProfile?.language ?? 'ro',
      },
    });

    const template = this.buildAccountRecoveryTemplate(
      trustToken.link,
      trustToken.expiresAt,
      reason,
    );
    await this.dispatchTrustEmail({
      userId: user.id,
      email: user.email,
      eventType: 'ACCOUNT_RECOVERY_REQUESTED',
      title: 'Account recovery requested',
      message:
        'We received an OpenStaff account recovery request. Use the secure recovery link if this was you.',
      relatedEntityId: trustToken.id,
      purpose: trustToken.purpose,
      template,
      metadata: trustToken.metadata,
    });

    return this.buildRequestAcceptedResponse(45);
  }

  async completeAccountRecovery(
    token: string,
    nextPassword: string,
    request?: any,
  ) {
    const trustToken = await this.consumeTrustToken('ACCOUNT_RECOVERY', token);
    if (!trustToken.userId) {
      throw new UnauthorizedException(
        'This recovery link is invalid or has expired',
      );
    }

    const passwordHash = await bcrypt.hash(nextPassword, 10);
    await this.prisma.user.update({
      where: { id: trustToken.userId },
      data: {
        password: passwordHash,
        refreshTokenHash: null,
        accountStatus: AccountLifecycleStatus.OFFLINE,
      },
    });

    await this.auditService.revokeAllSessionsForUser(trustToken.userId);

    const securityEventId =
      typeof trustToken.metadata.securityEventId === 'string'
        ? trustToken.metadata.securityEventId
        : null;
    if (securityEventId) {
      await this.prisma.securityEvent.updateMany({
        where: { id: securityEventId },
        data: {
          status: 'RESOLVED',
        },
      });
    }

    await this.auditService.logSecurityEvent({
      userId: trustToken.userId,
      type: 'SUSPICIOUS_ACTIVITY',
      category: 'AUTH',
      sourceType: trustToken.purpose,
      sourceId: trustToken.id,
      message: 'Account recovery completed and active sessions were revoked',
      severity: 'WARNING',
      request,
    });

    return {
      success: true,
      message:
        'Account recovery is complete. Your password was updated and active sessions were revoked.',
    };
  }

  async requestEmailOwnershipVerification(userId: string, request?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { identityProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trustToken = await this.issueTrustToken({
      userId: user.id,
      email: user.email,
      purpose: 'EMAIL_OWNERSHIP',
      expiresInMinutes: 60,
      linkPath: '/trust-action',
      linkParams: { flow: 'email-ownership' },
      metadata: {
        locale: user.identityProfile?.language ?? 'ro',
      },
    });

    const template = this.buildEmailOwnershipTemplate(
      trustToken.link,
      trustToken.expiresAt,
    );
    await this.dispatchTrustEmail({
      userId: user.id,
      email: user.email,
      eventType: 'EMAIL_OWNERSHIP_VERIFICATION_REQUESTED',
      title: 'Email ownership verification requested',
      message:
        'Confirm this email address to strengthen your OpenStaff trust status.',
      relatedEntityId: trustToken.id,
      purpose: trustToken.purpose,
      template,
      metadata: trustToken.metadata,
    });

    await this.auditService.log({
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'TRUST_TOKEN',
      entityId: trustToken.id,
      action: 'EMAIL_OWNERSHIP_REQUESTED',
      category: 'TRUST',
      metadata: {
        expiresAt: trustToken.expiresAt,
      },
      request,
    });

    return {
      success: true,
      message: 'A verification email was sent from no-reply@openstaff.eu.',
      expiresInMinutes: 60,
    };
  }

  async confirmEmailOwnership(token: string, request?: any) {
    const trustToken = await this.consumeTrustToken('EMAIL_OWNERSHIP', token);

    await this.auditService.log({
      actorUserId: trustToken.userId,
      targetUserId: trustToken.userId,
      entityType: 'TRUST_TOKEN',
      entityId: trustToken.id,
      action: 'EMAIL_OWNERSHIP_CONFIRMED',
      category: 'TRUST',
      metadata: {
        email: trustToken.email,
      },
      request,
    });

    return {
      success: true,
      message: 'Email ownership confirmed successfully.',
    };
  }

  async confirmSuspiciousLogin(token: string, request?: any) {
    const trustToken = await this.consumeTrustToken(
      'SUSPICIOUS_LOGIN_CONFIRMATION',
      token,
    );
    const securityEventId =
      typeof trustToken.metadata.securityEventId === 'string'
        ? trustToken.metadata.securityEventId
        : null;

    if (securityEventId) {
      await this.prisma.securityEvent.updateMany({
        where: { id: securityEventId },
        data: {
          status: 'RESOLVED',
        },
      });
    }

    await this.auditService.logSecurityEvent({
      userId: trustToken.userId,
      type: 'SUSPICIOUS_ACTIVITY',
      category: 'AUTH',
      sourceType: trustToken.purpose,
      sourceId: trustToken.id,
      message: 'Suspicious login/device confirmation completed by email link',
      request,
    });

    return {
      success: true,
      message: 'Suspicious login confirmation recorded successfully.',
    };
  }

  async requestSuspiciousLoginConfirmation(
    userId: string,
    securityEventId?: string | null,
    request?: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { identityProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const trustToken = await this.issueTrustToken({
      userId: user.id,
      email: user.email,
      purpose: 'SUSPICIOUS_LOGIN_CONFIRMATION',
      expiresInMinutes: 20,
      linkPath: '/trust-action',
      linkParams: { flow: 'suspicious-login' },
      metadata: {
        locale: user.identityProfile?.language ?? 'ro',
        securityEventId: securityEventId ?? null,
      },
    });

    const actionUrl = trustToken.link;
    const template = this.buildGenericTrustTemplate(
      'Suspicious login confirmation requested',
      'We detected a sign-in attempt that needs confirmation. If this was you, confirm the device from this secure link.',
      actionUrl,
      null,
    );

    await this.dispatchTrustEmail({
      userId: user.id,
      email: user.email,
      eventType: 'SUSPICIOUS_LOGIN_DETECTED',
      title: 'Suspicious login detected',
      message:
        'A suspicious login/device confirmation request was issued for your account.',
      relatedEntityId: trustToken.id,
      purpose: trustToken.purpose,
      template,
      metadata: trustToken.metadata,
    });

    await this.auditService.logSecurityEvent({
      userId: user.id,
      type: 'SUSPICIOUS_ACTIVITY',
      category: 'AUTH',
      sourceType: trustToken.purpose,
      sourceId: trustToken.id,
      message: 'Suspicious login confirmation email issued',
      severity: 'WARNING',
      metadata: {
        securityEventId: securityEventId ?? null,
        expiresAt: trustToken.expiresAt,
      },
      request,
    });

    return {
      success: true,
      expiresInMinutes: 20,
    };
  }

  async performAdminTrustAction(
    userId: string,
    actorUserId: string,
    input: AdminTrustActionDto,
    request?: any,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        twoFactorSettings: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const note = input.note?.trim() || null;
    const before = this.toAdminUserState(existing);
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      let nextUserData: Prisma.UserUpdateInput = {};
      let nextProfileData: Prisma.ProfileUpdateInput | null = null;

      switch (input.action) {
        case 'APPROVE_ACCOUNT':
          nextUserData = {
            approvalStatus: AccountApprovalStatus.APPROVED,
            approvedAt: now,
            accountStatus:
              existing.accountStatus === AccountLifecycleStatus.SUSPENDED
                ? AccountLifecycleStatus.OFFLINE
                : AccountLifecycleStatus.LIVE,
            suspendedAt: null,
          };
          break;
        case 'REJECT_ACCOUNT':
          nextUserData = {
            approvalStatus: AccountApprovalStatus.REJECTED,
            accountStatus: AccountLifecycleStatus.SUSPENDED,
            suspendedAt: now,
          };
          break;
        case 'REQUEST_MORE_INFO':
          nextUserData = {
            approvalStatus: AccountApprovalStatus.PENDING,
          };
          if (existing.profile) {
            nextProfileData = {
              moderationStatus: ProfileModerationStatus.CHANGES_REQUESTED,
              status: ProfileLifecycleStatus.OFFLINE,
            };
          }
          break;
        case 'APPROVE_PROFILE':
          if (!existing.profile) {
            throw new NotFoundException('Profile not found');
          }
          nextProfileData = {
            moderationStatus: ProfileModerationStatus.APPROVED,
            status: ProfileLifecycleStatus.LIVE,
            approvedAt: now,
          };
          break;
        case 'REJECT_PROFILE':
          if (!existing.profile) {
            throw new NotFoundException('Profile not found');
          }
          nextProfileData = {
            moderationStatus: ProfileModerationStatus.REJECTED,
            status: ProfileLifecycleStatus.OFFLINE,
          };
          break;
        case 'SUSPEND_PROFILE':
          if (!existing.profile) {
            throw new NotFoundException('Profile not found');
          }
          nextProfileData = {
            status: ProfileLifecycleStatus.SUSPENDED,
          };
          break;
        case 'REACTIVATE_PROFILE':
          if (!existing.profile) {
            throw new NotFoundException('Profile not found');
          }
          nextProfileData = {
            status:
              existing.profile.moderationStatus ===
              ProfileModerationStatus.APPROVED
                ? ProfileLifecycleStatus.LIVE
                : ProfileLifecycleStatus.OFFLINE,
          };
          break;
        case 'ESCALATE_REVIEW':
          break;
        case 'REQUIRE_2FA':
          await tx.userTwoFactorSettings.upsert({
            where: { userId },
            update: {
              adminEnforced: true,
              emailOtpEnabled: true,
            },
            create: {
              userId,
              adminEnforced: true,
              emailOtpEnabled: true,
            },
          });
          break;
        case 'CLEAR_2FA_LOCK':
          await tx.userTwoFactorSettings.upsert({
            where: { userId },
            update: {
              failedAttemptCount: 0,
              lockoutUntil: null,
            },
            create: {
              userId,
              failedAttemptCount: 0,
              lockoutUntil: null,
            },
          });
          break;
        default:
          break;
      }

      if (Object.keys(nextUserData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: nextUserData,
        });
      }

      if (nextProfileData && existing.profile) {
        await tx.profile.update({
          where: { id: existing.profile.id },
          data: nextProfileData,
        });
      }

      if (input.action === 'ESCALATE_REVIEW') {
        await tx.securityEvent.create({
          data: {
            userId: existing.id,
            reviewedByUserId: actorUserId,
            type: 'SUSPICIOUS_ACTIVITY',
            status: 'PENDING',
            severity: 'WARNING',
            category: 'TRUST',
            sourceType: 'TRUST_ESCALATION',
            sourceId: existing.id,
            message: 'Account/profile escalation was requested by moderation.',
            metadata: {
              note,
            },
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          profile: true,
          twoFactorSettings: true,
        },
      });
    });

    const after = this.toAdminUserState(updated);
    await this.auditService.log({
      actorUserId,
      targetUserId: userId,
      entityType: 'TRUST_WORKFLOW',
      entityId: existing.profile?.id ?? userId,
      action: input.action,
      category: 'TRUST',
      before,
      after,
      metadata: {
        note,
      },
      request,
    });

    await this.auditService.logSecurityEvent({
      userId,
      reviewedByUserId: actorUserId,
      type: 'ADMIN_OVERRIDE',
      category: 'TRUST',
      sourceType: 'TRUST_ACTION',
      sourceId: input.action,
      message: `Admin trust action executed: ${input.action}`,
      metadata: {
        note,
      },
      request,
    });

    await this.emitAdminTrustNotifications(updated, input.action, note);

    return this.getAdminTrustSummary(userId);
  }

  async getAdminTrustSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        twoFactorSettings: true,
        identityProfile: true,
        identityCompanyProfiles: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileId = user.profile?.id ?? null;
    const [
      auditLogs,
      securityEvents,
      notificationEvents,
      verificationCases,
      reluSignals,
    ] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { targetUserId: userId },
            { actorUserId: userId },
            ...(profileId
              ? [{ entityType: 'PROFILE', entityId: profileId }]
              : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.securityEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.notificationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.verificationCase.findMany({
        where: { userId },
        include: {
          reviewedBy: {
            select: { id: true, email: true, role: true },
          },
          decisions: {
            include: {
              actorUser: {
                select: { id: true, email: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.getReluModerationSignals(userId, profileId),
    ]);

    return {
      user: this.toAdminUserState(user),
      trustLifecycle: this.deriveTrustLifecycleState(user),
      twoFactor: {
        enabled: user.twoFactorSettings?.enabled ?? false,
        adminEnforced: user.twoFactorSettings?.adminEnforced ?? false,
        emailOtpEnabled: user.twoFactorSettings?.emailOtpEnabled ?? true,
        lastChallengeVerifiedAt:
          user.twoFactorSettings?.lastChallengeVerifiedAt?.toISOString() ??
          null,
        failedAttemptCount: user.twoFactorSettings?.failedAttemptCount ?? 0,
        lockoutUntil:
          user.twoFactorSettings?.lockoutUntil?.toISOString() ?? null,
        recoveryCodesRemaining: this.countRecoveryCodesRemaining(
          user.twoFactorSettings?.recoveryCodesJson ?? null,
        ),
      },
      notificationSender: 'OpenStaff <no-reply@openstaff.eu>',
      moderationTimeline: auditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        category: item.category,
        entityType: item.entityType,
        entityId: item.entityId,
        createdAt: item.createdAt,
        metadata: item.metadataJson,
      })),
      trustEvents: securityEvents,
      notificationHistory: notificationEvents,
      approvalHistory: verificationCases,
      internalNotes: auditLogs
        .filter((item) => item.metadataJson !== null)
        .map((item) => ({
          id: item.id,
          action: item.action,
          metadata: item.metadataJson,
          createdAt: item.createdAt,
        })),
      reluModerationAssistant: reluSignals,
    };
  }

  derivePublicTrustStatus(profile: {
    user?: {
      approvalStatus?: AccountApprovalStatus;
      accountStatus?: AccountLifecycleStatus;
    } | null;
    moderationStatus?: ProfileModerationStatus;
    status?: ProfileLifecycleStatus;
    identityProfile?: { verificationStatus?: string | null } | null;
  }) {
    if (
      profile.user?.accountStatus === AccountLifecycleStatus.SUSPENDED ||
      profile.status === ProfileLifecycleStatus.SUSPENDED
    ) {
      return 'SUSPENDED';
    }
    if (
      profile.user?.approvalStatus === AccountApprovalStatus.REJECTED ||
      profile.moderationStatus === ProfileModerationStatus.REJECTED
    ) {
      return 'REJECTED';
    }
    if (
      profile.user?.approvalStatus === AccountApprovalStatus.APPROVED &&
      profile.moderationStatus === ProfileModerationStatus.APPROVED &&
      profile.status === ProfileLifecycleStatus.LIVE
    ) {
      return profile.identityProfile?.verificationStatus === 'VERIFIED'
        ? 'VERIFIED'
        : 'APPROVED';
    }
    return 'PENDING_REVIEW';
  }

  private async issueTrustToken(input: {
    userId: string;
    email: string;
    purpose: TrustTokenPurpose;
    expiresInMinutes: number;
    linkPath: string;
    linkParams?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }) {
    const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000);
    const payload = {
      p: input.purpose,
      sub: input.userId,
      exp: expiresAt.toISOString(),
      nonce: randomBytes(12).toString('hex'),
    };
    const rawToken = this.signTrustPayload(payload);
    const tokenHash = this.hashToken(rawToken);
    const metadata = {
      ...(input.metadata ?? {}),
      email: input.email,
      expiresAt: expiresAt.toISOString(),
      consumedAt: null,
      nonce: payload.nonce,
      purpose: input.purpose,
    };
    const link = this.buildPublicLink(input.linkPath, {
      token: rawToken,
      ...(input.linkParams ?? {}),
    });

    const event = await this.prisma.notificationEvent.create({
      data: {
        key: `trust:${input.purpose}:${input.userId}:${tokenHash}`,
        eventType: TrustService.PURPOSE_EVENT_TYPE,
        sourceType: input.purpose,
        sourceId: tokenHash,
        userId: input.userId,
        category: NotificationCategory.ACCOUNT,
        metadata: {
          ...metadata,
          link,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      id: event.id,
      userId: event.userId,
      email: input.email,
      expiresAt: expiresAt.toISOString(),
      consumedAt: null,
      link,
      purpose: input.purpose,
      metadata,
    } satisfies TrustTokenRecord;
  }

  private async consumeTrustToken(
    purpose: TrustTokenPurpose,
    rawToken: string,
  ) {
    const parsed = this.verifySignedTrustToken(rawToken, purpose);
    const tokenHash = this.hashToken(rawToken);
    const event = await this.prisma.notificationEvent.findFirst({
      where: {
        eventType: TrustService.PURPOSE_EVENT_TYPE,
        sourceType: purpose,
        sourceId: tokenHash,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!event) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    const metadata = this.toMetadataRecord(event.metadata);
    const consumedAt =
      typeof metadata.consumedAt === 'string'
        ? new Date(metadata.consumedAt)
        : null;
    if (consumedAt) {
      throw new UnauthorizedException('This link was already used');
    }

    const expiresAt =
      typeof metadata.expiresAt === 'string'
        ? new Date(metadata.expiresAt)
        : null;
    if (
      !expiresAt ||
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    if (
      typeof parsed.sub === 'string' &&
      event.userId &&
      parsed.sub !== event.userId
    ) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    const nextMetadata = {
      ...metadata,
      consumedAt: new Date().toISOString(),
    };

    await this.prisma.notificationEvent.update({
      where: { id: event.id },
      data: {
        metadata: nextMetadata as Prisma.InputJsonValue,
        deliveredAt: new Date(),
      },
    });

    return {
      id: event.id,
      userId: event.userId,
      email: typeof metadata.email === 'string' ? metadata.email : null,
      expiresAt:
        typeof metadata.expiresAt === 'string'
          ? metadata.expiresAt
          : parsed.exp,
      consumedAt: nextMetadata.consumedAt,
      link: typeof metadata.link === 'string' ? metadata.link : '',
      purpose,
      metadata,
    } satisfies TrustTokenRecord;
  }

  private async dispatchTrustEmail(input: {
    userId: string;
    email: string;
    eventType: string;
    title: string;
    message: string;
    relatedEntityId: string;
    purpose: TrustTokenPurpose;
    template: TrustEmailTemplate;
    metadata?: Record<string, unknown>;
  }) {
    return this.notificationService.emitEvent({
      key: `trust-email:${input.eventType}:${input.relatedEntityId}`,
      eventType: input.eventType,
      sourceType: input.purpose,
      sourceId: input.relatedEntityId,
      userId: input.userId,
      category: NotificationCategory.ACCOUNT,
      channel: NotificationChannel.EMAIL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      title: input.title,
      message: input.message,
      relatedEntityType: 'NotificationEvent',
      relatedEntityId: input.relatedEntityId,
      metadata: {
        ...(input.metadata ?? {}),
        email: input.email,
        emailSubject: input.template.subject,
        emailText: input.template.text,
        emailHtml: input.template.html,
      },
    });
  }

  private async emitAdminTrustNotifications(
    user: { id: string; email: string; profile: any | null },
    action: AdminTrustActionDto['action'],
    note: string | null,
  ) {
    const titleMap: Record<AdminTrustActionDto['action'], string> = {
      APPROVE_ACCOUNT: 'Account approved',
      REJECT_ACCOUNT: 'Account rejected',
      REQUEST_MORE_INFO: 'Additional information requested',
      APPROVE_PROFILE: 'Profile approved',
      REJECT_PROFILE: 'Profile rejected',
      SUSPEND_PROFILE: 'Profile suspended',
      REACTIVATE_PROFILE: 'Profile reactivated',
      ESCALATE_REVIEW: 'Moderation escalation opened',
      REQUIRE_2FA: 'Two-factor authentication required',
      CLEAR_2FA_LOCK: 'Two-factor access reset',
    };

    const messageMap: Record<AdminTrustActionDto['action'], string> = {
      APPROVE_ACCOUNT:
        'Your account was approved and is ready for operational use.',
      REJECT_ACCOUNT:
        'Your account was rejected. Review the latest note for next steps.',
      REQUEST_MORE_INFO:
        'We need more information before we can approve your account or profile.',
      APPROVE_PROFILE: 'Your public profile was approved for visibility.',
      REJECT_PROFILE:
        'Your public profile was rejected. Review the latest note for next steps.',
      SUSPEND_PROFILE:
        'Your public profile was suspended from public visibility.',
      REACTIVATE_PROFILE: 'Your public profile was reactivated.',
      ESCALATE_REVIEW:
        'Your account or profile was escalated for deeper moderation review.',
      REQUIRE_2FA:
        'Two-factor authentication is now required for your account before future logins can complete.',
      CLEAR_2FA_LOCK:
        'A stuck two-factor lock was cleared by OpenStaff operations. Please sign in again and complete the new challenge.',
    };

    const actionUrl =
      action === 'APPROVE_ACCOUNT' || action === 'REQUEST_MORE_INFO'
        ? this.buildPublicLink('/profile')
        : this.buildPublicLink('/login');

    const template = this.buildGenericTrustTemplate(
      titleMap[action],
      messageMap[action],
      actionUrl,
      note,
    );
    await this.notificationService.emitEvent({
      key: `trust-admin-action:${action}:${user.id}:${Date.now()}`,
      eventType: this.mapAdminActionToEventType(action),
      sourceType: 'TRUST_ACTION',
      sourceId: user.id,
      userId: user.id,
      category: NotificationCategory.ACCOUNT,
      channel: NotificationChannel.EMAIL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      title: titleMap[action],
      message: messageMap[action],
      relatedEntityType: 'User',
      relatedEntityId: user.id,
      metadata: {
        note,
        email: user.email,
        emailSubject: template.subject,
        emailText: template.text,
        emailHtml: template.html,
      },
    });
  }

  private async getReluModerationSignals(
    userId: string,
    profileId: string | null,
  ) {
    const [classifications, recommendations] = await Promise.all([
      this.prisma.reluClassificationResult.findMany({
        where: {
          userId,
          domain: 'MODERATION',
          ...(profileId ? { sourceId: profileId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.reluRecommendation.findMany({
        where: {
          userId,
          domain: 'RECOMMENDATION',
          ...(profileId ? { sourceId: profileId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    return {
      scope: 'human_review_only',
      capabilities: [
        'summarize profile risk',
        'classify missing onboarding info',
        'suggest moderation actions',
        'detect suspicious or incomplete profiles',
      ],
      prohibitedActions: ['auto-approve', 'auto-reject', 'auto-ban'],
      classifications,
      recommendations,
    };
  }

  private countRecoveryCodesRemaining(value: Prisma.JsonValue | null) {
    if (!Array.isArray(value)) {
      return 0;
    }

    return value.filter((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }
      const candidate = item as Record<string, unknown>;
      return !candidate.usedAt;
    }).length;
  }

  private deriveTrustLifecycleState(user: {
    approvalStatus: AccountApprovalStatus;
    accountStatus: AccountLifecycleStatus;
    profile?: {
      moderationStatus: ProfileModerationStatus;
      status: ProfileLifecycleStatus;
    } | null;
  }) {
    if (
      user.accountStatus === AccountLifecycleStatus.SUSPENDED ||
      user.profile?.status === ProfileLifecycleStatus.SUSPENDED
    ) {
      return 'SUSPENDED';
    }
    if (
      user.approvalStatus === AccountApprovalStatus.REJECTED ||
      user.profile?.moderationStatus === ProfileModerationStatus.REJECTED
    ) {
      return 'REJECTED';
    }
    if (
      user.approvalStatus === AccountApprovalStatus.APPROVED &&
      user.profile?.moderationStatus === ProfileModerationStatus.APPROVED &&
      user.profile?.status === ProfileLifecycleStatus.LIVE
    ) {
      return 'APPROVED';
    }
    if (user.approvalStatus === AccountApprovalStatus.APPROVED) {
      return 'VERIFIED';
    }
    return 'PENDING_REVIEW';
  }

  private toAdminUserState(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      approvedAt: user.approvedAt,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      twoFactor: user.twoFactorSettings
        ? {
            enabled: user.twoFactorSettings.enabled,
            adminEnforced: user.twoFactorSettings.adminEnforced,
            emailOtpEnabled: user.twoFactorSettings.emailOtpEnabled,
            lastChallengeVerifiedAt:
              user.twoFactorSettings.lastChallengeVerifiedAt,
            failedAttemptCount: user.twoFactorSettings.failedAttemptCount,
            lockoutUntil: user.twoFactorSettings.lockoutUntil,
          }
        : null,
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
            approvedAt: user.profile.approvedAt,
          }
        : null,
    };
  }

  private mapAdminActionToEventType(action: AdminTrustActionDto['action']) {
    switch (action) {
      case 'APPROVE_ACCOUNT':
        return 'ACCOUNT_APPROVED';
      case 'REJECT_ACCOUNT':
        return 'ACCOUNT_REJECTED';
      case 'REQUEST_MORE_INFO':
        return 'VERIFICATION_REQUESTED';
      case 'APPROVE_PROFILE':
        return 'PROFILE_APPROVED';
      case 'REJECT_PROFILE':
        return 'PROFILE_REJECTED';
      case 'SUSPEND_PROFILE':
        return 'ACCOUNT_SUSPENDED';
      case 'REACTIVATE_PROFILE':
        return 'PROFILE_REACTIVATED';
      case 'REQUIRE_2FA':
        return 'VERIFICATION_REQUESTED';
      case 'CLEAR_2FA_LOCK':
        return 'VERIFICATION_REQUESTED';
      default:
        return 'MODERATION_ESCALATED';
    }
  }

  private buildPasswordResetTemplate(
    link: string,
    expiresAt: string,
  ): TrustEmailTemplate {
    const expiryText = new Date(expiresAt).toLocaleString('ro-RO');
    return {
      subject: 'OpenStaff password reset',
      text: `A fost ceruta resetarea parolei. Foloseste linkul securizat: ${link}\nLinkul expira la ${expiryText}.`,
      html: `<p>A fost ceruta resetarea parolei pentru contul tau OpenStaff.</p><p><a href="${link}">Reseteaza parola</a></p><p>Linkul expira la <strong>${expiryText}</strong>.</p>`,
    };
  }

  private buildAccountRecoveryTemplate(
    link: string,
    expiresAt: string,
    reason: 'GENERAL' | 'LOCKED' | 'COMPROMISED',
  ): TrustEmailTemplate {
    const expiryText = new Date(expiresAt).toLocaleString('ro-RO');
    return {
      subject: 'OpenStaff account recovery',
      text: `Am primit o cerere de recuperare cont (${reason}). Foloseste linkul securizat: ${link}\nLinkul expira la ${expiryText}. Daca nu ai initiat tu cererea, ignora acest email.`,
      html: `<p>Am primit o cerere de recuperare cont OpenStaff <strong>(${reason})</strong>.</p><p><a href="${link}">Recupereaza contul</a></p><p>Linkul expira la <strong>${expiryText}</strong>. Daca nu ai initiat tu cererea, ignora acest email.</p>`,
    };
  }

  private buildEmailOwnershipTemplate(
    link: string,
    expiresAt: string,
  ): TrustEmailTemplate {
    const expiryText = new Date(expiresAt).toLocaleString('ro-RO');
    return {
      subject: 'OpenStaff email ownership confirmation',
      text: `Confirma proprietatea acestui email folosind linkul securizat: ${link}\nLinkul expira la ${expiryText}.`,
      html: `<p>Confirma proprietatea acestui email pentru a consolida increderea in contul tau OpenStaff.</p><p><a href="${link}">Confirma emailul</a></p><p>Linkul expira la <strong>${expiryText}</strong>.</p>`,
    };
  }

  private buildGenericTrustTemplate(
    subject: string,
    message: string,
    actionUrl: string,
    note: string | null,
  ): TrustEmailTemplate {
    return {
      subject: `OpenStaff ${subject}`,
      text: `${message}\n${note ? `Nota operator: ${note}\n` : ''}${actionUrl}`,
      html: `<p>${message}</p>${note ? `<p><strong>Nota operator:</strong> ${note}</p>` : ''}<p><a href="${actionUrl}">Open OpenStaff</a></p>`,
    };
  }

  private buildRequestAcceptedResponse(expiresInMinutes = 30) {
    return {
      success: true,
      message:
        'If the account exists, a secure message was sent from no-reply@openstaff.eu with the next trust step.',
      expiresInMinutes,
    };
  }

  private buildPublicLink(path: string, params?: Record<string, string>) {
    const base = (
      process.env.PUBLIC_WEB_URL?.trim() ||
      process.env.APP_PUBLIC_URL?.trim() ||
      'https://openstaff.eu'
    ).replace(/\/+$/, '');
    const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private signTrustPayload(payload: Record<string, string>) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.getTrustSecret())
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  private verifySignedTrustToken(rawToken: string, purpose: TrustTokenPurpose) {
    const [encodedPayload, signature] = rawToken.trim().split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    const expected = createHmac('sha256', this.getTrustSecret())
      .update(encodedPayload)
      .digest('base64url');
    if (expected !== signature) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    let payload: Record<string, string>;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as Record<string, string>;
    } catch {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    if (payload.p !== purpose) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

    return payload;
  }

  private getTrustSecret() {
    return (
      process.env.TRUST_TOKEN_SECRET?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      'openstaff-trust-secret-dev'
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toMetadataRecord(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {} as Record<string, unknown>;
    }
    return value as Record<string, unknown>;
  }
}
