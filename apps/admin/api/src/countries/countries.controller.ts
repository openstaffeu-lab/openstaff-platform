import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get()
  async findAll() {
    try {
      return await this.countriesService.findAll();
    } catch (error) {
      logEndpointError('CountriesController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post()
  async create(
    @Body()
    body: {
      name?: string;
      code?: string;
      currency?: string;
      vatRate?: number;
    },
  ) {
    try {
      return await this.countriesService.create(body);
    } catch (error) {
      logEndpointError('CountriesController.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
