import {
  Body,
  Controller,
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
import { CreateProjectWorkerAssignmentDto } from './dto/create-project-worker-assignment.dto';
import { UpdateProjectWorkerAssignmentStatusDto } from './dto/update-project-worker-assignment-status.dto';
import { ProjectWorkerAssignmentsService } from './project-worker-assignments.service';

@Controller('projects')
export class ProjectWorkerAssignmentsController {
  constructor(
    private readonly projectWorkerAssignmentsService: ProjectWorkerAssignmentsService,
  ) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post(':projectId/worker-assignments')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectWorkerAssignmentDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectWorkerAssignmentsService.create(projectId, body, user);
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/worker-assignments')
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectWorkerAssignmentsService.list(projectId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch(':projectId/worker-assignments/:assignmentId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: UpdateProjectWorkerAssignmentStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectWorkerAssignmentsService.updateStatus(
      projectId,
      assignmentId,
      body,
      user,
    );
  }
}
