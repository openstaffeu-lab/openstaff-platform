import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ComplianceDocumentStatus,
  NotificationChannel,
  NotificationSeverity,
  NotificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async listCurrentActorNotifications(actor: { id: string }) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        actorId: actor.id,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const unreadCount = notifications.filter((item) => item.status !== NotificationStatus.READ).length;

    return {
      unreadCount,
      items: notifications.map((notification) => this.toNotificationResponse(notification)),
    };
  }

  async markActorNotificationRead(notificationId: string, actor: { id: string; role?: string }) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (
      !['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(actor.role ?? '') &&
      notification.actorId !== actor.id
    ) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: notification.readAt ?? new Date(),
      },
    });

    return this.toNotificationResponse(updated);
  }

  async listCurrentUserNotifications(user: AuthenticatedUser) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: user.sub,
      },
      orderBy: [{ status: 'asc' }, { scheduledFor: 'desc' }, { createdAt: 'desc' }],
    });

    const unreadCount = notifications.filter((item) => item.status !== NotificationStatus.READ).length;

    return {
      unreadCount,
      items: notifications.map((notification) => this.toNotificationResponse(notification)),
    };
  }

  async markRead(notificationId: string, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (user.role !== 'ADMIN' && notification.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: notification.readAt ?? new Date(),
      },
    });

    return this.toNotificationResponse(updated);
  }

  async recomputeComplianceReminders(user: AuthenticatedUser) {
    const profiles = await this.prisma.profile.findMany({
      where:
        user.role === 'ADMIN'
          ? undefined
          : {
              userId: user.sub,
            },
      include: {
        actorDocuments: true,
        actorCertifications: true,
        medicalFitnessCertificates: true,
      },
    });

    const now = new Date();
    let createdOrUpdated = 0;

    for (const profile of profiles) {
      for (const document of profile.actorDocuments) {
        createdOrUpdated += await this.scheduleReminder({
          keyPrefix: 'actor-document',
          userId: profile.userId,
          profileId: profile.id,
          relatedEntityType: 'ActorDocument',
          relatedEntityId: document.id,
          title: document.title,
          expiresAt: document.expiresAt,
          status: document.status,
          now,
        });
      }

      for (const certification of profile.actorCertifications) {
        createdOrUpdated += await this.scheduleReminder({
          keyPrefix: 'actor-certification',
          userId: profile.userId,
          profileId: profile.id,
          relatedEntityType: 'ActorCertification',
          relatedEntityId: certification.id,
          title: certification.title,
          expiresAt: certification.expiresAt,
          status: certification.status,
          now,
        });
      }

      for (const medical of profile.medicalFitnessCertificates) {
        createdOrUpdated += await this.scheduleReminder({
          keyPrefix: 'medical-fitness',
          userId: profile.userId,
          profileId: profile.id,
          relatedEntityType: 'MedicalFitnessCertificate',
          relatedEntityId: medical.id,
          title: medical.title,
          expiresAt: medical.expiresAt,
          status: medical.status,
          now,
        });
      }
    }

    return {
      processedProfiles: profiles.length,
      createdOrUpdated,
    };
  }

  async createInAppNotification(input: {
    key: string;
    userId: string;
    profileId?: string | null;
    type: string;
    severity?: NotificationSeverity;
    title: string;
    message: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    scheduledFor?: Date | null;
  }) {
    const notification = await this.prisma.notification.upsert({
      where: { key: input.key },
      update: {
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        scheduledFor: input.scheduledFor ?? null,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.PENDING,
        sentAt: null,
      },
      create: {
        key: input.key,
        userId: input.userId,
        profileId: input.profileId ?? null,
        type: input.type,
        channel: NotificationChannel.IN_APP,
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        status: NotificationStatus.PENDING,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        scheduledFor: input.scheduledFor ?? null,
      },
    });

    return this.toNotificationResponse(notification);
  }

  async createActorNotification(input: {
    actorId: string;
    type: string;
    title: string;
    message: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        key: `actor:${input.actorId}:${input.type}:${Date.now()}`,
        userId: input.actorId,
        actorId: input.actorId,
        type: input.type,
        channel: NotificationChannel.IN_APP,
        severity: NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        status: NotificationStatus.PENDING,
      },
    });

    return this.toNotificationResponse(notification);
  }

  private async scheduleReminder(input: {
    keyPrefix: string;
    userId: string;
    profileId: string;
    relatedEntityType: string;
    relatedEntityId: string;
    title: string;
    expiresAt: Date | null;
    status: ComplianceDocumentStatus;
    now: Date;
  }) {
    if (!input.expiresAt) {
      return 0;
    }

    const daysUntilExpiry = this.daysBetween(input.now, input.expiresAt);

    if (daysUntilExpiry > 30) {
      return 0;
    }

    const severity =
      input.status === ComplianceDocumentStatus.EXPIRED || daysUntilExpiry < 0
        ? NotificationSeverity.CRITICAL
        : daysUntilExpiry <= 15
          ? NotificationSeverity.CRITICAL
          : NotificationSeverity.WARNING;

    const type =
      input.status === ComplianceDocumentStatus.EXPIRED || daysUntilExpiry < 0
        ? 'COMPLIANCE_EXPIRED'
        : 'COMPLIANCE_EXPIRING';

    const message =
      input.status === ComplianceDocumentStatus.EXPIRED || daysUntilExpiry < 0
        ? `${input.title} has expired and requires immediate action.`
        : daysUntilExpiry <= 15
          ? `${input.title} expires within ${Math.max(daysUntilExpiry, 0)} day(s). Renew urgently.`
          : `${input.title} expires within 30 days. Plan renewal now.`;

    const reminderKey =
      daysUntilExpiry < 0
        ? `${input.keyPrefix}:${input.relatedEntityId}:expired`
        : daysUntilExpiry <= 15
          ? `${input.keyPrefix}:${input.relatedEntityId}:daily:${input.now.toISOString().slice(0, 10)}`
          : `${input.keyPrefix}:${input.relatedEntityId}:warning`;

    await this.createInAppNotification({
      key: reminderKey,
      userId: input.userId,
      profileId: input.profileId,
      type,
      severity,
      title: input.status === ComplianceDocumentStatus.EXPIRED || daysUntilExpiry < 0
        ? 'Compliance expired'
        : 'Compliance reminder',
      message,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      scheduledFor: input.now,
    });

    return 1;
  }

  private toNotificationResponse(notification: any) {
    return {
      id: notification.id,
      key: notification.key,
      userId: notification.userId,
      profileId: notification.profileId,
      type: notification.type,
      channel: notification.channel,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private daysBetween(left: Date, right: Date) {
    return Math.floor((right.getTime() - left.getTime()) / (1000 * 60 * 60 * 24));
  }
}
