import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentActor } from '../auth/current-actor.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll(@Query() query: Record<string, unknown>) {
    return this.jobsService.findAll(query);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Get('stats')
  stats() {
    return this.jobsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  create(@Body() body: CreateJobDto, @CurrentActor() actor: any) {
    return this.jobsService.create(body, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
    @CurrentActor() actor: any,
  ) {
    return this.jobsService.update(id, body, actor);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateJobStatusDto) {
    return this.jobsService.updateStatus(id, body);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id/applications')
  listApplications(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.jobsService.listApplications(id, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post(':id/apply')
  apply(
    @Param('id') id: string,
    @Body() body: ApplyJobDto,
    @CurrentActor() actor: any,
  ) {
    return this.jobsService.apply(id, body, actor);
  }
}
