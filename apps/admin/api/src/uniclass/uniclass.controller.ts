import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { UniclassService } from './uniclass.service';

@Controller('uniclass')
export class UniclassController {
  constructor(private readonly uniclassService: UniclassService) {}

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get()
  async findAll() {
    try {
      return await this.uniclassService.findAll();
    } catch (error) {
      logEndpointError('UniclassController.findAll', error);
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
      return await this.uniclassService.create(body);
    } catch (error) {
      logEndpointError('UniclassController.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
