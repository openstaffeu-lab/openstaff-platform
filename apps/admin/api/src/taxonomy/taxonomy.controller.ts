import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permission, PlatformRole, TaxonomyType } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { TaxonomyService } from './taxonomy.service';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  async getAll() {
    try {
      return await this.taxonomyService.getAll();
    } catch (error) {
      logEndpointError('TaxonomyController.getAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('search')
  async search(@Query('q') query?: string) {
    try {
      return await this.taxonomyService.search(query ?? '');
    } catch (error) {
      logEndpointError('TaxonomyController.search', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('by-industry')
  async byIndustry(@Query('industry') industrySlug?: string) {
    try {
      return await this.taxonomyService.byIndustry(industrySlug ?? '');
    } catch (error) {
      logEndpointError('TaxonomyController.byIndustry', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('by-industry/:industrySlug')
  async byIndustryLegacy(@Param('industrySlug') industrySlug: string) {
    try {
      return await this.taxonomyService.byIndustry(industrySlug);
    } catch (error) {
      logEndpointError('TaxonomyController.byIndustryLegacy', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('nace')
  async searchNace(
    @Query('q') query = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return {
      results: await this.taxonomyService.searchByType(TaxonomyType.NACE, query, limit),
    };
  }

  @Get('esco')
  async searchEsco(
    @Query('q') query = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return {
      results: await this.taxonomyService.searchByType(TaxonomyType.ESCO, query, limit),
    };
  }

  @Get('uniclass')
  async searchUniclass(
    @Query('q') query = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return {
      results: await this.taxonomyService.searchByType(TaxonomyType.UNICLASS, query, limit),
    };
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Post('import')
  async importBulk(@Body() body: { entries?: Array<Record<string, unknown>> }) {
    return this.taxonomyService.importBulk(body.entries ?? []);
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post('professions')
  createProfession(@Body() body: Record<string, unknown>) {
    try {
      return this.taxonomyService.createProfession(body);
    } catch (error) {
      logEndpointError('TaxonomyController.createProfession', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('professions/:id')
  updateProfession(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      return this.taxonomyService.updateProfession(id, body);
    } catch (error) {
      logEndpointError('TaxonomyController.updateProfession', error);
      return buildInternalErrorResponse(error);
    }
  }
}
