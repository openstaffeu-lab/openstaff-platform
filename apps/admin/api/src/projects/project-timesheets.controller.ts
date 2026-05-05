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
import { GenerateWorkerTimesheetDto } from './dto/generate-worker-timesheet.dto';
import { UpdateWorkerTimesheetStatusDto } from './dto/update-worker-timesheet-status.dto';
import { ProjectTimesheetsService } from './project-timesheets.service';

@Controller()
export class ProjectTimesheetsController {
  constructor(private readonly projectTimesheetsService: ProjectTimesheetsService) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('projects/:projectId/timesheets/generate')
  async generateTimesheet(
    @Param('projectId') projectId: string,
    @Body() body: GenerateWorkerTimesheetDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectTimesheetsService.generateTimesheet(projectId, body, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/timesheets')
  async listProjectTimesheets(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectTimesheetsService.listProjectTimesheets(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/timesheets/:timesheetId')
  async getProjectTimesheet(
    @Param('projectId') projectId: string,
    @Param('timesheetId') timesheetId: string,
    @Req() req: any,
  ) {
    return this.projectTimesheetsService.getProjectTimesheet(projectId, timesheetId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('projects/:projectId/timesheets/:timesheetId/status')
  async updateTimesheetStatus(
    @Param('projectId') projectId: string,
    @Param('timesheetId') timesheetId: string,
    @Body() body: UpdateWorkerTimesheetStatusDto,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectTimesheetsService.updateTimesheetStatus(projectId, timesheetId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('projects/:projectId/timesheets/:timesheetId/payroll-calculate')
  async calculatePayroll(
    @Param('projectId') projectId: string,
    @Param('timesheetId') timesheetId: string,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectTimesheetsService.calculatePayroll(projectId, timesheetId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/timesheets/:timesheetId/payroll')
  async getPayroll(
    @Param('projectId') projectId: string,
    @Param('timesheetId') timesheetId: string,
    @Req() req: any,
  ) {
    return this.projectTimesheetsService.getPayroll(projectId, timesheetId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile/timesheets')
  async listCurrentProfileTimesheets(@Req() req: any) {
    return this.projectTimesheetsService.listCurrentProfileTimesheets(req.user);
  }
}
