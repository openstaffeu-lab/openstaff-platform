import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildSuccessResponse } from '../common/api-response';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actorUserId?: string | null;
    projectId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        ...(input.projectId ? { projectId: input.projectId } : {}),
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        beforeJson: this.serialize(input.before),
        afterJson: this.serialize(input.after),
        metadataJson: this.serialize(input.metadata),
      },
    });
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
      throw new ForbiddenException('You do not have access to this audit timeline');
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
      },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return buildSuccessResponse(logs.map((log) => this.toAuditResponse(log)));
  }

  private toAuditResponse(log: any) {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      projectId: log.projectId,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      beforeJson: this.parse(log.beforeJson),
      afterJson: this.parse(log.afterJson),
      metadataJson: this.parse(log.metadataJson),
      createdAt: log.createdAt,
      actorUser: log.actorUser ?? null,
    };
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
}
