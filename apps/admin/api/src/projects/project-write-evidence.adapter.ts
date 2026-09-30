import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type ProjectSnapshotSource = {
  id: string;
  slug: string;
  createdById: string;
  status: string;
  visibility: string;
  engagementModel: string;
  publishedAt?: Date | string | null;
  archivedAt?: Date | string | null;
};

export type ProjectEvidenceSnapshot = {
  id: string;
  slug: string;
  createdById: string;
  status: string;
  visibility: string;
  engagementModel: string;
  publishedAt: string | null;
  archivedAt: string | null;
};

export type ProjectEvidenceChangedField = {
  field: keyof ProjectEvidenceSnapshot;
  before: ProjectEvidenceSnapshot[keyof ProjectEvidenceSnapshot];
  after: ProjectEvidenceSnapshot[keyof ProjectEvidenceSnapshot];
};

@Injectable()
export class ProjectWriteEvidenceAdapter {
  private readonly logger = new Logger(ProjectWriteEvidenceAdapter.name);

  constructor(private readonly auditService: AuditService) {}

  toSnapshot(project: ProjectSnapshotSource): ProjectEvidenceSnapshot {
    return {
      id: project.id,
      slug: project.slug,
      createdById: project.createdById,
      status: project.status,
      visibility: project.visibility,
      engagementModel: project.engagementModel,
      publishedAt: this.toIsoString(project.publishedAt),
      archivedAt: this.toIsoString(project.archivedAt),
    };
  }

  getChangedFields(
    before: ProjectEvidenceSnapshot,
    after: ProjectEvidenceSnapshot,
  ): ProjectEvidenceChangedField[] {
    const fields = Object.keys(before) as Array<keyof ProjectEvidenceSnapshot>;

    return fields
      .filter((field) => before[field] !== after[field])
      .map((field) => ({
        field,
        before: before[field],
        after: after[field],
      }));
  }

  async recordProjectCreated(input: {
    project: ProjectSnapshotSource;
    actor: AuthenticatedUser;
    request?: any;
  }) {
    const after = this.toSnapshot(input.project);

    await this.safeLog({
      actorUserId: input.actor.sub,
      targetUserId: input.project.createdById,
      projectId: input.project.id,
      entityId: input.project.id,
      action: 'PROJECT_CREATED',
      before: null,
      after,
      metadata: {
        operation: 'FIU1-PRJ-CREATE',
        actorRole: input.actor.role,
        permissionReference: 'JWT+WRITE+ROLE_OBSERVED',
        accessPolicyContext: {
          actorUserId: input.actor.sub,
          projectOwnerUserId: input.project.createdById,
          ownerMatch: input.actor.sub === input.project.createdById,
          adminActor: this.isAdmin(input.actor),
        },
        changedFields: [],
        source: 'projects.controller:POST /projects',
        actingEntity: 'ACTING_ENTITY_NOT_CANONICALLY_RESOLVED',
        idempotency: 'IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1',
      },
      request: input.request,
    });
  }

  async recordProjectUpdated(input: {
    beforeProject: ProjectSnapshotSource;
    afterProject: ProjectSnapshotSource;
    actor: AuthenticatedUser;
    request?: any;
  }) {
    const before = this.toSnapshot(input.beforeProject);
    const after = this.toSnapshot(input.afterProject);
    const changedFields = this.getChangedFields(before, after);

    await this.safeLog({
      actorUserId: input.actor.sub,
      targetUserId: input.afterProject.createdById,
      projectId: input.afterProject.id,
      entityId: input.afterProject.id,
      action: 'PROJECT_UPDATED',
      before,
      after,
      metadata: {
        operation: 'FIU1-PRJ-UPDATE',
        actorRole: input.actor.role,
        permissionReference: 'JWT+WRITE+ROLE+OWNER_OR_ADMIN_OBSERVED',
        accessPolicyContext: {
          actorUserId: input.actor.sub,
          projectOwnerUserId: input.afterProject.createdById,
          ownerMatch: input.actor.sub === input.afterProject.createdById,
          adminActor: this.isAdmin(input.actor),
        },
        changedFields,
        source: 'projects.controller:PATCH /projects/:projectId',
        actingEntity: 'ACTING_ENTITY_NOT_CANONICALLY_RESOLVED',
        idempotency: 'IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1',
      },
      request: input.request,
    });
  }

  private async safeLog(input: {
    actorUserId: string;
    targetUserId: string;
    projectId: string;
    entityId: string;
    action: string;
    before: ProjectEvidenceSnapshot | null;
    after: ProjectEvidenceSnapshot;
    metadata: Record<string, unknown>;
    request?: any;
  }) {
    try {
      await this.auditService.log({
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        projectId: input.projectId,
        entityType: 'PROJECT',
        entityId: input.entityId,
        action: input.action,
        category: 'PROJECT_WRITE_EVIDENCE',
        before: input.before,
        after: input.after,
        metadata: input.metadata,
        request: input.request,
      });
    } catch (error) {
      this.logger.error(
        `FIU-1 project write evidence failed for ${input.action} on project ${input.projectId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private isAdmin(actor: AuthenticatedUser) {
    return actor.role === 'ADMIN' || actor.role === 'SUPERADMIN';
  }

  private toIsoString(value?: Date | string | null) {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return new Date(value).toISOString();
  }
}
