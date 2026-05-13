import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { PrivateMessagingService } from './private-messaging.service';

@Controller()
export class PrivateMessagingController {
  constructor(private readonly privateMessagingService: PrivateMessagingService) {}

  @UseGuards(JwtGuard)
  @Get('private-conversations')
  async listConversations(@Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.privateMessagingService.listConversations();
    } catch (error) {
      logEndpointError('PrivateMessagingController.listConversations', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('private-conversations')
  async createConversation(@Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.privateMessagingService.createConversation(body, req.user.sub);
    } catch (error) {
      if (error instanceof HttpException || error instanceof ForbiddenException) {
        throw error;
      }
      logEndpointError('PrivateMessagingController.createConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('private-conversations/:id/messages')
  async listMessages(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.privateMessagingService.listMessages(id);
    } catch (error) {
      logEndpointError('PrivateMessagingController.listMessages', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('private-conversations/:id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.privateMessagingService.createMessage(id, body);
    } catch (error) {
      logEndpointError('PrivateMessagingController.createMessage', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/private-conversations')
  async listConversationsForAdmin() {
    try {
      return await this.privateMessagingService.listConversationsForAdmin();
    } catch (error) {
      logEndpointError('PrivateMessagingController.listConversationsForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/private-conversations/:id/status')
  async updateConversationStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    try {
      return await this.privateMessagingService.updateConversationStatus(
        id,
        typeof body.status === 'string' ? body.status : 'OPEN',
      );
    } catch (error) {
      logEndpointError('PrivateMessagingController.updateConversationStatus', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/private-messages/:id/status')
  async updateMessageStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    try {
      return await this.privateMessagingService.updateMessageStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING_REVIEW',
      );
    } catch (error) {
      logEndpointError('PrivateMessagingController.updateMessageStatus', error);
      return buildInternalErrorResponse(error);
    }
  }
}
