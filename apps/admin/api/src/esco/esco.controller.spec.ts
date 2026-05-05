import { Body, Controller, Get, Post } from '@nestjs/common';
import { EscoService } from './esco.service';

@Controller('esco')
export class EscoController {
  constructor(private readonly escoService: EscoService) {}

  @Get()
  async findAll() {
    return this.escoService.findAll();
  }

  @Post()
  async create(
    @Body()
    body: { code: string; title: string; description?: string },
  ) {
    return this.escoService.create(body);
  }
}