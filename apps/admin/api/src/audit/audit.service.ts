import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildSuccessResponse } from '../common/api-response';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type RequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

type SecurityEventTypeValue =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_RESET'
  | 'MFA_EVENT'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_TRIGGERED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'ADMIN_OVERRIDE'
  | 'DATA_EXPORT'
  | 'ACCOUNT_DELETE_REQUEST';

type SecurityEventStatusValue = 'PENDING' | 'RESOLVED' | 'DISMISSED';
type SecurityEventSeverityValue = 'INFO' | 'WARNING' | 'CRITICAL';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  extractRequestContext(request?: any): RequestContext {
    const forwarded = request?.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : null;
    const userAgentHeader = request?.headers?.['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader[0]
      : userAgentHeader;

    return {
      ipAddress:
        forwardedIp ?? request?.ip ?? request?.socket?.remoteAddress ?? null,
      userAgent: userAgent ?? null,
      requestId:
        request?.requestId ?? request?.headers?.['x-request-id'] ?? null,
    };
  }

  async log(input: {
    actorUserId?: string | null;
    targetUserId?: string | null;
    projectId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    category?: string | null;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    request?: any;
  }) {
    const context = input.request
      ? this.extractRequestContext(input.request)
      : undefined;

    return this.prisma.auditLog.create({
      data: {
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
        ...(input.projectId ? { projectId: input.projectId } : {}),
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        category: input.category ?? null,
        beforeJson: this.serialize(input.before),
        afterJson: this.serialize(input.after),
        metadataJson: this.serialize(input.metadata),
        ipAddress: input.ipAddress ?? context?.ipAddress ?? null,
        userAgent: input.userAgent ?? context?.userAgent ?? null,
        requestId: input.requestId ?? context?.requestId ?? null,
      } as any,
    });
  }

  async logSecurityEvent(input: {
    userId?: string | null;
    reviewedByUserId?: string | null;
    type: SecurityEventTypeValue;
    message: string;
    category?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    status?: SecurityEventStatusValue;
    severity?: SecurityEventSeverityValue;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    request?: any;
  }) {
    const context = input.request
      ? this.extractRequestContext(input.request)
      : undefined;

    return this.prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        reviewedByUserId: input.reviewedByUserId ?? null,
        type: input.type,
        message: input.message,
        category: input.category ?? null,
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        status: input.status ?? 'PENDING',
        severity: input.severity ?? 'INFO',
        metadata: this.toJsonValue(input.metadata),
        ipAddress: input.ipAddress ?? context?.ipAddress ?? null,
        userAgent: input.userAgent ?? context?.userAgent ?? null,
        requestId: input.requestId ?? context?.requestId ?? null,
      },
    });
  }

  async createOrUpdateSession(input: {
    userId: string;
    refreshTokenHash?: string | null;
    request?: any;
    deviceLabel?: string | null;
  }) {
    const context = this.extractRequestContext(input.request);
    const fingerprintHash = this.computeFingerprintHash({
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    const deviceFingerprint = await this.prisma.userDeviceFingerprint.upsert({
      where: {
        userId_fingerprintHash: {
          userId: input.userId,
          fingerprintHash,
        },
      },
      update: {
        lastSeenAt: new Date(),
        deviceLabel: input.deviceLabel ?? null,
        browser: this.extractBrowser(context.userAgent),
        os: this.extractOs(context.userAgent),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      create: {
        userId: input.userId,
        fingerprintHash,
        deviceLabel: input.deviceLabel ?? null,
        browser: this.extractBrowser(context.userAgent),
        os: this.extractOs(context.userAgent),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        lastSeenAt: new Date(),
      },
    });

    const activeSession = await this.prisma.userSession.findFirst({
      where: {
        userId: input.userId,
        userDeviceFingerprintId: deviceFingerprint.id,
        revokedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const session = activeSession
      ? await this.prisma.userSession.update({
          where: { id: activeSession.id },
          data: {
            refreshTokenHash: input.refreshTokenHash ?? null,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceLabel: input.deviceLabel ?? activeSession.deviceLabel ?? null,
            lastActivityAt: new Date(),
            revokedAt: null,
          },
        })
      : await this.prisma.userSession.create({
          data: {
            userId: input.userId,
            userDeviceFingerprintId: deviceFingerprint.id,
            refreshTokenHash: input.refreshTokenHash ?? null,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceLabel: input.deviceLabel ?? null,
            lastActivityAt: new Date(),
          },
        });

    return this.toSessionResponse(session, deviceFingerprint);
  }

  async revokeSession(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        deviceFingerprint: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (
      actor.role !== 'ADMIN' &&
      actor.role !== 'SUPERADMIN' &&
      session.userId !== actor.sub
    ) {
      throw new ForbiddenException('You do not have access to this session');
    }

    const revokedAt = new Date();
    const updated = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt,
        lastActivityAt: revokedAt,
      },
      include: {
        deviceFingerprint: true,
      },
    });

    if (session.refreshTokenHash) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: session.userId },
        select: { refreshTokenHash: true },
      });

      if (currentUser?.refreshTokenHash === session.refreshTokenHash) {
        await this.prisma.user.update({
          where: { id: session.userId },
          data: { refreshTokenHash: null },
        });
      }
    }

    return this.toSessionResponse(updated, updated.deviceFingerprint ?? null);
  }

  async revokeAllSessionsForUser(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  async listUserSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      include: { deviceFingerprint: true },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return sessions.map((session) =>
      this.toSessionResponse(session, session.deviceFingerprint ?? null),
    );
  }

  async listAdminSessions() {
    const sessions = await this.prisma.userSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        deviceFingerprint: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
    });

    return sessions.map((session) => ({
      ...this.toSessionResponse(session, session.deviceFingerprint ?? null),
      user: session.user,
    }));
  }

  async listProjectAuditLogs(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN' &&
      project.createdById !== user.sub
    ) {
      throw new ForbiddenException(
        'You do not have access to this audit timeline',
      );
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        projectId,
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(logs.map((log) => this.toAuditResponse(log)));
  }

  async listAiAuditLogs(user: AuthenticatedUser) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('You do not have access to AI audit logs');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'RELU_TASK' },
          { entityType: 'GEMINI_AGENT' },
          { action: { startsWith: 'RELU_' } },
        ],
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return buildSuccessResponse(logs.map((log) => this.toAuditResponse(log)));
  }

  async listAdminAuditLogs(filters?: {
    q?: string;
    category?: string;
    entityType?: string;
  }) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.q
          ? {
              OR: [
                { action: { contains: filters.q, mode: 'insensitive' } },
                { entityType: { contains: filters.q, mode: 'insensitive' } },
                { entityId: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      } as any,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });

    return logs.map((log) => this.toAuditResponse(log));
  }

  async listAdminSecurityEvents(filters?: { type?: string; status?: string }) {
    const events = (await this.prisma.securityEvent.findMany({
      where: {
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      } as any,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      } as any,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    })) as any[];

    return events.map((event) => ({
      id: event.id,
      userId: event.userId,
      type: event.type,
      category: event.category,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      status: event.status,
      severity: event.severity,
      message: event.message,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      requestId: event.requestId,
      reviewedAt: event.reviewedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      user: event.user ?? null,
      reviewedByUser: event.reviewedByUser ?? null,
    }));
  }

  async updateSecurityEventStatus(
    id: string,
    status: string,
    reviewerUserId: string,
  ) {
    const event = await this.prisma.securityEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Security event not found');
    }

    return this.prisma.securityEvent.update({
      where: { id },
      data: {
        status,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
      } as any,
    }) as any;
  }

  async listAdminComplianceRequests() {
    const requests = await this.prisma.complianceRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });

    return requests.map((request) => ({
      id: request.id,
      userId: request.userId,
      type: request.type,
      status: request.status,
      requestedAt: request.requestedAt,
      reviewedAt: request.reviewedAt,
      secureDownloadToken: request.secureDownloadToken,
      exportData: request.exportData,
      metadata: request.metadata,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: request.user,
      reviewedByUser: request.reviewedByUser ?? null,
    }));
  }

  private toAuditResponse(log: any) {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      targetUserId: log.targetUserId,
      projectId: log.projectId,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      category: log.category,
      beforeJson: this.parse(log.beforeJson),
      afterJson: this.parse(log.afterJson),
      metadataJson: this.parse(log.metadataJson),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      requestId: log.requestId,
      createdAt: log.createdAt,
      actorUser: log.actorUser ?? null,
      targetUser: log.targetUser ?? null,
    };
  }

  private toSessionResponse(session: any, deviceFingerprint: any) {
    return {
      id: session.id,
      userId: session.userId,
      deviceFingerprintId: session.userDeviceFingerprintId,
      deviceLabel:
        session.deviceLabel ?? deviceFingerprint?.deviceLabel ?? null,
      browser: deviceFingerprint?.browser ?? null,
      os: deviceFingerprint?.os ?? null,
      ipAddress: session.ipAddress ?? deviceFingerprint?.ipAddress ?? null,
      userAgent: session.userAgent ?? deviceFingerprint?.userAgent ?? null,
      lastActivityAt: session.lastActivityAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private computeFingerprintHash(input: {
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    return createHash('sha256')
      .update(`${input.userAgent ?? 'unknown'}|${input.ipAddress ?? 'unknown'}`)
      .digest('hex');
  }

  private extractBrowser(userAgent?: string | null) {
    const source = (userAgent ?? '').toLowerCase();
    if (!source) {
      return null;
    }
    if (source.includes('edg/')) {
      return 'Edge';
    }
    if (source.includes('chrome/')) {
      return 'Chrome';
    }
    if (source.includes('firefox/')) {
      return 'Firefox';
    }
    if (source.includes('safari/')) {
      return 'Safari';
    }
    return 'Unknown';
  }

  private extractOs(userAgent?: string | null) {
    const source = (userAgent ?? '').toLowerCase();
    if (!source) {
      return null;
    }
    if (source.includes('windows')) {
      return 'Windows';
    }
    if (source.includes('mac os')) {
      return 'macOS';
    }
    if (source.includes('android')) {
      return 'Android';
    }
    if (
      source.includes('iphone') ||
      source.includes('ipad') ||
      source.includes('ios')
    ) {
      return 'iOS';
    }
    if (source.includes('linux')) {
      return 'Linux';
    }
    return 'Unknown';
  }

  private serialize(value: unknown) {
    if (value === undefined) {
      return null;
    }

    try {
      return value === null ? null : JSON.stringify(value);
    } catch {
      return JSON.stringify({ error: 'Failed to serialize audit payload' });
    }
  }

  private parse(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private toJsonValue(value: Record<string, unknown> | null | undefined) {
    if (!value) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }
}
