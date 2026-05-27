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
import { CreateProjectContractDto } from './dto/create-project-contract.dto';
import { CreateProjectInvoiceDto } from './dto/create-project-invoice.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { CreateProjectPaymentRequestDto } from './dto/create-project-payment-request.dto';
import { UpdateProjectContractStatusDto } from './dto/update-project-contract-status.dto';
import { UpdateProjectEscrowDto } from './dto/update-project-escrow.dto';
import { UpdateProjectInvoiceStatusDto } from './dto/update-project-invoice-status.dto';
import { UpdateProjectMilestoneStatusDto } from './dto/update-project-milestone-status.dto';
import { UpdateProjectPaymentStatusDto } from './dto/update-project-payment-status.dto';
import { ProjectContractsService } from './project-contracts.service';

@Controller('projects')
export class ProjectContractsController {
  constructor(
    private readonly projectContractsService: ProjectContractsService,
  ) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/from-proposal/:proposalId')
  async createFromProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @Body() body: CreateProjectContractDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.createFromProposal(
      projectId,
      proposalId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts')
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectContractsService.list(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.findOne(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId/contracts/:contractId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: UpdateProjectContractStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.updateStatus(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/escrow')
  async getEscrow(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.getEscrow(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId/contracts/:contractId/escrow')
  async updateEscrow(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: UpdateProjectEscrowDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.updateEscrow(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/financial-snapshot')
  async getFinancialSnapshot(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.getFinancialSnapshot(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/financial-snapshot')
  async createFinancialSnapshot(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.createFinancialSnapshot(
      projectId,
      contractId,
      user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/invoices')
  async createInvoice(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: CreateProjectInvoiceDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.createInvoice(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/invoices')
  async listInvoices(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.listInvoices(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId/contracts/:contractId/invoices/:invoiceId/status')
  async updateInvoiceStatus(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() body: UpdateProjectInvoiceStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.updateInvoiceStatus(
      projectId,
      contractId,
      invoiceId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/payments')
  async listPayments(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.listPayments(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/payments/request')
  async requestPayment(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: CreateProjectPaymentRequestDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.requestPayment(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/milestones')
  async createMilestone(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: CreateProjectMilestoneDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.createMilestone(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/milestones')
  async listMilestones(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectContractsService.listMilestones(
      projectId,
      contractId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId/contracts/:contractId/milestones/:milestoneId/status')
  async updateMilestoneStatus(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: UpdateProjectMilestoneStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectContractsService.updateMilestoneStatus(
      projectId,
      contractId,
      milestoneId,
      body,
      user,
    );
  }
}
