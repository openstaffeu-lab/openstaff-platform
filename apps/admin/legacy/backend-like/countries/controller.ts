import { Controller, Get, Post, Body } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private service: CountriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }
}
