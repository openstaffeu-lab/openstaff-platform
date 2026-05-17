import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { GenerateRenewalsDto } from './dto/generate-renewals.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { ProcessBillingWebhookDto } from './dto/process-billing-webhook.dto';
import { UpsertBillingProfileDto } from './dto/upsert-billing-profile.dto';
import { BillingService } from './billing.service';

@Controller('admin/billing')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class BillingAdminController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices/generate')
  async generateInvoice(@Body() body: GenerateInvoiceDto, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.billingService.generateInvoice(body, req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingAdminController.generateInvoice', error);
      throw error;
    }
  }

  @Get('events')
  async listBillingEvents() {
    try {
      return buildSuccessResponse(await this.billingService.listBillingEvents());
    } catch (error) {
      logEndpointError('BillingAdminController.listBillingEvents', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('invoices')
  async listInvoices() {
    try {
      return buildSuccessResponse(await this.billingService.listInvoices());
    } catch (error) {
      logEndpointError('BillingAdminController.listInvoices', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    try {
      return buildSuccessResponse(await this.billingService.getInvoice(id));
    } catch (error) {
      logEndpointError('BillingAdminController.getInvoice', error);
      throw error;
    }
  }

  @Post('invoices/:id/mark-paid')
  async markInvoicePaid(
    @Param('id') id: string,
    @Body() body: MarkInvoicePaidDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.billingService.markInvoicePaid(id, body, req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingAdminController.markInvoicePaid', error);
      throw error;
    }
  }

  @Get('payments')
  async listPayments() {
    try {
      return buildSuccessResponse(await this.billingService.listPayments());
    } catch (error) {
      logEndpointError('BillingAdminController.listPayments', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('webhooks')
  async listWebhooks() {
    try {
      return buildSuccessResponse(await this.billingService.listWebhooks());
    } catch (error) {
      logEndpointError('BillingAdminController.listWebhooks', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Post('webhooks/:id/process')
  async processWebhook(
    @Param('id') id: string,
    @Body() body: ProcessBillingWebhookDto,
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.billingService.processWebhook(id, body, req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingAdminController.processWebhook', error);
      throw error;
    }
  }

  @Get('renewals')
  async listRenewals() {
    try {
      return buildSuccessResponse(await this.billingService.listRenewals());
    } catch (error) {
      logEndpointError('BillingAdminController.listRenewals', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Post('renewals/generate')
  async generateRenewals(@Body() body: GenerateRenewalsDto, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.billingService.generateRenewals(body, req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingAdminController.generateRenewals', error);
      throw error;
    }
  }

  @Post('renewals/:id/process')
  async processRenewal(@Param('id') id: string, @Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.billingService.processRenewal(id, req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingAdminController.processRenewal', error);
      throw error;
    }
  }
}

@Controller('billing/profile')
@UseGuards(JwtGuard)
export class BillingProfileController {
  constructor(private readonly billingService: BillingService) {}

  @Get('me')
  async getMyBillingProfile(@Req() req: any) {
    try {
      return buildSuccessResponse(
        await this.billingService.getBillingProfile(req.user.sub),
      );
    } catch (error) {
      logEndpointError('BillingProfileController.getMyBillingProfile', error);
      throw error;
    }
  }

  @Put('me')
  async upsertMyBillingProfile(
    @Req() req: any,
    @Body() body: UpsertBillingProfileDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.billingService.upsertBillingProfile(req.user.sub, body),
      );
    } catch (error) {
      logEndpointError('BillingProfileController.upsertMyBillingProfile', error);
      throw error;
    }
  }
}

@Controller('billing')
export class BillingPublicController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('webhooks/:provider')
  async receiveWebhook(
    @Param('provider') provider: string,
    @Body() body: unknown,
    @Req() req: any,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    try {
      return buildSuccessResponse(
        await this.billingService.receiveWebhook(provider, body, {
          rawBody: req.rawBody,
          signatureHeader: stripeSignature,
        }),
      );
    } catch (error) {
      logEndpointError('BillingPublicController.receiveWebhook', error);
      throw error;
    }
  }
}
