import { Controller, Get, Post, Body } from '@nestjs/common';
import { UniclassService } from './uniclass.service';

@Controller('uniclass')
export class UniclassController {
  constructor(private service: UniclassService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }
}
