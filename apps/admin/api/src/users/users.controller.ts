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
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
  @Patch(':userId/approval')
  async updateApproval(
    @Param('userId') userId: string,
    @Body() body: { approvalStatus: AccountApprovalStatus },
  ) {
    return this.usersService.updateApproval(userId, body.approvalStatus);
  }

  @UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
  @Patch(':userId/account-status')
  async updateAccountStatus(
    @Param('userId') userId: string,
    @Body() body: { accountStatus: AccountLifecycleStatus },
  ) {
    return this.usersService.updateAccountStatus(userId, body.accountStatus);
  }

  @UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
  @Patch(':userId/profile-moderation')
  async updateProfileModeration(
    @Param('userId') userId: string,
    @Body()
    body: {
      moderationStatus: ProfileModerationStatus;
      status: ProfileLifecycleStatus;
    },
  ) {
    return this.usersService.updateProfileModeration(
      userId,
      body.moderationStatus,
      body.status,
    );
  }
}
