import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HiringPipelineStatus, Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { ApproveApplicationDto } from './dto/approve-application.dto';
import { MoveApplicationStageDto } from './dto/move-application-stage.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { ShortlistApplicationDto } from './dto/shortlist-application.dto';
import { HiringService } from './hiring.service';

@Controller('hiring')
@UseGuards(
  JwtGuard,
  new RolesGuard([
    Role.ADMIN,
    Role.SUPERADMIN,
    Role.EMPLOYER,
    Role.GENERAL_CONTRACTOR,
    Role.CONTRACTOR,
  ]),
)
export class HiringAdminController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('pipelines')
  async listPipelines(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('status') status?: HiringPipelineStatus,
  ) {
    try {
      return buildSuccessResponse(
        await this.hiringService.listPipelines(req.user, { q, status }),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.listPipelines', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('jobs/:jobId/pipeline')
  async getJobPipeline(@Param('jobId') jobId: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.hiringService.getJobPipeline(jobId, req.user),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.getJobPipeline', error);
      throw error;
    }
  }

  @Get('applications/:id')
  async getApplication(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.hiringService.getApplicationDetail(id, req.user),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.getApplication', error);
      throw error;
    }
  }

  @Post('applications/:id/stage')
  async moveStage(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: MoveApplicationStageDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.hiringService.moveApplicationStage(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.moveStage', error);
      throw error;
    }
  }

  @Post('applications/:id/approve')
  async approve(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: ApproveApplicationDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.hiringService.approveApplication(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.approve', error);
      throw error;
    }
  }

  @Post('applications/:id/reject')
  async reject(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: RejectApplicationDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.hiringService.rejectApplication(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.reject', error);
      throw error;
    }
  }

  @Post('applications/:id/shortlist')
  async shortlist(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: ShortlistApplicationDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.hiringService.shortlistApplication(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('HiringAdminController.shortlist', error);
      throw error;
    }
  }
}

@Controller('applications')
@UseGuards(JwtGuard)
export class HiringCandidateController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('me')
  async getMine(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.hiringService.getMyApplications(req.user),
      );
    } catch (error) {
      logEndpointError('HiringCandidateController.getMine', error);
      throw error;
    }
  }

  @Post(':id/withdraw')
  async withdraw(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.hiringService.withdrawApplication(id, req.user),
      );
    } catch (error) {
      logEndpointError('HiringCandidateController.withdraw', error);
      throw error;
    }
  }
}
