import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permission, Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { AccessControlService } from './access-control.service';

@Controller('admin/roles')
@UseGuards(JwtGuard, new RolesGuard([Role.SUPERADMIN]))
export class AdminRolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  async findAll() {
    try {
      const roles = await this.accessControlService.listRolePermissions();
      return buildSuccessResponse(roles, 'placeholder');
    } catch (error) {
      logEndpointError('AdminRolesController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Put(':role/permissions')
  async updatePermissions(
    @Param('role') role: string,
    @Body() body: { permissions?: Permission[] },
  ) {
    const normalizedRole = role.toUpperCase() as Role;

    try {
      const updatedRole = await this.accessControlService.updateRolePermissions(
        normalizedRole,
        Array.isArray(body.permissions) ? body.permissions : [],
      );

      return buildSuccessResponse(updatedRole);
    } catch (error) {
      logEndpointError('AdminRolesController.updatePermissions', error);
      return buildInternalErrorResponse(error);
    }
  }
}
