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
import {
  VerificationCaseStatus,
  VerificationCaseSubjectType,
} from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { ReviewVerificationCaseDto } from './dto/review-verification-case.dto';
import { SubmitVerificationCaseDto } from './dto/submit-verification-case.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
@UseGuards(JwtGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.verificationService.getVerificationMe(req.user.sub),
      );
    } catch (error) {
      logEndpointError('VerificationController.getMe', error);
      throw error;
    }
  }

  @Post('identity/submit')
  async submitIdentityCase(
    @Req() req: any,
    @Body() body: SubmitVerificationCaseDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.verificationService.submitIdentityCase(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('VerificationController.submitIdentityCase', error);
      throw error;
    }
  }

  @Post('company/submit')
  async submitCompanyCase(
    @Req() req: any,
    @Body() body: SubmitVerificationCaseDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.verificationService.submitCompanyCase(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('VerificationController.submitCompanyCase', error);
      throw error;
    }
  }
}

@Controller('admin/verifications')
@UseGuards(JwtGuard, new RolesGuard(['ADMIN', 'SUPERADMIN']))
export class VerificationAdminController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('cases')
  async listCases(
    @Query('q') q?: string,
    @Query('status') status?: VerificationCaseStatus,
    @Query('subjectType') subjectType?: VerificationCaseSubjectType,
  ) {
    try {
      return buildSuccessResponse(
        await this.verificationService.listAdminCases({
          q,
          status,
          subjectType,
        }),
      );
    } catch (error) {
      logEndpointError('VerificationAdminController.listCases', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('cases/:id')
  async getCase(@Param('id') id: string) {
    try {
      return buildSuccessResponse(
        await this.verificationService.getAdminCase(id),
      );
    } catch (error) {
      logEndpointError('VerificationAdminController.getCase', error);
      throw error;
    }
  }

  @Post('cases/:id/review')
  async reviewCase(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: ReviewVerificationCaseDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.verificationService.reviewCase(id, req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('VerificationAdminController.reviewCase', error);
      throw error;
    }
  }
}
