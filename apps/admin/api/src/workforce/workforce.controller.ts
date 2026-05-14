import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { ActivateContractDto } from './dto/activate-contract.dto';
import { CreateWorkforceAssignmentDto } from './dto/create-workforce-assignment.dto';
import { SuspendContractDto } from './dto/suspend-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { WorkforceService } from './workforce.service';

@Controller('workforce')
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
export class WorkforceAdminController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Post('assignments')
  async createAssignment(@Body() body: CreateWorkforceAssignmentDto, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.workforceService.createAssignment(body, req.user),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.createAssignment', error);
      throw error;
    }
  }

  @Get('assignments')
  async listAssignments(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('contractStatus') contractStatus?: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.workforceService.listAssignments(req.user, {
          q,
          status,
          contractStatus,
        }),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.listAssignments', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('assignments/:id')
  async getAssignment(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.workforceService.getAssignment(id, req.user));
    } catch (error) {
      logEndpointError('WorkforceAdminController.getAssignment', error);
      throw error;
    }
  }

  @Post('contracts/:id/send')
  async sendContract(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.workforceService.sendContract(id, req.user));
    } catch (error) {
      logEndpointError('WorkforceAdminController.sendContract', error);
      throw error;
    }
  }

  @Post('contracts/:id/activate')
  async activateContract(
    @Param('id') id: string,
    @Body() body: ActivateContractDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.workforceService.activateContract(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.activateContract', error);
      throw error;
    }
  }

  @Post('contracts/:id/suspend')
  async suspendContract(
    @Param('id') id: string,
    @Body() body: SuspendContractDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.workforceService.suspendContract(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.suspendContract', error);
      throw error;
    }
  }

  @Post('contracts/:id/terminate')
  async terminateContract(
    @Param('id') id: string,
    @Body() body: TerminateContractDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.workforceService.terminateContract(id, req.user, body),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.terminateContract', error);
      throw error;
    }
  }

  @Get('contracts/:id/timeline')
  async getContractTimeline(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.workforceService.getContractTimeline(id, req.user),
      );
    } catch (error) {
      logEndpointError('WorkforceAdminController.getContractTimeline', error);
      throw error;
    }
  }
}

@Controller('workforce')
@UseGuards(JwtGuard)
export class WorkforceWorkerController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Get('me')
  async getMyAssignments(@Req() req: any) {
    try {
      return buildSuccessResponse(await this.workforceService.getMyAssignments(req.user));
    } catch (error) {
      logEndpointError('WorkforceWorkerController.getMyAssignments', error);
      throw error;
    }
  }
}
