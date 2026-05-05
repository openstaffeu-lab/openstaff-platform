import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { NaceService } from './nace.service';

@Controller('nace')
export class NaceController {
  constructor(private readonly naceService: NaceService) {}

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get()
  async findAll() {
    try {
      return await this.naceService.findAll();
    } catch (error) {
      logEndpointError('NaceController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post()
  async create(
    @Body()
    body: { code: string; title: string; description?: string },
  ) {
    try {
      return await this.naceService.create(body);
    } catch (error) {
      logEndpointError('NaceController.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
