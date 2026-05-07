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
import { Permission, ReluAccessMode } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildErrorResponse,
  buildInternalErrorResponse,
  buildSuccessResponse,
} from '../common/api-response';
import { ReluService } from './relu.service';

type AuthenticatedRequest = {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

@Controller('relu')
export class ReluController {
  constructor(private readonly reluService: ReluService) {}

  @Post('public-assistant')
  async publicAssistant(
    @Body()
    body: {
      message?: string;
      history?: Array<{ role: 'user' | 'model'; parts: string }>;
    },
  ) {
    try {
      return buildSuccessResponse(await this.reluService.publicAssistant(body));
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('onboarding-assistant')
  async onboardingAssistant(
    @Req() request: AuthenticatedRequest,
    @Body() body: { message?: string },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.onboardingAssistant(this.requireUser(request), body),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('profile-completion-assistant')
  async profileCompletionAssistant(
    @Req() request: AuthenticatedRequest,
    @Body() body: { message?: string },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.profileCompletionAssistant(this.requireUser(request), body),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('project-interpretation')
  async interpretProject(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string; sourceText?: string },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.interpretProject(this.requireUser(request), body),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('taxonomy-match')
  async taxonomyMatch(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string; profileId?: string },
  ) {
    try {
      if (!body.projectId?.trim()) {
        return buildErrorResponse('projectId is required');
      }

      return buildSuccessResponse(
        await this.reluService.taxonomyMatch(this.requireUser(request), {
          projectId: body.projectId.trim(),
          profileId: body.profileId?.trim(),
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('eligibility')
  async eligibility(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string; profileId?: string },
  ) {
    try {
      if (!body.projectId?.trim()) {
        return buildErrorResponse('projectId is required');
      }

      return buildSuccessResponse(
        await this.reluService.eligibilityPercentage(this.requireUser(request), {
          projectId: body.projectId.trim(),
          profileId: body.profileId?.trim(),
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('missing-certifications')
  async missingCertifications(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string; profileId?: string },
  ) {
    try {
      if (!body.projectId?.trim()) {
        return buildErrorResponse('projectId is required');
      }

      return buildSuccessResponse(
        await this.reluService.missingCertificationDetection(this.requireUser(request), {
          projectId: body.projectId.trim(),
          profileId: body.profileId?.trim(),
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('test-generator')
  async testGenerator(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string },
  ) {
    try {
      if (!body.projectId?.trim()) {
        return buildErrorResponse('projectId is required');
      }

      return buildSuccessResponse(
        await this.reluService.generateTest(this.requireUser(request), {
          projectId: body.projectId.trim(),
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('recommendations')
  async recommendations(
    @Req() request: AuthenticatedRequest,
    @Body() body: { projectId?: string; limit?: number },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.candidateProjectRecommendation(this.requireUser(request), {
          projectId: body.projectId?.trim(),
          limit: body.limit,
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Post('contract-lifecycle-monitor')
  async contractLifecycleMonitor(
    @Req() request: AuthenticatedRequest,
    @Body() body: { contractId?: string },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.contractLifecycleMonitoring(this.requireUser(request), {
          contractId: body.contractId?.trim(),
        }),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Post('notification-generator')
  async notificationGenerator(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      eventType?: string;
      entityType?: string;
      entityId?: string;
      summary?: string;
    },
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.notificationGenerator(this.requireUser(request), body),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('config')
  async config() {
    try {
      return buildSuccessResponse(await this.reluService.listConfig());
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Patch('config/:id')
  async updateConfig(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string | null;
      model: string;
      accessMode: ReluAccessMode;
      temperature: number;
      enabled: boolean;
      publicEnabled: boolean;
      maxContextItems: number;
      webhookUrl: string | null;
    }>,
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.updateConfig(id, body, this.requireUser(request)),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('prompts-policies')
  async promptsPolicies() {
    try {
      return buildSuccessResponse(await this.reluService.listPromptsPolicies());
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Patch('prompts-policies/:id')
  async updatePromptPolicy(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      description: string | null;
      systemPrompt: string;
      policyJson: Record<string, unknown> | null;
    }>,
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.updatePromptPolicy(id, body, this.requireUser(request)),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('queue')
  async queue() {
    try {
      return buildSuccessResponse(await this.reluService.queueStatus());
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  private requireUser(request: AuthenticatedRequest) {
    if (!request.user) {
      throw new HttpException('Authenticated user context is missing', 401);
    }

    return request.user;
  }

  private toErrorResponse(error: unknown) {
    if (error instanceof HttpException) {
      return buildErrorResponse(error.message);
    }

    return buildInternalErrorResponse(error);
  }
}
