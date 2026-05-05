import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuditService } from './audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/audit-logs')
  async listProjectAuditLogs(@Param('projectId') projectId: string, @Req() req: any) {
    return this.auditService.listProjectAuditLogs(projectId, req.user);
  }
}
