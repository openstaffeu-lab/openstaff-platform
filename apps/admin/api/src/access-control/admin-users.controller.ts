import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { UsersService } from '../users/users.service';

@Controller('admin/users')
@UseGuards(JwtGuard, new RolesGuard([Role.SUPERADMIN]))
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    try {
      const users = await this.usersService.findAllAdminUsers();
      return buildSuccessResponse(users, 'placeholder');
    } catch (error) {
      logEndpointError('AdminUsersController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Patch(':userId/role')
  async updateRole(
    @Param('userId') userId: string,
    @Body() body: { role: Role },
  ) {
    try {
      const user = await this.usersService.updateRole(userId, body.role);
      return buildSuccessResponse(user);
    } catch (error) {
      logEndpointError('AdminUsersController.updateRole', error);
      return buildInternalErrorResponse(error);
    }
  }
}
