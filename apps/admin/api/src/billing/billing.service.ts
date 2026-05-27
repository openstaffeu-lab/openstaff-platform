import {
  AccountSubscriptionStatus,
  BillingEventStatus,
  BillingEventType,
  BillingInvoiceStatus,
  BillingInvoiceType,
  BillingVatMode,
  BillingWebhookStatus,
  NotificationCategory,
  PaymentProvider,
  PaymentRecordStatus,
  Prisma,
  SettlementBillingStatus,
  SettlementStatus,
  SubscriptionRenewalStatus,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { GenerateRenewalsDto } from './dto/generate-renewals.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { ProcessBillingWebhookDto } from './dto/process-billing-webhook.dto';
import { UpsertBillingProfileDto } from './dto/upsert-billing-profile.dto';

type BillingInvoiceWithRelations = Prisma.BillingInvoiceGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
      };
    };
    lines: {
      include: {
        billingEvent: {
          select: {
            id: true;
            type: true;
            status: true;
            amount: true;
            currency: true;
          };
        };
      };
    };
    payments: true;
  };
}>;

type BillingProfileLike = {
  companyName?: string | null;
  vatId?: string | null;
  country: string;
  region?: string | null;
  city?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  currency: string;
  isCompany: boolean;
  isVatPayer: boolean;
  vatMode?: BillingVatMode | null;
};

