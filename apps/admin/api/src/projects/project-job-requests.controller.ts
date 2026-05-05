import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProjectJobRequestDto } from './dto/create-project-job-request.dto';
import { UpdateProjectJobRequestDto } from './dto/update-project-job-request.dto';
import { ProjectJobRequestsService } from './project-job-requests.service';

@Controller('projects/:projectId/job-requests')
export class ProjectJobRequestsController {
  constructor(
    private readonly projectJobRequestsService: ProjectJobRequestsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectJobRequestsService.findAll(projectId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectJobRequestDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectJobRequestsService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':jobRequestId')
  async update(
    @Param('projectId') projectId: string,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: UpdateProjectJobRequestDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectJobRequestsService.update(projectId, jobRequestId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Delete(':jobRequestId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('jobRequestId') jobRequestId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectJobRequestsService.remove(projectId, jobRequestId, user);
  }
}
