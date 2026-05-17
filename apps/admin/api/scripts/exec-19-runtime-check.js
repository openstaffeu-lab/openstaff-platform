require('dotenv').config({ path: '.env' });

const { createHmac } = require('node:crypto');
const { spawn } = require('node:child_process');
const {
  PrismaClient,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  Role,
} = require('@prisma/client');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(500);
  }

  throw new Error(`Server did not become healthy on ${baseUrl} within ${timeoutMs}ms.`);
}

async function http(baseUrl, path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: response.status, body };
}

async function httpRaw(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'POST',
    headers: options.headers ?? {},
    body: options.rawBody,
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: response.status, body };
}

function unwrapData(response) {
  return response?.body?.data ?? response?.body ?? null;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function signStripePayload(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify(payload);
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  return {
    rawBody,
    signatureHeader: `t=${timestamp},v1=${signature}`,
  };
}

async function register(baseUrl, payload) {
  return http(baseUrl, '/auth/register', { method: 'POST', body: payload });
}

async function login(baseUrl, email, password) {
  return http(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

async function main() {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET || 'exec19-test-webhook-secret';

  const prisma = new PrismaClient();
  const port = 8096;
  const baseUrl = `http://127.0.0.1:${port}`;
  const runId = `exec19-${Date.now()}`;

  const server = spawn('node', ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX_REQUESTS: '20',
      STRIPE_WEBHOOK_SECRET: stripeSecret,
    },
    stdio: 'inherit',
  });

  try {
    await waitForServer(baseUrl);

    const health = await http(baseUrl, '/health');
    assert(health.status === 200, '/health must return 200.');

    const initialStatus = await http(baseUrl, '/status');
    assert(initialStatus.status === 200, '/status must return 200.');
    const initialStatusBody = unwrapData(initialStatus);
    assert(Array.isArray(initialStatusBody?.readiness?.errors), 'Status readiness errors missing.');
    assert(initialStatusBody.readiness.errors.length === 0, '/status readiness errors must stay empty.');

    const adminEmail = `${runId}-admin@openstaff.eu`;
    const userEmail = `${runId}-user@openstaff.eu`;
    const password = 'OpenStaff!123';

    const adminRegister = await register(baseUrl, {
      email: adminEmail,
      password,
      displayName: 'Exec 19 Admin',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });
    assert(adminRegister.status === 201, 'Admin registration must succeed.');
    const adminUser = unwrapData(adminRegister).user;
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        role: Role.SUPERADMIN,
        approvalStatus: AccountApprovalStatus.APPROVED,
        accountStatus: AccountLifecycleStatus.LIVE,
      },
    });

    const userRegister = await register(baseUrl, {
      email: userEmail,
      password,
      displayName: 'Exec 19 User',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });
    assert(userRegister.status === 201, 'User registration must succeed.');
    const userAuth = unwrapData(userRegister);
    const userToken = userAuth.accessToken;

    const adminLogin = await login(baseUrl, adminEmail, password);
    assert(adminLogin.status === 200, 'Admin login must succeed.');
    const adminToken = unwrapData(adminLogin).accessToken;

    const authMe = await http(baseUrl, '/auth/me', { token: userToken });
    assert(authMe.status === 200, 'Auth /me must remain stable.');

    const billingProfileUpdate = await http(baseUrl, '/billing/profile/me', {
      method: 'PUT',
      token: userToken,
      body: {
        companyName: 'Exec 19 Builders',
        vatId: 'RO12345678',
        country: 'Romania',
        city: 'Bucharest',
        addressLine1: 'Bd. Unirii 1',
        postalCode: '010101',
        currency: 'EUR',
        isCompany: true,
        isVatPayer: true,
      },
    });
    assert(billingProfileUpdate.status === 200, 'Billing profile update must succeed.');

    const upgradeRequest = await http(baseUrl, '/subscriptions/upgrade-requests', {
      method: 'POST',
      token: userToken,
      body: {
        requestedPlanCode: 'GOLD',
        source: 'PRICING',
        message: 'Need more private outreach capacity.',
      },
    });
    assert(upgradeRequest.status === 200 || upgradeRequest.status === 201, 'Upgrade request must succeed.');
    const requestId = unwrapData(upgradeRequest).id;

    const adminRequests = await http(baseUrl, '/admin/subscription-upgrade-requests', {
      token: adminToken,
    });
    assert(adminRequests.status === 200, 'Admin upgrade request listing must succeed.');
    assert(
      unwrapData(adminRequests).some((item) => item.id === requestId),
      'Admin must see the upgrade request.',
    );

    const approveRequest = await http(
      baseUrl,
      `/admin/subscription-upgrade-requests/${requestId}/approve`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          billingStatus: 'PENDING',
        },
      },
    );
    assert(
      approveRequest.status === 200 || approveRequest.status === 201,
      'Upgrade approval must succeed.',
    );
    const approvePayload = unwrapData(approveRequest);
    const invoiceId = approvePayload.invoice.id;
    assert(approvePayload.subscription?.planCode === 'GOLD', 'Approved subscription must be GOLD.');
    assert(approvePayload.invoice.status === 'ISSUED', 'Invoice must be issued after approval.');

    const invoices = await http(baseUrl, '/admin/billing/invoices', { token: adminToken });
    const paymentsBeforeWebhook = await http(baseUrl, '/admin/billing/payments', { token: adminToken });
    const events = await http(baseUrl, '/admin/billing/events', { token: adminToken });
    assert(invoices.status === 200, 'Admin billing invoices must be visible.');
    assert(paymentsBeforeWebhook.status === 200, 'Admin billing payments must be visible.');
    assert(events.status === 200, 'Admin billing events must be visible.');

    const paymentBeforeWebhook = unwrapData(paymentsBeforeWebhook).find(
      (payment) => payment.invoice?.id === invoiceId,
    );
    assert(paymentBeforeWebhook?.status === 'PENDING', 'Invoice should start with a pending manual payment record.');

    const stripeSuccessEvent = {
      id: `evt_${runId}_success`,
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: `in_${runId}`,
          payment_intent: `pi_${runId}`,
          metadata: {
            invoiceId,
          },
        },
      },
    };
    const signedSuccess = signStripePayload(stripeSuccessEvent, stripeSecret);
    const successWebhook = await httpRaw(baseUrl, '/billing/webhooks/stripe', {
      method: 'POST',
      rawBody: signedSuccess.rawBody,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signedSuccess.signatureHeader,
      },
    });
    assert(successWebhook.status === 200 || successWebhook.status === 201, 'Signed Stripe success webhook must succeed.');

    const invoiceAfterWebhook = await http(baseUrl, `/admin/billing/invoices/${invoiceId}`, {
      token: adminToken,
    });
    assert(invoiceAfterWebhook.status === 200, 'Invoice detail must remain visible.');
    const paidInvoice = unwrapData(invoiceAfterWebhook);
    assert(paidInvoice.status === 'PAID', 'Webhook success must reconcile invoice to PAID.');
    assert(paidInvoice.invoiceType === 'FISCAL', 'Webhook success must finalize invoice to FISCAL.');

    const paymentsAfterWebhook = await http(baseUrl, '/admin/billing/payments', { token: adminToken });
    const reconciledPayment = unwrapData(paymentsAfterWebhook).find(
      (payment) => payment.invoice?.id === invoiceId && payment.status === 'RECONCILED',
    );
    assert(reconciledPayment, 'Webhook success must reconcile a payment record.');

    const idempotentWebhook = await httpRaw(baseUrl, '/billing/webhooks/stripe', {
      method: 'POST',
      rawBody: signedSuccess.rawBody,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signedSuccess.signatureHeader,
      },
    });
    assert(idempotentWebhook.status === 200 || idempotentWebhook.status === 201, 'Replayed Stripe webhook must remain idempotent.');

    const webhooksAfterReplay = await http(baseUrl, '/admin/billing/webhooks', { token: adminToken });
    assert(webhooksAfterReplay.status === 200, 'Admin billing webhooks must be visible.');
    const successEvents = unwrapData(webhooksAfterReplay).filter(
      (event) => event.externalId === stripeSuccessEvent.id,
    );
    assert(successEvents.length === 1, 'Webhook persistence must be idempotent per external event id.');

    const failingStripeEvent = {
      id: `evt_${runId}_missing_invoice`,
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: `in_missing_${runId}`,
          payment_intent: `pi_missing_${runId}`,
          metadata: {
            invoiceId: 'missing-invoice-id',
          },
        },
      },
    };
    const signedFailure = signStripePayload(failingStripeEvent, stripeSecret);
    const failingWebhook = await httpRaw(baseUrl, '/billing/webhooks/stripe', {
      method: 'POST',
      rawBody: signedFailure.rawBody,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signedFailure.signatureHeader,
      },
    });
    assert(failingWebhook.status >= 400, 'Unresolvable Stripe webhook should fail and remain visible for retry.');

    const webhooksAfterFailure = await http(baseUrl, '/admin/billing/webhooks', { token: adminToken });
    const failedWebhook = unwrapData(webhooksAfterFailure).find(
      (event) => event.externalId === failingStripeEvent.id,
    );
    assert(failedWebhook?.status === 'FAILED', 'Failed webhook must be persisted with FAILED status.');

    const retryFailedWebhook = await http(
      baseUrl,
      `/admin/billing/webhooks/${failedWebhook.id}/process`,
      {
        method: 'POST',
        token: adminToken,
        body: { status: 'PROCESSED' },
      },
    );
    assert(retryFailedWebhook.status >= 400, 'Retrying an unresolved webhook should still fail visibly.');

    const finalWebhookList = await http(baseUrl, '/admin/billing/webhooks', { token: adminToken });
    const failedWebhookAfterRetry = unwrapData(finalWebhookList).find(
      (event) => event.id === failedWebhook.id,
    );
    assert(
      failedWebhookAfterRetry?.status === 'FAILED',
      'Failed webhook must stay FAILED after an unresolved retry.',
    );

    const notifications = await http(baseUrl, '/notifications', { token: userToken });
    assert(notifications.status === 200, 'Notifications must remain stable.');

    const publicFeed = await http(baseUrl, '/public-posts');
    assert(publicFeed.status === 200, 'Public feed must remain stable.');

    const subscriptionsMe = await http(baseUrl, '/subscriptions/me', { token: userToken });
    const billingMe = await http(baseUrl, '/billing/profile/me', { token: userToken });
    assert(subscriptionsMe.status === 200, 'Subscriptions must remain stable.');
    assert(billingMe.status === 200, 'Billing profile must remain stable.');

    const finalStatus = await http(baseUrl, '/status');
    assert(finalStatus.status === 200, 'Final /status must return 200.');
    const finalStatusBody = unwrapData(finalStatus);
    assert(finalStatusBody.db === 'healthy', 'Database must stay healthy.');
    assert(finalStatusBody.api === 'ok', 'API must stay healthy.');
    assert(Array.isArray(finalStatusBody.readiness?.errors), 'Final readiness errors missing.');
    assert(finalStatusBody.readiness.errors.length === 0, 'Final readiness errors must stay empty.');
    assert(
      finalStatusBody.integrations?.commercial?.launchMode === 'manual_only',
      'Commercial launch mode must be explicit as manual_only when checkout is not configured.',
    );
    assert(
      finalStatusBody.integrations?.billingWebhook?.mode === 'configured',
      'Billing webhook mode must report configured when STRIPE_WEBHOOK_SECRET is present.',
    );
    assert(
      finalStatusBody.integrations?.emailDelivery?.mode === 'not_configured',
      'Email delivery mode must be explicit when no provider exists.',
    );
    assert(
      ['manual_only', 'not_required'].includes(finalStatusBody.integrations?.smsDelivery?.mode),
      'SMS delivery mode must be explicit and non-public.',
    );

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          runId,
          invoiceId,
          paidInvoiceStatus: paidInvoice.status,
          webhookSuccessEventId: stripeSuccessEvent.id,
          webhookFailureEventId: failingStripeEvent.id,
          publicBillingMode: finalStatusBody.integrations?.commercial?.launchMode,
          webhookMode: finalStatusBody.integrations?.billingWebhook?.mode,
          emailMode: finalStatusBody.integrations?.emailDelivery?.mode,
          smsMode: finalStatusBody.integrations?.smsDelivery?.mode,
        },
        null,
        2,
      ),
    );
  } finally {
    server.kill();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
