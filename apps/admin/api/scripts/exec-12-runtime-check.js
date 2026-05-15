require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const {
  PrismaClient,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  PublicModerationStatus,
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

async function register(baseUrl, payload) {
  return http(baseUrl, '/auth/register', { method: 'POST', body: payload });
}

async function login(baseUrl, email, password) {
  return http(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

function unwrapData(response) {
  return response?.body?.data ?? response?.body ?? null;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSuccess(response, message) {
  assert(
    response.status >= 200 && response.status < 300,
    `${message} (${response.status}): ${JSON.stringify(response.body)}`,
  );
}

async function spawnAndExpectRuntimeValidationFailure(baseEnv) {
  const port = 8198;
  let output = '';

  const child = spawn(process.execPath, ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...baseEnv,
      PORT: String(port),
      NODE_ENV: 'production',
      DATABASE_URL: baseEnv.DATABASE_URL || 'postgresql://invalid:invalid@localhost:5432/invalid',
      JWT_SECRET: 'prod-secret',
      JWT_REFRESH_SECRET: 'prod-refresh-secret',
      CORS_ORIGIN: 'https://openstaff.eu',
      ENABLE_DEMO_PUBLIC_FEED: 'true',
      ENABLE_DEV_AUTH_BYPASS: 'true',
      SKIP_FIREBASE_AUTH: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr?.on('data', (chunk) => {
    output += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(null);
    }, 12000);

    child.on('exit', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });

  assert(exitCode !== null, 'Unsafe production runtime validation process did not exit.');
  assert(exitCode !== 0, 'Unsafe production flags were not rejected.');
  assert(
    /Runtime environment validation failed/i.test(output),
    `Expected runtime validation failure output, received: ${output.slice(-5000)}`,
  );

  return true;
}

async function main() {
  const prisma = new PrismaClient();
  const port = 8102;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec12-${Date.now()}`;
  const password = 'Password123!';
  const summary = {};
  let serverLogs = '';

  const server = spawn(process.execPath, ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
      ENABLE_DEV_AUTH_BYPASS: 'false',
      ENABLE_DEMO_PUBLIC_FEED: 'false',
      ENABLE_DEMO_MESSAGING: 'false',
      ENABLE_AI_FALLBACK: 'true',
      ENABLE_DEBUG_LOGS: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout?.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr?.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });

  try {
    await sleep(1000);
    await waitForServer(baseUrl, 90000).catch((error) => {
      throw new Error(`${error.message}\n${serverLogs}`);
    });

    const health = await http(baseUrl, '/health');
    assertSuccess(health, '/health failed');
    assert(health.body?.status === 'ok', '/health payload missing ok status');
    summary.health = true;

    const status = await http(baseUrl, '/status');
    assertSuccess(status, '/status failed');
    assert(status.body?.service === 'openstaff-api', '/status service mismatch');
    assert(
      status.body?.featureFlags?.ENABLE_DEMO_PUBLIC_FEED === false,
      'Demo public feed should be disabled in runtime validation.',
    );
    assert(
      status.body?.featureFlags?.ENABLE_DEMO_MESSAGING === false,
      'Demo messaging should be disabled in runtime validation.',
    );
    assert(
      typeof status.body?.integrations?.billingPlaceholders?.enabled === 'boolean',
      'Billing placeholder status missing from /status.',
    );
    assert(
      typeof status.body?.integrations?.gemini?.fallbackEnabled === 'boolean',
      'Relu fallback status missing from /status.',
    );
    summary.status = true;

    await spawnAndExpectRuntimeValidationFailure(process.env);
    summary.productionUnsafeFlagsDetected = true;

    const unauthorized = await http(baseUrl, '/notifications');
    assert(unauthorized.status === 401, 'Unauthorized notifications request should return 401.');
    assert(unauthorized.body?.status === 'error', 'Unauthorized error payload missing status.');
    assert(typeof unauthorized.body?.code === 'string', 'Unauthorized error payload missing code.');
    assert(typeof unauthorized.body?.requestId === 'string', 'Unauthorized error payload missing requestId.');
    assert(typeof unauthorized.headers.requestId === 'string', 'Unauthorized response missing x-request-id.');
    summary.errorEnvelope = true;

    const users = {
      admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec12 Admin' },
      user: { email: `${suffix}.user@example.com`, displayName: 'Exec12 User' },
      peer: { email: `${suffix}.peer@example.com`, displayName: 'Exec12 Peer' },
    };

    for (const person of Object.values(users)) {
      const result = await register(baseUrl, {
        email: person.email,
        password,
        displayName: person.displayName,
        actorType: person === users.admin ? 'COMPANY' : 'INDIVIDUAL',
        profileType: person === users.admin ? 'GENERAL_CONTRACTOR' : 'PROFESSIONAL',
      });
      assert(result.status === 201, `Register failed for ${person.email}`);
    }

    const [adminUser, appUser, peerUser] = await Promise.all([
      prisma.user.update({
        where: { email: users.admin.email },
        data: {
          role: Role.ADMIN,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: users.user.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: users.peer.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    const [adminLogin, userLogin, peerLogin] = await Promise.all([
      login(baseUrl, users.admin.email, password),
      login(baseUrl, users.user.email, password),
      login(baseUrl, users.peer.email, password),
    ]);

    const adminToken = unwrapData(adminLogin).accessToken;
    const userToken = unwrapData(userLogin).accessToken;
    const peerToken = unwrapData(peerLogin).accessToken;

    const authMe = await http(baseUrl, '/auth/me', { token: userToken });
    const onboardingMe = await http(baseUrl, '/onboarding/me', { token: userToken });
    const subscriptionsMe = await http(baseUrl, '/subscriptions/me', { token: userToken });
    const billingMe = await http(baseUrl, '/billing/profile/me', { token: userToken });
    const notificationsMe = await http(baseUrl, '/notifications', { token: userToken });
    assertSuccess(authMe, 'Auth regression detected');
    assertSuccess(onboardingMe, 'Onboarding regression detected');
    assertSuccess(subscriptionsMe, 'Subscriptions regression detected');
    assertSuccess(billingMe, 'Billing regression detected');
    assertSuccess(notificationsMe, 'Notifications regression detected');
    summary.coreModulesStable = true;

    const publicPostCreate = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'PROJECT',
        title: `Exec12 Live Post ${suffix}`,
        summary: 'Production hardening validation',
        description: 'Post used to verify live feed remains stable without demo fallback.',
        domain: 'Construction',
        location: 'Romania',
        value: 'EUR 1200',
        ownerName: users.user.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
      },
    });
    assertSuccess(publicPostCreate, 'Public post creation failed');
    const postId = unwrapData(publicPostCreate).id;

    const approvePost = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: PublicModerationStatus.APPROVED,
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });
    assertSuccess(approvePost, 'Public post moderation approval failed');

    const publicFeed = await http(baseUrl, '/public-posts');
    assertSuccess(publicFeed, 'Public feed regression detected');
    const livePosts = unwrapData(publicFeed);
    assert(Array.isArray(livePosts), 'Public feed should return an array.');
    assert(livePosts.some((item) => item.id === postId), 'Approved public post missing from live feed.');
    summary.publicFeedStable = true;

    const reluIngest = await http(baseUrl, `/relu/public-posts/${postId}/ingest`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });
    const reluResults = await http(baseUrl, `/relu/public-posts/${postId}/results`, {
      token: adminToken,
    });
    assertSuccess(reluIngest, 'Relu ingestion failed');
    assertSuccess(reluResults, 'Relu results retrieval failed');
    summary.reluStable = true;

    const conversation = await http(baseUrl, '/messages/conversations/direct', {
      method: 'POST',
      token: userToken,
      body: {
        participantUserIds: [peerUser.id],
        title: 'Exec12 direct workspace',
      },
    });
    assertSuccess(conversation, 'Direct conversation creation failed');
    const conversationId = unwrapData(conversation).id;

    const sendMessage = await http(baseUrl, `/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      token: peerToken,
      body: {
        type: 'TEXT',
        content: 'Messaging remains live and non-demo.',
      },
    });
    const conversationMessages = await http(
      baseUrl,
      `/messages/conversations/${conversationId}/messages`,
      { token: userToken },
    );
    assertSuccess(sendMessage, 'Messaging send failed');
    assertSuccess(conversationMessages, 'Messaging regression detected');
    summary.messagingStable = true;

    console.log(
      JSON.stringify(
        {
          verdict: 'PASS',
          summary,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          verdict: 'FAIL',
          error: error instanceof Error ? error.message : String(error),
          summary,
          serverLogs: serverLogs.slice(-12000),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    server.kill('SIGTERM');
  }
}

main();
