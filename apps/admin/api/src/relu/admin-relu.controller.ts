import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permission, ReluResultStatus } from '@prisma/client';
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

@Controller('admin/relu')
@UseGuards(JwtGuard, PermissionsGuard)
@RequirePermissions(Permission.MODERATE_AI)
export class AdminReluController {
  constructor(private readonly reluService: ReluService) {}

  @Get('runs')
  async listRuns(@Req() request: AuthenticatedRequest) {
    try {
      return buildSuccessResponse(
        await this.reluService.listRuns(this.requireUser(request)),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @Get('results')
  async listResults(@Req() request: AuthenticatedRequest) {
    try {
      return buildSuccessResponse(
        await this.reluService.listResults(this.requireUser(request)),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @Patch('results/:id/status')
  async updateResultStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { status?: ReluResultStatus },
  ) {
    try {
      if (!body.status) {
        return buildErrorResponse('status is required');
      }

      return buildSuccessResponse(
        await this.reluService.updateResultStatus(
          id,
          body.status,
          this.requireUser(request),
        ),
      );
    } catch (error) {
      return this.toErrorResponse(error);
    }
  }

  @Patch('results/:id/override')
  async overrideResult(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      return buildSuccessResponse(
        await this.reluService.overrideResult(
          id,
          body,
          this.requireUser(request),
        ),
      );
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
