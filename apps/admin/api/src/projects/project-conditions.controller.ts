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
import { CreateProjectConditionDto } from './dto/create-project-condition.dto';
import { UpdateProjectConditionDto } from './dto/update-project-condition.dto';
import { ProjectConditionsService } from './project-conditions.service';

@Controller('projects/:projectId/conditions')
export class ProjectConditionsController {
  constructor(
    private readonly projectConditionsService: ProjectConditionsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectConditionsService.findAll(projectId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectConditionDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectConditionsService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':conditionId')
  async update(
    @Param('projectId') projectId: string,
    @Param('conditionId') conditionId: string,
    @Body() body: UpdateProjectConditionDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectConditionsService.update(projectId, conditionId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Delete(':conditionId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('conditionId') conditionId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectConditionsService.remove(projectId, conditionId, user);
  }
}
