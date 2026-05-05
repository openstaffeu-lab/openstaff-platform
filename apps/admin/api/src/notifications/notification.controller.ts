import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentActor } from '../auth/current-actor.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { NotificationService } from './notification.service';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('notifications')
  async listCurrentUserNotifications(@CurrentActor() actor: any) {
    return this.notificationService.listCurrentActorNotifications(actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch('notifications/:id/read')
  async markRead(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.notificationService.markActorNotificationRead(id, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('notifications/recompute-compliance-reminders')
  async recomputeComplianceReminders(@Req() req: any) {
    return this.notificationService.recomputeComplianceReminders(req.user);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Post('notifications/send')
  async sendManual(
    @Body() body: { actorId: string; type: string; title: string; message: string },
  ) {
    return this.notificationService.createActorNotification(body);
  }
}
