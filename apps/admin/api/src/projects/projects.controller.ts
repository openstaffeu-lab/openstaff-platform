import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permission, Role } from '@prisma/client';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get()
  async findAll(@Query() query: ListProjectsQueryDto, @Req() req: any) {
    try {
      return await this.projectsService.findAll(query, req.user);
    } catch (error) {
      logEndpointError('ProjectsController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.READ)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get(':projectId')
  async findOne(@Param('projectId') projectId: string, @Req() req: any) {
    try {
      return await this.projectsService.findOne(projectId, req.user);
    } catch (error) {
      logEndpointError('ProjectsController.findOne', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(
    JwtGuard,
    PermissionsGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post()
  async create(@Body() body: CreateProjectDto, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectsService.create(body, user);
  }

  @RequirePermissions(Permission.WRITE)
  @UseGuards(
    JwtGuard,
    PermissionsGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId')
  async update(
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectsService.update(projectId, body, user);
  }
}
