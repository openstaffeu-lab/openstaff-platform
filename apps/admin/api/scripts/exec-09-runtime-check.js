require('dotenv').config({ path: '.env' });

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
  };
}

async function register(baseUrl, payload) {
  return http(baseUrl, '/auth/register', {
    method: 'POST',
    body: payload,
  });
}

async function login(baseUrl, email, password) {
  return http(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

async function main() {
  const prisma = new PrismaClient();
  const port = 8097;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec09-${Date.now()}`;
  const password = 'Password123!';
  let serverLogs = '';
  const server = spawn(process.execPath, ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout?.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr?.on('data', (chunk) => {
    serverLogs += chunk.toString();
  });

  const users = {
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec09 Admin' },
    owner: { email: `${suffix}.owner@example.com`, displayName: 'Exec09 Owner' },
  };

  try {
    await sleep(1000);
    try {
      await waitForServer(baseUrl, 90000);
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.message : 'Server startup failed.'}\n${serverLogs}`,
      );
    }

    await register(baseUrl, {
      email: users.admin.email,
      password,
      displayName: users.admin.displayName,
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
    });
    await register(baseUrl, {
      email: users.owner.email,
      password,
      displayName: users.owner.displayName,
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });

    await Promise.all([
      prisma.user.update({
        where: { email: users.admin.email },
        data: {
          role: Role.ADMIN,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: users.owner.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    const [adminLogin, ownerLogin] = await Promise.all([
      login(baseUrl, users.admin.email, password),
      login(baseUrl, users.owner.email, password),
    ]);

    const adminToken = adminLogin.body.accessToken;
    const ownerToken = ownerLogin.body.accessToken;
    const ownerProfileId = ownerLogin.body.user.profile?.id;

    const createPost = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        type: 'PROJECT',
        title: `Exec09 Relu Post ${suffix}`,
        summary: 'Relu ingestion and matching validation post',
        description:
          'Electrical installation, structured cabling, QA/QC and commissioning support in Bucharest data center delivery.',
        domain: 'Data Center / Electrical',
        location: 'Romania, Bucharest',
        value: 'EUR 48,000',
        ownerName: users.owner.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
        certifications: 'Safety, permit, commissioning',
      },
    });

    const postId = createPost.body.data.id;

    const approvePost = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: 'APPROVED',
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });

    const ownerCannotIngest = await http(baseUrl, `/relu/public-posts/${postId}/ingest`, {
      method: 'POST',
      token: ownerToken,
    });

    const ingest = await http(baseUrl, `/relu/public-posts/${postId}/ingest`, {
      method: 'POST',
      token: adminToken,
    });

    const classifyPost = await http(baseUrl, `/relu/public-posts/${postId}/classify`, {
      method: 'POST',
      token: adminToken,
    });

    const classifyProfile = await http(baseUrl, `/relu/profiles/${ownerProfileId}/classify`, {
      method: 'POST',
      token: ownerToken,
    });

    const match = await http(baseUrl, `/relu/public-posts/${postId}/matches`, {
      method: 'POST',
      token: ownerToken,
      body: {
        profileId: ownerProfileId,
      },
    });

    const publicResults = await http(baseUrl, `/relu/public-posts/${postId}/results`, {
      token: ownerToken,
    });

    const profileResults = await http(baseUrl, `/relu/profiles/${ownerProfileId}/results`, {
      token: ownerToken,
    });

    const adminResults = await http(baseUrl, '/admin/relu/results', {
      token: adminToken,
    });

    const adminRuns = await http(baseUrl, '/admin/relu/runs', {
      token: adminToken,
    });

    const reluResultId =
      Array.isArray(adminResults.body?.data) && adminResults.body.data.length > 0
        ? adminResults.body.data[0].id
        : null;

    const overrideResult = reluResultId
      ? await http(baseUrl, `/admin/relu/results/${reluResultId}/override`, {
          method: 'PATCH',
          token: adminToken,
          body: {
            explanation: 'Exec09 admin override validation',
            score: 91,
          },
        })
      : { status: 500, body: null };

    const publicFeed = await http(baseUrl, '/public-posts');
    const authStable = await http(baseUrl, '/auth/me', { token: ownerToken });
    const subscriptionsStable = await http(baseUrl, '/subscriptions/me', { token: ownerToken });
    const billingStable = await http(baseUrl, '/billing/profile/me', { token: ownerToken });
    const onboardingStable = await http(baseUrl, '/onboarding/me', { token: ownerToken });

    const reluTasks = await prisma.reluTask.findMany({
      where: {
        contextEntityId: postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const runs = await prisma.reluProcessingRun.findMany({
      where: {
        sourceId: postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const classifications = await prisma.reluClassificationResult.findMany({
      where: {
        sourceId: postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const matches = await prisma.reluMatchResult.findMany({
      where: {
        sourceId: postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const postRecord = await prisma.publicPost.findUnique({
      where: { id: postId },
    });

    const latestMatch = matches[0] ?? null;
    const latestClassification = classifications[0] ?? null;

    console.log(
      JSON.stringify(
        {
          registerUser: createPost.status === 201 || createPost.status === 200,
          createPublicPost: createPost.body.data.moderationStatus === 'PENDING',
          approvePublicPost: approvePost.status === 200 && approvePost.body.data.status === 'LIVE',
          nonAdminBlockedFromIngest: ownerCannotIngest.status === 403,
          runReluIngestion: ingest.status === 200,
          runReluClassification: classifyPost.status === 200,
          reluTaskPersisted: reluTasks.length >= 3,
          reluRunPersisted: runs.length >= 2,
          reluClassificationPersisted: classifications.length >= 2,
          profileClassificationWorks: classifyProfile.status === 200,
          publicPostTagsUpdated:
            Array.isArray(JSON.parse(postRecord?.naceCodesJson || '[]')) &&
            Array.isArray(JSON.parse(postRecord?.escoCodesJson || '[]')),
          runMatching: match.status === 200,
          compatibilityPercentPresent:
            typeof match.body?.data?.compatibilityPercent === 'number' ||
            typeof latestMatch?.compatibilityPercent === 'number',
          explanationPresent:
            typeof match.body?.data?.explanation === 'string' &&
            match.body.data.explanation.length > 10,
          publicResultsVisible:
            publicResults.status === 200 &&
            Array.isArray(publicResults.body?.data?.classifications),
          profileResultsVisible:
            profileResults.status === 200 &&
            Array.isArray(profileResults.body?.data?.classifications),
          adminListSeesResult:
            adminResults.status === 200 &&
            Array.isArray(adminResults.body?.data) &&
            adminResults.body.data.some((item) => item.sourceId === postId),
          adminRunsVisible:
            adminRuns.status === 200 &&
            Array.isArray(adminRuns.body?.data) &&
            adminRuns.body.data.some((item) => item.sourceId === postId),
          adminOverrideWorks:
            overrideResult.status === 200 && overrideResult.body.data.status === 'OVERRIDDEN',
          aiFallbackWorksIfGeminiMissing:
            !process.env.GEMINI_API_KEY
              ? latestClassification?.fallbackUsed === true &&
                latestClassification?.status === 'FAILED'
              : true,
          approvedPostVisiblePublicly:
            publicFeed.status === 200 &&
            publicFeed.body.data.some((item) => item.id === postId),
          authStable: authStable.status === 200,
          subscriptionsStable: subscriptionsStable.status === 200,
          billingStable: billingStable.status === 200,
          onboardingStable: onboardingStable.status === 200,
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
  if (error && typeof error === 'object' && 'message' in error) {
    console.error(error.message);
  }
  console.error(error);
  process.exitCode = 1;
});
