import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { AuditService } from './audit.service';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';

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
}
