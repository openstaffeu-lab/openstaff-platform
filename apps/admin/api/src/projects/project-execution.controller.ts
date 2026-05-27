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
import { CheckInWorkerDto } from './dto/check-in-worker.dto';
import { CheckOutWorkerDto } from './dto/check-out-worker.dto';
import { CreateWorkerWorkLogDto } from './dto/create-worker-work-log.dto';
import { UpdateWorkerWorkLogStatusDto } from './dto/update-worker-work-log-status.dto';
import { ProjectExecutionService } from './project-execution.service';

@Controller()
export class ProjectExecutionController {
  constructor(
    private readonly projectExecutionService: ProjectExecutionService,
  ) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard([
      'ADMIN',
      'EMPLOYER',
      'CONTRACTOR',
      'GENERAL_CONTRACTOR',
      'PROFESSIONAL',
    ]),
  )
  @Post('projects/:projectId/attendance/check-in')
  async checkIn(
    @Param('projectId') projectId: string,
    @Body() body: CheckInWorkerDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectExecutionService.checkIn(projectId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard([
      'ADMIN',
      'EMPLOYER',
      'CONTRACTOR',
      'GENERAL_CONTRACTOR',
      'PROFESSIONAL',
    ]),
  )
  @Post('projects/:projectId/attendance/check-out')
  async checkOut(
    @Param('projectId') projectId: string,
    @Body() body: CheckOutWorkerDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectExecutionService.checkOut(projectId, body, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/attendance')
  async listAttendance(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectExecutionService.listAttendance(projectId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard([
      'ADMIN',
      'EMPLOYER',
      'CONTRACTOR',
      'GENERAL_CONTRACTOR',
      'PROFESSIONAL',
    ]),
  )
  @Post('projects/:projectId/work-logs')
  async createWorkLog(
    @Param('projectId') projectId: string,
    @Body() body: CreateWorkerWorkLogDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectExecutionService.createWorkLog(
      projectId,
      body,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/work-logs')
  async listWorkLogs(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectExecutionService.listWorkLogs(projectId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard([
      'ADMIN',
      'EMPLOYER',
      'CONTRACTOR',
      'GENERAL_CONTRACTOR',
      'PROFESSIONAL',
    ]),
  )
  @Patch('projects/:projectId/work-logs/:logId/status')
  async updateWorkLogStatus(
    @Param('projectId') projectId: string,
    @Param('logId') logId: string,
    @Body() body: UpdateWorkerWorkLogStatusDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectExecutionService.updateWorkLogStatus(
      projectId,
      logId,
      body,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Get('profile/attendance')
  async listCurrentProfileAttendance(@Req() req: any) {
    return this.projectExecutionService.listCurrentProfileAttendance(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile/work-logs')
  async listCurrentProfileWorkLogs(@Req() req: any) {
    return this.projectExecutionService.listCurrentProfileWorkLogs(req.user);
  }
}
