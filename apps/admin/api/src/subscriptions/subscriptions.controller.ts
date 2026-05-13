import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { CreateUpgradeRequestDto } from './dto/create-upgrade-request.dto';
import { UpdateUpgradeRequestStatusDto } from './dto/update-upgrade-request-status.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  async listPlans() {
    try {
      return buildSuccessResponse(await this.subscriptionsService.listPlans());
    } catch (error) {
      logEndpointError('SubscriptionsController.listPlans', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('subscriptions/me')
  async getMySubscription(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.subscriptionsService.getCurrentSubscriptionSummary(req.user.sub),
      );
    } catch (error) {
      logEndpointError('SubscriptionsController.getMySubscription', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Public()
  @Post('subscriptions/upgrade-requests')
  async createUpgradeRequest(
    @Body() body: CreateUpgradeRequestDto,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    try {
      const authUser =
        await this.subscriptionsService.resolveOptionalUserFromAuthorizationHeader(
          authorizationHeader,
        );

      return buildSuccessResponse(
        await this.subscriptionsService.createUpgradeRequest(body, authUser),
      );
    } catch (error) {
      logEndpointError('SubscriptionsController.createUpgradeRequest', error);
      throw error;
    }
  }
}

@Controller('admin/subscription-upgrade-requests')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class AdminSubscriptionUpgradeRequestsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async listRequests() {
    try {
      return buildSuccessResponse(
        await this.subscriptionsService.listAdminUpgradeRequests(),
      );
    } catch (error) {
      logEndpointError('AdminSubscriptionUpgradeRequestsController.listRequests', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUpgradeRequestStatusDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.subscriptionsService.updateUpgradeRequestStatus(id, body.status),
      );
    } catch (error) {
      logEndpointError('AdminSubscriptionUpgradeRequestsController.updateStatus', error);
      throw error;
    }
  }
}
