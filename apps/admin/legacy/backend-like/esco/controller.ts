import { Controller, Get, Post, Body } from '@nestjs/common';
import { EscoService } from './esco.service';

@Controller('esco')
export class EscoController {
  constructor(private service: EscoService) {}

  @Get()
 findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }
}
