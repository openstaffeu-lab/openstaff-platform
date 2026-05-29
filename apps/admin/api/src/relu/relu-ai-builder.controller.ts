import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ReluAiBuilderService } from './relu-ai-builder.service';
import {
  TaxonomySuggestionDto,
  EscoSuggestionDto,
  NaceSuggestionDto,
  UniclassSuggestionDto,
  IntentClassificationDto,
  SummaryGenerationDto,
  GeographySuggestionDto,
} from './dto/relu-ai-builder.dto';

@Controller('relu-ai-builder')
@UseGuards(JwtGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_TECHNICAL_OPERATIONS)
export class ReluAiBuilderController {
  constructor(private readonly builder: ReluAiBuilderService) {}

  @Post('taxonomy')
  async taxonomy(@Body() dto: TaxonomySuggestionDto, @Req() req: any) {
    return this.builder.suggestTaxonomy(dto, req.user.sub);
  }

  @Post('esco')
  async esco(@Body() dto: EscoSuggestionDto, @Req() req: any) {
    return this.builder.suggestEsco(dto, req.user.sub);
  }

  @Post('nace')
  async nace(@Body() dto: NaceSuggestionDto, @Req() req: any) {
    return this.builder.suggestNace(dto, req.user.sub);
  }

  @Post('uniclass')
  async uniclass(@Body() dto: UniclassSuggestionDto, @Req() req: any) {
    return this.builder.suggestUniclass(dto, req.user.sub);
  }

  @Post('intent')
  async intent(@Body() dto: IntentClassificationDto, @Req() req: any) {
    return this.builder.classifyIntent(dto, req.user.sub);
  }

  @Post('summary')
  async summary(@Body() dto: SummaryGenerationDto, @Req() req: any) {
    return this.builder.generateSummary(dto, req.user.sub);
  }

  @Post('geography')
  async geography(@Body() dto: GeographySuggestionDto, @Req() req: any) {
    return this.builder.suggestGeography(dto, req.user.sub);
  }
}
