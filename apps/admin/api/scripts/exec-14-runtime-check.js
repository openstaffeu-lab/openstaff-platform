require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const { PrismaClient, AccountApprovalStatus, AccountLifecycleStatus, Role } = require('@prisma/client');

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

  return {
    status: response.status,
    body,
    headers: {
      requestId: response.headers.get('x-request-id'),
    },
  };
}

function unwrapData(response) {
  return response?.body?.data ?? response?.body ?? null;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  const prisma = new PrismaClient();
  const port = 8094;
  const baseUrl = `http://127.0.0.1:${port}`;
  const runId = `exec14-${Date.now()}`;

  const server = spawn('node', ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX_REQUESTS: '2',
    },
    stdio: 'inherit',
  });

  try {
    await waitForServer(baseUrl);

    const health = await http(baseUrl, '/health');
    assert(health.status === 200, 'Health check must return 200.');

    const status = await http(baseUrl, '/status');
    assert(status.status === 200, 'Status check must return 200.');

    const adminEmail = `${runId}-admin@openstaff.eu`;
    const userEmail = `${runId}-user@openstaff.eu`;
    const password = 'OpenStaff!123';

    const adminRegister = await register(baseUrl, {
      email: adminEmail,
      password,
      displayName: 'Exec 14 Admin',
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
      displayName: 'Exec 14 Worker',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });
    assert(userRegister.status === 201, 'Worker registration must succeed.');

    const userAuth = unwrapData(userRegister);
    const userToken = userAuth.accessToken;
    const userId = userAuth.user.id;

    const adminLogin = await login(baseUrl, adminEmail, password);
    assert(adminLogin.status === 200, 'Admin login must succeed.');
    const adminToken = unwrapData(adminLogin).accessToken;

    const mySessions = await http(baseUrl, '/auth/sessions', { token: userToken });
    assert(mySessions.status === 200, 'User sessions endpoint must return 200.');
    const sessions = unwrapData(mySessions);
    assert(Array.isArray(sessions) && sessions.length >= 1, 'Session creation must be persisted.');

    const revokeSession = await http(baseUrl, `/auth/sessions/${sessions[0].id}`, {
      method: 'DELETE',
      token: userToken,
    });
    assert(revokeSession.status === 200, 'Session revoke must succeed.');
    assert(unwrapData(revokeSession).revokedAt, 'Revoked session must expose revokedAt.');

    const createPost = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'PROJECT',
        title: `Exec 14 Security Post ${runId}`,
        description: 'Security audit runtime validation post',
        visibility: 'PUBLIC',
        location: 'Bucharest',
        domain: 'Security',
      },
    });
    assert(createPost.status === 201, 'Public post creation must succeed.');
    const post = unwrapData(createPost);

    const approvePost = await http(baseUrl, `/admin/public-posts/${post.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'LIVE',
        moderationStatus: 'APPROVED',
        visibility: 'PUBLIC',
      },
    });
    assert(approvePost.status === 200, 'Admin post approval must succeed.');

    const publicFeed = await http(baseUrl, '/public-posts');
    assert(publicFeed.status === 200, 'Public feed must remain stable.');

    const exportRequest = await http(baseUrl, '/compliance/export-request', {
      method: 'POST',
      token: userToken,
    });
    assert(exportRequest.status === 201 || exportRequest.status === 200, 'Export request must succeed.');

    const deleteRequest = await http(baseUrl, '/compliance/delete-request', {
      method: 'POST',
      token: userToken,
    });
    assert(deleteRequest.status === 201 || deleteRequest.status === 200, 'Delete request must succeed.');

    const forbiddenAdminPosts = await http(baseUrl, '/admin/public-posts', {
      token: userToken,
    });
    assert(forbiddenAdminPosts.status === 403, 'Non-admin admin route access must return 403.');
    assert(forbiddenAdminPosts.body?.requestId, 'Forbidden response must include requestId.');
    assert(forbiddenAdminPosts.body?.code, 'Forbidden response must include code.');

    const unauthorizedMessages = await http(baseUrl, '/messages/conversations');
    assert(unauthorizedMessages.status === 401, 'Unauthorized route access must return 401.');
    assert(unauthorizedMessages.body?.requestId, 'Unauthorized response must include requestId.');
    assert(unauthorizedMessages.body?.code, 'Unauthorized response must include code.');

    const failedLogin = await login(baseUrl, userEmail, 'WrongPassword!1');
    assert(failedLogin.status === 401, 'Wrong password must return 401.');
    let rateLimitedLogin = null;
    for (let index = 0; index < 12; index += 1) {
      const attempt = await login(baseUrl, userEmail, 'WrongPassword!1');
      if (attempt.status === 429) {
        rateLimitedLogin = attempt;
        break;
      }
    }
    assert(rateLimitedLogin?.status === 429, 'Auth rate limit must trigger.');

    const auditLogs = await http(baseUrl, '/admin/security/audit-logs', { token: adminToken });
    assert(auditLogs.status === 200, 'Admin audit log endpoint must return 200.');
    const auditItems = unwrapData(auditLogs);
    assert(
      Array.isArray(auditItems) &&
        auditItems.some((item) => item.action === 'DATA_EXPORT_REQUESTED' || item.action === 'ACCOUNT_DELETE_REQUESTED'),
      'Audit log persistence must include compliance actions.',
    );

    const securityEventsResponse = await http(baseUrl, '/admin/security/events', { token: adminToken });
    assert(securityEventsResponse.status === 200, 'Admin security event endpoint must return 200.');
    const securityEvents = unwrapData(securityEventsResponse);
    assert(
      Array.isArray(securityEvents) &&
        securityEvents.some((item) => item.type === 'LOGIN_FAILED') &&
        securityEvents.some((item) => item.type === 'RATE_LIMIT_TRIGGERED') &&
        securityEvents.some((item) => item.type === 'PERMISSION_DENIED'),
      'Security events must include login failure, rate limit and permission denied.',
    );

    const pendingEvent = securityEvents.find((item) => item.status === 'PENDING');
    assert(pendingEvent, 'At least one pending security event must exist.');

    const resolveEvent = await http(
      baseUrl,
      `/admin/security/events/${pendingEvent.id}/status?status=RESOLVED`,
      {
        method: 'PATCH',
        token: adminToken,
        body: {},
      },
    );
    assert(resolveEvent.status === 200, 'Admin must be able to resolve a security event.');

    const adminSessions = await http(baseUrl, '/admin/security/sessions', { token: adminToken });
    assert(adminSessions.status === 200, 'Admin security sessions endpoint must return 200.');
    assert(Array.isArray(unwrapData(adminSessions)), 'Admin sessions payload must be a list.');

    const complianceQueue = await http(baseUrl, '/admin/compliance/requests', { token: adminToken });
    assert(complianceQueue.status === 200, 'Admin compliance queue endpoint must return 200.');
    const complianceItems = unwrapData(complianceQueue);
    assert(
      Array.isArray(complianceItems) &&
        complianceItems.some((item) => item.type === 'DATA_EXPORT') &&
        complianceItems.some((item) => item.type === 'ACCOUNT_DELETE'),
      'Compliance queue must contain export and delete requests.',
    );

    const authMe = await http(baseUrl, '/auth/me', { token: userToken });
    assert(authMe.status === 200, 'Auth must remain stable.');
    const onboarding = await http(baseUrl, '/onboarding/me', { token: userToken });
    assert(onboarding.status === 200, 'Onboarding must remain stable.');
    const subscriptions = await http(baseUrl, '/subscriptions/me', { token: userToken });
    assert(subscriptions.status === 200, 'Subscriptions must remain stable.');
    const billing = await http(baseUrl, '/billing/profile/me', { token: userToken });
    assert(billing.status === 200, 'Billing must remain stable.');
    const relu = await http(baseUrl, '/admin/relu/runs', { token: adminToken });
    assert(relu.status === 200, 'Relu admin endpoints must remain stable.');
    const messaging = await http(baseUrl, '/messages/conversations', { token: userToken });
    assert(messaging.status === 200, 'Messaging must remain stable.');
    const notifications = await http(baseUrl, '/notifications', { token: userToken });
    assert(notifications.status === 200, 'Notifications must remain stable.');
    const workforce = await http(baseUrl, '/workforce/me', { token: userToken });
    assert(workforce.status === 200, 'Workforce must remain stable.');
    const payroll = await http(baseUrl, '/payroll/me', { token: userToken });
    assert(payroll.status === 200, 'Payroll must remain stable.');

    const finalStatus = await http(baseUrl, '/status');
    assert(finalStatus.status === 200, 'Final status must return 200.');
    assert(unwrapData(finalStatus) === null || finalStatus.body?.security, 'Status must expose security summary.');

    console.log('EXEC-14 runtime validation PASS');
  } finally {
    server.kill();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('EXEC-14 runtime validation FAILED');
  console.error(error);
  process.exit(1);
});
