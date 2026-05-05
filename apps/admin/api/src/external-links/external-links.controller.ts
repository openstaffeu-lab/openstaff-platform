import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { ExternalLinksService } from './external-links.service';

@Controller('admin/external-links')
@RequirePermissions(Permission.MANAGE_USERS)
@UseGuards(JwtGuard, PermissionsGuard)
export class ExternalLinksController {
  constructor(private readonly externalLinksService: ExternalLinksService) {}

  @Get()
  async listForAdmin() {
    try {
      return await this.externalLinksService.listForAdmin();
    } catch (error) {
      logEndpointError('ExternalLinksController.listForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { securityStatus?: string; status?: string },
  ) {
    try {
      return await this.externalLinksService.updateStatus(
        id,
        typeof body.securityStatus === 'string'
          ? body.securityStatus
          : typeof body.status === 'string'
            ? body.status
            : 'PENDING',
      );
    } catch (error) {
      logEndpointError('ExternalLinksController.updateStatus', error);
      return buildInternalErrorResponse(error);
    }
  }
}
