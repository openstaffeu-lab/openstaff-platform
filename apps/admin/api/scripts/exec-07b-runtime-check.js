require('reflect-metadata');
require('dotenv').config({ path: '.env' });

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const request = require('supertest');
const {
  PrismaClient,
  Role,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  VerificationStatus,
  ContractStatus,
  ContractLifecycleStatus,
} = require('@prisma/client');
const { AppModule } = require('../dist/src/app.module');

async function main() {
  const prisma = new PrismaClient();
  const suffix = `exec07b-${Date.now()}`;
  const adminEmail = `${suffix}.admin@example.com`;
  const recruiterEmail = `${suffix}.recruiter@example.com`;
  const candidateEmail = `${suffix}.candidate@example.com`;
  const password = 'Password123!';
  const recruiterUid = `${suffix}-recruiter-uid`;
  const candidateUid = `${suffix}-candidate-uid`;
  let app;

  const setBypass = (uid, email) => {
    process.env.NODE_ENV = 'development';
    process.env.SKIP_FIREBASE_AUTH = 'true';
    process.env.DEV_FIREBASE_UID = uid;
    process.env.DEV_FIREBASE_EMAIL = email;
  };

  const register = (server, payload) => request(server).post('/auth/register').send(payload);
  const login = (server, email) =>
    request(server).post('/auth/login').send({ email, password });

  try {
    app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const server = app.getHttpServer();

    await register(server, {
      email: adminEmail,
      password,
      displayName: 'Exec07B Admin',
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
    });
    await register(server, {
      email: recruiterEmail,
      password,
      displayName: 'Exec07B Recruiter',
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
    });
    await register(server, {
      email: candidateEmail,
      password,
      displayName: 'Exec07B Candidate',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });

    const [, candidateUser] = await Promise.all([
      prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: Role.ADMIN,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: candidateEmail },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
      prisma.user.update({
        where: { email: recruiterEmail },
        data: {
          role: Role.EMPLOYER,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    const adminLogin = await login(server, adminEmail);
    const candidateLogin = await login(server, candidateEmail);
    const adminToken = adminLogin.body.accessToken;
    const candidateToken = candidateLogin.body.accessToken;

    setBypass(recruiterUid, recruiterEmail);
    const createJob = await request(server).post('/jobs').send({
      title: `Exec07B Job ${suffix}`,
      description: 'Lifecycle validation job',
      category: 'CONSTRUCTION',
      countryCode: 'RO',
      currency: 'RON',
    });
    const jobId = createJob.body.id;

    setBypass(candidateUid, candidateEmail);
    const applyResponse = await request(server)
      .post(`/jobs/${jobId}/apply`)
      .send({ message: 'Ready to start.' });
    const applicationId = applyResponse.body.id;

    const approveResponse = await request(server)
      .post(`/hiring/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Hiring approved for workforce lifecycle validation.' });

    const applicationAfterHire = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { actor: true, job: true },
    });

    const contract = await prisma.contract.create({
      data: {
        jobId,
        employerId: applicationAfterHire.job.actorId,
        contractorId: applicationAfterHire.actorId,
        status: ContractStatus.DRAFT,
        lifecycleStatus: ContractLifecycleStatus.DRAFT,
        value: 12500,
        currency: 'RON',
      },
    });

    const assignmentCreate = await request(server)
      .post('/workforce/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ applicationId, contractId: contract.id });

    const activateBlocked = await request(server)
      .post(`/workforce/contracts/${contract.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Should fail before verification.' });

    await prisma.identityProfile.update({
      where: { userId: candidateUser.id },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    const sendResponse = await request(server)
      .post(`/workforce/contracts/${contract.id}/send`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    const activateResponse = await request(server)
      .post(`/workforce/contracts/${contract.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Activate workforce.' });
    const suspendResponse = await request(server)
      .post(`/workforce/contracts/${contract.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Temporary suspension.' });
    const terminateResponse = await request(server)
      .post(`/workforce/contracts/${contract.id}/terminate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Project scope closed.' });
    const immutableAfterTerminate = await request(server)
      .post(`/workforce/contracts/${contract.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Should fail after terminate.' });

    const timelineResponse = await request(server)
      .get(`/workforce/contracts/${contract.id}/timeline`)
      .set('Authorization', `Bearer ${adminToken}`);
    const listAssignmentsResponse = await request(server)
      .get('/workforce/assignments')
      .set('Authorization', `Bearer ${adminToken}`);
    const assignmentDetailResponse = await request(server)
      .get(`/workforce/assignments/${assignmentCreate.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const workforceMeResponse = await request(server)
      .get('/workforce/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const nonAdminBlocked = await request(server)
      .get('/workforce/assignments')
      .set('Authorization', `Bearer ${candidateToken}`);
    const noTokenBlocked = await request(server).get('/workforce/assignments');
    const authStable = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const onboardingStable = await request(server)
      .get('/onboarding/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const subscriptionsStable = await request(server)
      .get('/subscriptions/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const billingStable = await request(server)
      .get('/billing/profile/me')
      .set('Authorization', `Bearer ${candidateToken}`);

    const assignmentAfterTerminate = await prisma.workforceAssignment.findUniqueOrThrow({
      where: { id: assignmentCreate.body.data.id },
    });
    const contractAfterTerminate = await prisma.contract.findUniqueOrThrow({
      where: { id: contract.id },
      include: { lifecycleEvents: true },
    });

    console.log(
      JSON.stringify(
        {
          createHiredApplication:
            approveResponse.status === 201 || approveResponse.status === 200,
          createContract: Boolean(contract.id),
          createWorkforceAssignment:
            assignmentCreate.status === 201 || assignmentCreate.status === 200,
          assignmentAutoLinksCorrectly:
            assignmentCreate.body.data.user.id === candidateUser.id &&
            assignmentCreate.body.data.job.id === jobId &&
            assignmentCreate.body.data.contract.id === contract.id &&
            assignmentCreate.body.data.application.id === applicationId,
          verificationRequirementEnforced: activateBlocked.status === 400,
          activateContract:
            activateResponse.status === 201 || activateResponse.status === 200,
          assignmentBecomesActive:
            activateResponse.body.data.assignments[0]?.status === 'ACTIVE',
          suspendContract:
            suspendResponse.status === 201 || suspendResponse.status === 200,
          terminateContract:
            terminateResponse.status === 201 || terminateResponse.status === 200,
          assignmentAutoEnded:
            assignmentAfterTerminate.status === 'ENDED' &&
            Boolean(assignmentAfterTerminate.endedAt),
          immutableTerminatedContract: immutableAfterTerminate.status === 400,
          lifecycleTimelineCreated:
            Array.isArray(timelineResponse.body.data) &&
            timelineResponse.body.data.length >= 4,
          nonAdminBlocked: nonAdminBlocked.status === 403 && noTokenBlocked.status === 401,
          workforceMeVisible:
            workforceMeResponse.status === 200 && workforceMeResponse.body.data.length >= 1,
          authRemainsStable: authStable.status === 200,
          onboardingRemainsStable: onboardingStable.status === 200,
          subscriptionsRemainStable: subscriptionsStable.status === 200,
          billingRemainsStable: billingStable.status === 200,
          finalContractLifecycleStatus: contractAfterTerminate.lifecycleStatus,
          finalAssignmentStatus: assignmentAfterTerminate.status,
          timelineEvents: contractAfterTerminate.lifecycleEvents.map((item) => item.eventType),
          assignmentCount: listAssignmentsResponse.body.data.length,
          detailTimelineCount: assignmentDetailResponse.body.data.timeline.length,
          contractSendStatus: sendResponse.body.data.contract.lifecycleStatus,
        },
        null,
        2,
      ),
    );
  } finally {
    if (app) {
      await app.close();
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
