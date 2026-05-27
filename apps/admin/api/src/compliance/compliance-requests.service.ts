import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
  email?: string;
};

@Injectable()
export class ComplianceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async createExportRequest(user: AuthenticatedUser, request?: any) {
    const complianceRequest = await this.prisma.complianceRequest.create({
      data: {
        userId: user.sub,
        type: 'DATA_EXPORT' as any,
        status: 'PENDING' as any,
        secureDownloadToken: `pending-export-${Date.now()}`,
        metadata: {
          requestedByEmail: user.email ?? null,
          placeholder: true,
        },
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      targetUserId: user.sub,
      entityType: 'COMPLIANCE_REQUEST',
      entityId: complianceRequest.id,
      action: 'DATA_EXPORT_REQUESTED',
      category: 'COMPLIANCE',
      after: complianceRequest,
      request,
    });

    await this.auditService.logSecurityEvent({
      userId: user.sub,
      type: 'DATA_EXPORT' as any,
      category: 'COMPLIANCE',
      sourceType: 'COMPLIANCE_REQUEST',
      sourceId: complianceRequest.id,
      status: 'PENDING' as any,
      severity: 'INFO' as any,
      message: 'User requested data export',
      request,
    });

    await this.notificationService.emitEvent({
      key: `compliance:export:${complianceRequest.id}`,
      eventType: 'COMPLIANCE_EXPORT_REQUESTED',
      sourceType: 'COMPLIANCE_REQUEST',
      sourceId: complianceRequest.id,
      userId: user.sub,
      category: NotificationCategory.ACCOUNT,
      title: 'Data export request received',
      message: 'Your data export request is queued for compliance review.',
      relatedEntityType: 'ComplianceRequest',
      relatedEntityId: complianceRequest.id,
      metadata: {
        type: complianceRequest.type,
        status: complianceRequest.status,
      },
    });

    return complianceRequest;
  }

  async createDeleteRequest(user: AuthenticatedUser, request?: any) {
    const complianceRequest = await this.prisma.complianceRequest.create({
      data: {
        userId: user.sub,
        type: 'ACCOUNT_DELETE' as any,
        status: 'PENDING' as any,
        metadata: {
          requestedByEmail: user.email ?? null,
          placeholder: true,
          automaticDeletionEnabled: false,
        },
      },
    });

    await this.auditService.log({
      actorUserId: user.sub,
      targetUserId: user.sub,
      entityType: 'COMPLIANCE_REQUEST',
      entityId: complianceRequest.id,
      action: 'ACCOUNT_DELETE_REQUESTED',
      category: 'COMPLIANCE',
      after: complianceRequest,
      request,
    });

    await this.auditService.logSecurityEvent({
      userId: user.sub,
      type: 'ACCOUNT_DELETE_REQUEST' as any,
      category: 'COMPLIANCE',
      sourceType: 'COMPLIANCE_REQUEST',
      sourceId: complianceRequest.id,
      status: 'PENDING' as any,
      severity: 'WARNING' as any,
      message: 'User requested account deletion review',
      request,
    });

    await this.notificationService.emitEvent({
      key: `compliance:delete:${complianceRequest.id}`,
      eventType: 'COMPLIANCE_DELETE_REQUESTED',
      sourceType: 'COMPLIANCE_REQUEST',
      sourceId: complianceRequest.id,
      userId: user.sub,
      category: NotificationCategory.ACCOUNT,
      title: 'Delete request received',
      message: 'Your account deletion request is queued for compliance review.',
      relatedEntityType: 'ComplianceRequest',
      relatedEntityId: complianceRequest.id,
      metadata: {
        type: complianceRequest.type,
        status: complianceRequest.status,
      },
    });

    return complianceRequest;
  }

  async listAdminRequests(actor: AuthenticatedUser) {
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Only administrators can review compliance requests',
      );
    }

    return this.auditService.listAdminComplianceRequests();
  }
}