type StripeWebhookEventEnvelope = {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

const EU_COUNTRIES = new Set([
  'AT',
  'AUSTRIA',
  'BE',
  'BELGIUM',
  'BG',
  'BULGARIA',
  'HR',
  'CROATIA',
  'CY',
  'CYPRUS',
  'CZ',
  'CZECHIA',
  'CZECH REPUBLIC',
  'DE',
  'GERMANY',
  'DK',
  'DENMARK',
  'EE',
  'ESTONIA',
  'ES',
  'SPAIN',
  'FI',
  'FINLAND',
  'FR',
  'FRANCE',
  'GR',
  'GREECE',
  'HU',
  'HUNGARY',
  'IE',
  'IRELAND',
  'IT',
  'ITALY',
  'LT',
  'LITHUANIA',
  'LU',
  'LUXEMBOURG',
  'LV',
  'LATVIA',
  'MT',
  'MALTA',
  'NL',
  'NETHERLANDS',
  'PL',
  'POLAND',
  'PT',
  'PORTUGAL',
  'RO',
  'ROMANIA',
  'SE',
  'SWEDEN',
  'SI',
  'SLOVENIA',
  'SK',
  'SLOVAKIA',
]);

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getBillingProfile(userId: string) {
    return this.prisma.billingProfile.findUnique({
      where: { userId },
    });
  }

  async upsertBillingProfile(userId: string, input: UpsertBillingProfileDto) {
    const vatMode = this.resolveVatMode({
      country: input.country,
      isCompany: input.isCompany,
      isVatPayer: input.isVatPayer,
      vatId: input.vatId ?? null,
      currency: input.currency,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      city: input.city ?? null,
      companyName: input.companyName ?? null,
      postalCode: input.postalCode ?? null,
      region: input.region ?? null,
      vatMode: input.vatMode as BillingVatMode | undefined,
    });

    const profile = await this.prisma.billingProfile.upsert({
      where: { userId },
      update: {
        companyName: input.companyName?.trim() || null,
        vatId: input.vatId?.trim() || null,
        country: input.country.trim(),
        region: input.region?.trim() || null,
        city: input.city?.trim() || null,
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        currency: input.currency.trim().toUpperCase(),
        isCompany: input.isCompany,
        isVatPayer: input.isVatPayer,
        vatMode,
      },
      create: {
        userId,
        companyName: input.companyName?.trim() || null,
        vatId: input.vatId?.trim() || null,
        country: input.country.trim(),
        region: input.region?.trim() || null,
        city: input.city?.trim() || null,
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        currency: input.currency.trim().toUpperCase(),
        isCompany: input.isCompany,
        isVatPayer: input.isVatPayer,
        vatMode,
      },
    });

    await this.notificationService.emitEvent({
      key: `billing-profile:updated:${userId}`,
      eventType: 'BILLING_PROFILE_UPDATED',
      sourceType: 'BILLING_PROFILE',
      sourceId: profile.id,
      userId,
      category: NotificationCategory.BILLING,
      title: 'Billing profile updated',
      message: 'Your billing profile details were updated successfully.',
      relatedEntityType: 'BillingProfile',
      relatedEntityId: profile.id,
      metadata: {
        currency: profile.currency,
        vatMode: profile.vatMode,
        isCompany: profile.isCompany,
      },
    });

    return profile;
  }

  calculateVat(
    profile: BillingProfileLike,
    subtotal: number,
  ): {
    vatMode: BillingVatMode;
    vatRatePercent: number;
    vatAmount: number;
    total: number;
  } {
    const vatMode = this.resolveVatMode(profile);
    const vatRatePercent = vatMode === BillingVatMode.DOMESTIC ? 19 : 0;
    const vatAmount = this.roundMoney((subtotal * vatRatePercent) / 100);

    return {
      vatMode,
      vatRatePercent,
      vatAmount,
      total: this.roundMoney(subtotal + vatAmount),
    };
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  async generateInvoice(
    input: GenerateInvoiceDto,
    actorUserId?: string | null,
  ) {
    const billingEvents = await this.prisma.billingEvent.findMany({
      where: {
        userId: input.userId,
        id: { in: input.billingEventIds },
        status: { in: [BillingEventStatus.PENDING, BillingEventStatus.ISSUED] },
        invoiceLine: null,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    if (billingEvents.length === 0) {
      throw new BadRequestException(
        'No invoiceable billing events found for the requested user.',
      );
    }

    if (billingEvents.length !== input.billingEventIds.length) {
      throw new BadRequestException(
        'Some billing events are missing, already invoiced, or not invoiceable.',
      );
    }

    return this.createInvoiceForEvents(
      billingEvents,
      input.dueDays ?? 14,
      actorUserId,
    );
  }

  async listBillingEvents() {
    const events = await this.prisma.billingEvent.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        invoiceLine: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                invoiceType: true,
                status: true,
                total: true,
                currency: true,
              },
            },
          },
        },
        billingLink: {
          include: {
            payrollSettlement: {
              select: {
                id: true,
                status: true,
                payrollCycleId: true,
                workforceAssignmentId: true,
                regularHours: true,
                overtimeHours: true,
              },
            },
            billingInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                invoiceType: true,
                status: true,
                total: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return events.map((event) => ({
      id: event.id,
      createdAt: event.createdAt,
      type: event.type,
      amount: event.amount,
      currency: event.currency,
      status: event.status,
      description: event.description,
      metadata: event.metadata,
      user: event.user,
      invoice: event.invoiceLine?.invoice
        ? {
            ...event.invoiceLine.invoice,
            total: Number(event.invoiceLine.invoice.total),
          }
        : null,
      billingLink: event.billingLink
        ? {
            id: event.billingLink.id,
            status: event.billingLink.status,
            payrollSettlementId: event.billingLink.payrollSettlementId,
            billingInvoiceId: event.billingLink.billingInvoiceId,
            payrollCycleId: event.billingLink.payrollSettlement.payrollCycleId,
            workforceAssignmentId:
              event.billingLink.payrollSettlement.workforceAssignmentId,
            regularHours: event.billingLink.payrollSettlement.regularHours,
            overtimeHours: event.billingLink.payrollSettlement.overtimeHours,
            invoiceNumber:
              event.billingLink.billingInvoice?.invoiceNumber ?? null,
          }
        : null,
    }));
  }

  async listInvoices() {
    const invoices = await this.prisma.billingInvoice.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        lines: {
          include: {
            billingEvent: {
              select: {
                id: true,
                type: true,
                status: true,
                amount: true,
                currency: true,
                metadata: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      currency: invoice.currency,
      fiscalSeries: invoice.fiscalSeries,
      fiscalNumber: invoice.fiscalNumber,
      proformaReference: invoice.proformaReference,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      user: invoice.user,
      lineCount: invoice.lines.length,
      sourceTypes: Array.from(
        new Set(
          invoice.lines
            .map((line) => line.billingEvent?.type)
            .filter((value): value is BillingEventType => Boolean(value)),
        ),
      ),
      workforceSettlementRefs: invoice.lines
        .map((line) => {
          const metadata =
            line.billingEvent?.metadata &&
            typeof line.billingEvent.metadata === 'object'
              ? (line.billingEvent.metadata as Record<string, unknown>)
              : null;

          if (
            !metadata ||
            line.billingEvent?.type !== BillingEventType.WORKFORCE_SETTLEMENT
          ) {
            return null;
          }

          return {
            billingEventId: line.billingEvent.id,
            payrollSettlementId:
              typeof metadata.payrollSettlementId === 'string'
                ? metadata.payrollSettlementId
                : null,
            workerUserId:
              typeof metadata.workerUserId === 'string'
                ? metadata.workerUserId
                : null,
            workerEmail: line.billingEvent.user.email,
          };
        })
        .filter(
          (
            value,
          ): value is {
            billingEventId: string;
            payrollSettlementId: string | null;
            workerUserId: string | null;
            workerEmail: string;
          } => Boolean(value),
        ),
    }));
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        lines: {
          include: {
            billingEvent: {
              select: {
                id: true,
                type: true,
                status: true,
                amount: true,
                currency: true,
              },
            },
          },
        },
        payments: {
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Billing invoice not found.');
    }

    return invoice;
  }

  async markInvoicePaid(
    id: string,
    input: MarkInvoicePaidDto,
    actorUserId?: string | null,
  ) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id },
      include: {
        lines: {
          where: {
            billingEventId: {
              not: null,
            },
          },
          select: {
            billingEventId: true,
          },
        },
        payments: {
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Billing invoice not found.');
    }

    if (
      invoice.status === BillingInvoiceStatus.PAID &&
      invoice.invoiceType === BillingInvoiceType.FISCAL
    ) {
      throw new BadRequestException(
        'Billing invoice is already finalized and paid.',
      );
    }

    const billingEventIds = invoice.lines
      .map((line) => line.billingEventId)
      .filter((value): value is string => Boolean(value));

    const pendingPayment = invoice.payments.find(
      (payment) => payment.status === PaymentRecordStatus.PENDING,
    );

    const fiscalSeries =
      input.fiscalSeries?.trim() || invoice.fiscalSeries || 'OS';
    const fiscalNumber =
      invoice.fiscalNumber || (await this.generateFiscalNumber(fiscalSeries));
    const proformaReference =
      invoice.invoiceType === BillingInvoiceType.PROFORMA
        ? invoice.proformaReference || invoice.invoiceNumber
        : invoice.proformaReference;

    const result = await this.prisma.$transaction(async (tx) => {
      const paidAt = new Date();

      const payment = pendingPayment
        ? await tx.paymentRecord.update({
            where: { id: pendingPayment.id },
            data: {
              provider: input.provider as PaymentProvider,
              providerPaymentId: input.providerPaymentId ?? null,
              status: PaymentRecordStatus.RECONCILED,
              amount: invoice.total,
              currency: invoice.currency,
              paidAt,
              metadata: {
                ...(pendingPayment.metadata &&
                typeof pendingPayment.metadata === 'object'
                  ? (pendingPayment.metadata as Record<string, unknown>)
                  : {}),
                note: input.note ?? null,
                finalizedFromPlaceholder: true,
              },
            },
          })
        : await tx.paymentRecord.create({
            data: {
              userId: invoice.userId,
              invoiceId: invoice.id,
              provider: input.provider as PaymentProvider,
              providerPaymentId: input.providerPaymentId ?? null,
              status: PaymentRecordStatus.RECONCILED,
              amount: invoice.total,
              currency: invoice.currency,
              paidAt,
              metadata: {
                note: input.note ?? null,
              },
            },
          });

      const updatedInvoice = await tx.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status: BillingInvoiceStatus.PAID,
          paidAt,
          invoiceType: BillingInvoiceType.FISCAL,
          fiscalSeries,
          fiscalNumber,
          proformaReference,
        },
      });

      if (billingEventIds.length > 0) {
        await tx.billingEvent.updateMany({
          where: {
            id: { in: billingEventIds },
          },
          data: {
            status: BillingEventStatus.PAID,
          },
        });

        await tx.workforceBillingLink.updateMany({
          where: {
            billingEventId: { in: billingEventIds },
          },
          data: {
            status: SettlementBillingStatus.PAID,
          },
        });

        const workforceLinks = await tx.workforceBillingLink.findMany({
          where: {
            billingEventId: { in: billingEventIds },
          },
          select: {
            payrollSettlementId: true,
          },
        });

        if (workforceLinks.length > 0) {
          await tx.payrollSettlement.updateMany({
            where: {
              id: {
                in: workforceLinks.map((link) => link.payrollSettlementId),
              },
            },
            data: {
              status: SettlementStatus.PAID,
              paidAt,
            },
          });
        }
      }

      return { payment, invoice: updatedInvoice };
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'BillingInvoice',
      entityId: id,
      action: 'FINALIZE_FISCAL_AND_MARK_PAID',
      before: {
        status: invoice.status,
        paidAt: invoice.paidAt,
        invoiceType: invoice.invoiceType,
        fiscalSeries: invoice.fiscalSeries,
        fiscalNumber: invoice.fiscalNumber,
      },
      after: {
        status: result.invoice.status,
        paidAt: result.invoice.paidAt,
        invoiceType: result.invoice.invoiceType,
        fiscalSeries: result.invoice.fiscalSeries,
        fiscalNumber: result.invoice.fiscalNumber,
        paymentRecordId: result.payment.id,
      },
      metadata: {
        provider: input.provider,
        providerPaymentId: input.providerPaymentId ?? null,
        note: input.note ?? null,
      },
    });

    await this.notificationService.emitEvent({
      key: `billing-invoice:paid:${result.invoice.id}`,
      eventType: 'BILLING_INVOICE_PAID',
      sourceType: 'BILLING_INVOICE',
      sourceId: result.invoice.id,
      userId: invoice.userId,
      category: NotificationCategory.BILLING,
      title: 'Invoice paid',
      message: `Invoice ${result.invoice.invoiceNumber ?? result.invoice.id} was marked as paid.`,
      relatedEntityType: 'BillingInvoice',
      relatedEntityId: result.invoice.id,
      metadata: {
        provider: input.provider,
        total: result.invoice.total,
        currency: result.invoice.currency,
      },
    });

    return {
      invoice: await this.getInvoice(id),
      payment: result.payment,
    };
  }

  async listPayments() {
    return this.prisma.paymentRecord.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceType: true,
            status: true,
            fiscalSeries: true,
            fiscalNumber: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async receiveWebhook(
    provider: string,
    payload: unknown,
    options?: {
      rawBody?: Buffer | string | null;
      signatureHeader?: string;
      actorUserId?: string | null;
    },
  ) {
    const normalizedProvider = provider.trim().toLowerCase();

    if (normalizedProvider !== 'stripe') {
      throw new BadRequestException('Unsupported billing webhook provider.');
    }

    const rawPayload = this.resolveWebhookPayloadString(
      payload,
      options?.rawBody,
    );
    this.assertStripeWebhookSignature(rawPayload, options?.signatureHeader);

    const stripeEvent = this.parseStripeWebhookPayload(payload);
    const existing =
      stripeEvent.id.length > 0
        ? await this.prisma.billingWebhookEvent.findFirst({
            where: {
              provider: normalizedProvider,
              externalId: stripeEvent.id,
            },
            orderBy: [{ createdAt: 'desc' }],
          })
        : null;

    if (existing?.status === BillingWebhookStatus.PROCESSED) {
      return existing;
    }

    if (existing) {
      return this.processStoredWebhook(existing, options?.actorUserId ?? null);
    }

    const created = await this.prisma.billingWebhookEvent.create({
      data: {
        provider: normalizedProvider,
        eventType: stripeEvent.type,
        externalId: stripeEvent.id,
        status: BillingWebhookStatus.RECEIVED,
        payload: (payload ?? {}) as object,
      },
    });

    return this.processStoredWebhook(created, options?.actorUserId ?? null);
  }

  async listWebhooks() {
    return this.prisma.billingWebhookEvent.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async processWebhook(
    id: string,
    input: ProcessBillingWebhookDto,
    actorUserId?: string | null,
  ) {
    const existing = await this.prisma.billingWebhookEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Billing webhook event not found.');
    }

    const nextStatus =
      input.status === 'FAILED'
        ? BillingWebhookStatus.FAILED
        : BillingWebhookStatus.PROCESSED;

    if (nextStatus === BillingWebhookStatus.PROCESSED) {
      if (existing.status === BillingWebhookStatus.PROCESSED) {
        return existing;
      }

      return this.processStoredWebhook(existing, actorUserId);
    }

    const updated = await this.prisma.billingWebhookEvent.update({
      where: { id },
      data: {
        status: nextStatus,
        processedAt: null,
        error: input.note ?? 'Processing failed',
      },
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'BillingWebhookEvent',
      entityId: id,
      action: 'FAIL',
      before: {
        status: existing.status,
      },
      after: {
        status: updated.status,
        processedAt: updated.processedAt,
      },
      metadata: {
        note: input.note ?? null,
      },
    });

    return updated;
  }

  private async processStoredWebhook(
    event: {
      id: string;
      provider: string;
      eventType: string;
      externalId: string | null;
      payload: Prisma.JsonValue;
      status: BillingWebhookStatus;
    },
    actorUserId?: string | null,
  ) {
    try {
      const outcome = await this.applyWebhookEvent(event, actorUserId);
      const updated = await this.prisma.billingWebhookEvent.update({
        where: { id: event.id },
        data: {
          status: BillingWebhookStatus.PROCESSED,
          processedAt: new Date(),
          error: null,
        },
      });

      await this.auditService.log({
        actorUserId,
        entityType: 'BillingWebhookEvent',
        entityId: event.id,
        action: 'PROCESS',
        before: {
          status: event.status,
        },
        after: {
          status: updated.status,
          processedAt: updated.processedAt,
        },
        metadata: outcome,
      });

      return updated;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Webhook processing failed.';
      const updated = await this.prisma.billingWebhookEvent.update({
        where: { id: event.id },
        data: {
          status: BillingWebhookStatus.FAILED,
          processedAt: null,
          error: message,
        },
      });

      await this.auditService.log({
        actorUserId,
        entityType: 'BillingWebhookEvent',
        entityId: event.id,
        action: 'FAIL',
        before: {
          status: event.status,
        },
        after: {
          status: updated.status,
          processedAt: updated.processedAt,
          error: updated.error,
        },
        metadata: {
          provider: event.provider,
          eventType: event.eventType,
          externalId: event.externalId,
        },
      });

      throw error;
    }
  }

  async listRenewals() {
    return this.prisma.subscriptionRenewal.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        billingInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceType: true,
            status: true,
            fiscalSeries: true,
            fiscalNumber: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async generateRenewals(
    input: GenerateRenewalsDto,
    actorUserId?: string | null,
  ) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      throw new BadRequestException('Invalid renewal period.');
    }

    const activeSubscriptions = await this.prisma.accountSubscription.findMany({
      where: {
        status: AccountSubscriptionStatus.ACTIVE,
        plan: {
          priceMonthly: {
            gt: 0,
          },
        },
      },
      include: {
        plan: true,
      },
    });

    const createdRenewals: Array<{
      id: string;
      subscriptionId: string;
      billingEventId: string;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const subscription of activeSubscriptions) {
        const existingRenewal = await tx.subscriptionRenewal.findFirst({
          where: {
            subscriptionId: subscription.id,
            periodStart,
            periodEnd,
          },
          select: { id: true },
        });

        if (existingRenewal) {
          continue;
        }

        const renewal = await tx.subscriptionRenewal.create({
          data: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            status: SubscriptionRenewalStatus.SCHEDULED,
            periodStart,
            periodEnd,
            scheduledAt: new Date(),
            metadata: {
              planCode: subscription.plan.code,
            },
          },
        });

        const billingEvent = await tx.billingEvent.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            type: BillingEventType.SUBSCRIPTION_RENEWAL,
            amount: subscription.plan.priceMonthly,
            currency: subscription.plan.currencyCode,
            status: BillingEventStatus.PENDING,
            description: `Scheduled renewal for ${subscription.plan.code}`,
            metadata: {
              renewalId: renewal.id,
              planCode: subscription.plan.code,
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
            },
          },
        });

        await tx.subscriptionRenewal.update({
          where: { id: renewal.id },
          data: {
            metadata: {
              planCode: subscription.plan.code,
              billingEventId: billingEvent.id,
            },
          },
        });

        createdRenewals.push({
          id: renewal.id,
          subscriptionId: subscription.id,
          billingEventId: billingEvent.id,
        });
      }
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'SubscriptionRenewal',
      entityId: `${periodStart.toISOString()}_${periodEnd.toISOString()}`,
      action: 'GENERATE_BATCH',
      before: null,
      after: {
        createdCount: createdRenewals.length,
      },
      metadata: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        renewalIds: createdRenewals.map((item) => item.id),
      },
    });

    return {
      createdCount: createdRenewals.length,
      renewals: createdRenewals,
    };
  }

  async processRenewal(id: string, actorUserId?: string | null) {
    const renewal = await this.prisma.subscriptionRenewal.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!renewal) {
      throw new NotFoundException('Subscription renewal not found.');
    }

    if (renewal.status === SubscriptionRenewalStatus.PROCESSED) {
      throw new BadRequestException(
        'Subscription renewal is already processed.',
      );
    }

    const renewalMetadata =
      renewal.metadata && typeof renewal.metadata === 'object'
        ? (renewal.metadata as Record<string, unknown>)
        : {};
    const billingEventId =
      typeof renewalMetadata.billingEventId === 'string'
        ? renewalMetadata.billingEventId
        : null;

    let invoice: BillingInvoiceWithRelations | null = null;

    if (billingEventId) {
      const billingEvent = await this.prisma.billingEvent.findUnique({
        where: { id: billingEventId },
        include: {
          invoiceLine: {
            include: {
              invoice: true,
            },
          },
        },
      });

      if (billingEvent) {
        if (billingEvent.invoiceLine?.invoice) {
          invoice = (await this.getInvoice(
            billingEvent.invoiceLine.invoice.id,
          )) as BillingInvoiceWithRelations;
        } else {
          invoice = await this.createInvoiceForEvents(
            [billingEvent],
            14,
            actorUserId,
          );
        }
      }
    }

    const updatedRenewal = await this.prisma.subscriptionRenewal.update({
      where: { id },
      data: {
        status: SubscriptionRenewalStatus.PROCESSED,
        processedAt: new Date(),
        billingInvoiceId: invoice?.id ?? null,
      },
      include: {
        billingInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceType: true,
            status: true,
            fiscalSeries: true,
            fiscalNumber: true,
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'SubscriptionRenewal',
      entityId: id,
      action: 'PROCESS',
      before: {
        status: renewal.status,
        billingInvoiceId: renewal.billingInvoiceId,
      },
      after: {
        status: updatedRenewal.status,
        billingInvoiceId: updatedRenewal.billingInvoiceId,
      },
      metadata: {
        invoiceId: invoice?.id ?? null,
      },
    });

    return {
      renewal: updatedRenewal,
      invoice,
    };
  }

  private async createInvoiceForEvents(
    billingEvents: Array<{
      id: string;
      userId: string;
      subscriptionId: string | null;
      amount: number;
      currency: string;
      description: string;
      status: BillingEventStatus;
      metadata: unknown;
    }>,
    dueDays: number,
    actorUserId?: string | null,
  ) {
    const first = billingEvents[0];
    const currency = first.currency;

    if (billingEvents.some((event) => event.currency !== currency)) {
      throw new BadRequestException(
        'All billing events in an invoice must use the same currency.',
      );
    }

    const subtotal = billingEvents.reduce(
      (sum, event) => sum + event.amount,
      0,
    );
    const subscriptionIds = Array.from(
      new Set(
        billingEvents
          .map((event) => event.subscriptionId)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const subscriptionId =
      subscriptionIds.length === 1 ? subscriptionIds[0] : null;
    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + dueDays * 24 * 60 * 60 * 1000);
    const invoiceNumber = await this.generateProformaNumber();
    const billingProfile = await this.ensureBillingProfile(
      first.userId,
      currency,
    );
    const vatSummary = this.calculateVat(billingProfile, subtotal);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.billingInvoice.create({
        data: {
          userId: first.userId,
          subscriptionId,
          invoiceNumber,
          invoiceType: BillingInvoiceType.PROFORMA,
          status: BillingInvoiceStatus.ISSUED,
          currency,
          subtotal,
          taxAmount: vatSummary.vatAmount,
          total: vatSummary.total,
          issuedAt,
          dueAt,
          metadata: {
            generatedFromBillingEventIds: billingEvents.map(
              (event) => event.id,
            ),
            vatMode: vatSummary.vatMode,
            vatRatePercent: vatSummary.vatRatePercent,
            billingProfileSnapshot: {
              companyName: billingProfile.companyName,
              vatId: billingProfile.vatId,
              country: billingProfile.country,
              region: billingProfile.region,
              city: billingProfile.city,
              addressLine1: billingProfile.addressLine1,
              addressLine2: billingProfile.addressLine2,
              postalCode: billingProfile.postalCode,
              currency: billingProfile.currency,
              isCompany: billingProfile.isCompany,
              isVatPayer: billingProfile.isVatPayer,
              vatMode: billingProfile.vatMode,
            },
          },
        },
      });

      for (const event of billingEvents) {
        await tx.billingInvoiceLine.create({
          data: {
            invoiceId: createdInvoice.id,
            billingEventId: event.id,
            description: event.description,
            quantity: 1,
            unitPrice: event.amount,
            amount: event.amount,
            metadata:
              event.metadata && typeof event.metadata === 'object'
                ? (event.metadata as object)
                : undefined,
          },
        });
      }

      await tx.paymentRecord.create({
        data: {
          userId: first.userId,
          invoiceId: createdInvoice.id,
          provider: PaymentProvider.MANUAL,
          status: PaymentRecordStatus.PENDING,
          amount: vatSummary.total,
          currency,
          metadata: {
            placeholder: true,
            reason: 'Awaiting manual/admin reconciliation',
          },
        },
      });

      await tx.billingEvent.updateMany({
        where: {
          id: {
            in: billingEvents.map((event) => event.id),
          },
        },
        data: {
          status: BillingEventStatus.ISSUED,
        },
      });

      await tx.workforceBillingLink.updateMany({
        where: {
          billingEventId: {
            in: billingEvents.map((event) => event.id),
          },
        },
        data: {
          billingInvoiceId: createdInvoice.id,
          status: SettlementBillingStatus.INVOICED,
        },
      });

      return tx.billingInvoice.findUniqueOrThrow({
        where: { id: createdInvoice.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          lines: {
            include: {
              billingEvent: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  amount: true,
                  currency: true,
                },
              },
            },
          },
          payments: true,
        },
      });
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'BillingInvoice',
      entityId: invoice.id,
      action: 'GENERATE_PROFORMA',
      before: null,
      after: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        status: invoice.status,
        total: invoice.total,
        taxAmount: invoice.taxAmount,
      },
      metadata: {
        billingEventIds: billingEvents.map((event) => event.id),
        vatMode: vatSummary.vatMode,
        vatRatePercent: vatSummary.vatRatePercent,
      },
    });

    await this.notificationService.emitEvent({
      key: `billing-invoice:issued:${invoice.id}`,
      eventType: 'BILLING_INVOICE_ISSUED',
      sourceType: 'BILLING_INVOICE',
      sourceId: invoice.id,
      userId: first.userId,
      category: NotificationCategory.BILLING,
      title: 'Invoice issued',
      message: `A new invoice ${invoice.invoiceNumber} is available for review.`,
      relatedEntityType: 'BillingInvoice',
      relatedEntityId: invoice.id,
      metadata: {
        invoiceType: invoice.invoiceType,
        total: invoice.total,
        taxAmount: invoice.taxAmount,
        currency: invoice.currency,
        billingEventIds: billingEvents.map((event) => event.id),
      },
    });

    return invoice;
  }

  private async applyWebhookEvent(
    event: {
      id: string;
      provider: string;
      eventType: string;
      externalId: string | null;
      payload: Prisma.JsonValue;
    },
    actorUserId?: string | null,
  ) {
    if (event.provider !== 'stripe') {
      throw new BadRequestException('Unsupported billing webhook provider.');
    }

    const payload = this.parseStripeWebhookPayload(event.payload);
    const supportedSuccessEvents = new Set([
      'checkout.session.completed',
      'invoice.payment_succeeded',
      'payment_intent.succeeded',
      'charge.succeeded',
    ]);
    const supportedFailureEvents = new Set([
      'invoice.payment_failed',
      'payment_intent.payment_failed',
      'charge.failed',
    ]);

    if (
      !supportedSuccessEvents.has(payload.type) &&
      !supportedFailureEvents.has(payload.type)
    ) {
      return {
        provider: event.provider,
        eventType: payload.type,
        action: 'ignored',
        reason: 'unsupported_event_type',
      };
    }

    const reference = this.extractStripeInvoiceReference(payload);
    if (!reference.invoiceId && !reference.invoiceNumber) {
      throw new BadRequestException(
        'Stripe webhook payload is missing billing invoice metadata.',
      );
    }

    const invoice = await this.findInvoiceByStripeReference(reference);
    if (!invoice) {
      throw new NotFoundException(
        'Billing invoice referenced by webhook was not found.',
      );
    }

    const providerPaymentId =
      this.extractStripeProviderPaymentId(payload) ??
      event.externalId ??
      undefined;

    if (supportedSuccessEvents.has(payload.type)) {
      if (invoice.status === BillingInvoiceStatus.PAID) {
        return {
          provider: event.provider,
          eventType: payload.type,
          action: 'already_paid',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        };
      }

      await this.markInvoicePaid(
        invoice.id,
        {
          provider: 'MANUAL',
          providerPaymentId,
          note: `Auto-reconciled from Stripe webhook ${payload.type}.`,
        },
        actorUserId,
      );

      return {
        provider: event.provider,
        eventType: payload.type,
        action: 'invoice_paid',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        providerPaymentId: providerPaymentId ?? null,
      };
    }

    await this.markInvoicePaymentFailed({
      invoiceId: invoice.id,
      providerPaymentId,
      eventType: payload.type,
      externalId: event.externalId,
      actorUserId,
    });

    return {
      provider: event.provider,
      eventType: payload.type,
      action: 'payment_failed',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      providerPaymentId: providerPaymentId ?? null,
    };
  }

  private parseStripeWebhookPayload(
    payload: unknown,
  ): StripeWebhookEventEnvelope {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException(
        'Stripe webhook payload must be a JSON object.',
      );
    }

    const envelope = payload as Record<string, unknown>;
    const id = typeof envelope.id === 'string' ? envelope.id.trim() : '';
    const type = typeof envelope.type === 'string' ? envelope.type.trim() : '';

    if (!id || !type) {
      throw new BadRequestException(
        'Stripe webhook payload must include id and type.',
      );
    }

    const data =
      envelope.data &&
      typeof envelope.data === 'object' &&
      !Array.isArray(envelope.data)
        ? (envelope.data as { object?: Record<string, unknown> })
        : undefined;

    return {
      id,
      type,
      data,
    };
  }

  private resolveWebhookPayloadString(
    payload: unknown,
    rawBody?: Buffer | string | null,
  ) {
    if (Buffer.isBuffer(rawBody)) {
      return rawBody.toString('utf8');
    }

    if (typeof rawBody === 'string') {
      return rawBody;
    }

    return JSON.stringify(payload ?? {});
  }

  private assertStripeWebhookSignature(
    payload: string,
    signatureHeader?: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured.');
    }

    if (!signatureHeader?.trim()) {
      throw new BadRequestException('Missing Stripe-Signature header.');
    }

    const signatureParts = Object.fromEntries(
      signatureHeader.split(',').map((entry) => {
        const [key, value] = entry.split('=');
        return [key?.trim(), value?.trim()];
      }),
    );

    const timestamp = signatureParts.t;
    const signature = signatureParts.v1;

    if (!timestamp || !signature) {
      throw new BadRequestException('Stripe-Signature header is malformed.');
    }

    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds)) {
      throw new BadRequestException('Stripe-Signature timestamp is invalid.');
    }

    const ageSeconds = Math.abs(
      Math.floor(Date.now() / 1000) - timestampSeconds,
    );
    if (ageSeconds > 300) {
      throw new BadRequestException(
        'Stripe webhook signature timestamp expired.',
      );
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new BadRequestException(
        'Stripe webhook signature verification failed.',
      );
    }
  }

  private extractStripeInvoiceReference(payload: StripeWebhookEventEnvelope) {
    const stripeObject = payload.data?.object ?? {};
    const metadata =
      stripeObject.metadata &&
      typeof stripeObject.metadata === 'object' &&
      !Array.isArray(stripeObject.metadata)
        ? (stripeObject.metadata as Record<string, unknown>)
        : {};

    const invoiceIdCandidates = [
      metadata.invoiceId,
      metadata.billingInvoiceId,
      metadata.invoice_id,
    ];
    const invoiceNumberCandidates = [
      metadata.invoiceNumber,
      metadata.invoice_number,
    ];

    return {
      invoiceId: this.pickStringValue(invoiceIdCandidates),
      invoiceNumber: this.pickStringValue(invoiceNumberCandidates),
    };
  }

  private extractStripeProviderPaymentId(payload: StripeWebhookEventEnvelope) {
    const stripeObject = payload.data?.object ?? {};
    const candidates = [
      stripeObject.payment_intent,
      stripeObject.paymentIntent,
      stripeObject.charge,
      stripeObject.id,
    ];

    return this.pickStringValue(candidates);
  }

  private async findInvoiceByStripeReference(reference: {
    invoiceId: string | null;
    invoiceNumber: string | null;
  }) {
    if (reference.invoiceId) {
      const invoice = await this.prisma.billingInvoice.findUnique({
        where: { id: reference.invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      });

      if (invoice) {
        return invoice;
      }
    }

    if (reference.invoiceNumber) {
      return this.prisma.billingInvoice.findUnique({
        where: { invoiceNumber: reference.invoiceNumber },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      });
    }

    return null;
  }

  private async markInvoicePaymentFailed(input: {
    invoiceId: string;
    providerPaymentId?: string;
    eventType: string;
    externalId?: string | null;
    actorUserId?: string | null;
  }) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        payments: {
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Billing invoice not found.');
    }

    const failureMetadata = {
      source: 'stripe_webhook',
      eventType: input.eventType,
      externalId: input.externalId ?? null,
      providerPaymentId: input.providerPaymentId ?? null,
    };

    const pendingPayment = invoice.payments.find(
      (payment) => payment.status === PaymentRecordStatus.PENDING,
    );

    const failedPayment = pendingPayment
      ? await this.prisma.paymentRecord.update({
          where: { id: pendingPayment.id },
          data: {
            status: PaymentRecordStatus.FAILED,
            providerPaymentId:
              input.providerPaymentId ?? pendingPayment.providerPaymentId,
            metadata: {
              ...(pendingPayment.metadata &&
              typeof pendingPayment.metadata === 'object'
                ? (pendingPayment.metadata as Record<string, unknown>)
                : {}),
              ...failureMetadata,
            },
          },
        })
      : await this.prisma.paymentRecord.create({
          data: {
            userId: invoice.userId,
            invoiceId: invoice.id,
            provider: PaymentProvider.MANUAL,
            providerPaymentId: input.providerPaymentId ?? null,
            status: PaymentRecordStatus.FAILED,
            amount: invoice.total,
            currency: invoice.currency,
            metadata: failureMetadata,
          },
        });

    await this.auditService.log({
      actorUserId: input.actorUserId ?? null,
      entityType: 'PaymentRecord',
      entityId: failedPayment.id,
      action: 'MARK_FAILED_FROM_WEBHOOK',
      before: pendingPayment
        ? {
            status: pendingPayment.status,
            providerPaymentId: pendingPayment.providerPaymentId,
          }
        : null,
      after: {
        status: failedPayment.status,
        providerPaymentId: failedPayment.providerPaymentId,
      },
      metadata: failureMetadata,
    });

    return failedPayment;
  }

  private pickStringValue(values: unknown[]) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private async ensureBillingProfile(userId: string, currency: string) {
    const existing = await this.prisma.billingProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: {
          select: {
            displayName: true,
            companyName: true,
          },
        },
      },
    });

    return this.prisma.billingProfile.create({
      data: {
        userId,
        companyName: user?.profile?.companyName ?? null,
        country: 'Romania',
        addressLine1: 'Pending billing profile completion',
        currency,
        isCompany: Boolean(user?.profile?.companyName),
        isVatPayer: false,
        vatMode: BillingVatMode.DOMESTIC,
      },
    });
  }

  private resolveVatMode(profile: BillingProfileLike) {
    if (profile.vatMode === BillingVatMode.EXEMPT) {
      return BillingVatMode.EXEMPT;
    }

    const country = this.normalizeCountry(profile.country);

    if (country === 'RO' || country === 'ROMANIA') {
      return BillingVatMode.DOMESTIC;
    }

    if (EU_COUNTRIES.has(country)) {
      if (
        profile.isCompany &&
        profile.isVatPayer &&
        Boolean(profile.vatId?.trim())
      ) {
        return BillingVatMode.EU_REVERSE_CHARGE;
      }

      return BillingVatMode.DOMESTIC;
    }

    return BillingVatMode.EXPORT;
  }

  private normalizeCountry(value: string) {
    return value.trim().toUpperCase();
  }

  private async generateProformaNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes(),
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(
      now.getMilliseconds(),
    ).padStart(3, '0')}`;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `PRO-${datePart}-${timePart}${attempt > 0 ? `-${attempt}` : ''}`;
      const existing = await this.prisma.billingInvoice.findUnique({
        where: { invoiceNumber: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException(
      'Unable to generate a unique proforma invoice number.',
    );
  }

  private async generateFiscalNumber(series: string) {
    const latest = await this.prisma.billingInvoice.findFirst({
      where: {
        invoiceType: BillingInvoiceType.FISCAL,
        fiscalSeries: series,
      },
      orderBy: [{ createdAt: 'desc' }],
      select: { fiscalNumber: true },
    });

    const latestValue = Number.parseInt(latest?.fiscalNumber ?? '0', 10);
    const nextValue = Number.isFinite(latestValue) ? latestValue + 1 : 1;

    return String(nextValue).padStart(4, '0');
  }
}
