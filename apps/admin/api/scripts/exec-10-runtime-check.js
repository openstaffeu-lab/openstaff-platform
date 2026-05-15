require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const {
  PrismaClient,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ActorType,
  AppStatus,
  ApplicationDecision,
  ApplicationStage,
  ContractLifecycleStatus,
  ContractStatus,
  JobCategory,
  JobStatus,
  PlatformRole,
  ProjectEngagementModel,
  ProjectStatus,
  PublicModerationStatus,
  Role,
  SettlementStatus,
  VerificationStatus,
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

  return { status: response.status, body };
}

async function httpForm(baseUrl, path, options = {}) {
  const headers = {
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: options.formData,
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

function isSuccessStatus(status) {
  return status === 200 || status === 201;
}

async function main() {
  const prisma = new PrismaClient();
  const port = 8098;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec10-${Date.now()}`;
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
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec10 Admin' },
    owner: { email: `${suffix}.owner@example.com`, displayName: 'Exec10 Owner' },
    member: { email: `${suffix}.member@example.com`, displayName: 'Exec10 Member' },
    worker: { email: `${suffix}.worker@example.com`, displayName: 'Exec10 Worker' },
    outsider: { email: `${suffix}.outsider@example.com`, displayName: 'Exec10 Outsider' },
  };
  const cycleStart = new Date(Date.UTC(2026, 4, 5, 0, 0, 0, 0) + Date.now() % 10_000_000);
  const cycleEnd = new Date(cycleStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 86399999);

  try {
    await sleep(1000);
    try {
      await waitForServer(baseUrl, 90000);
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.message : 'Server startup failed.'}\n${serverLogs}`,
      );
    }

    for (const person of Object.values(users)) {
      await register(baseUrl, {
        email: person.email,
        password,
        displayName: person.displayName,
        actorType: person === users.admin ? 'COMPANY' : 'INDIVIDUAL',
        profileType: person === users.admin ? 'GENERAL_CONTRACTOR' : 'PROFESSIONAL',
      });
    }

    const [adminUser, ownerUser, memberUser, workerUser, outsiderUser] = await Promise.all([
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
      prisma.user.update({
        where: { email: users.member.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: users.worker.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: users.outsider.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    await prisma.identityProfile.update({
      where: { userId: workerUser.id },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    const [adminLogin, ownerLogin, memberLogin, workerLogin, outsiderLogin] = await Promise.all([
      login(baseUrl, users.admin.email, password),
      login(baseUrl, users.owner.email, password),
      login(baseUrl, users.member.email, password),
      login(baseUrl, users.worker.email, password),
      login(baseUrl, users.outsider.email, password),
    ]);

    const adminToken = adminLogin.body.accessToken;
    const ownerToken = ownerLogin.body.accessToken;
    const memberToken = memberLogin.body.accessToken;
    const workerToken = workerLogin.body.accessToken;
    const outsiderToken = outsiderLogin.body.accessToken;
    const ownerProfileId = ownerLogin.body?.user?.profile?.id ?? null;

    const recruiterActor = await prisma.actor.create({
      data: {
        firebaseUid: `${suffix}-recruiter-actor`,
        email: users.admin.email,
        actorType: ActorType.COMPANY,
        displayName: users.admin.displayName,
        role: PlatformRole.USER,
      },
    });
    const workerActor = await prisma.actor.create({
      data: {
        firebaseUid: `${suffix}-worker-actor`,
        email: users.worker.email,
        actorType: ActorType.INDIVIDUAL,
        displayName: users.worker.displayName,
        role: PlatformRole.USER,
      },
    });

    const job = await prisma.job.create({
      data: {
        actorId: recruiterActor.id,
        title: `Exec10 Messaging Job ${suffix}`,
        description: 'Messaging runtime validation job',
        category: JobCategory.CONSTRUCTION,
        status: JobStatus.LIVE,
        countryCode: 'RO',
        currency: 'RON',
      },
    });

    await prisma.hiringPipeline.create({
      data: {
        jobId: job.id,
        totalApplicants: 1,
        totalHired: 1,
      },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        actorId: workerActor.id,
        candidateUserId: workerUser.id,
        status: AppStatus.ACCEPTED,
        currentStage: ApplicationStage.HIRED,
        stageChangedAt: new Date(),
        message: 'Worker hired for messaging validation.',
        stageHistory: {
          create: {
            fromStage: ApplicationStage.APPLIED,
            toStage: ApplicationStage.HIRED,
            changedByUserId: adminUser.id,
            note: 'Direct runtime setup.',
          },
        },
        hiringDecisions: {
          create: {
            decision: ApplicationDecision.APPROVED,
            decidedByUserId: adminUser.id,
            reason: 'Runtime validation hire.',
          },
        },
      },
    });

    const project = await prisma.project.create({
      data: {
        slug: `${suffix}-project`,
        name: `Exec10 Collaboration Project`,
        engagementModel: ProjectEngagementModel.B2B,
        status: ProjectStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    const contract = await prisma.contract.create({
      data: {
        jobId: job.id,
        employerId: recruiterActor.id,
        contractorId: workerActor.id,
        status: ContractStatus.DRAFT,
        lifecycleStatus: ContractLifecycleStatus.DRAFT,
        value: 10000,
        currency: 'RON',
      },
    });

    const directConversation = await http(baseUrl, '/messages/conversations/direct', {
      method: 'POST',
      token: adminToken,
      body: {
        participantUserIds: [memberUser.id],
        title: 'Exec10 direct channel',
      },
    });
    const directConversationId = directConversation.body.data.id;
    const directConversationDuplicate = await http(baseUrl, '/messages/conversations/direct', {
      method: 'POST',
      token: adminToken,
      body: {
        participantUserIds: [memberUser.id],
        title: 'Exec10 direct channel duplicate request',
      },
    });

    const directMessage = await http(
      baseUrl,
      `/messages/conversations/${directConversationId}/messages`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          type: 'TEXT',
          content: 'Hello from admin to member for EXEC-10.',
        },
      },
    );
    const directMessageId = directMessage.body.data.id;

    const memberInboxBeforeRead = await http(baseUrl, '/messages/conversations', {
      token: memberToken,
    });

    const markConversationRead = await http(
      baseUrl,
      `/messages/conversations/${directConversationId}/read`,
      {
        method: 'POST',
        token: memberToken,
      },
    );

    const memberInboxAfterRead = await http(baseUrl, '/messages/conversations', {
      token: memberToken,
    });

    const editMessage = await http(baseUrl, `/messages/messages/${directMessageId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        content: 'Edited admin message for EXEC-10.',
      },
    });

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['exec-10 attachment body'], { type: 'text/plain' }),
      'exec10-note.txt',
    );
    formData.append('content', 'Attachment upload for runtime validation');

    const attachmentMessage = await httpForm(
      baseUrl,
      `/messages/conversations/${directConversationId}/attachments`,
      {
        method: 'POST',
        token: adminToken,
        formData,
      },
    );
    const attachmentMessageId = attachmentMessage.body.data.id;
    const attachmentId = attachmentMessage.body.data.attachments[0].id;

    const getAttachment = await fetch(`${baseUrl}/messages/attachments/${attachmentId}`, {
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    const nonParticipantBlocked = await http(
      baseUrl,
      `/messages/conversations/${directConversationId}/messages`,
      {
        token: outsiderToken,
      },
    );

    const nonAdminModerationBlocked = await http(
      baseUrl,
      `/admin/messages/${attachmentMessageId}/moderate`,
      {
        method: 'PATCH',
        token: memberToken,
        body: {
          moderationStatus: PublicModerationStatus.APPROVED,
        },
      },
    );

    const moderationListBefore = await http(baseUrl, '/admin/messages/moderation', {
      token: adminToken,
    });

    const moderateAttachmentMessage = await http(
      baseUrl,
      `/admin/messages/${attachmentMessageId}/moderate`,
      {
        method: 'PATCH',
        token: adminToken,
        body: {
          moderationStatus: PublicModerationStatus.APPROVED,
          moderationNotes: 'Approved for collaboration runtime validation.',
          applyToAttachments: true,
        },
      },
    );

    const deleteMessage = await http(baseUrl, `/messages/messages/${directMessageId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    const messagesAfterDelete = await http(
      baseUrl,
      `/messages/conversations/${directConversationId}/messages`,
      {
        token: memberToken,
      },
    );

    const postCreate = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        type: 'PROJECT',
        title: `Exec10 Public Project ${suffix}`,
        summary: 'Workspace messaging validation',
        description: 'Public project feed item for conversation testing.',
        domain: 'Construction',
        location: 'Romania, Bucharest',
        value: 'EUR 15,000',
        ownerName: users.owner.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
        certifications: 'Safety',
      },
    });
    const postId = postCreate.body.data.id;

    const approvePost = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: 'APPROVED',
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });
    const reluMatch = ownerProfileId
      ? await http(baseUrl, `/relu/public-posts/${postId}/matches`, {
          method: 'POST',
          token: ownerToken,
          body: {
            profileId: ownerProfileId,
          },
        })
      : { status: 500, body: { message: 'ownerProfileId missing' } };

    const projectConversation = await http(baseUrl, '/messages/conversations/project', {
      method: 'POST',
      token: adminToken,
      body: {
        publicPostId: postId,
        participantUserIds: [ownerUser.id],
        title: 'Exec10 project workspace',
      },
    });
    const projectConversationDuplicate = await http(baseUrl, '/messages/conversations/project', {
      method: 'POST',
      token: adminToken,
      body: {
        publicPostId: postId,
        participantUserIds: [ownerUser.id],
        title: 'Exec10 project workspace duplicate request',
      },
    });
    const projectConversationId = projectConversation.body.data.id;
    const projectAttachmentForm = new FormData();
    projectAttachmentForm.append(
      'file',
      new Blob(['exec-10 project attachment'], { type: 'text/plain' }),
      'exec10-project-note.txt',
    );
    projectAttachmentForm.append('content', 'Project workspace attachment');
    const projectAttachmentMessage = await httpForm(
      baseUrl,
      `/messages/conversations/${projectConversationId}/attachments`,
      {
        method: 'POST',
        token: ownerToken,
        formData: projectAttachmentForm,
      },
    );
    const projectMessages = await http(
      baseUrl,
      `/messages/conversations/${projectConversationId}/messages`,
      {
        token: ownerToken,
      },
    );

    const workforceAssignment = await http(baseUrl, '/workforce/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        applicationId: application.id,
        contractId: contract.id,
        projectId: project.id,
      },
    });
    const assignmentId = workforceAssignment.body.data.id;

    await http(baseUrl, `/workforce/contracts/${contract.id}/send`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });
    await http(baseUrl, `/workforce/contracts/${contract.id}/activate`, {
      method: 'POST',
      token: adminToken,
      body: { note: 'Activate for messaging validation.' },
    });

    const workforceConversation = await http(baseUrl, '/messages/conversations/workforce', {
      method: 'POST',
      token: adminToken,
      body: {
        workforceAssignmentId: assignmentId,
        title: 'Exec10 workforce channel',
      },
    });

    const payrollCycle = await prisma.payrollCycle.create({
      data: {
        periodStart: cycleStart,
        periodEnd: cycleEnd,
      },
    });

    const payrollSettlement = await prisma.payrollSettlement.create({
      data: {
        payrollCycleId: payrollCycle.id,
        workforceAssignmentId: assignmentId,
        userId: workerUser.id,
        approvedTimesheetIds: [],
        regularHours: 8,
        overtimeHours: 2,
        grossAmount: 550,
        deductionsAmount: 0,
        netAmount: 550,
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
          reason: 'Payroll issue follow-up required.',
        },
      },
    );
    const unauthorizedConversations = await http(baseUrl, '/messages/conversations');

    const adminMessageConversations = await http(baseUrl, '/admin/messages/conversations', {
      token: adminToken,
    });
    const workerConversations = await http(baseUrl, '/messages/conversations', {
      token: workerToken,
    });

    const authStable = await http(baseUrl, '/auth/me', { token: ownerToken });
    const subscriptionsStable = await http(baseUrl, '/subscriptions/me', { token: ownerToken });
    const billingStable = await http(baseUrl, '/billing/profile/me', { token: ownerToken });
    const onboardingStable = await http(baseUrl, '/onboarding/me', { token: ownerToken });
    const publicFeedStable = await http(baseUrl, '/public-posts');
    const reluStable = await http(baseUrl, '/admin/relu/runs', { token: adminToken });

    const attachmentRecord = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
    });

    const payrollConversationExists = await prisma.conversation.findFirst({
      where: {
        payrollSettlementId: payrollSettlement.id,
        type: 'PAYROLL',
      },
      include: {
        messages: true,
      },
    });

    const memberUnreadBeforeRead =
      memberInboxBeforeRead.body.data.find((item) => item.id === directConversationId)?.unreadCount ?? 0;
    const memberUnreadAfterRead =
      memberInboxAfterRead.body.data.find((item) => item.id === directConversationId)?.unreadCount ?? -1;

    const workforceConversationExists = await prisma.conversation.findFirst({
      where: {
        workforceAssignmentId: assignmentId,
        type: 'WORKFORCE',
      },
    });
    const reluConversationExists = await prisma.conversation.findFirst({
      where: {
        type: 'RELU',
        reluRecommendationId: {
          not: null,
        },
      },
      include: {
        participants: true,
        reluRecommendation: true,
      },
    });
    const adminCanSeeReluConversation =
      adminMessageConversations.status === 200 &&
      Array.isArray(adminMessageConversations.body?.data) &&
      adminMessageConversations.body.data.some((item) => item.id === reluConversationExists?.id);
    const deletedMessageHidden =
      messagesAfterDelete.status === 200 &&
      Array.isArray(messagesAfterDelete.body?.data) &&
      !messagesAfterDelete.body.data.some((item) => item.id === directMessageId);

    const checks = [
      ['direct conversation create', isSuccessStatus(directConversation.status)],
      ['direct dedupe pair', directConversationDuplicate.body?.data?.id === directConversationId],
      ['send/read/edit/delete message', isSuccessStatus(directMessage.status) && isSuccessStatus(markConversationRead.status) && editMessage.status === 200 && deleteMessage.status === 200],
      ['deleted message hidden', deletedMessageHidden],
      ['attachment upload', isSuccessStatus(attachmentMessage.status) && getAttachment.status === 200],
      ['unread counters', memberUnreadBeforeRead > 0 && memberUnreadAfterRead === 0],
      ['project conversation', isSuccessStatus(projectConversation.status) && approvePost.status === 200 && projectConversationDuplicate.body?.data?.id === projectConversationId && isSuccessStatus(projectAttachmentMessage.status) && projectMessages.status === 200],
      ['workforce conversation', isSuccessStatus(workforceAssignment.status) && isSuccessStatus(workforceConversation.status) && Boolean(workforceConversationExists)],
      ['payroll notification flow', isSuccessStatus(rejectSettlement.status) && Boolean(payrollConversationExists) && payrollConversationExists.messages.length > 0],
      ['relu conversation', isSuccessStatus(reluMatch.status) && Boolean(reluConversationExists) && adminCanSeeReluConversation],
      ['admin moderation flow', moderationListBefore.status === 200 && moderateAttachmentMessage.status === 200 && attachmentRecord?.status === PublicModerationStatus.APPROVED],
      ['permissions enforcement', nonParticipantBlocked.status === 404 && nonAdminModerationBlocked.status === 403 && unauthorizedConversations.status === 401],
      ['auth stable', authStable.status === 200],
      ['subscriptions stable', subscriptionsStable.status === 200],
      ['billing stable', billingStable.status === 200],
      ['onboarding stable', onboardingStable.status === 200],
      ['public feed stable', publicFeedStable.status === 200],
      ['relu stable', reluStable.status === 200],
      ['admin conversations visible', adminMessageConversations.status === 200],
      ['worker inbox visible', workerConversations.status === 200],
    ];

    const failed = checks.filter(([, passed]) => !passed);
    if (failed.length) {
      throw new Error(
        `EXEC-10 runtime validation failed: ${failed.map(([label]) => label).join(', ')}\n${JSON.stringify(
          {
            memberUnreadBeforeRead,
            memberUnreadAfterRead,
            directConversation,
            directConversationDuplicate,
            directMessage,
            editMessage,
            deleteMessage,
            messagesAfterDelete,
            attachmentMessage,
            projectConversation,
            projectConversationDuplicate,
            projectAttachmentMessage,
            projectMessages,
            workforceAssignment,
            workforceConversation,
            rejectSettlement,
            reluMatch,
            deletedMessageHidden,
            moderationListBeforeStatus: moderationListBefore.status,
            moderateAttachmentMessageStatus: moderateAttachmentMessage.status,
            nonParticipantBlocked,
            nonAdminModerationBlocked,
            unauthorizedConversations,
            authStable,
            subscriptionsStable,
            billingStable,
            onboardingStable,
            publicFeedStable,
            reluStable,
          },
          null,
          2,
        )}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          verdict: 'PASS',
          directConversationId,
          directMessageId,
          attachmentId,
          projectConversationId,
          workforceConversationId: workforceConversation.body.data.id,
          payrollConversationId: payrollConversationExists.id,
          reluConversationId: reluConversationExists?.id ?? null,
          memberUnreadBeforeRead,
          memberUnreadAfterRead,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
