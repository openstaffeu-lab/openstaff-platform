import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Permission, PublicModerationStatus } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { AddConversationParticipantDto } from './dto/add-conversation-participant.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ModerateMessageDto } from './dto/moderate-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagingService, MessagingUploadedFile } from './messaging.service';

@Controller()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  private rethrowHttpException(error: unknown) {
    if (error instanceof HttpException) {
      throw error;
    }
  }

  private assertAuthenticated(req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }
  }

  @UseGuards(JwtGuard)
  @Get('messages/conversations')
  async listConversations(@Req() req: any, @Query() query: any) {
    try {
      return buildSuccessResponse(await this.messagingService.listConversations(req.user, query));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.listConversations', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('messages/conversations/:conversationId')
  async getConversation(@Param('conversationId') conversationId: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.messagingService.getConversation(conversationId, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.getConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('messages/conversations/direct')
  async createDirectConversation(@Body() body: any, @Req() req: any) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.createDirectConversation(
          {
            participantUserIds: body.participantUserIds ?? [],
            title: body.title ?? null,
          },
          req.user,
        ),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.createDirectConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('messages/conversations/project')
  async createProjectConversation(@Body() body: any, @Req() req: any) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.createProjectConversation(
          {
            projectId: body.projectId ?? null,
            publicPostId: body.publicPostId ?? null,
            participantUserIds: body.participantUserIds ?? [],
            title: body.title ?? null,
          },
          req.user,
        ),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.createProjectConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('messages/conversations/workforce')
  async createWorkforceConversation(@Body() body: any, @Req() req: any) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.createWorkforceConversation(
          body.workforceAssignmentId!,
          req.user.sub,
          body.title ?? null,
        ),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.createWorkforceConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('messages/conversations/:conversationId/messages')
  async listMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.messagingService.listMessages(conversationId, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.listMessages', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'messaging-send', maxRequests: 30 })
  @Post('messages/conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: CreateMessageDto,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.sendMessage(conversationId, body, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.sendMessage', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'messaging-upload', maxRequests: 20 })
  @Post('messages/conversations/:conversationId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: MessagingUploadedFile | undefined,
    @Body() body: { content?: string },
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.uploadAttachmentMessage(conversationId, file, body, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.uploadAttachment', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('messages/attachments/:attachmentId')
  async getAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const file = await this.messagingService.getAttachmentAsset(attachmentId, req.user);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      );
      return new StreamableFile(file.stream);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.getAttachment', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('messages/messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() body: UpdateMessageDto,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(await this.messagingService.editMessage(messageId, body, req.user));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.updateMessage', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete('messages/messages/:messageId')
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(await this.messagingService.deleteMessage(messageId, req.user));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.deleteMessage', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('messages/conversations/:conversationId/read')
  async markConversationRead(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.messagingService.markConversationRead(conversationId, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.markConversationRead', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('messages/conversations/:conversationId/participants')
  async addParticipant(
    @Param('conversationId') conversationId: string,
    @Body() body: AddConversationParticipantDto,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.addParticipant(conversationId, body as any, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.addParticipant', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/messages/conversations')
  async listAdminConversations(@Query() query: any) {
    try {
      return buildSuccessResponse(await this.messagingService.listAdminConversations(query));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.listAdminConversations', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/messages/moderation')
  async listModeration(@Query('status') status?: PublicModerationStatus, @Query('q') q?: string) {
    try {
      return buildSuccessResponse(
        await this.messagingService.listModerationQueue({ status, q }),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.listModeration', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/messages/:messageId/moderate')
  async moderateMessage(
    @Param('messageId') messageId: string,
    @Body() body: ModerateMessageDto,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(
        await this.messagingService.moderateMessage(messageId, body as any, req.user),
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.moderateMessage', error);
      return buildInternalErrorResponse(error);
    }
  }

  // Backward-compatible aliases for existing project messaging panels.
  @UseGuards(JwtGuard)
  @Get('conversations')
  async legacyListConversations(@Req() req: any, @Query() query: any) {
    return this.listConversations(req, query);
  }

  @UseGuards(JwtGuard)
  @Post('conversations')
  async legacyCreateConversation(@Body() body: CreateConversationDto, @Req() req: any) {
    this.assertAuthenticated(req);

    try {
      return buildSuccessResponse(await this.messagingService.createConversation(body, req.user));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.legacyCreateConversation', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('conversations/:conversationId/messages')
  async legacyListMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.listMessages(conversationId, req);
  }

  @UseGuards(JwtGuard)
  @Post('conversations/:conversationId/messages')
  async legacyCreateMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: CreateMessageDto,
    @Req() req: any,
  ) {
    return this.sendMessage(conversationId, body, req);
  }

  @UseGuards(JwtGuard)
  @Post('messages/:messageId/read')
  async legacyMarkRead(@Param('messageId') messageId: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.messagingService.markRead(messageId, req.user));
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('MessagingController.legacyMarkRead', error);
      return buildInternalErrorResponse(error);
    }
  }
}
