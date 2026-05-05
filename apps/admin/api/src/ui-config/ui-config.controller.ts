import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { PublicUiConfig } from './default-ui-config';
import { UiConfigService } from './ui-config.service';

@Controller()
export class UiConfigController {
  constructor(private readonly uiConfigService: UiConfigService) {}

  @Get('ui-config')
  async getPublicConfig() {
    try {
      const result = await this.uiConfigService.getPublicConfig();
      return buildSuccessResponse(result.config, result.source);
    } catch (error) {
      logEndpointError('UiConfigController.getPublicConfig', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, new RolesGuard([Role.SUPERADMIN]))
  @Get('admin/ui-config')
  async getAdminConfig() {
    try {
      const result = await this.uiConfigService.getPublicConfig();
      return buildSuccessResponse(result.config, result.source);
    } catch (error) {
      logEndpointError('UiConfigController.getAdminConfig', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard, new RolesGuard([Role.SUPERADMIN]))
  @Put('admin/ui-config')
  async updateAdminConfig(@Body() body: Partial<PublicUiConfig>) {
    try {
      const result = await this.uiConfigService.updatePublicConfig(body);
      return buildSuccessResponse(result.config, result.source);
    } catch (error) {
      logEndpointError('UiConfigController.updateAdminConfig', error);
      return buildInternalErrorResponse(error);
    }
  }
}
