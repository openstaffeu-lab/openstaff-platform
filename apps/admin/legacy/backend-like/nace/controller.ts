import { Controller, Get, Post, Body } from '@nestjs/common';
import { NaceService } from './nace.service';

@Controller('nace')
export class NaceController {
  constructor(private service: NaceService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }
}
