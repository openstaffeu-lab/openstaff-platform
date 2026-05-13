import {
  AccountSubscriptionStatus,
  BillingEventStatus,
  BillingEventType,
  BillingInvoiceStatus,
  BillingWebhookStatus,
  Prisma,
  PaymentProvider,
  PaymentRecordStatus,
  SubscriptionRenewalStatus,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { GenerateRenewalsDto } from './dto/generate-renewals.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { ProcessBillingWebhookDto } from './dto/process-billing-webhook.dto';

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

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async generateInvoice(input: GenerateInvoiceDto, actorUserId?: string | null) {
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
      throw new BadRequestException('No invoiceable billing events found for the requested user.');
    }

    if (billingEvents.length !== input.billingEventIds.length) {
      throw new BadRequestException(
        'Some billing events are missing, already invoiced, or not invoiceable.',
      );
    }

    return this.createInvoiceForEvents(billingEvents, input.dueDays ?? 14, actorUserId);
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
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      user: invoice.user,
      lineCount: invoice.lines.length,
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

  async markInvoicePaid(id: string, input: MarkInvoicePaidDto, actorUserId?: string | null) {
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
      },
    });

    if (!invoice) {
      throw new NotFoundException('Billing invoice not found.');
    }

    if (invoice.status === BillingInvoiceStatus.PAID) {
      throw new BadRequestException('Billing invoice is already marked as paid.');
    }

    const billingEventIds = invoice.lines
      .map((line) => line.billingEventId)
      .filter((value): value is string => Boolean(value));

    const result = await this.prisma.$transaction(async (tx) => {
      const paidAt = new Date();

      const payment = await tx.paymentRecord.create({
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
      }

      return { payment, invoice: updatedInvoice };
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'BillingInvoice',
      entityId: id,
      action: 'MARK_PAID',
      before: {
        status: invoice.status,
        paidAt: invoice.paidAt,
      },
      after: {
        status: result.invoice.status,
        paidAt: result.invoice.paidAt,
        paymentRecordId: result.payment.id,
      },
      metadata: {
        provider: input.provider,
        providerPaymentId: input.providerPaymentId ?? null,
        note: input.note ?? null,
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
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async receiveWebhook(provider: string, payload: unknown) {
    const eventType =
      typeof payload === 'object' && payload !== null && 'eventType' in payload
        ? String((payload as Record<string, unknown>).eventType)
        : typeof payload === 'object' && payload !== null && 'type' in payload
          ? String((payload as Record<string, unknown>).type)
          : 'UNKNOWN';
    const externalId =
      typeof payload === 'object' && payload !== null && 'id' in payload
        ? String((payload as Record<string, unknown>).id)
        : null;

    return this.prisma.billingWebhookEvent.create({
      data: {
        provider,
        eventType,
        externalId,
        status: BillingWebhookStatus.RECEIVED,
        payload: (payload ?? {}) as object,
      },
    });
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

    const updated = await this.prisma.billingWebhookEvent.update({
      where: { id },
      data: {
        status: nextStatus,
        processedAt: nextStatus === BillingWebhookStatus.PROCESSED ? new Date() : null,
        error: nextStatus === BillingWebhookStatus.FAILED ? input.note ?? 'Processing failed' : null,
      },
    });

    await this.auditService.log({
      actorUserId,
      entityType: 'BillingWebhookEvent',
      entityId: id,
      action: nextStatus === BillingWebhookStatus.PROCESSED ? 'PROCESS' : 'FAIL',
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
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async generateRenewals(input: GenerateRenewalsDto, actorUserId?: string | null) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
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

    const createdRenewals: Array<{ id: string; subscriptionId: string; billingEventId: string }> = [];

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
      throw new BadRequestException('Subscription renewal is already processed.');
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
          const createdInvoice = await this.createInvoiceForEvents(
            [billingEvent],
            14,
            actorUserId,
          );
          invoice = createdInvoice;
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
            status: true,
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
      throw new BadRequestException('All billing events in an invoice must use the same currency.');
    }

    const subtotal = billingEvents.reduce((sum, event) => sum + event.amount, 0);
    const subscriptionIds = Array.from(
      new Set(
        billingEvents
          .map((event) => event.subscriptionId)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const subscriptionId = subscriptionIds.length === 1 ? subscriptionIds[0] : null;
    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + dueDays * 24 * 60 * 60 * 1000);
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.billingInvoice.create({
        data: {
          userId: first.userId,
          subscriptionId,
          invoiceNumber,
          status: BillingInvoiceStatus.ISSUED,
          currency,
          subtotal,
          taxAmount: 0,
          total: subtotal,
          issuedAt,
          dueAt,
          metadata: {
            generatedFromBillingEventIds: billingEvents.map((event) => event.id),
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
      action: 'GENERATE',
      before: null,
      after: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total,
      },
      metadata: {
        billingEventIds: billingEvents.map((event) => event.id),
      },
    });

    return invoice;
  }

  private async generateInvoiceNumber() {
    const count = await this.prisma.billingInvoice.count();
    return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
  }
}
