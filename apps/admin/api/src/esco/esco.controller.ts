import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { EscoService } from './esco.service';

@Controller('esco')
export class EscoController {
  constructor(private readonly escoService: EscoService) {}

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get()
  async findAll() {
    try {
      return await this.escoService.findAll();
    } catch (error) {
      logEndpointError('EscoController.findAll', error);
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
      return await this.escoService.create(body);
    } catch (error) {
      logEndpointError('EscoController.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
