import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ComplianceDocumentStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationSeverity,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as nodemailerShared from 'nodemailer/lib/shared';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
  email?: string;
};

type NotificationCategoryMap = Record<NotificationCategory, boolean>;

type DeliveryAttemptResult = {
  status: NotificationStatus;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  metadata?: Record<string, unknown> | null;
};

type ResolvedEmailProvider =
  | 'smtp'
  | 'resend'
  | 'sendgrid'
  | 'postmark'
  | 'mailgun';

type EmitEventInput = {
  key?: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  userId?: string | null;
  actorId?: string | null;
  profileId?: string | null;
  category?: NotificationCategory | null;
  channel?: NotificationChannel;
  channels?: NotificationChannel[];
  severity?: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  notificationKey?: string | null;
  skipNotification?: boolean;
};

const DEFAULT_CATEGORY_PREFERENCES: NotificationCategoryMap = {
  ACCOUNT: true,
  BILLING: true,
  VERIFICATION: true,
  PROJECTS: true,
  MESSAGING: true,
  WORKFORCE: true,
  PAYROLL: true,
  RELU: true,
  ADMIN: true,
};

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit() {
    this.logEmailRuntimeSummary('startup');
  }

  async emitEvent(input: EmitEventInput) {
    const channel = input.channel ?? NotificationChannel.IN_APP;
    const eventKey =
      input.key?.trim() ||
      `${input.eventType}:${input.sourceType}:${input.sourceId}:${input.userId ?? 'anonymous'}`;
    const metadata = this.normalizeMetadata(input.metadata, {
      title: input.title,
      message: input.message,
      category: input.category ?? null,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    });

    const event = await this.prisma.notificationEvent.upsert({
      where: { key: eventKey },
      update: {
        eventType: input.eventType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        userId: input.userId ?? null,
        channel,
        category: input.category ?? null,
        metadata: metadata as Prisma.InputJsonValue,
        status: NotificationStatus.PENDING,
        failedAt: null,
      },
      create: {
        key: eventKey,
        eventType: input.eventType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        userId: input.userId ?? null,
        channel,
        category: input.category ?? null,
        status: NotificationStatus.PENDING,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    const preferences = input.userId
      ? await this.ensureNotificationPreferences(input.userId)
      : null;
    const channels = this.resolveChannels(input.channels, channel, preferences);
    let notification: Awaited<
      ReturnType<NotificationService['createUserNotification']>
    > | null = null;

    if (
      input.userId &&
      !input.skipNotification &&
      this.canCreateInAppNotification(preferences, input.category)
    ) {
      notification = await this.createUserNotification({
        eventId: event.id,
        key:
          input.notificationKey?.trim() ||
          `event:${event.id}:in-app:${input.userId}`,
        userId: input.userId,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        type: input.eventType,
        category: input.category ?? null,
        channel: NotificationChannel.IN_APP,
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        metadata,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
      });
    }

    const deliveries: Array<
      Awaited<ReturnType<NotificationService['queueDelivery']>>
    > = [];
    for (const deliveryChannel of channels) {
      deliveries.push(
        await this.queueDelivery({
          eventId: event.id,
          notificationId:
            deliveryChannel === NotificationChannel.IN_APP
              ? (notification?.id ?? null)
              : null,
          userId: input.userId ?? null,
          channel: deliveryChannel,
          metadata,
        }),
      );
    }

    await this.createWorkflowRunForEvent(event, deliveries, input);
    await this.updateEventStatusFromDeliveries(event.id);

    return {
      event: await this.getEventById(event.id),
      notification,
      deliveries,
    };
  }

  async createUserNotification(input: {
    eventId?: string | null;
    key: string;
    userId: string;
    profileId?: string | null;
    actorId?: string | null;
    type: string;
    category?: NotificationCategory | null;
    channel?: NotificationChannel;
    severity?: NotificationSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown> | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    scheduledFor?: Date | null;
  }) {
    const notification = await this.prisma.notification.upsert({
      where: { key: input.key },
      update: {
        eventId: input.eventId ?? null,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        category: input.category ?? null,
        channel: input.channel ?? NotificationChannel.IN_APP,
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        metadata: this.toJsonValue(input.metadata),
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        scheduledFor: input.scheduledFor ?? null,
        status: NotificationStatus.PENDING,
        sentAt: null,
        deliveredAt: null,
        failedAt: null,
        dismissedAt: null,
      },
      create: {
        key: input.key,
        eventId: input.eventId ?? null,
        userId: input.userId,
        profileId: input.profileId ?? null,
        actorId: input.actorId ?? null,
        type: input.type,
        category: input.category ?? null,
        channel: input.channel ?? NotificationChannel.IN_APP,
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        metadata: this.toJsonValue(input.metadata),
        status: NotificationStatus.PENDING,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        scheduledFor: input.scheduledFor ?? null,
      },
    });

    return this.toNotificationResponse(notification);
  }

  async queueDelivery(input: {
    notificationId?: string | null;
    eventId?: string | null;
    userId?: string | null;
    channel: NotificationChannel;
    metadata?: Record<string, unknown> | null;
  }) {
    const now = new Date();
    const {
      status,
      deliveredAt,
      failedAt,
      failureReason,
      metadata: deliveryMetadata,
    } = await this.resolveDeliveryOutcome(
      input.channel,
      input.metadata,
      input.userId ?? null,
    );

    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: input.notificationId ?? null,
        eventId: input.eventId ?? null,
        userId: input.userId ?? null,
        channel: input.channel,
        status,
        deliveredAt,
        failedAt,
        metadata: this.normalizeMetadata(
          this.normalizeMetadata(input.metadata, deliveryMetadata ?? undefined),
          failureReason ? { failureReason } : undefined,
        ) as Prisma.InputJsonValue,
      },
    });

    if (input.notificationId) {
      await this.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          status,
          sentAt: status === NotificationStatus.SENT ? now : null,
          deliveredAt: deliveredAt ?? null,
          failedAt: failedAt ?? null,
        },
      });
    }

    return this.toDeliveryResponse(delivery);
  }

  async retryFailedDelivery(deliveryId: string, actor: AuthenticatedUser) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Notification delivery not found');
    }

    const retried = await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        retryCount: { increment: 1 },
        failedAt:
          delivery.channel === NotificationChannel.IN_APP ||
          delivery.channel === NotificationChannel.SYSTEM
            ? null
            : new Date(),
        deliveredAt:
          delivery.channel === NotificationChannel.IN_APP ||
          delivery.channel === NotificationChannel.SYSTEM
            ? new Date()
            : null,
        status:
          delivery.channel === NotificationChannel.IN_APP ||
          delivery.channel === NotificationChannel.SYSTEM
            ? NotificationStatus.SENT
            : NotificationStatus.FAILED,
        metadata: this.normalizeMetadata(this.parseJson(delivery.metadata), {
          lastRetryAt: new Date().toISOString(),
          retriedByUserId: actor.sub,
        }) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.log({
      actorUserId: actor.sub,
      entityType: 'NOTIFICATION_DELIVERY',
      entityId: deliveryId,
      action: 'RETRY',
      after: {
        retryCount: retried.retryCount,
        status: retried.status,
      },
    });

    if (retried.eventId) {
      await this.updateEventStatusFromDeliveries(retried.eventId);
    }

    return this.toDeliveryResponse(retried);
  }

  async listForUser(user: AuthenticatedUser) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: [
        { status: 'asc' },
        { scheduledFor: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      unreadCount: notifications.filter(
        (item) => !this.isReadLikeStatus(item.status),
      ).length,
      items: notifications.map((notification) =>
        this.toNotificationResponse(notification),
      ),
    };
  }

  async unreadCount(user: AuthenticatedUser) {
    const count = await this.prisma.notification.count({
      where: {
        userId: user.sub,
        status: {
          notIn: [NotificationStatus.READ, NotificationStatus.DISMISSED],
        },
      },
    });

    return { unreadCount: count };
  }

  async markRead(notificationId: string, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (user.role !== 'ADMIN' && notification.userId !== user.sub) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    const now = new Date();
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: notification.readAt ?? now,
        deliveredAt: notification.deliveredAt ?? now,
      },
    });

    if (notification.eventId) {
      await this.prisma.notificationEvent.update({
        where: { id: notification.eventId },
        data: {
          readAt: now,
          status: NotificationStatus.READ,
        },
      });
    }

    return this.toNotificationResponse(updated);
  }

  async markAllRead(user: AuthenticatedUser) {
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: {
        userId: user.sub,
        status: {
          notIn: [NotificationStatus.READ, NotificationStatus.DISMISSED],
        },
      },
      data: {
        status: NotificationStatus.READ,
        readAt: now,
        deliveredAt: now,
      },
    });

    return this.listForUser(user);
  }

  async dismiss(notificationId: string, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (user.role !== 'ADMIN' && notification.userId !== user.sub) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.DISMISSED,
        dismissedAt: new Date(),
      },
    });

    return this.toNotificationResponse(updated);
  }

  async getPreferences(user: AuthenticatedUser) {
    const preference = await this.ensureNotificationPreferences(user.sub);
    return this.toPreferenceResponse(preference);
  }

  async updatePreferences(
    user: AuthenticatedUser,
    input: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      categories?: Partial<Record<NotificationCategory, boolean>>;
    },
  ) {
    const current = await this.ensureNotificationPreferences(user.sub);
    const categoryPreferences = this.mergeCategoryPreferences(
      this.parseCategoryPreferences(current.categoryPreferences),
      input.categories,
    );

    const updated = await this.prisma.notificationPreference.update({
      where: { userId: user.sub },
      data: {
        ...(typeof input.inAppEnabled === 'boolean'
          ? { inAppEnabled: input.inAppEnabled }
          : {}),
        ...(typeof input.emailEnabled === 'boolean'
          ? { emailEnabled: input.emailEnabled }
          : {}),
        ...(typeof input.smsEnabled === 'boolean'
          ? { smsEnabled: input.smsEnabled }
          : {}),
        categoryPreferences,
      },
    });

    return this.toPreferenceResponse(updated);
  }

  async listAdminEvents() {
    const events = await this.prisma.notificationEvent.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        notifications: {
          select: { id: true, status: true, channel: true, title: true },
        },
        deliveries: {
          select: { id: true, channel: true, status: true, retryCount: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return events.map((event) => this.toEventResponse(event));
  }

  async listAdminDeliveries() {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        event: {
          select: {
            id: true,
            eventType: true,
            sourceType: true,
            sourceId: true,
          },
        },
        notification: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return deliveries.map((delivery) => this.toDeliveryResponse(delivery));
  }

  async listWorkflowAutomationRuns() {
    const runs = await this.prisma.workflowAutomationRun.findMany({
      include: {
        rule: true,
        event: {
          select: {
            id: true,
            eventType: true,
            sourceType: true,
            sourceId: true,
            status: true,
          },
        },
        triggeredByUser: {
          select: { id: true, email: true, role: true },
        },
        reviewedByUser: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return runs.map((run) => this.toWorkflowRunResponse(run));
  }

  async listCurrentActorNotifications(actor: { id: string }) {
    const notifications = await this.prisma.notification.findMany({
      where: { actorId: actor.id },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      unreadCount: notifications.filter(
        (item) => !this.isReadLikeStatus(item.status),
      ).length,
      items: notifications.map((notification) =>
        this.toNotificationResponse(notification),
      ),
    };
  }

  async markActorNotificationRead(
    notificationId: string,
    actor: { id: string; role?: string },
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (
      !['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(
        actor.role ?? '',
      ) &&
      notification.actorId !== actor.id
    ) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
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
    return this.listForUser(user);
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
    actorId?: string | null;
    type: string;
    category?: NotificationCategory | null;
    severity?: NotificationSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown> | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    scheduledFor?: Date | null;
    eventId?: string | null;
  }) {
    const notification = await this.createUserNotification({
      eventId: input.eventId ?? null,
      key: input.key,
      userId: input.userId,
      profileId: input.profileId ?? null,
      actorId: input.actorId ?? null,
      type: input.type,
      category: input.category ?? null,
      channel: NotificationChannel.IN_APP,
      severity: input.severity ?? NotificationSeverity.INFO,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? null,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      scheduledFor: input.scheduledFor ?? null,
    });

    await this.queueDelivery({
      notificationId: notification.id,
      eventId: notification.eventId,
      userId: notification.userId,
      channel: NotificationChannel.IN_APP,
      metadata: notification.metadata,
    });

    return notification;
  }

  async createActorNotification(input: {
    actorId: string;
    type: string;
    title: string;
    message: string;
  }) {
    const actor = await this.prisma.actor.findUnique({
      where: { id: input.actorId },
      select: {
        id: true,
        email: true,
      },
    });

    const user = actor?.email
      ? await this.prisma.user.findUnique({
          where: { email: actor.email },
          select: { id: true },
        })
      : null;

    if (!user?.id) {
      return null;
    }

    return this.createInAppNotification({
      key: `actor:${input.actorId}:${input.type}`,
      userId: user.id,
      actorId: input.actorId,
      type: input.type,
      category: NotificationCategory.ADMIN,
      title: input.title,
      message: input.message,
    });
  }

  private async getEventById(eventId: string) {
    const event = await this.prisma.notificationEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        notifications: true,
        deliveries: true,
      },
    });

    return this.toEventResponse(event);
  }

  private async ensureNotificationPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        categoryPreferences: DEFAULT_CATEGORY_PREFERENCES,
      },
    });
  }

  private resolveChannels(
    requestedChannels: NotificationChannel[] | undefined,
    fallbackChannel: NotificationChannel,
    preferences: any,
  ) {
    const channels = new Set<NotificationChannel>(
      requestedChannels?.length ? requestedChannels : [fallbackChannel],
    );
    channels.add(NotificationChannel.IN_APP);

    if (preferences?.emailEnabled === false) {
      channels.delete(NotificationChannel.EMAIL);
    }
    if (preferences?.smsEnabled === false) {
      channels.delete(NotificationChannel.SMS_PLACEHOLDER);
      channels.delete(NotificationChannel.SMS);
    }
    if (preferences?.inAppEnabled === false) {
      channels.delete(NotificationChannel.IN_APP);
    }

    return Array.from(channels);
  }

  private canCreateInAppNotification(
    preferences: any,
    category: NotificationCategory | null | undefined,
  ) {
    if (!preferences || preferences.inAppEnabled !== false) {
      if (!category) {
        return true;
      }
      const categories = this.parseCategoryPreferences(
        preferences.categoryPreferences,
      );
      return categories[category] !== false;
    }

    return false;
  }

  private parseCategoryPreferences(value: unknown): NotificationCategoryMap {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_CATEGORY_PREFERENCES };
    }

    const parsed = { ...DEFAULT_CATEGORY_PREFERENCES };
    for (const category of Object.keys(
      DEFAULT_CATEGORY_PREFERENCES,
    ) as NotificationCategory[]) {
      const next = (value as Record<string, unknown>)[category];
      if (typeof next === 'boolean') {
        parsed[category] = next;
      }
    }

    return parsed;
  }

  private mergeCategoryPreferences(
    current: NotificationCategoryMap,
    input?: Partial<Record<NotificationCategory, boolean>>,
  ) {
    if (!input) {
      return current;
    }

    const next = { ...current };
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'boolean' && key in next) {
        next[key as NotificationCategory] = value;
      }
    }
    return next;
  }

  private async resolveDeliveryOutcome(
    channel: NotificationChannel,
    metadata?: Record<string, unknown> | null,
    userId?: string | null,
  ): Promise<DeliveryAttemptResult> {
    if (
      channel === NotificationChannel.IN_APP ||
      channel === NotificationChannel.SYSTEM
    ) {
      return {
        status: NotificationStatus.SENT,
        deliveredAt: new Date(),
        failedAt: null,
        failureReason: null,
      };
    }

    if (channel === NotificationChannel.EMAIL) {
      return this.sendEmailDelivery(metadata, userId);
    }

    return {
      status: NotificationStatus.FAILED,
      deliveredAt: null,
      failedAt: new Date(),
      failureReason:
        channel === NotificationChannel.SMS_PLACEHOLDER ||
        channel === NotificationChannel.SMS
          ? 'sms_provider_placeholder_only'
          : 'delivery_channel_not_configured',
    };
  }

  private async sendEmailDelivery(
    metadata?: Record<string, unknown> | null,
    userId?: string | null,
  ): Promise<DeliveryAttemptResult> {
    const recipient = await this.resolveEmailRecipient(metadata, userId);
    if (!recipient) {
      return {
        status: NotificationStatus.FAILED,
        deliveredAt: null,
        failedAt: new Date(),
        failureReason: 'email_recipient_missing',
      };
    }

    const provider = this.resolveEmailProvider();
    if (!provider) {
      this.logger.warn(
        `email delivery skipped because provider is not configured (userId=${userId ?? 'anonymous'})`,
      );
      return {
        status: NotificationStatus.FAILED,
        deliveredAt: null,
        failedAt: new Date(),
        failureReason: 'email_provider_not_configured',
      };
    }

    const subject =
      this.readMetadataString(metadata, 'emailSubject') ??
      this.readMetadataString(metadata, 'title') ??
      'OpenStaff notification';
    const html =
      this.readMetadataString(metadata, 'emailHtml') ??
      this.defaultEmailHtmlTemplate(
        subject,
        this.readMetadataString(metadata, 'message'),
      );
    const text =
      this.readMetadataString(metadata, 'emailText') ??
      this.defaultEmailTextTemplate(
        subject,
        this.readMetadataString(metadata, 'message'),
      );
    const eventType =
      this.readMetadataString(metadata, 'eventType') ?? 'unknown';
    const recipientSummary = this.maskEmailRecipient(recipient);

    this.logger.log(
      `email delivery attempt provider=${provider} eventType=${eventType} recipient=${recipientSummary}`,
    );

    try {
      const providerResult =
        provider === 'smtp'
          ? await this.sendWithSmtp(recipient, subject, html, text)
          : provider === 'resend'
            ? await this.sendWithResend(recipient, subject, html, text)
            : provider === 'sendgrid'
              ? await this.sendWithSendGrid(recipient, subject, html, text)
              : provider === 'postmark'
                ? await this.sendWithPostmark(recipient, subject, html, text)
                : await this.sendWithMailgun(recipient, subject, html, text);

      this.logger.log(
        `email delivery success provider=${provider} eventType=${eventType} recipient=${recipientSummary} messageId=${
          providerResult.messageId ? 'present' : 'missing'
        }`,
      );

      return {
        status: NotificationStatus.SENT,
        deliveredAt: new Date(),
        failedAt: null,
        failureReason: null,
        metadata: {
          deliveryProvider: provider,
          deliveryRecipient: recipient,
          providerMessageId: providerResult.messageId,
          providerAcceptedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const failure = this.toEmailFailureDetails(error);
      this.logger.warn(
        `email delivery failed provider=${provider} eventType=${eventType} recipient=${recipientSummary} code=${
          failure.code ?? 'unknown'
        } command=${failure.command ?? 'unknown'} responseCode=${
          failure.responseCode ?? 'unknown'
        } reason=${failure.message}`,
      );

      return {
        status: NotificationStatus.FAILED,
        deliveredAt: null,
        failedAt: new Date(),
        failureReason:
          error instanceof Error && error.message
            ? `email_provider_error:${error.message}`
            : 'email_provider_error',
        metadata: {
          deliveryProvider: provider,
          deliveryRecipient: recipient,
          failureCode: failure.code ?? null,
          failureCommand: failure.command ?? null,
          failureResponseCode: failure.responseCode ?? null,
          failureMessage: failure.message,
        },
      };
    }
  }

  private async resolveEmailRecipient(
    metadata?: Record<string, unknown> | null,
    userId?: string | null,
  ) {
    const explicitEmail =
      this.readMetadataString(metadata, 'emailAddress') ??
      this.readMetadataString(metadata, 'email');

    if (explicitEmail) {
      return explicitEmail.trim().toLowerCase();
    }

    if (!userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return user?.email?.trim().toLowerCase() ?? null;
  }

  getEmailRuntimeSummary() {
    const configuredProvider = process.env.EMAIL_PROVIDER?.trim() ?? null;
    const provider = this.resolveEmailProvider();
    const smtp = this.describeSmtpTransport(process.env.SMTP_URL?.trim() ?? '');

    return {
      configuredProvider,
      resolvedProvider: provider,
      fromConfigured: Boolean(this.getEmailFromAddress().trim()),
      smtp,
    };
  }

  private resolveEmailProvider() {
    const configuredProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
    if (configuredProvider === 'smtp' && process.env.SMTP_URL?.trim()) {
      return 'smtp' as const;
    }
    if (
      configuredProvider === 'resend' &&
      this.getEmailProviderToken('resend')
    ) {
      return 'resend' as const;
    }
    if (
      configuredProvider === 'sendgrid' &&
      this.getEmailProviderToken('sendgrid')
    ) {
      return 'sendgrid' as const;
    }
    if (
      configuredProvider === 'postmark' &&
      this.getEmailProviderToken('postmark')
    ) {
      return 'postmark' as const;
    }
    if (
      configuredProvider === 'mailgun' &&
      this.getEmailProviderToken('mailgun') &&
      process.env.MAILGUN_DOMAIN?.trim()
    ) {
      return 'mailgun' as const;
    }
    if (process.env.SMTP_URL?.trim()) {
      return 'smtp' as const;
    }
    if (process.env.RESEND_API_KEY?.trim()) {
      return 'resend' as const;
    }
    if (process.env.SENDGRID_API_KEY?.trim()) {
      return 'sendgrid' as const;
    }
    if (process.env.POSTMARK_SERVER_TOKEN?.trim()) {
      return 'postmark' as const;
    }
    if (
      process.env.MAILGUN_API_KEY?.trim() &&
      process.env.MAILGUN_DOMAIN?.trim()
    ) {
      return 'mailgun' as const;
    }

    return null;
  }

  private getEmailProviderToken(
    provider: Exclude<ResolvedEmailProvider, 'smtp'>,
  ) {
    const genericProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
    const genericToken = process.env.EMAIL_API_KEY?.trim();
    if (genericToken && genericProvider === provider) {
      return genericToken;
    }

    if (provider === 'resend') {
      return process.env.RESEND_API_KEY?.trim() ?? null;
    }
    if (provider === 'sendgrid') {
      return process.env.SENDGRID_API_KEY?.trim() ?? null;
    }
    if (provider === 'postmark') {
      return process.env.POSTMARK_SERVER_TOKEN?.trim() ?? null;
    }
    return process.env.MAILGUN_API_KEY?.trim() ?? null;
  }

  private getEmailFromAddress() {
    return (
      process.env.EMAIL_FROM?.trim() ||
      process.env.OPENSTAFF_EMAIL_FROM?.trim() ||
      process.env.POSTMARK_FROM_EMAIL?.trim() ||
      'OpenStaff <no-reply@openstaff.eu>'
    );
  }

  private maskEmailRecipient(value: string) {
    const [localPart, domain] = value.split('@');
    if (!domain) {
      return 'invalid-email';
    }

    const first = localPart?.slice(0, 1) ?? '';
    return `${first || '*'}***@${domain}`;
  }

  private toEmailFailureDetails(error: unknown) {
    if (!(error instanceof Error)) {
      return {
        code: null as string | null,
        command: null as string | null,
        responseCode: null as string | number | null,
        message: 'unknown_email_provider_error',
      };
    }

    const candidate = error as Error & {
      code?: string;
      command?: string;
      responseCode?: number | string;
      response?: string;
    };

    return {
      code: candidate.code ?? null,
      command: candidate.command ?? null,
      responseCode:
        typeof candidate.responseCode === 'number' ||
        typeof candidate.responseCode === 'string'
          ? candidate.responseCode
          : null,
      message:
        candidate.message ||
        candidate.response ||
        'unknown_email_provider_error',
    };
  }

  private describeSmtpTransport(value: string) {
    if (!value) {
      return {
        valid: false,
        host: null as string | null,
        port: null as number | null,
        secure: false,
        hasAuthUser: false,
        parseError: 'smtp_url_missing' as string | null,
      };
    }

    try {
      const parsed = nodemailerShared.parseConnectionUrl(value);
      return {
        valid: Boolean(parsed.host),
        host:
          typeof parsed.host === 'string' && parsed.host.trim()
            ? parsed.host.trim()
            : null,
        port:
          typeof parsed.port === 'number' && Number.isFinite(parsed.port)
            ? parsed.port
            : null,
        secure: Boolean(parsed.secure),
        hasAuthUser: Boolean(parsed.auth?.user),
        parseError: null as string | null,
      };
    } catch {
      return {
        valid: false,
        host: null,
        port: null,
        secure: false,
        hasAuthUser: false,
        parseError: 'smtp_url_unparsable' as string | null,
      };
    }
  }

  private async sendWithSmtp(
    recipient: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const smtpUrl = process.env.SMTP_URL?.trim();
    if (!smtpUrl) {
      throw new Error('smtp_url_missing');
    }

    const transport = this.describeSmtpTransport(smtpUrl);
    this.logger.log(
      `smtp transport resolved host=${transport.host ?? 'unknown'} port=${
        transport.port ?? 'default'
      } secure=${transport.secure} authUser=${
        transport.hasAuthUser ? 'present' : 'missing'
      } valid=${transport.valid}`,
    );

    if (!transport.valid || !transport.host) {
      throw new Error(transport.parseError ?? 'smtp_url_unparsable');
    }

    const transporter = nodemailer.createTransport(
      nodemailerShared.parseConnectionUrl(smtpUrl),
    );
    const response = await transporter.sendMail({
      from: this.getEmailFromAddress(),
      to: recipient,
      subject,
      html,
      text,
    });

    return {
      messageId:
        this.readUnknownString(response.messageId) ??
        this.readUnknownString(response.response),
    };
  }

  private logEmailRuntimeSummary(context: 'startup' | 'diagnostic') {
    const summary = this.getEmailRuntimeSummary();
    this.logger.log(
      `email runtime ${context} provider=${summary.resolvedProvider ?? 'not_configured'} configuredProvider=${
        summary.configuredProvider ?? 'missing'
      } from=${summary.fromConfigured ? 'present' : 'missing'} smtpHost=${
        summary.smtp.host ?? 'unknown'
      } smtpPort=${summary.smtp.port ?? 'default'} smtpSecure=${summary.smtp.secure} smtpAuthUser=${
        summary.smtp.hasAuthUser ? 'present' : 'missing'
      } smtpValid=${summary.smtp.valid} smtpParseError=${summary.smtp.parseError ?? 'none'}`,
    );
  }

  private async sendWithResend(
    recipient: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const response = await this.fetchJson('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getEmailProviderToken('resend') ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.getEmailFromAddress(),
        to: [recipient],
        subject,
        html,
        text,
      }),
    });

    return { messageId: this.readUnknownString((response as any)?.id) };
  }

  private async sendWithSendGrid(
    recipient: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const response = await this.fetchJson(
      'https://api.sendgrid.com/v3/mail/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getEmailProviderToken('sendgrid') ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: this.parseEmailIdentity(this.getEmailFromAddress()),
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
        allowEmptyResponse: true,
      },
    );

    return { messageId: this.readUnknownString((response as any)?.messageId) };
  }

  private async sendWithPostmark(
    recipient: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const response = await this.fetchJson('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.getEmailProviderToken('postmark') ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        From: this.getEmailFromAddress(),
        To: recipient,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
      }),
    });

    return {
      messageId:
        this.readUnknownString((response as any)?.MessageID) ??
        this.readUnknownString((response as any)?.MessageId),
    };
  }

  private async sendWithMailgun(
    recipient: string,
    subject: string,
    html: string,
    text: string,
  ) {
    const domain = process.env.MAILGUN_DOMAIN?.trim();
    if (!domain) {
      throw new Error('mailgun_domain_missing');
    }

    const formData = new URLSearchParams({
      from: this.getEmailFromAddress(),
      to: recipient,
      subject,
      text,
      html,
    });
    const credentials = Buffer.from(
      `api:${this.getEmailProviderToken('mailgun') ?? ''}`,
    ).toString('base64');

    const response = await this.fetchJson(
      `https://api.mailgun.net/v3/${domain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      },
    );

    return { messageId: this.readUnknownString((response as any)?.id) };
  }

  private async fetchJson(
    url: string,
    input: {
      method: string;
      headers: Record<string, string>;
      body: string;
      allowEmptyResponse?: boolean;
    },
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        signal: controller.signal,
      });
      const bodyText = await response.text();

      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }

      if (!bodyText.trim()) {
        if (input.allowEmptyResponse) {
          return {};
        }
        return {};
      }

      try {
        return JSON.parse(bodyText);
      } catch {
        return { raw: bodyText };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseEmailIdentity(input: string) {
    const match = input.match(/^(.*)<([^>]+)>$/);
    if (!match) {
      return { email: input.trim() };
    }

    return {
      name: match[1].trim().replace(/^"|"$/g, '') || undefined,
      email: match[2].trim(),
    };
  }

  private defaultEmailHtmlTemplate(subject: string, message?: string | null) {
    return `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h1 style="font-size:20px">${this.escapeHtml(subject)}</h1><p>${this.escapeHtml(message ?? 'OpenStaff sent you a transactional update.')}</p></div>`;
  }

  private defaultEmailTextTemplate(subject: string, message?: string | null) {
    return `${subject}\n\n${message ?? 'OpenStaff sent you a transactional update.'}`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private readMetadataString(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
  ) {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private readUnknownString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private async updateEventStatusFromDeliveries(eventId: string) {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: { eventId },
      select: { status: true, deliveredAt: true, failedAt: true, readAt: true },
    });

    const hasRead = deliveries.some(
      (item) => item.status === NotificationStatus.READ || item.readAt,
    );
    const hasSent = deliveries.some(
      (item) => item.status === NotificationStatus.SENT || item.deliveredAt,
    );
    const hasFailed = deliveries.some(
      (item) => item.status === NotificationStatus.FAILED || item.failedAt,
    );

    await this.prisma.notificationEvent.update({
      where: { id: eventId },
      data: {
        status: hasRead
          ? NotificationStatus.READ
          : hasSent
            ? NotificationStatus.SENT
            : hasFailed
              ? NotificationStatus.FAILED
              : NotificationStatus.PENDING,
        deliveredAt: hasSent ? new Date() : null,
        failedAt: hasFailed ? new Date() : null,
        readAt: hasRead ? new Date() : null,
      },
    });
  }

  private async createWorkflowRunForEvent(
    event: {
      id: string;
      eventType: string;
      sourceType: string;
      sourceId: string;
      userId: string | null;
    },
    deliveries: Array<{
      id: string;
      channel: NotificationChannel;
      status: NotificationStatus;
    }>,
    input: EmitEventInput,
  ) {
    const matchingRules = await this.prisma.workflowAutomationRule.findMany({
      where: {
        eventType: input.eventType,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (matchingRules.length === 0) {
      await this.prisma.workflowAutomationRun.create({
        data: {
          eventId: event.id,
          triggeredByUserId: input.userId ?? null,
          status: 'COMPLETED',
          inputSnapshot: {
            eventType: input.eventType,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
          },
          outputData: {
            deliveries,
            mode: 'direct-event-bus',
          },
          completedAt: new Date(),
        },
      });
      return;
    }

    for (const rule of matchingRules) {
      await this.prisma.workflowAutomationRun.create({
        data: {
          ruleId: rule.id,
          eventId: event.id,
          triggeredByUserId: input.userId ?? null,
          status: 'COMPLETED',
          inputSnapshot: {
            eventType: input.eventType,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            config: rule.config,
          },
          outputData: {
            ruleName: rule.name,
            channel: rule.channel,
            deliveries,
          },
          completedAt: new Date(),
        },
      });
    }
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
      category: NotificationCategory.ADMIN,
      severity,
      title:
        input.status === ComplianceDocumentStatus.EXPIRED || daysUntilExpiry < 0
          ? 'Compliance expired'
          : 'Compliance reminder',
      message,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      scheduledFor: input.now,
      metadata: {
        daysUntilExpiry,
        keyPrefix: input.keyPrefix,
      },
    });

    return 1;
  }

  private normalizeMetadata(
    current?: Record<string, unknown> | null,
    extras?: Record<string, unknown> | null,
  ) {
    return {
      ...(current ?? {}),
      ...(extras ?? {}),
    };
  }

  private toJsonValue(
    value?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  private parseJson(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private isReadLikeStatus(status: NotificationStatus) {
    return (
      status === NotificationStatus.READ ||
      status === NotificationStatus.DISMISSED
    );
  }

  private toNotificationResponse(notification: any) {
    return {
      id: notification.id,
      key: notification.key,
      eventId: notification.eventId ?? null,
      userId: notification.userId,
      profileId: notification.profileId,
      actorId: notification.actorId ?? null,
      type: notification.type,
      category: notification.category ?? null,
      channel: notification.channel,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt ?? null,
      failedAt: notification.failedAt ?? null,
      readAt: notification.readAt,
      dismissedAt: notification.dismissedAt ?? null,
      metadata: notification.metadata ?? null,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private toEventResponse(event: any) {
    return {
      id: event.id,
      key: event.key ?? null,
      eventType: event.eventType,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      userId: event.userId,
      channel: event.channel,
      category: event.category ?? null,
      status: event.status,
      retryCount: event.retryCount,
      metadata: event.metadata ?? null,
      readAt: event.readAt ?? null,
      deliveredAt: event.deliveredAt ?? null,
      failedAt: event.failedAt ?? null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      user: event.user ?? null,
      notificationCount: event.notifications?.length ?? 0,
      deliveryCount: event.deliveries?.length ?? 0,
      notifications:
        event.notifications?.map((notification: any) => ({
          id: notification.id,
          status: notification.status,
          channel: notification.channel,
          title: notification.title,
        })) ?? [],
      deliveries:
        event.deliveries?.map((delivery: any) => ({
          id: delivery.id,
          channel: delivery.channel,
          status: delivery.status,
          retryCount: delivery.retryCount,
        })) ?? [],
    };
  }

  private toDeliveryResponse(delivery: any) {
    return {
      id: delivery.id,
      notificationId: delivery.notificationId ?? null,
      eventId: delivery.eventId ?? null,
      userId: delivery.userId ?? null,
      channel: delivery.channel,
      status: delivery.status,
      retryCount: delivery.retryCount,
      metadata: delivery.metadata ?? null,
      readAt: delivery.readAt ?? null,
      deliveredAt: delivery.deliveredAt ?? null,
      failedAt: delivery.failedAt ?? null,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
      user: delivery.user ?? null,
      event: delivery.event ?? null,
      notification: delivery.notification ?? null,
    };
  }

  private toPreferenceResponse(preference: any) {
    return {
      id: preference.id,
      userId: preference.userId,
      inAppEnabled: preference.inAppEnabled,
      emailEnabled: preference.emailEnabled,
      smsEnabled: preference.smsEnabled,
      categories: this.parseCategoryPreferences(preference.categoryPreferences),
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }

  private toWorkflowRunResponse(run: any) {
    return {
      id: run.id,
      status: run.status,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      completedAt: run.completedAt ?? null,
      inputSnapshot: run.inputSnapshot ?? null,
      outputData: run.outputData ?? null,
      rule: run.rule
        ? {
            id: run.rule.id,
            name: run.rule.name,
            eventType: run.rule.eventType,
            channel: run.rule.channel,
            isActive: run.rule.isActive,
          }
        : null,
      event: run.event ?? null,
      triggeredByUser: run.triggeredByUser ?? null,
      reviewedByUser: run.reviewedByUser ?? null,
    };
  }

  private daysBetween(left: Date, right: Date) {
    return Math.floor(
      (right.getTime() - left.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
