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

async function main() {
  const prisma = new PrismaClient();
  const port = 8095;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec07d-${Date.now()}`;
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
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec07D Admin' },
    recruiter: { email: `${suffix}.recruiter@example.com`, displayName: 'Exec07D Recruiter' },
    alpha: { email: `${suffix}.alpha@example.com`, displayName: 'Exec07D Alpha' },
    beta: { email: `${suffix}.beta@example.com`, displayName: 'Exec07D Beta' },
    gamma: { email: `${suffix}.gamma@example.com`, displayName: 'Exec07D Gamma' },
    delta: { email: `${suffix}.delta@example.com`, displayName: 'Exec07D Delta' },
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

  async function createApprovedTimesheet(workerToken, adminToken, assignmentId, entries) {
    const createResponse = await http(baseUrl, '/timesheets', {
      method: 'POST',
      token: workerToken,
      body: {
        workforceAssignmentId: assignmentId,
        periodStart: '2026-05-05T00:00:00.000Z',
        periodEnd: '2026-05-11T23:59:59.999Z',
      },
    });

    const timesheetId = createResponse.body.data.id;

    for (const entry of entries) {
      await http(baseUrl, `/timesheets/${timesheetId}/entries`, {
        method: 'POST',
        token: workerToken,
        body: entry,
      });
    }

    await http(baseUrl, `/timesheets/${timesheetId}/submit`, {
      method: 'POST',
      token: workerToken,
      body: { note: 'Ready for payroll processing.' },
    });

    const approved = await http(baseUrl, `/admin/timesheets/${timesheetId}/approve`, {
      method: 'POST',
      token: adminToken,
      body: { note: 'Approved for payroll.' },
    });

    return {
      id: timesheetId,
      data: approved.body.data,
    };
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
        title: `Exec07D Job ${suffix}`,
        description: 'Payroll preparation validation job',
        category: JobCategory.CONSTRUCTION,
        status: JobStatus.LIVE,
        countryCode: 'RO',
        currency: 'RON',
      },
    });

    const pipeline = await prisma.hiringPipeline.create({
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
              reason: 'Payroll validation hire.',
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
              reason: 'Payroll validation hire.',
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
              reason: 'Payroll validation hire.',
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
              reason: 'Payroll validation hire.',
            },
          },
        },
      }),
    ]);

    const project = await prisma.project.create({
      data: {
        slug: `${suffix}-project`,
        name: `Exec07D Project ${suffix}`,
        engagementModel: ProjectEngagementModel.B2B,
        status: ProjectStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    async function createAssignmentScenario(application, actor, user) {
      const contract = await prisma.contract.create({
        data: {
          jobId: job.id,
          employerId: recruiterActor.id,
          contractorId: actor.id,
          status: ContractStatus.DRAFT,
          lifecycleStatus: ContractLifecycleStatus.DRAFT,
          value: 18000,
          currency: 'RON',
        },
      });

      const assignment = await http(baseUrl, '/workforce/assignments', {
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
        body: { note: 'Activate workforce for payroll validation.' },
      });

      return {
        user,
        actor,
        applicationId: application.id,
        contractId: contract.id,
        assignmentId: assignment.body.data.id,
      };
    }

    const alphaScenario = await createAssignmentScenario(applications[0], alphaActor, alphaUser);
    const betaScenario = await createAssignmentScenario(applications[1], betaActor, betaUser);
    const gammaScenario = await createAssignmentScenario(applications[2], gammaActor, gammaUser);
    const deltaScenario = await createAssignmentScenario(applications[3], deltaActor, deltaUser);

    const alphaTimesheet = await createApprovedTimesheet(
      alphaToken,
      adminToken,
      alphaScenario.assignmentId,
      [
        {
          workDate: '2026-05-05T00:00:00.000Z',
          hoursWorked: 8,
          overtimeHours: 2,
          notes: 'Alpha shift 1',
        },
        {
          workDate: '2026-05-06T00:00:00.000Z',
          hoursWorked: 7.5,
          overtimeHours: 1,
          notes: 'Alpha shift 2',
        },
      ],
    );
    const betaTimesheet = await createApprovedTimesheet(
      betaToken,
      adminToken,
      betaScenario.assignmentId,
      [
        {
          workDate: '2026-05-05T00:00:00.000Z',
          hoursWorked: 8,
          overtimeHours: 1,
          notes: 'Beta shift',
        },
      ],
    );
    await createApprovedTimesheet(gammaToken, adminToken, gammaScenario.assignmentId, [
      {
        workDate: '2026-05-05T00:00:00.000Z',
        hoursWorked: 7,
        overtimeHours: 0,
        notes: 'Gamma shift',
      },
    ]);
    await createApprovedTimesheet(deltaToken, adminToken, deltaScenario.assignmentId, [
      {
        workDate: '2026-05-05T00:00:00.000Z',
        hoursWorked: 6,
        overtimeHours: 0,
        notes: 'Delta shift',
      },
    ]);

    await http(baseUrl, '/attendance/check-in', {
      method: 'POST',
      token: alphaToken,
      body: {
        workforceAssignmentId: alphaScenario.assignmentId,
        source: 'MOBILE',
        locationMetadata: { site: 'Bucharest' },
      },
    });
    await http(baseUrl, '/attendance/check-out', {
      method: 'POST',
      token: alphaToken,
      body: {
        workforceAssignmentId: alphaScenario.assignmentId,
        locationMetadata: { site: 'Bucharest', completed: true },
      },
    });

    await http(baseUrl, `/workforce/contracts/${gammaScenario.contractId}/terminate`, {
      method: 'POST',
      token: adminToken,
      body: { reason: 'Exclude terminated worker from payroll.' },
    });
    await http(baseUrl, `/workforce/contracts/${deltaScenario.contractId}/suspend`, {
      method: 'POST',
      token: adminToken,
      body: { reason: 'Exclude suspended worker from payroll.' },
    });

    const compensationResponses = await Promise.all([
      http(baseUrl, '/admin/payroll/compensation', {
        method: 'POST',
        token: adminToken,
        body: {
          workforceAssignmentId: alphaScenario.assignmentId,
          compensationType: 'HOURLY',
          currency: 'RON',
          baseRate: 50,
          overtimeRate: 75,
          overtimeThresholdHours: 100,
          effectiveFrom: '2026-05-01T00:00:00.000Z',
        },
      }),
      http(baseUrl, '/admin/payroll/compensation', {
        method: 'POST',
        token: adminToken,
        body: {
          workforceAssignmentId: betaScenario.assignmentId,
          compensationType: 'HOURLY',
          currency: 'RON',
          baseRate: 40,
          overtimeRate: 60,
          overtimeThresholdHours: 100,
          effectiveFrom: '2026-05-01T00:00:00.000Z',
        },
      }),
      http(baseUrl, '/admin/payroll/compensation', {
        method: 'POST',
        token: adminToken,
        body: {
          workforceAssignmentId: gammaScenario.assignmentId,
          compensationType: 'HOURLY',
          currency: 'RON',
          baseRate: 30,
          overtimeRate: 45,
          overtimeThresholdHours: 100,
          effectiveFrom: '2026-05-01T00:00:00.000Z',
        },
      }),
      http(baseUrl, '/admin/payroll/compensation', {
        method: 'POST',
        token: adminToken,
        body: {
          workforceAssignmentId: deltaScenario.assignmentId,
          compensationType: 'HOURLY',
          currency: 'RON',
          baseRate: 20,
          overtimeRate: 30,
          overtimeThresholdHours: 100,
          effectiveFrom: '2026-05-01T00:00:00.000Z',
        },
      }),
    ]);

    const cycleCreate = await http(baseUrl, '/admin/payroll/cycles', {
      method: 'POST',
      token: adminToken,
      body: {
        periodStart: '2026-05-05T00:00:00.000Z',
        periodEnd: '2026-05-11T23:59:59.999Z',
      },
    });
    const cycleId = cycleCreate.body.data.id;

    const processCycle = await http(baseUrl, `/admin/payroll/cycles/${cycleId}/process`, {
      method: 'POST',
      token: adminToken,
      body: { note: 'Initial payroll processing.' },
    });
    const duplicateProcessBlocked = await http(
      baseUrl,
      `/admin/payroll/cycles/${cycleId}/process`,
      {
        method: 'POST',
        token: adminToken,
        body: { note: 'Should be blocked.' },
      },
    );

    const settlementsResponse = await http(baseUrl, '/admin/payroll/settlements', {
      token: adminToken,
    });
    const settlements = settlementsResponse.body.data;
    const alphaSettlement = settlements.find((item) => item.user.email === users.alpha.email);
    const betaSettlement = settlements.find((item) => item.user.email === users.beta.email);
    const gammaSettlement = settlements.find((item) => item.user.email === users.gamma.email);
    const deltaSettlement = settlements.find((item) => item.user.email === users.delta.email);

    const approveAlpha = await http(
      baseUrl,
      `/admin/payroll/settlements/${alphaSettlement.id}/approve`,
      {
        method: 'POST',
        token: adminToken,
        body: { note: 'Approve alpha settlement.' },
      },
    );
    const rejectBeta = await http(
      baseUrl,
      `/admin/payroll/settlements/${betaSettlement.id}/reject`,
      {
        method: 'POST',
        token: adminToken,
        body: { reason: 'Needs payroll review adjustment.' },
      },
    );

    const workerPayrollOverview = await http(baseUrl, '/payroll/me', {
      token: alphaToken,
    });
    const workerPayrollSettlements = await http(baseUrl, '/payroll/me/settlements', {
      token: alphaToken,
    });

    const reprocessAfterReject = await http(
      baseUrl,
      `/admin/payroll/cycles/${cycleId}/process`,
      {
        method: 'POST',
        token: adminToken,
        body: { note: 'Reprocess rejected settlement.' },
      },
    );

    const settlementsAfterReprocess = await http(baseUrl, '/admin/payroll/settlements', {
      token: adminToken,
    });
    const regeneratedBetaSettlement = settlementsAfterReprocess.body.data.find(
      (item) =>
        item.user.email === users.beta.email &&
        item.status === 'PENDING' &&
        item.id !== betaSettlement.id,
    );

    const approveBeta = await http(
      baseUrl,
      `/admin/payroll/settlements/${regeneratedBetaSettlement.id}/approve`,
      {
        method: 'POST',
        token: adminToken,
        body: { note: 'Approve regenerated beta settlement.' },
      },
    );

    const lockedCycle = await http(baseUrl, `/admin/payroll/cycles/${cycleId}`, {
      token: adminToken,
    });
    const lockedCycleImmutable = await http(
      baseUrl,
      `/admin/payroll/cycles/${cycleId}/process`,
      {
        method: 'POST',
        token: adminToken,
        body: { note: 'Should fail after lock.' },
      },
    );

    const authStable = await http(baseUrl, '/auth/me', { token: alphaToken });
    const onboardingStable = await http(baseUrl, '/onboarding/me', { token: alphaToken });
    const subscriptionsStable = await http(baseUrl, '/subscriptions/me', {
      token: alphaToken,
    });
    const billingStable = await http(baseUrl, '/billing/profile/me', { token: alphaToken });
    const workforceStable = await http(baseUrl, '/workforce/me', { token: alphaToken });

    console.log(
      JSON.stringify(
        {
          compensationAgreementCreation: compensationResponses.every(
            (response) => response.status === 201 || response.status === 200,
          ),
          approvedTimesheetsIncluded:
            alphaSettlement.approvedTimesheetIds.includes(alphaTimesheet.id) &&
            betaSettlement.approvedTimesheetIds.includes(betaTimesheet.id),
          overtimeCalculationsCorrect:
            alphaSettlement.regularHours === 12.5 &&
            alphaSettlement.overtimeHours === 3 &&
            alphaSettlement.grossAmount === 850 &&
            betaSettlement.regularHours === 7 &&
            betaSettlement.overtimeHours === 1 &&
            betaSettlement.grossAmount === 340,
          payrollCycleProcessWorks:
            processCycle.status === 201 || processCycle.status === 200,
          settlementTotalsCorrect:
            alphaSettlement.netAmount === 850 &&
            betaSettlement.netAmount === 340 &&
            processCycle.body.data.totalWorkers === 2,
          duplicateProcessingBlocked: duplicateProcessBlocked.status === 400,
          approveSettlementWorks:
            approveAlpha.status === 201 || approveAlpha.status === 200,
          rejectSettlementWorks:
            rejectBeta.status === 201 || rejectBeta.status === 200,
          rejectedSettlementReprocessable:
            reprocessAfterReject.status === 201 || reprocessAfterReject.status === 200,
          workerPayrollVisibilityWorks:
            workerPayrollOverview.status === 200 &&
            workerPayrollSettlements.status === 200 &&
            workerPayrollSettlements.body.data.length >= 1,
          terminatedAssignmentExcluded: !gammaSettlement,
          suspendedContractExcluded: !deltaSettlement,
          lockedCyclesImmutable:
            lockedCycle.body.data.status === 'LOCKED' && lockedCycleImmutable.status === 400,
          readyForPaymentAfterLock:
            approveBeta.status === 201 &&
            lockedCycle.body.data.settlements.every(
              (item) => item.status === 'READY_FOR_PAYMENT',
            ),
          authStable: authStable.status === 200,
          onboardingStable: onboardingStable.status === 200,
          subscriptionsStable: subscriptionsStable.status === 200,
          billingStable: billingStable.status === 200,
          workforceStable: workforceStable.status === 200,
          finalCycleStatus: lockedCycle.body.data.status,
          finalSettlementCount: lockedCycle.body.data.settlementCount,
          regeneratedSettlementId: regeneratedBetaSettlement?.id ?? null,
          alphaAttendanceSummaryHours:
            workerPayrollSettlements.body.data[0]?.attendanceSummary?.totalTrackedHours ?? null,
          pipelineId: pipeline.id,
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
