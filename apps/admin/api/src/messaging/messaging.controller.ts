import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagingService } from './messaging.service';

@Controller()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @UseGuards(JwtGuard)
  @Get('conversations')
  async listConversations(@Req() req: any, @Query() query: any) {
    return this.messagingService.listConversations(req.user, query);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('conversations')
  async createConversation(@Body() body: CreateConversationDto, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.messagingService.createConversation(body, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('conversations/:conversationId/messages')
  async listMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.messagingService.listMessages(conversationId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('conversations/:conversationId/messages')
  async createMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: CreateMessageDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.messagingService.createMessage(conversationId, body, req.user);
  }

  @UseGuards(JwtGuard)
  @Post('messages/:messageId/read')
  async markRead(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messagingService.markRead(messageId, req.user);
  }
}
