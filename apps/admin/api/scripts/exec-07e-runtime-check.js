require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const {
  PrismaClient,
  Role,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  VerificationStatus,
  ContractStatus,
  ContractLifecycleStatus,
  ProjectEngagementModel,
  ProjectStatus,
  ActorType,
  PlatformRole,
  JobCategory,
  JobStatus,
  AppStatus,
  ApplicationStage,
  ApplicationDecision,
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

function assertStatus(response, expected, label) {
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${label} expected ${expectedStatuses.join(' or ')} but received ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  return response;
}

function isoRangeFrom(startDate, durationDays = 7) {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + durationDays - 1);
  end.setUTCHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function main() {
  const prisma = new PrismaClient();
  const port = 8096;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec07e-${Date.now()}`;
  const uniqueOffsetDays = Number(String(Date.now()).slice(-4)) % 180;
  const cycleOneRange = isoRangeFrom(
    new Date(Date.UTC(2030, 0, 1 + uniqueOffsetDays)),
  );
  const cycleTwoRange = isoRangeFrom(
    new Date(Date.UTC(2030, 0, 8 + uniqueOffsetDays)),
  );
  const password = 'Password123!';
  const server = spawn(process.execPath, ['dist/src/main.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
    },
    stdio: 'ignore',
  });

  const users = {
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec07E Admin' },
    recruiter: { email: `${suffix}.recruiter@example.com`, displayName: 'Exec07E Recruiter' },
    alpha: { email: `${suffix}.alpha@example.com`, displayName: 'Exec07E Alpha' },
    beta: { email: `${suffix}.beta@example.com`, displayName: 'Exec07E Beta' },
    gamma: { email: `${suffix}.gamma@example.com`, displayName: 'Exec07E Gamma' },
    delta: { email: `${suffix}.delta@example.com`, displayName: 'Exec07E Delta' },
  };

  async function registerUser({ email, displayName }, actorType, profileType) {
    return http(baseUrl, '/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        displayName,
        actorType,
        profileType,
      },
    });
  }

  async function login(email) {
    return http(baseUrl, '/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async function createTimesheet(workerToken, assignmentId, periodStart, periodEnd, entries) {
    const createResponse = assertStatus(
      await http(baseUrl, '/timesheets', {
        method: 'POST',
        token: workerToken,
        body: {
          workforceAssignmentId: assignmentId,
          periodStart,
          periodEnd,
        },
      }),
      201,
      'create timesheet',
    );

    const timesheetId = createResponse.body.data.id;

    for (const entry of entries) {
      assertStatus(
        await http(baseUrl, `/timesheets/${timesheetId}/entries`, {
          method: 'POST',
          token: workerToken,
          body: entry,
        }),
        201,
        'add timesheet entry',
      );
    }

    assertStatus(
      await http(baseUrl, `/timesheets/${timesheetId}/submit`, {
        method: 'POST',
        token: workerToken,
        body: { note: 'Ready for payroll to billing validation.' },
      }),
      201,
      'submit timesheet',
    );

    return timesheetId;
  }

  async function approveTimesheet(adminToken, timesheetId) {
    return assertStatus(
      await http(baseUrl, `/admin/timesheets/${timesheetId}/approve`, {
        method: 'POST',
        token: adminToken,
        body: { note: 'Approved for settlement generation.' },
      }),
      201,
      'approve timesheet',
    );
  }

  try {
    await waitForServer(baseUrl);

    await registerUser(users.admin, 'COMPANY', 'GENERAL_CONTRACTOR');
    await registerUser(users.recruiter, 'COMPANY', 'GENERAL_CONTRACTOR');
    await registerUser(users.alpha, 'INDIVIDUAL', 'PROFESSIONAL');
    await registerUser(users.beta, 'INDIVIDUAL', 'PROFESSIONAL');
    await registerUser(users.gamma, 'INDIVIDUAL', 'PROFESSIONAL');
    await registerUser(users.delta, 'INDIVIDUAL', 'PROFESSIONAL');

    const [adminUser, recruiterUser, alphaUser, betaUser, gammaUser, deltaUser] =
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
          where: { email: users.recruiter.email },
          data: {
            role: Role.EMPLOYER,
            approvalStatus: AccountApprovalStatus.APPROVED,
            accountStatus: AccountLifecycleStatus.LIVE,
          },
        }),
        prisma.user.update({
          where: { email: users.alpha.email },
          data: {
            role: Role.PROFESSIONAL,
            approvalStatus: AccountApprovalStatus.APPROVED,
            accountStatus: AccountLifecycleStatus.LIVE,
          },
        }),
        prisma.user.update({
          where: { email: users.beta.email },
          data: {
            role: Role.PROFESSIONAL,
            approvalStatus: AccountApprovalStatus.APPROVED,
            accountStatus: AccountLifecycleStatus.LIVE,
          },
        }),
        prisma.user.update({
          where: { email: users.gamma.email },
          data: {
            role: Role.PROFESSIONAL,
            approvalStatus: AccountApprovalStatus.APPROVED,
            accountStatus: AccountLifecycleStatus.LIVE,
          },
        }),
        prisma.user.update({
          where: { email: users.delta.email },
          data: {
            role: Role.PROFESSIONAL,
            approvalStatus: AccountApprovalStatus.APPROVED,
            accountStatus: AccountLifecycleStatus.LIVE,
          },
        }),
      ]);

    await Promise.all([
      prisma.identityProfile.update({
        where: { userId: alphaUser.id },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.identityProfile.update({
        where: { userId: betaUser.id },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.identityProfile.update({
        where: { userId: gammaUser.id },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.identityProfile.update({
        where: { userId: deltaUser.id },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      }),
    ]);

    const [adminToken, alphaToken, betaToken, gammaToken, deltaToken] = await Promise.all([
      login(users.admin.email).then((item) => item.body.accessToken),
      login(users.alpha.email).then((item) => item.body.accessToken),
      login(users.beta.email).then((item) => item.body.accessToken),
      login(users.gamma.email).then((item) => item.body.accessToken),
      login(users.delta.email).then((item) => item.body.accessToken),
    ]);

    const recruiterActor = await prisma.actor.create({
      data: {
        firebaseUid: `${suffix}-recruiter-actor`,
        email: users.recruiter.email,
        actorType: ActorType.COMPANY,
        displayName: users.recruiter.displayName,
        role: PlatformRole.USER,
      },
    });

    const [alphaActor, betaActor, gammaActor, deltaActor] = await Promise.all([
      prisma.actor.create({
        data: {
          firebaseUid: `${suffix}-alpha-actor`,
          email: users.alpha.email,
          actorType: ActorType.INDIVIDUAL,
          displayName: users.alpha.displayName,
          role: PlatformRole.USER,
        },
      }),
      prisma.actor.create({
        data: {
          firebaseUid: `${suffix}-beta-actor`,
          email: users.beta.email,
          actorType: ActorType.INDIVIDUAL,
          displayName: users.beta.displayName,
          role: PlatformRole.USER,
        },
      }),
      prisma.actor.create({
        data: {
          firebaseUid: `${suffix}-gamma-actor`,
          email: users.gamma.email,
          actorType: ActorType.INDIVIDUAL,
          displayName: users.gamma.displayName,
          role: PlatformRole.USER,
        },
      }),
      prisma.actor.create({
        data: {
          firebaseUid: `${suffix}-delta-actor`,
          email: users.delta.email,
          actorType: ActorType.INDIVIDUAL,
          displayName: users.delta.displayName,
          role: PlatformRole.USER,
        },
      }),
    ]);

    const job = await prisma.job.create({
      data: {
        actorId: recruiterActor.id,
        title: `Exec07E Job ${suffix}`,
        description: 'Settlement to billing bridge validation job',
        category: JobCategory.CONSTRUCTION,
        status: JobStatus.LIVE,
        countryCode: 'RO',
        currency: 'RON',
      },
    });

    await prisma.hiringPipeline.create({
      data: {
        jobId: job.id,
        totalApplicants: 4,
        totalHired: 4,
      },
    });

    const applications = await Promise.all([
      prisma.application.create({
        data: {
          jobId: job.id,
          actorId: alphaActor.id,
          candidateUserId: alphaUser.id,
          status: AppStatus.ACCEPTED,
          currentStage: ApplicationStage.HIRED,
          stageChangedAt: new Date(),
          message: 'Alpha hired.',
          stageHistory: {
            create: {
              fromStage: ApplicationStage.APPLIED,
              toStage: ApplicationStage.HIRED,
              changedByUserId: adminUser.id,
              note: 'Direct setup for runtime validation.',
            },
          },
          hiringDecisions: {
            create: {
              decision: ApplicationDecision.APPROVED,
              decidedByUserId: adminUser.id,
              reason: 'Settlement bridge hire.',
            },
          },
        },
      }),
      prisma.application.create({
        data: {
          jobId: job.id,
          actorId: betaActor.id,
          candidateUserId: betaUser.id,
          status: AppStatus.ACCEPTED,
          currentStage: ApplicationStage.HIRED,
          stageChangedAt: new Date(),
          message: 'Beta hired.',
          stageHistory: {
            create: {
              fromStage: ApplicationStage.APPLIED,
              toStage: ApplicationStage.HIRED,
              changedByUserId: adminUser.id,
              note: 'Direct setup for runtime validation.',
            },
          },
          hiringDecisions: {
            create: {
              decision: ApplicationDecision.APPROVED,
              decidedByUserId: adminUser.id,
              reason: 'Settlement bridge hire.',
            },
          },
        },
      }),
      prisma.application.create({
        data: {
          jobId: job.id,
          actorId: gammaActor.id,
          candidateUserId: gammaUser.id,
          status: AppStatus.ACCEPTED,
          currentStage: ApplicationStage.HIRED,
          stageChangedAt: new Date(),
          message: 'Gamma hired.',
          stageHistory: {
            create: {
              fromStage: ApplicationStage.APPLIED,
              toStage: ApplicationStage.HIRED,
              changedByUserId: adminUser.id,
              note: 'Direct setup for runtime validation.',
            },
          },
          hiringDecisions: {
            create: {
              decision: ApplicationDecision.APPROVED,
              decidedByUserId: adminUser.id,
              reason: 'Settlement bridge hire.',
            },
          },
        },
      }),
      prisma.application.create({
        data: {
          jobId: job.id,
          actorId: deltaActor.id,
          candidateUserId: deltaUser.id,
          status: AppStatus.ACCEPTED,
          currentStage: ApplicationStage.HIRED,
          stageChangedAt: new Date(),
          message: 'Delta hired.',
          stageHistory: {
            create: {
              fromStage: ApplicationStage.APPLIED,
              toStage: ApplicationStage.HIRED,
              changedByUserId: adminUser.id,
              note: 'Direct setup for runtime validation.',
            },
          },
          hiringDecisions: {
            create: {
              decision: ApplicationDecision.APPROVED,
              decidedByUserId: adminUser.id,
              reason: 'Settlement bridge hire.',
            },
          },
        },
      }),
    ]);

    const project = await prisma.project.create({
      data: {
        slug: `${suffix}-project`,
        name: `Exec07E Project ${suffix}`,
        engagementModel: ProjectEngagementModel.B2B,
        status: ProjectStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    async function createAssignmentScenario(application) {
      const contract = await prisma.contract.create({
        data: {
          jobId: job.id,
          employerId: recruiterActor.id,
          contractorId: application.actorId,
          status: ContractStatus.DRAFT,
          lifecycleStatus: ContractLifecycleStatus.DRAFT,
          value: 18000,
          currency: 'RON',
        },
      });

      const assignmentResponse = await http(baseUrl, '/workforce/assignments', {
        method: 'POST',
        token: adminToken,
        body: {
          applicationId: application.id,
          contractId: contract.id,
          projectId: project.id,
        },
      });

      await http(baseUrl, `/workforce/contracts/${contract.id}/send`, {
        method: 'POST',
        token: adminToken,
        body: {},
      });

      await http(baseUrl, `/workforce/contracts/${contract.id}/activate`, {
        method: 'POST',
        token: adminToken,
        body: { note: 'Activate workforce for settlement bridge validation.' },
      });

      return {
        contractId: contract.id,
        assignmentId: assignmentResponse.body.data.id,
      };
    }

    const alphaScenario = await createAssignmentScenario(applications[0]);
    const betaScenario = await createAssignmentScenario(applications[1]);
    const gammaScenario = await createAssignmentScenario(applications[2]);
    const deltaScenario = await createAssignmentScenario(applications[3]);

    await Promise.all([
      assertStatus(
        await http(baseUrl, '/admin/payroll/compensation', {
          method: 'POST',
          token: adminToken,
          body: {
            workforceAssignmentId: alphaScenario.assignmentId,
            compensationType: 'HOURLY',
            currency: 'RON',
            baseRate: 50,
            overtimeRate: 75,
            overtimeThresholdHours: 100,
            effectiveFrom: cycleOneRange.start,
          },
        }),
        [200, 201],
        'create alpha compensation agreement',
      ),
      assertStatus(
        await http(baseUrl, '/admin/payroll/compensation', {
          method: 'POST',
          token: adminToken,
          body: {
            workforceAssignmentId: betaScenario.assignmentId,
            compensationType: 'HOURLY',
            currency: 'RON',
            baseRate: 40,
            overtimeRate: 60,
            overtimeThresholdHours: 100,
            effectiveFrom: cycleOneRange.start,
          },
        }),
        [200, 201],
        'create beta compensation agreement',
      ),
      assertStatus(
        await http(baseUrl, '/admin/payroll/compensation', {
          method: 'POST',
          token: adminToken,
          body: {
            workforceAssignmentId: gammaScenario.assignmentId,
            compensationType: 'HOURLY',
            currency: 'RON',
            baseRate: 30,
            overtimeRate: 45,
            overtimeThresholdHours: 100,
            effectiveFrom: cycleOneRange.start,
          },
        }),
        [200, 201],
        'create gamma compensation agreement',
      ),
      assertStatus(
        await http(baseUrl, '/admin/payroll/compensation', {
          method: 'POST',
          token: adminToken,
          body: {
            workforceAssignmentId: deltaScenario.assignmentId,
            compensationType: 'HOURLY',
            currency: 'RON',
            baseRate: 20,
            overtimeRate: 30,
            overtimeThresholdHours: 100,
            effectiveFrom: cycleOneRange.start,
          },
        }),
        [200, 201],
        'create delta compensation agreement',
      ),
    ]);

    const cycleOne = assertStatus(
      await http(baseUrl, '/admin/payroll/cycles', {
        method: 'POST',
        token: adminToken,
        body: {
          periodStart: cycleOneRange.start,
          periodEnd: cycleOneRange.end,
        },
      }),
      201,
      'create payroll cycle one',
    );

    const cycleTwo = assertStatus(
      await http(baseUrl, '/admin/payroll/cycles', {
        method: 'POST',
        token: adminToken,
        body: {
          periodStart: cycleTwoRange.start,
          periodEnd: cycleTwoRange.end,
        },
      }),
      201,
      'create payroll cycle two',
    );

    const alphaTs = await createTimesheet(
      alphaToken,
      alphaScenario.assignmentId,
      cycleOneRange.start,
      cycleOneRange.end,
      [{ workDate: cycleOneRange.start, hoursWorked: 8, overtimeHours: 0, notes: 'Alpha' }],
    );
    const betaTs = await createTimesheet(
      betaToken,
      betaScenario.assignmentId,
      cycleOneRange.start,
      cycleOneRange.end,
      [{ workDate: cycleOneRange.start, hoursWorked: 8, overtimeHours: 0, notes: 'Beta' }],
    );
    const gammaTs = await createTimesheet(
      gammaToken,
      gammaScenario.assignmentId,
      cycleTwoRange.start,
      cycleTwoRange.end,
      [{ workDate: cycleTwoRange.start, hoursWorked: 10, overtimeHours: 0, notes: 'Gamma' }],
    );
    const deltaTs = await createTimesheet(
      deltaToken,
      deltaScenario.assignmentId,
      cycleTwoRange.start,
      cycleTwoRange.end,
      [{ workDate: cycleTwoRange.start, hoursWorked: 6, overtimeHours: 0, notes: 'Delta' }],
    );

    await Promise.all([
      approveTimesheet(adminToken, alphaTs),
      approveTimesheet(adminToken, betaTs),
      approveTimesheet(adminToken, gammaTs),
      approveTimesheet(adminToken, deltaTs),
    ]);

    assertStatus(
      await http(baseUrl, `/admin/payroll/cycles/${cycleOne.body.data.id}/process`, {
        method: 'POST',
        token: adminToken,
        body: {},
      }),
      [200, 201],
      'process payroll cycle one',
    );
    assertStatus(
      await http(baseUrl, `/admin/payroll/cycles/${cycleTwo.body.data.id}/process`, {
        method: 'POST',
        token: adminToken,
        body: {},
      }),
      [200, 201],
      'process payroll cycle two',
    );

    const settlementsAfterProcess = assertStatus(
      await http(baseUrl, '/admin/payroll/settlements', {
        token: adminToken,
      }),
      200,
      'list settlements after process',
    );

    const alphaSettlement = settlementsAfterProcess.body.data.find(
      (item) => item.user.email === users.alpha.email,
    );
    const betaSettlement = settlementsAfterProcess.body.data.find(
      (item) => item.user.email === users.beta.email,
    );
    const gammaSettlement = settlementsAfterProcess.body.data.find(
      (item) => item.user.email === users.gamma.email,
    );
    const deltaSettlement = settlementsAfterProcess.body.data.find(
      (item) => item.user.email === users.delta.email,
    );

    const pendingBlocked = await http(
      baseUrl,
      `/admin/payroll/settlements/${alphaSettlement.id}/create-billing-event`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    await http(baseUrl, `/admin/payroll/settlements/${alphaSettlement.id}/approve`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });

    const alphaBilled = await http(
      baseUrl,
      `/admin/payroll/settlements/${alphaSettlement.id}/create-billing-event`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    const duplicateBlocked = await http(
      baseUrl,
      `/admin/payroll/settlements/${alphaSettlement.id}/create-billing-event`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    await http(baseUrl, `/admin/payroll/settlements/${betaSettlement.id}/reject`, {
      method: 'POST',
      token: adminToken,
      body: { reason: 'Settlement review rejected.' },
    });

    const rejectedBlocked = await http(
      baseUrl,
      `/admin/payroll/settlements/${betaSettlement.id}/create-billing-event`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    await http(baseUrl, `/admin/payroll/settlements/${gammaSettlement.id}/approve`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });
    await http(baseUrl, `/admin/payroll/settlements/${deltaSettlement.id}/approve`, {
      method: 'POST',
      token: adminToken,
      body: {},
    });

    const gammaBilled = await http(
      baseUrl,
      `/admin/payroll/settlements/${gammaSettlement.id}/create-billing-event`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    const cycleBatch = await http(
      baseUrl,
      `/admin/payroll/cycles/${cycleTwo.body.data.id}/create-billing-events`,
      {
        method: 'POST',
        token: adminToken,
        body: {},
      },
    );

    const billingLinks = await http(baseUrl, '/admin/payroll/billing-links', {
      token: adminToken,
    });
    const billingEvents = await http(baseUrl, '/admin/billing/events', {
      token: adminToken,
    });

    const gammaBillingEventId = gammaBilled.body.data.billingLink?.billingEvent?.id;

    const invoiceCreate = await http(baseUrl, '/admin/billing/invoices/generate', {
      method: 'POST',
      token: adminToken,
      body: {
        userId: gammaUser.id,
        billingEventIds: [gammaBillingEventId],
      },
    });

    const invoicePaid = await http(
      baseUrl,
      `/admin/billing/invoices/${invoiceCreate.body.data.id}/mark-paid`,
      {
        method: 'POST',
        token: adminToken,
        body: { provider: 'MANUAL' },
      },
    );

    const gammaSettlementAfterPayment = await http(
      baseUrl,
      `/admin/payroll/settlements/${gammaSettlement.id}`,
      {
        token: adminToken,
      },
    );
    const cycleTwoAfterBridge = await http(
      baseUrl,
      `/admin/payroll/cycles/${cycleTwo.body.data.id}`,
      {
        token: adminToken,
      },
    );

    const authStable = await http(baseUrl, '/auth/me', { token: alphaToken });
    const onboardingStable = await http(baseUrl, '/onboarding/me', { token: alphaToken });
    const subscriptionsStable = await http(baseUrl, '/subscriptions/me', {
      token: alphaToken,
    });
    const billingStable = await http(baseUrl, '/billing/profile/me', { token: alphaToken });
    const workforceStable = await http(baseUrl, '/workforce/me', { token: alphaToken });
    const payrollStable = await http(baseUrl, '/payroll/me/settlements', { token: alphaToken });

    console.log(
      JSON.stringify(
        {
          approvedSettlementCreated: alphaBilled.status === 200 || alphaBilled.status === 201,
          createBillingEventFromSettlement: Boolean(
            alphaBilled.body?.data?.billingLink?.billingEvent?.id,
          ),
          duplicateBillingEventBlocked: duplicateBlocked.status === 400,
          pendingSettlementBlocked: pendingBlocked.status === 400,
          rejectedSettlementBlocked: rejectedBlocked.status === 400,
          batchCreatesOnlyMissingApproved:
            (cycleBatch.status === 200 || cycleBatch.status === 201) &&
            cycleBatch.body.data.createdCount === 1 &&
            cycleBatch.body.data.links.some(
              (link) =>
                link.payrollSettlementId === deltaSettlement.id &&
                link.status === 'BILLING_EVENT_CREATED',
            ),
          billingEventSourceVisible:
            billingEvents.status === 200 &&
            billingEvents.body.data.some(
              (event) =>
                event.type === 'WORKFORCE_SETTLEMENT' &&
                event.billingLink?.payrollSettlementId === alphaSettlement.id,
            ),
          billingInvoiceGenerationStillWorks:
            (invoiceCreate.status === 200 || invoiceCreate.status === 201) &&
            invoiceCreate.body.data.lines?.[0]?.billingEvent?.type === 'WORKFORCE_SETTLEMENT',
          markInvoicePaidStillWorks:
            (invoicePaid.status === 200 || invoicePaid.status === 201) &&
            invoicePaid.body.data.invoice.status === 'PAID',
          settlementMarkedPaidAfterInvoice:
            gammaSettlementAfterPayment.status === 200 &&
            gammaSettlementAfterPayment.body.data.status === 'PAID' &&
            gammaSettlementAfterPayment.body.data.billingLink?.status === 'PAID',
          linksListed:
            billingLinks.status === 200 &&
            billingLinks.body.data.length >= 3,
          authStable: authStable.status === 200,
          onboardingStable: onboardingStable.status === 200,
          subscriptionsStable: subscriptionsStable.status === 200,
          billingStable: billingStable.status === 200,
          workforceStable: workforceStable.status === 200,
          payrollStable: payrollStable.status === 200,
          cycleTwoStatusAfterLock: cycleTwoAfterBridge.body?.data?.status ?? null,
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
