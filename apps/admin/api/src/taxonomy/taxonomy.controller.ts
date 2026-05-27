import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Permission, TaxonomyType } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildErrorResponse,
  buildInternalErrorResponse,
  getErrorDetails,
  logEndpointError,
} from '../common/api-response';
import { TaxonomyService, UploadedImportFile } from './taxonomy.service';

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
    try {
      return {
        results: await this.taxonomyService.searchByType(
          TaxonomyType.NACE,
          query,
          limit,
        ),
      };
    } catch (error) {
      logEndpointError('TaxonomyController.searchNace', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('esco')
  async searchEsco(
    @Query('q') query = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    try {
      return {
        results: await this.taxonomyService.searchByType(
          TaxonomyType.ESCO,
          query,
          limit,
        ),
      };
    } catch (error) {
      logEndpointError('TaxonomyController.searchEsco', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('uniclass')
  async searchUniclass(
    @Query('q') query = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    try {
      return {
        results: await this.taxonomyService.searchByType(
          TaxonomyType.UNICLASS,
          query,
          limit,
        ),
      };
    } catch (error) {
      logEndpointError('TaxonomyController.searchUniclass', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post('professions')
  async createProfession(@Body() body: Record<string, unknown>) {
    try {
      return await this.taxonomyService.createProfession(body);
    } catch (error) {
      logEndpointError('TaxonomyController.createProfession', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('professions/:id')
  async updateProfession(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      return await this.taxonomyService.updateProfession(id, body);
    } catch (error) {
      logEndpointError('TaxonomyController.updateProfession', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/import-options')
  async getImportOptions() {
    try {
      return await this.taxonomyService.getImportOptions();
    } catch (error) {
      logEndpointError('TaxonomyController.getImportOptions', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/imports')
  async listImportBatches() {
    try {
      return await this.taxonomyService.listImportBatches();
    } catch (error) {
      logEndpointError('TaxonomyController.listImportBatches', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/imports/:id')
  async getImportBatch(@Param('id') id: string) {
    try {
      return await this.taxonomyService.getImportBatch(id);
    } catch (error) {
      logEndpointError('TaxonomyController.getImportBatch', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('admin/imports/upload')
  async uploadImport(
    @UploadedFile() file: UploadedImportFile | undefined,
    @Body('entityType') entityType: string,
    @Req() req: any,
  ) {
    try {
      return await this.taxonomyService.uploadImport(
        entityType,
        file,
        req.user?.sub ?? null,
      );
    } catch (error) {
      logEndpointError('TaxonomyController.uploadImport', error);
      return buildErrorResponse('Import upload failed', getErrorDetails(error));
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post('admin/imports/:id/parse')
  async parseImport(@Param('id') id: string) {
    try {
      return await this.taxonomyService.parseImport(id);
    } catch (error) {
      logEndpointError('TaxonomyController.parseImport', error);
      return buildErrorResponse(
        'Import parsing failed',
        getErrorDetails(error),
      );
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post('admin/imports/:id/validate')
  async validateImport(@Param('id') id: string) {
    try {
      return await this.taxonomyService.validateImport(id);
    } catch (error) {
      logEndpointError('TaxonomyController.validateImport', error);
      return buildErrorResponse(
        'Import validation failed',
        getErrorDetails(error),
      );
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Post('admin/imports/:id/commit')
  async commitImport(@Param('id') id: string) {
    try {
      return await this.taxonomyService.commitImport(id);
    } catch (error) {
      logEndpointError('TaxonomyController.commitImport', error);
      return buildErrorResponse('Import commit failed', getErrorDetails(error));
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/browser')
  async browseEntries(
    @Query('entityType') entityType?: string,
    @Query('q') query?: string,
  ) {
    try {
      return await this.taxonomyService.browseEntries(
        entityType ?? '',
        query ?? '',
      );
    } catch (error) {
      logEndpointError('TaxonomyController.browseEntries', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/browser/:entityType/:id')
  async updateEntry(
    @Param('entityType') entityType: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      return await this.taxonomyService.updateEntry(entityType, id, body);
    } catch (error) {
      logEndpointError('TaxonomyController.updateEntry', error);
      return buildErrorResponse(
        'Taxonomy update failed',
        getErrorDetails(error),
      );
    }
  }
}
