import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationCategory, NotificationChannel } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';

type AuthenticatedUser = {
  sub?: string;
  role?: string;
  email?: string;
};

type FunnelEventType =
  | 'LANDING_PAGE_VISIT'
  | 'REGISTER_STARTED'
  | 'PUBLISH_STARTED';

type FeedbackType =
  | 'ONBOARDING_FRICTION'
  | 'MODERATION_CONFUSION'
  | 'BILLING_CONFUSION'
  | 'SUPPORT_PAIN_POINT'
  | 'FAILED_FLOW'
  | 'OPERATOR_ESCALATION'
  | 'REPEATED_USER_CONFUSION';

const ALLOWED_FUNNEL_EVENTS: FunnelEventType[] = [
  'LANDING_PAGE_VISIT',
  'REGISTER_STARTED',
  'PUBLISH_STARTED',
];

const ALLOWED_FEEDBACK_TYPES: FeedbackType[] = [
  'ONBOARDING_FRICTION',
  'MODERATION_CONFUSION',
  'BILLING_CONFUSION',
  'SUPPORT_PAIN_POINT',
  'FAILED_FLOW',
  'OPERATOR_ESCALATION',
  'REPEATED_USER_CONFUSION',
];

@Injectable()
export class RolloutIntelligenceService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async recordFunnelEvent(
    input: {
      eventType: string;
      surface?: string;
      sourceId?: string;
      metadata?: Record<string, unknown> | null;
      dedupeKey?: string | null;
    },
    request?: any,
    user?: AuthenticatedUser | null,
  ) {
    if (!ALLOWED_FUNNEL_EVENTS.includes(input.eventType as FunnelEventType)) {
      throw new BadRequestException('Unsupported funnel event type.');
    }

    const surface = this.cleanText(input.surface, 80) ?? 'public-web';
    const sourceId = this.cleanText(input.sourceId, 120) ?? surface;
    const metadata = this.sanitizeMetadata(input.metadata);
    const requestContext = this.auditService.extractRequestContext(request);
    const eventKey =
      this.cleanText(input.dedupeKey, 160) ??
      [
        'rollout-funnel',
        input.eventType,
        sourceId,
        user?.sub ?? 'anonymous',
        requestContext.requestId ?? randomUUID(),
      ].join(':');

    await this.notificationService.emitEvent({
      key: eventKey,
      eventType: input.eventType,
      sourceType: 'ROLLOUT_FUNNEL',
      sourceId,
      userId: user?.sub ?? null,
      actorId: user?.sub ?? null,
      category: NotificationCategory.ADMIN,
      channel: NotificationChannel.SYSTEM,
      channels: [NotificationChannel.SYSTEM],
      title: this.titleForFunnelEvent(input.eventType as FunnelEventType),
      message: this.messageForFunnelEvent(
        input.eventType as FunnelEventType,
        surface,
      ),
      metadata: {
        surface,
        role: user?.role ?? 'anonymous',
        ...metadata,
      },
      relatedEntityType: 'RolloutFunnelEvent',
      relatedEntityId: sourceId,
      skipNotification: true,
    });

    await this.auditService.log({
      actorUserId: user?.sub ?? null,
      entityType: 'ROLLOUT_FUNNEL',
      entityId: sourceId,
      action: input.eventType,
      category: 'ROLLOUT_INTELLIGENCE',
      metadata: {
        surface,
        role: user?.role ?? 'anonymous',
        ...metadata,
      },
      request,
    });

    return { recorded: true };
  }

  async recordOperationalFeedback(
    input: {
      feedbackType: string;
      surface?: string;
      summary?: string;
      metadata?: Record<string, unknown> | null;
    },
    request?: any,
    user?: AuthenticatedUser | null,
  ) {
    if (!ALLOWED_FEEDBACK_TYPES.includes(input.feedbackType as FeedbackType)) {
      throw new BadRequestException('Unsupported operational feedback type.');
    }

    const surface = this.cleanText(input.surface, 80) ?? 'unknown-surface';
    const summary = this.cleanText(input.summary, 300) ?? '';
    const metadata = this.sanitizeMetadata(input.metadata);
    const requestContext = this.auditService.extractRequestContext(request);
    const sourceId = [
      input.feedbackType,
      surface,
      user?.sub ?? 'anonymous',
      requestContext.requestId ?? randomUUID(),
    ].join(':');

    await this.notificationService.emitEvent({
      key: `operational-feedback:${sourceId}`,
      eventType: `OPERATIONAL_FEEDBACK_${input.feedbackType}`,
      sourceType: 'OPERATIONAL_FEEDBACK',
      sourceId,
      userId: user?.sub ?? null,
      actorId: user?.sub ?? null,
      category: NotificationCategory.ADMIN,
      channel: NotificationChannel.SYSTEM,
      channels: [NotificationChannel.SYSTEM],
      title: this.titleForFeedback(input.feedbackType as FeedbackType),
      message: summary || `${input.feedbackType} reported on ${surface}.`,
      metadata: {
        surface,
        role: user?.role ?? 'anonymous',
        summary,
        ...metadata,
      },
      relatedEntityType: 'OperationalFeedback',
      relatedEntityId: sourceId,
      skipNotification: true,
    });

    await this.auditService.log({
      actorUserId: user?.sub ?? null,
      entityType: 'OPERATIONAL_FEEDBACK',
      entityId: sourceId,
      action: input.feedbackType,
      category: 'ROLLOUT_INTELLIGENCE',
      metadata: {
        surface,
        role: user?.role ?? 'anonymous',
        summary,
        ...metadata,
      },
      request,
    });

    return { recorded: true };
  }

  private titleForFunnelEvent(eventType: FunnelEventType) {
    switch (eventType) {
      case 'LANDING_PAGE_VISIT':
        return 'Landing page visit recorded';
      case 'REGISTER_STARTED':
        return 'Registration start recorded';
      case 'PUBLISH_STARTED':
        return 'Publish flow start recorded';
    }
  }

  private messageForFunnelEvent(eventType: FunnelEventType, surface: string) {
    switch (eventType) {
      case 'LANDING_PAGE_VISIT':
        return `A landing-page visit was recorded on ${surface}.`;
      case 'REGISTER_STARTED':
        return `A registration flow was started on ${surface}.`;
      case 'PUBLISH_STARTED':
        return `A publish flow was started on ${surface}.`;
    }
  }

  private titleForFeedback(feedbackType: FeedbackType) {
    return feedbackType
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private sanitizeMetadata(metadata?: Record<string, unknown> | null) {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(metadata)
        .filter(
          ([key]) => !/(token|secret|password|authorization|cookie)/i.test(key),
        )
        .slice(0, 12)
        .map(([key, value]) => [key, this.normalizeValue(value)]),
    );
  }

  private normalizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.cleanText(value, 180) ?? '';
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 10).map((item) => this.normalizeValue(item));
    }

    if (typeof value === 'object' && value) {
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 8)
          .map(([key, nestedValue]) => [key, this.normalizeValue(nestedValue)]),
      );
    }

    return String(value);
  }

  private cleanText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return null;
    }

    return normalized.slice(0, maxLength);
  }
}
