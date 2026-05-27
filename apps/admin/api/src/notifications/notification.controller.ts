import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { JwtGuard } from '../auth/jwt.guard';
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtGuard)
  @Get('notifications')
  async listCurrentUserNotifications(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.listForUser(req.user),
      );
    } catch (error) {
      logEndpointError(
        'NotificationController.listCurrentUserNotifications',
        error,
      );
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('notifications/unread-count')
  async unreadCount(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.unreadCount(req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.unreadCount', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('notifications/:id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.markRead(id, req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.markRead', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('notifications/read-all')
  async markAllRead(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.markAllRead(req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.markAllRead', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('notifications/:id/dismiss')
  async dismiss(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.dismiss(id, req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.dismiss', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('notifications/preferences')
  async getPreferences(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.getPreferences(req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.getPreferences', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Put('notifications/preferences')
  async updatePreferences(@Req() req: any, @Body() body: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.updatePreferences(req.user, body ?? {}),
      );
    } catch (error) {
      logEndpointError('NotificationController.updatePreferences', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('notifications/recompute-compliance-reminders')
  async recomputeComplianceReminders(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.recomputeComplianceReminders(req.user),
      );
    } catch (error) {
      logEndpointError(
        'NotificationController.recomputeComplianceReminders',
        error,
      );
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @Get('admin/notifications/events')
  async listAdminEvents() {
    try {
      return buildSuccessResponse(
        await this.notificationService.listAdminEvents(),
      );
    } catch (error) {
      logEndpointError('NotificationController.listAdminEvents', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @Get('admin/notifications/deliveries')
  async listAdminDeliveries() {
    try {
      return buildSuccessResponse(
        await this.notificationService.listAdminDeliveries(),
      );
    } catch (error) {
      logEndpointError('NotificationController.listAdminDeliveries', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @Post('admin/notifications/deliveries/:id/retry')
  async retryFailedDelivery(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.retryFailedDelivery(id, req.user),
      );
    } catch (error) {
      logEndpointError('NotificationController.retryFailedDelivery', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @Get('admin/workflow-automation/runs')
  async listWorkflowRuns() {
    try {
      return buildSuccessResponse(
        await this.notificationService.listWorkflowAutomationRuns(),
      );
    } catch (error) {
      logEndpointError('NotificationController.listWorkflowRuns', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'notification-manual-send', maxRequests: 10 })
  @RequirePermissions(Permission.MANAGE_USERS)
  @Post('notifications/send')
  async sendManual(@Body() body: any) {
    try {
      return buildSuccessResponse(
        await this.notificationService.createActorNotification(body),
      );
    } catch (error) {
      logEndpointError('NotificationController.sendManual', error);
      return buildInternalErrorResponse(error);
    }
  }
}
