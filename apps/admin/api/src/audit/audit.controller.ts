import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { AuditService } from './audit.service';
import { buildInternalErrorResponse, buildSuccessResponse, logEndpointError } from '../common/api-response';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/audit-logs')
  async listProjectAuditLogs(@Param('projectId') projectId: string, @Req() req: any) {
    try {
      return await this.auditService.listProjectAuditLogs(projectId, req.user);
    } catch (error) {
      logEndpointError('AuditController.listProjectAuditLogs', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('audit/ai-actions')
  async listAiAuditLogs(@Req() req: any) {
    try {
      return await this.auditService.listAiAuditLogs(req.user);
    } catch (error) {
      logEndpointError('AuditController.listAiAuditLogs', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/security/audit-logs')
  async listAdminAuditLogs(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('entityType') entityType?: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.auditService.listAdminAuditLogs({ q, category, entityType }),
      );
    } catch (error) {
      logEndpointError('AuditController.listAdminAuditLogs', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/security/events')
  async listAdminSecurityEvents(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.auditService.listAdminSecurityEvents({ type, status }),
      );
    } catch (error) {
      logEndpointError('AuditController.listAdminSecurityEvents', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/security/events/:id/status')
  async updateSecurityEventStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Query('status') status: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.auditService.updateSecurityEventStatus(id, status, req.user.sub),
      );
    } catch (error) {
      logEndpointError('AuditController.updateSecurityEventStatus', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/security/sessions')
  async listAdminSessions() {
    try {
      return buildSuccessResponse(await this.auditService.listAdminSessions());
    } catch (error) {
      logEndpointError('AuditController.listAdminSessions', error);
      return buildInternalErrorResponse(error);
    }
  }
}
