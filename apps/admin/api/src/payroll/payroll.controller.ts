import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  PayrollCycleStatus,
  Role,
  SettlementBillingStatus,
  SettlementStatus,
} from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { ApprovePayrollSettlementDto } from './dto/approve-payroll-settlement.dto';
import { CreateCompensationAgreementDto } from './dto/create-compensation-agreement.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { ProcessPayrollCycleDto } from './dto/process-payroll-cycle.dto';
import { RejectPayrollSettlementDto } from './dto/reject-payroll-settlement.dto';
import { PayrollService } from './payroll.service';

@Controller('admin/payroll')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class PayrollAdminController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('compensation')
  async createCompensationAgreement(
    @Body() body: CreateCompensationAgreementDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.createCompensationAgreement(body, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.createCompensationAgreement', error);
      throw error;
    }
  }

  @Post('cycles')
  async createPayrollCycle(@Body() body: CreatePayrollCycleDto, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.payrollService.createPayrollCycle(body, req.user));
    } catch (error) {
      logEndpointError('PayrollAdminController.createPayrollCycle', error);
      throw error;
    }
  }

  @Get('cycles')
  async listPayrollCycles(
    @Req() req: any,
    @Query('status') status?: PayrollCycleStatus,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.listPayrollCycles(req.user, { status }),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.listPayrollCycles', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('cycles/:id')
  async getPayrollCycle(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.payrollService.getPayrollCycle(id, req.user));
    } catch (error) {
      logEndpointError('PayrollAdminController.getPayrollCycle', error);
      throw error;
    }
  }

  @Post('cycles/:id/process')
  async processPayrollCycle(
    @Param('id') id: string,
    @Body() body: ProcessPayrollCycleDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.processPayrollCycle(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.processPayrollCycle', error);
      throw error;
    }
  }

  @Get('settlements')
  async listSettlements(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('status') status?: SettlementStatus,
    @Query('cycleId') cycleId?: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.listSettlements(req.user, { q, status, cycleId }),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.listSettlements', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('settlements/:id')
  async getSettlement(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(await this.payrollService.getSettlement(id, req.user));
    } catch (error) {
      logEndpointError('PayrollAdminController.getSettlement', error);
      throw error;
    }
  }

  @Post('settlements/:id/approve')
  async approveSettlement(
    @Param('id') id: string,
    @Body() body: ApprovePayrollSettlementDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.approveSettlement(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.approveSettlement', error);
      throw error;
    }
  }

  @Post('settlements/:id/reject')
  async rejectSettlement(
    @Param('id') id: string,
    @Body() body: RejectPayrollSettlementDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.rejectSettlement(id, body, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.rejectSettlement', error);
      throw error;
    }
  }

  @Post('settlements/:id/create-billing-event')
  async createBillingEventFromSettlement(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.payrollService.createBillingEventFromSettlement(id, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.createBillingEventFromSettlement', error);
      throw error;
    }
  }

  @Post('cycles/:id/create-billing-events')
  async createBillingEventsForCycle(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.payrollService.createBillingEventsForCycle(id, req.user),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.createBillingEventsForCycle', error);
      throw error;
    }
  }

  @Get('billing-links')
  async listBillingLinks(
    @Req() req: any,
    @Query('cycleId') cycleId?: string,
    @Query('status') status?: SettlementBillingStatus,
  ) {
    try {
      return buildSuccessResponse(
        await this.payrollService.listBillingLinks(req.user, {
          payrollCycleId: cycleId,
          status,
        }),
      );
    } catch (error) {
      logEndpointError('PayrollAdminController.listBillingLinks', error);
      return buildInternalErrorResponse(error);
    }
  }
}

@Controller('payroll')
@UseGuards(JwtGuard)
export class PayrollWorkerController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('me')
  async getMyPayrollOverview(@Req() req: any) {
    try {
      return buildSuccessResponse(await this.payrollService.getMyPayrollOverview(req.user));
    } catch (error) {
      logEndpointError('PayrollWorkerController.getMyPayrollOverview', error);
      throw error;
    }
  }

  @Get('me/settlements')
  async getMyPayrollSettlements(@Req() req: any) {
    try {
      return buildSuccessResponse(await this.payrollService.getMyPayrollSettlements(req.user));
    } catch (error) {
      logEndpointError('PayrollWorkerController.getMyPayrollSettlements', error);
      throw error;
    }
  }
}
