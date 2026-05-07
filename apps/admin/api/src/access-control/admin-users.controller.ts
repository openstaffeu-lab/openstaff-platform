import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  Role,
} from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { UsersService } from '../users/users.service';

@Controller('admin/users')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    try {
      const users = await this.usersService.findAllAdminUsers();
      return buildSuccessResponse(users);
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

  @Patch(':userId/approval')
  async updateApproval(
    @Param('userId') userId: string,
    @Body() body: { approvalStatus: AccountApprovalStatus },
  ) {
    try {
      const user = await this.usersService.updateApproval(
        userId,
        body.approvalStatus,
      );
      return buildSuccessResponse(user);
    } catch (error) {
      logEndpointError('AdminUsersController.updateApproval', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Patch(':userId/account-status')
  async updateAccountStatus(
    @Param('userId') userId: string,
    @Body() body: { accountStatus: AccountLifecycleStatus },
  ) {
    try {
      const user = await this.usersService.updateAccountStatus(
        userId,
        body.accountStatus,
      );
      return buildSuccessResponse(user);
    } catch (error) {
      logEndpointError('AdminUsersController.updateAccountStatus', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Patch(':userId/profile-moderation')
  async updateProfileModeration(
    @Param('userId') userId: string,
    @Body()
    body: {
      moderationStatus: ProfileModerationStatus;
      status: ProfileLifecycleStatus;
    },
  ) {
    try {
      const result = await this.usersService.updateProfileModeration(
        userId,
        body.moderationStatus,
        body.status,
      );
      return buildSuccessResponse(result);
    } catch (error) {
      logEndpointError('AdminUsersController.updateProfileModeration', error);
      return buildInternalErrorResponse(error);
    }
  }
}
