import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OnboardingStatus, Role, VerificationStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import { UpsertCompanyProfileDto } from './dto/upsert-company-profile.dto';
import { UpsertIdentityProfileDto } from './dto/upsert-identity-profile.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.getOnboardingMe(req.user.sub),
      );
    } catch (error) {
      logEndpointError('OnboardingController.getMe', error);
      throw error;
    }
  }

  @Put('identity-profile')
  async upsertIdentityProfile(
    @Req() req: any,
    @Body() body: UpsertIdentityProfileDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.upsertIdentityProfile(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('OnboardingController.upsertIdentityProfile', error);
      throw error;
    }
  }

  @Put('company-profile')
  async upsertCompanyProfile(
    @Req() req: any,
    @Body() body: UpsertCompanyProfileDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.upsertCompanyProfile(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('OnboardingController.upsertCompanyProfile', error);
      throw error;
    }
  }

  @Patch('steps')
  async updateSteps(@Req() req: any, @Body() body: UpdateOnboardingStepDto) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.updateOnboardingSteps(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('OnboardingController.updateSteps', error);
      throw error;
    }
  }

  @Get('progress')
  async getProgress(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.getOnboardingProgress(req.user.sub),
      );
    } catch (error) {
      logEndpointError('OnboardingController.getProgress', error);
      throw error;
    }
  }
}

@Controller('onboarding')
export class OnboardingPublicController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Get('defaults')
  async getDefaults(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.getRegistrationDefaults(req),
      );
    } catch (error) {
      logEndpointError('OnboardingPublicController.getDefaults', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Public()
  @Put('company-lookup')
  async companyLookup(
    @Body()
    body: {
      fiscalCode?: string;
      countryCode?: string;
    },
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.lookupCompanyProfile({
          fiscalCode: body.fiscalCode ?? '',
          countryCode: body.countryCode ?? '',
          request: req,
        }),
      );
    } catch (error) {
      logEndpointError('OnboardingPublicController.companyLookup', error);
      return buildInternalErrorResponse(error);
    }
  }
}

@Controller('profiles')
export class OnboardingPublicProfilesController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Get(':slug')
  async getPublicProfile(@Param('slug') slug: string) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.getPublicProfileBySlug(slug),
      );
    } catch (error) {
      logEndpointError('OnboardingPublicProfilesController.getPublicProfile', error);
      throw error;
    }
  }
}

@Controller('admin/onboarding')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class OnboardingAdminController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('sessions')
  async listSessions(
    @Query('q') q?: string,
    @Query('onboardingStatus') onboardingStatus?: OnboardingStatus,
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
  ) {
    try {
      return buildSuccessResponse(
        await this.onboardingService.listAdminOnboardingSessions({
          q,
          onboardingStatus,
          verificationStatus,
        }),
      );
    } catch (error) {
      logEndpointError('OnboardingAdminController.listSessions', error);
      return buildInternalErrorResponse(error);
    }
  }
}
