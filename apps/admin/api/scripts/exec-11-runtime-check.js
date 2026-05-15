require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const {
  PrismaClient,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  AppStatus,
  ApplicationStage,
  ContractLifecycleStatus,
  ContractStatus,
  JobCategory,
  JobStatus,
  PayrollCycleStatus,
  PlatformRole,
  PublicModerationStatus,
  Role,
  SettlementStatus,
  VerificationDecisionType,
  VerificationStatus,
  NotificationChannel,
  NotificationStatus,
} = require('@prisma/client');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
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

  return { status: response.status, body };
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

async function findEvent(prisma, eventType, userId, sourceId) {
  return prisma.notificationEvent.findFirst({
    where: {
      eventType,
      ...(userId ? { userId } : {}),
      ...(sourceId ? { sourceId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function findNotificationByType(prisma, type, userId) {
  return prisma.notification.findFirst({
    where: { type, userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function main() {
  const prisma = new PrismaClient();
  const port = 8101;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec11-${Date.now()}`;
  const password = 'Password123!';
  const summary = {};
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
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec11 Admin' },
    user: { email: `${suffix}.user@example.com`, displayName: 'Exec11 User' },
    peer: { email: `${suffix}.peer@example.com`, displayName: 'Exec11 Peer' },
  };

  try {
    await sleep(1000);
    await waitForServer(baseUrl, 90000).catch((error) => {
      throw new Error(`${error.message}\n${serverLogs}`);
    });

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

    const accountEvent = await findEvent(prisma, 'ACCOUNT_REGISTERED', appUser.id);
    assert(accountEvent, 'ACCOUNT_REGISTERED event missing after register');
    summary.accountRegistered = true;

    const identityUpsert = await http(baseUrl, '/onboarding/identity-profile', {
      method: 'PUT',
      token: userToken,
      body: {
        firstName: 'Exec11',
        lastName: 'User',
        displayName: users.user.displayName,
        bio: 'Notification runtime validation profile',
        phone: '+40123456789',
        country: 'Romania',
        city: 'Bucharest',
        language: 'ro',
        timezone: 'Europe/Bucharest',
        linkedinUrl: 'https://linkedin.com/in/exec11-user',
      },
    });
    assert(identityUpsert.status === 200, 'Identity profile upsert failed');

    const companyUpsert = await http(baseUrl, '/onboarding/company-profile', {
      method: 'PUT',
      token: userToken,
      body: {
        companyName: 'Exec11 Ops SRL',
        legalName: 'Exec11 Ops SRL',
        country: 'Romania',
        city: 'Bucharest',
        addressLine1: 'Automation Street 11',
        website: 'https://example.com/exec11',
      },
    });
    assert(companyUpsert.status === 200, 'Company profile upsert failed');

    const onboardingComplete = await http(baseUrl, '/onboarding/steps', {
      method: 'PATCH',
      token: userToken,
      body: {
        currentStep: 'completion',
        completedSteps: ['welcome', 'identity', 'company', 'completion'],
        status: 'COMPLETED',
        completionPercent: 100,
      },
    });
    assertSuccess(onboardingComplete, 'Onboarding completion request failed');
    assert(await findEvent(prisma, 'ONBOARDING_COMPLETED', appUser.id), 'ONBOARDING_COMPLETED event missing');
    summary.onboardingCompleted = true;

    const profileUpdate = await http(baseUrl, '/billing/profile/me', {
      method: 'PUT',
      token: userToken,
      body: {
        companyName: 'Exec11 Billing SRL',
        country: 'Romania',
        city: 'Bucharest',
        addressLine1: 'Automation Street 11',
        currency: 'RON',
        isCompany: true,
        isVatPayer: true,
        vatId: 'RO12345678',
      },
    });
    assertSuccess(profileUpdate, 'Billing profile update failed');
    assert(await findEvent(prisma, 'BILLING_PROFILE_UPDATED', appUser.id), 'BILLING_PROFILE_UPDATED event missing');
    summary.billingProfileUpdated = true;

    const preferencesUpdate = await http(baseUrl, '/notifications/preferences', {
      method: 'PUT',
      token: userToken,
      body: {
        emailEnabled: false,
        categories: {
          RELU: false,
        },
      },
    });
    assertSuccess(preferencesUpdate, 'Notification preferences update failed');
    summary.preferencesUpdated = true;

    const upgradeRequest = await http(baseUrl, '/subscriptions/upgrade-requests', {
      method: 'POST',
      token: userToken,
      body: {
        requestedPlanCode: 'GOLD',
        source: 'PRICING',
      },
    });
    assertSuccess(upgradeRequest, 'Upgrade request creation failed');
    const upgradeRequestId = unwrapData(upgradeRequest).id;

    const upgradeApproved = await http(
      baseUrl,
      `/admin/subscription-upgrade-requests/${upgradeRequestId}/approve`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );
    assertSuccess(upgradeApproved, 'Upgrade approval failed');
    const upgradeApprovedData = unwrapData(upgradeApproved);
    const invoiceId = upgradeApprovedData.invoice.id;
    assert(await findEvent(prisma, 'SUBSCRIPTION_UPGRADE_APPROVED', appUser.id), 'SUBSCRIPTION_UPGRADE_APPROVED event missing');
    assert(await findEvent(prisma, 'BILLING_INVOICE_ISSUED', appUser.id, invoiceId), 'BILLING_INVOICE_ISSUED event missing');
    summary.upgradeApproved = true;

    const invoicePaid = await http(baseUrl, `/admin/billing/invoices/${invoiceId}/mark-paid`, {
      method: 'POST',
      token: adminToken,
      body: {
        provider: 'MANUAL',
        note: 'exec11 paid',
      },
    });
    assertSuccess(invoicePaid, 'Invoice mark paid failed');
    assert(await findEvent(prisma, 'BILLING_INVOICE_PAID', appUser.id, invoiceId), 'BILLING_INVOICE_PAID event missing');
    summary.invoicePaid = true;

    const verificationSubmit = await http(baseUrl, '/verification/identity/submit', {
      method: 'POST',
      token: userToken,
      body: {},
    });
    assertSuccess(verificationSubmit, 'Verification submit failed');
    const verificationCaseId = unwrapData(verificationSubmit).case.id;
    const verificationApprove = await http(
      baseUrl,
      `/admin/verifications/cases/${verificationCaseId}/review`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          decision: VerificationDecisionType.APPROVE,
          note: 'approved by exec11',
        },
      },
    );
    assertSuccess(verificationApprove, 'Verification approve failed');
    assert(await findEvent(prisma, 'VERIFICATION_APPROVED', appUser.id, verificationCaseId), 'VERIFICATION_APPROVED event missing');
    summary.verificationApproved = true;

    const approvedPostResponse = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'PROJECT',
        title: `Exec11 Approved Post ${suffix}`,
        summary: 'Approved notification source',
        description: 'Electrical fit-out and commissioning for operational validation.',
        domain: 'Construction',
        location: 'Romania',
        value: 'EUR 1000',
        ownerName: users.user.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
      },
    });
    assertSuccess(approvedPostResponse, 'Approved post creation failed');
    const approvedPostId = unwrapData(approvedPostResponse).id;

    const rejectedPostResponse = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'PROJECT',
        title: `Exec11 Rejected Post ${suffix}`,
        summary: 'Rejected notification source',
        description: 'This post exists for moderation rejection testing.',
        domain: 'Construction',
        location: 'Romania',
        value: 'EUR 500',
        ownerName: users.user.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
      },
    });
    assertSuccess(rejectedPostResponse, 'Rejected post creation failed');
    const rejectedPostId = unwrapData(rejectedPostResponse).id;

    const approvePost = await http(baseUrl, `/admin/public-posts/${approvedPostId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: PublicModerationStatus.APPROVED,
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });
    const rejectPost = await http(baseUrl, `/admin/public-posts/${rejectedPostId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: PublicModerationStatus.REJECTED,
        status: 'REJECTED',
        visibility: 'PRIVATE',
      },
    });
    assertSuccess(approvePost, 'Approved post moderation failed');
    assertSuccess(rejectPost, 'Rejected post moderation failed');
    assert(await findEvent(prisma, 'PUBLIC_POST_APPROVED', appUser.id, approvedPostId), 'PUBLIC_POST_APPROVED event missing');
    assert(await findEvent(prisma, 'PUBLIC_POST_REJECTED', appUser.id, rejectedPostId), 'PUBLIC_POST_REJECTED event missing');
    const publicFeed = await http(baseUrl, '/public-posts');
    const publicPosts = unwrapData(publicFeed);
    assert(publicFeed.status === 200, 'Public feed failed');
    assert(publicPosts.some((item) => item.id === approvedPostId), 'Approved post missing from public feed');
    assert(!publicPosts.some((item) => item.id === rejectedPostId), 'Rejected post leaked into public feed');
    summary.publicPostModeration = true;

    const reluMatch = await http(baseUrl, `/relu/public-posts/${approvedPostId}/matches`, {
      method: 'POST',
      token: userToken,
      body: {
        profileId: unwrapData(userLogin).user.profile.id,
      },
    });
    assertSuccess(reluMatch, 'Relu match failed');
    const reluRecommendationEvent = await findEvent(prisma, 'RELU_RECOMMENDATION_GENERATED', appUser.id);
    assert(reluRecommendationEvent, 'RELU_RECOMMENDATION_GENERATED event missing');
    const reluNotification = await prisma.notification.findFirst({
      where: {
        userId: appUser.id,
        type: 'RELU_RECOMMENDATION_GENERATED',
      },
    });
    assert(!reluNotification, 'RELU notification should be suppressed by preferences');
    summary.reluPreferenceRespected = true;

    const recruiterActor = await prisma.actor.create({
      data: {
        firebaseUid: `${suffix}-recruiter`,
        email: users.admin.email,
        actorType: ActorType.COMPANY,
        displayName: users.admin.displayName,
        role: PlatformRole.USER,
      },
    });
    const candidateActor = await prisma.actor.create({
      data: {
        firebaseUid: `${suffix}-candidate`,
        email: users.user.email,
        actorType: ActorType.INDIVIDUAL,
        displayName: users.user.displayName,
        role: PlatformRole.USER,
      },
    });

    const hiringJob = await prisma.job.create({
      data: {
        actorId: recruiterActor.id,
        title: `Exec11 Hiring Job ${suffix}`,
        description: 'Hiring notification validation',
        category: JobCategory.CONSTRUCTION,
        status: JobStatus.LIVE,
        countryCode: 'RO',
        currency: 'RON',
      },
    });

    await prisma.hiringPipeline.create({
      data: {
        jobId: hiringJob.id,
        status: 'ACTIVE',
        totalApplicants: 1,
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: hiringJob.id,
        actorId: candidateActor.id,
        candidateUserId: appUser.id,
        status: AppStatus.PENDING,
        currentStage: ApplicationStage.APPLIED,
        stageChangedAt: new Date(),
        message: 'Exec11 application',
      },
    });

    const moveStage = await http(baseUrl, `/hiring/applications/${application.id}/stage`, {
      method: 'POST',
      token: adminToken,
      body: {
        targetStage: 'SCREENING',
        note: 'screening started',
      },
    });
    assertSuccess(moveStage, 'Hiring stage move failed');
    assert(await findEvent(prisma, 'HIRING_STAGE_CHANGED', appUser.id, application.id), 'HIRING_STAGE_CHANGED event missing');
    summary.hiringStageChanged = true;

    const workforceContract = await prisma.contract.create({
      data: {
        jobId: hiringJob.id,
        employerId: recruiterActor.id,
        contractorId: candidateActor.id,
        status: ContractStatus.DRAFT,
        lifecycleStatus: ContractLifecycleStatus.DRAFT,
        value: 3000,
        currency: 'RON',
      },
    });

    const approveApplication = await http(
      baseUrl,
      `/hiring/applications/${application.id}/approve`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          note: 'approved for workforce activation',
        },
      },
    );
    assertSuccess(approveApplication, 'Hiring approve failed');

    const createAssignment = await http(baseUrl, '/workforce/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        applicationId: application.id,
        contractId: workforceContract.id,
      },
    });
    assertSuccess(createAssignment, 'Workforce assignment creation failed');
    const assignmentId = unwrapData(createAssignment).id;

    const activateContract = await http(baseUrl, `/workforce/contracts/${workforceContract.id}/activate`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });
    assertSuccess(activateContract, 'Workforce contract activation failed');
    assert(await findEvent(prisma, 'WORKFORCE_CONTRACT_ACTIVATED', appUser.id, assignmentId), 'WORKFORCE_CONTRACT_ACTIVATED event missing');
    summary.workforceActivated = true;

    const payrollCycle = await prisma.payrollCycle.create({
      data: {
        periodStart: new Date('2026-05-01T00:00:00.000Z'),
        periodEnd: new Date('2026-05-07T23:59:59.000Z'),
        status: PayrollCycleStatus.PROCESSING,
        totalWorkers: 1,
        totalGrossAmount: 1000,
      },
    });

    const payrollSettlement = await prisma.payrollSettlement.create({
      data: {
        payrollCycleId: payrollCycle.id,
        workforceAssignmentId: assignmentId,
        userId: appUser.id,
        approvedTimesheetIds: [],
        regularHours: 8,
        overtimeHours: 0,
        grossAmount: 1000,
        deductionsAmount: 0,
        netAmount: 1000,
        currency: 'RON',
        status: SettlementStatus.PENDING,
      },
    });

    const rejectSettlement = await http(
      baseUrl,
      `/admin/payroll/settlements/${payrollSettlement.id}/reject`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          reason: 'Missing supporting detail',
        },
      },
    );
    assertSuccess(rejectSettlement, 'Payroll settlement reject failed');
    assert(await findEvent(prisma, 'PAYROLL_SETTLEMENT_REJECTED', appUser.id, payrollSettlement.id), 'PAYROLL_SETTLEMENT_REJECTED event missing');
    summary.payrollRejected = true;

    const directConversation = await http(baseUrl, '/messages/conversations/direct', {
      method: 'POST',
      token: adminToken,
      body: {
        participantUserIds: [peerUser.id],
        title: 'Exec11 direct thread',
      },
    });
    assertSuccess(directConversation, 'Direct conversation failed');
    const conversationId = unwrapData(directConversation).id;

    const sendMessage = await http(baseUrl, `/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      token: peerToken,
      body: {
        type: 'TEXT',
        content: 'Exec11 message notification test',
      },
    });
    assertSuccess(sendMessage, 'Send message failed');
    assert(await findEvent(prisma, 'NEW_MESSAGE', adminUser.id), 'NEW_MESSAGE event missing');
    summary.newMessage = true;

    const notificationsList = await http(baseUrl, '/notifications', { token: adminToken });
    assert(notificationsList.status === 200, 'Notifications list failed');
    const unreadCountBefore = unwrapData(await http(baseUrl, '/notifications/unread-count', { token: adminToken })).unreadCount;
    assert(unreadCountBefore > 0, 'Unread count should be positive after message');

    const messageNotification = await findNotificationByType(prisma, 'NEW_MESSAGE', adminUser.id);
    assert(messageNotification, 'Message notification record missing');
    const markRead = await http(baseUrl, `/notifications/${messageNotification.id}/read`, {
      method: 'PATCH',
      token: adminToken,
    });
    assertSuccess(markRead, 'Mark read failed');
    const unreadCountAfter = unwrapData(await http(baseUrl, '/notifications/unread-count', { token: adminToken })).unreadCount;
    assert(unreadCountAfter < unreadCountBefore, 'Unread count did not decrease after mark read');
    summary.readState = true;

    const adminEvents = await http(baseUrl, '/admin/notifications/events', { token: adminToken });
    const adminDeliveries = await http(baseUrl, '/admin/notifications/deliveries', { token: adminToken });
    const workflowRuns = await http(baseUrl, '/admin/workflow-automation/runs', { token: adminToken });
    assert(adminEvents.status === 200, 'Admin notification events failed');
    assert(adminDeliveries.status === 200, 'Admin notification deliveries failed');
    assert(workflowRuns.status === 200, 'Workflow automation runs failed');
    summary.adminViews = true;

    const retryEvent = await prisma.notificationEvent.create({
      data: {
        key: `${suffix}-retry-event`,
        eventType: 'MANUAL_RETRY_TEST',
        sourceType: 'RUNTIME_CHECK',
        sourceId: suffix,
        userId: adminUser.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.FAILED,
      },
    });
    const retryNotification = await prisma.notification.create({
      data: {
        key: `${suffix}-retry-notification`,
        eventId: retryEvent.id,
        userId: adminUser.id,
        type: 'MANUAL_RETRY_TEST',
        channel: NotificationChannel.IN_APP,
        severity: 'INFO',
        title: 'Retry test',
        message: 'Retry test notification',
        status: NotificationStatus.FAILED,
      },
    });
    const failedDelivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: retryNotification.id,
        eventId: retryEvent.id,
        userId: adminUser.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
      },
    });
    const retryDelivery = await http(
      baseUrl,
      `/admin/notifications/deliveries/${failedDelivery.id}/retry`,
      {
        method: 'POST',
        token: adminToken,
      },
    );
    assertSuccess(retryDelivery, 'Retry failed delivery endpoint failed');
    const retriedDelivery = await prisma.notificationDelivery.findUnique({
      where: { id: failedDelivery.id },
    });
    assert(retriedDelivery?.status === NotificationStatus.SENT, 'Retry failed delivery did not transition to SENT');
    summary.retryFailedDelivery = true;

    const [authMe, onboardingMe, subscriptionsMe, billingMe, reluResults, publicFeedStable, messagesList] =
      await Promise.all([
        http(baseUrl, '/auth/me', { token: userToken }),
        http(baseUrl, '/onboarding/me', { token: userToken }),
        http(baseUrl, '/subscriptions/me', { token: userToken }),
        http(baseUrl, '/billing/profile/me', { token: userToken }),
        http(baseUrl, `/relu/public-posts/${approvedPostId}/results`, { token: userToken }),
        http(baseUrl, '/public-posts'),
        http(baseUrl, `/messages/conversations/${conversationId}/messages`, { token: adminToken }),
      ]);
    assert(authMe.status === 200, 'Auth regression detected');
    assert(onboardingMe.status === 200, 'Onboarding regression detected');
    assert(subscriptionsMe.status === 200, 'Subscriptions regression detected');
    assert(billingMe.status === 200, 'Billing regression detected');
    assert(reluResults.status === 200, 'Relu regression detected');
    assert(publicFeedStable.status === 200, 'Public feed regression detected');
    assert(messagesList.status === 200, 'Messaging regression detected');
    summary.regressionsStable = true;

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
