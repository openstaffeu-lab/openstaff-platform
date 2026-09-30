import { Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ProjectWriteEvidenceAdapter } from './project-write-evidence.adapter';

describe('ProjectWriteEvidenceAdapter', () => {
  const auditServiceMock = {
    log: jest.fn(),
  };

  let adapter: ProjectWriteEvidenceAdapter;

  const project = {
    id: 'project-1',
    slug: 'safe-project',
    createdById: 'owner-1',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    engagementModel: 'MIXED',
    publishedAt: null,
    archivedAt: null,
    summary: 'must not be logged',
    description: 'must not be logged',
    scopeOfWork: 'must not be logged',
    addressLine1: 'must not be logged',
    latitude: 44.43,
    storageKey: 'must-not-be-logged',
    extractedJson: { unsafe: true },
  };

  beforeEach(() => {
    auditServiceMock.log.mockReset();
    auditServiceMock.log.mockResolvedValue({ id: 'audit-1' });
    adapter = new ProjectWriteEvidenceAdapter(
      auditServiceMock as unknown as AuditService,
    );
  });

  it('creates compact allowlisted snapshots without prohibited fields', () => {
    const snapshot = adapter.toSnapshot(project);

    expect(snapshot).toEqual({
      id: 'project-1',
      slug: 'safe-project',
      createdById: 'owner-1',
      status: 'DRAFT',
      visibility: 'PRIVATE',
      engagementModel: 'MIXED',
      publishedAt: null,
      archivedAt: null,
    });
    expect(snapshot).not.toHaveProperty('summary');
    expect(snapshot).not.toHaveProperty('description');
    expect(snapshot).not.toHaveProperty('scopeOfWork');
    expect(snapshot).not.toHaveProperty('addressLine1');
    expect(snapshot).not.toHaveProperty('latitude');
    expect(snapshot).not.toHaveProperty('storageKey');
    expect(snapshot).not.toHaveProperty('extractedJson');
  });

  it('calculates changed fields only from the snapshot allowlist', () => {
    const before = adapter.toSnapshot(project);
    const after = adapter.toSnapshot({
      ...project,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      publishedAt: new Date('2026-08-20T10:00:00.000Z'),
      description: 'changed but prohibited',
    });

    expect(adapter.getChangedFields(before, after)).toEqual([
      { field: 'status', before: 'DRAFT', after: 'PUBLISHED' },
      { field: 'visibility', before: 'PRIVATE', after: 'PUBLIC' },
      {
        field: 'publishedAt',
        before: null,
        after: '2026-08-20T10:00:00.000Z',
      },
    ]);
  });

  it('records Project creation evidence with request correlation', async () => {
    const request = {
      requestId: 'req-1',
      headers: {
        'x-request-id': 'req-header',
        'user-agent': 'jest',
      },
      ip: '127.0.0.1',
    };

    await adapter.recordProjectCreated({
      project,
      actor: { sub: 'owner-1', role: 'EMPLOYER' },
      request,
    });

    expect(auditServiceMock.log).toHaveBeenCalledTimes(1);
    expect(auditServiceMock.log).toHaveBeenCalledWith({
      actorUserId: 'owner-1',
      targetUserId: 'owner-1',
      projectId: 'project-1',
      entityType: 'PROJECT',
      entityId: 'project-1',
      action: 'PROJECT_CREATED',
      category: 'PROJECT_WRITE_EVIDENCE',
      before: null,
      after: adapter.toSnapshot(project),
      metadata: expect.objectContaining({
        operation: 'FIU1-PRJ-CREATE',
        actorRole: 'EMPLOYER',
        permissionReference: 'JWT+WRITE+ROLE_OBSERVED',
        actingEntity: 'ACTING_ENTITY_NOT_CANONICALLY_RESOLVED',
        idempotency: 'IDEMPOTENCY_NOT_AVAILABLE_IN_FIU1',
      }),
      request,
    });
  });

  it('records Project update evidence with safe before and after state', async () => {
    await adapter.recordProjectUpdated({
      beforeProject: project,
      afterProject: {
        ...project,
        status: 'ACTIVE',
        archivedAt: new Date('2026-08-20T12:00:00.000Z'),
      },
      actor: { sub: 'admin-1', role: 'ADMIN' },
    });

    expect(auditServiceMock.log).toHaveBeenCalledTimes(1);
    const payload = auditServiceMock.log.mock.calls[0][0];

    expect(payload.action).toBe('PROJECT_UPDATED');
    expect(payload.before).toEqual(adapter.toSnapshot(project));
    expect(payload.after).toEqual(
      adapter.toSnapshot({
        ...project,
        status: 'ACTIVE',
        archivedAt: new Date('2026-08-20T12:00:00.000Z'),
      }),
    );
    expect(payload.metadata.changedFields).toEqual([
      { field: 'status', before: 'DRAFT', after: 'ACTIVE' },
      {
        field: 'archivedAt',
        before: null,
        after: '2026-08-20T12:00:00.000Z',
      },
    ]);
    expect(payload.metadata.accessPolicyContext).toEqual({
      actorUserId: 'admin-1',
      projectOwnerUserId: 'owner-1',
      ownerMatch: false,
      adminActor: true,
    });
  });

  it('does not throw when audit logging fails', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    auditServiceMock.log.mockRejectedValue(new Error('audit unavailable'));

    await expect(
      adapter.recordProjectCreated({
        project,
        actor: { sub: 'owner-1', role: 'EMPLOYER' },
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      'FIU-1 project write evidence failed for PROJECT_CREATED on project project-1',
      expect.any(String),
    );

    errorSpy.mockRestore();
  });
});
