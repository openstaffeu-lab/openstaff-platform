import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';
import { TaxRulesService } from './tax-rules.service';

@Controller('tax-rules')
export class TaxRulesController {
  constructor(private readonly taxRulesService: TaxRulesService) {}

  @UseGuards(JwtGuard)
  @Get()
  async findAll() {
    return this.taxRulesService.findAll();
  }

  @UseGuards(JwtGuard, new RolesGuard(['ADMIN']))
  @Post()
  async create(@Body() body: CreateTaxRuleDto) {
    return this.taxRulesService.create(body);
  }

  @UseGuards(JwtGuard, new RolesGuard(['ADMIN']))
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTaxRuleDto) {
    return this.taxRulesService.update(id, body);
  }
}
