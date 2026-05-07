import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import {
  buildErrorResponse,
  buildInternalErrorResponse,
  buildSuccessResponse,
} from '../common/api-response';
import { JwtGuard } from '../auth/jwt.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { GeminiService } from './gemini.service';

type AuthenticatedRequest = {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('chat')
  async chat(
    @Body() body: { message?: string; history?: Array<{ role: 'user' | 'model'; parts: string }> },
  ) {
    try {
      const message = body.message?.trim();

      if (!message) {
        return buildErrorResponse('Message is required');
      }

      const result = await this.geminiService.chat(message, body.history ?? []);
      return buildSuccessResponse(result);
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('analyze-document')
  async analyzeDocument(
    @Req() request: AuthenticatedRequest,
    @Body() body: { fileUrl?: string; documentType?: string },
  ) {
    try {
      if (!body.fileUrl?.trim() || !body.documentType?.trim()) {
        return buildErrorResponse('fileUrl and documentType are required');
      }

      const result = await this.geminiService.analyzeDocument(
        body.fileUrl.trim(),
        body.documentType.trim(),
      );

      return buildSuccessResponse({
        requestedByUserId: request.user?.sub ?? null,
        ...result,
      });
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('generate-contract')
  async generateContract(@Body() body: { contractId?: string }) {
    try {
      if (!body.contractId?.trim()) {
        return buildErrorResponse('contractId is required');
      }

      const result = await this.geminiService.generateContract(body.contractId.trim());
      return buildSuccessResponse(result);
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Post('compliance-check')
  async complianceCheck(@Body() body: { content?: string }) {
    try {
      if (!body.content?.trim()) {
        return buildErrorResponse('content is required');
      }

      const result = await this.geminiService.complianceCheck(body.content.trim());
      return buildSuccessResponse(result);
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Post('pcb-assist')
  async pcbAssist(@Body() body: { prompt?: string; context?: string }) {
    try {
      if (!body.prompt?.trim()) {
        return buildErrorResponse('prompt is required');
      }

      const result = await this.geminiService.pcbAssist(
        body.prompt.trim(),
        body.context?.trim(),
      );

      return buildSuccessResponse(result);
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('agents')
  async getAgents() {
    try {
      return buildSuccessResponse(await this.geminiService.listAgents());
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Patch('agents/:id')
  async updateAgent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      return buildSuccessResponse(await this.geminiService.updateAgent(id, body));
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  private toErrorResponse(error: unknown) {
    if (error instanceof HttpException) {
      return buildErrorResponse(error.message);
    }

    return buildInternalErrorResponse(error);
  }
}
