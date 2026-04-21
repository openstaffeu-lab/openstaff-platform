import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll() {
    return this.projectsService.findAll();
  }

  @Post()
  async create(
    @Body()
    body: { name: string; location: string; status: string },
  ) {
    return this.projectsService.create(body);
  }
}