import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role, TimesheetStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { AddTimesheetEntryDto } from './dto/add-timesheet-entry.dto';
import { ApproveTimesheetDto } from './dto/approve-timesheet.dto';
import { AttendanceCheckInDto } from './dto/attendance-checkin.dto';
import { AttendanceCheckOutDto } from './dto/attendance-checkout.dto';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { RejectTimesheetDto } from './dto/reject-timesheet.dto';
import { SubmitTimesheetDto } from './dto/submit-timesheet.dto';
import { TimesheetsService } from './timesheets.service';

@Controller()
@UseGuards(JwtGuard)
export class TimesheetsWorkerController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post('timesheets')
  async createTimesheet(@Body() body: CreateTimesheetDto, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.createTimesheet(body, req.user),
      );
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.createTimesheet', error);
      throw error;
    }
  }

  @Post('timesheets/:id/entries')
  async addTimesheetEntry(
    @Param('id') id: string,
    @Body() body: AddTimesheetEntryDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.addTimesheetEntry(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.addTimesheetEntry', error);
      throw error;
    }
  }

  @Post('timesheets/:id/submit')
  async submitTimesheet(
    @Param('id') id: string,
    @Body() body: SubmitTimesheetDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.submitTimesheet(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.submitTimesheet', error);
      throw error;
    }
  }

  @Post('attendance/check-in')
  async checkIn(@Body() body: AttendanceCheckInDto, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.timesheetsService.checkIn(body, req.user));
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.checkIn', error);
      throw error;
    }
  }

  @Post('attendance/check-out')
  async checkOut(@Body() body: AttendanceCheckOutDto, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.timesheetsService.checkOut(body, req.user));
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.checkOut', error);
      throw error;
    }
  }

  @Get('timesheets/me')
  async getMyTimesheets(@Req() req: any) {
    try {
      return buildSuccessResponse(await this.timesheetsService.getMyTimesheets(req.user));
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.getMyTimesheets', error);
      throw error;
    }
  }

  @Get('attendance/me')
  async getMyAttendance(@Req() req: any) {
    try {
      return buildSuccessResponse(await this.timesheetsService.getMyAttendance(req.user));
    } catch (error) {
      logEndpointError('TimesheetsWorkerController.getMyAttendance', error);
      throw error;
    }
  }
}

@Controller('admin')
@UseGuards(
  JwtGuard,
  new RolesGuard([
    Role.ADMIN,
    Role.SUPERADMIN,
    Role.EMPLOYER,
    Role.GENERAL_CONTRACTOR,
    Role.CONTRACTOR,
  ]),
)
export class TimesheetsAdminController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get('timesheets')
  async listTimesheets(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('status') status?: TimesheetStatus,
  ) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.listAdminTimesheets(req.user, { q, status }),
      );
    } catch (error) {
      logEndpointError('TimesheetsAdminController.listTimesheets', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('timesheets/:id')
  async getTimesheet(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.timesheetsService.getAdminTimesheet(id, req.user));
    } catch (error) {
      logEndpointError('TimesheetsAdminController.getTimesheet', error);
      throw error;
    }
  }

  @Post('timesheets/:id/approve')
  async approveTimesheet(
    @Param('id') id: string,
    @Body() body: ApproveTimesheetDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.approveTimesheet(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('TimesheetsAdminController.approveTimesheet', error);
      throw error;
    }
  }

  @Post('timesheets/:id/reject')
  async rejectTimesheet(
    @Param('id') id: string,
    @Body() body: RejectTimesheetDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.rejectTimesheet(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('TimesheetsAdminController.rejectTimesheet', error);
      throw error;
    }
  }

  @Get('attendance')
  async listAttendance(@Req() req: any, @Query('q') q?: string) {
    try {
      return buildSuccessResponse(
        await this.timesheetsService.listAdminAttendance(req.user, { q }),
      );
    } catch (error) {
      logEndpointError('TimesheetsAdminController.listAttendance', error);
      return buildInternalErrorResponse(error);
    }
  }
}
