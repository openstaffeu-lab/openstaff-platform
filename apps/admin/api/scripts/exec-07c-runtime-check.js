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
  ProjectEngagementModel,
  ProjectStatus,
} = require('@prisma/client');
const { AppModule } = require('../dist/src/app.module');

async function main() {
  const prisma = new PrismaClient();
  const suffix = `exec07c-${Date.now()}`;
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
      displayName: 'Exec07C Admin',
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
    });
    await register(server, {
      email: recruiterEmail,
      password,
      displayName: 'Exec07C Recruiter',
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
    });
    await register(server, {
      email: candidateEmail,
      password,
      displayName: 'Exec07C Candidate',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });

    const [adminUser, recruiterUser, candidateUser] = await Promise.all([
      prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: Role.ADMIN,
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
      prisma.user.update({
        where: { email: candidateEmail },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    const adminLogin = await login(server, adminEmail);
    const recruiterLogin = await login(server, recruiterEmail);
    const candidateLogin = await login(server, candidateEmail);
    const adminToken = adminLogin.body.accessToken;
    const recruiterToken = recruiterLogin.body.accessToken;
    const candidateToken = candidateLogin.body.accessToken;

    setBypass(recruiterUid, recruiterEmail);
    const createJob = await request(server).post('/jobs').send({
      title: `Exec07C Job ${suffix}`,
      description: 'Operational execution validation job',
      category: 'CONSTRUCTION',
      countryCode: 'RO',
      currency: 'RON',
    });
    const jobId = createJob.body.id;

    setBypass(candidateUid, candidateEmail);
    const applyResponse = await request(server)
      .post(`/jobs/${jobId}/apply`)
      .send({ message: 'Ready for operational validation.' });
    const applicationId = applyResponse.body.id;

    await request(server)
      .post(`/hiring/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Hired for timesheet and attendance execution.' });

    const applicationAfterHire = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { actor: true, job: true },
    });

    const project = await prisma.project.create({
      data: {
        slug: `${suffix}-project`,
        name: `Exec07C Project ${suffix}`,
        engagementModel: ProjectEngagementModel.B2B,
        status: ProjectStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    const contract = await prisma.contract.create({
      data: {
        jobId,
        employerId: applicationAfterHire.job.actorId,
        contractorId: applicationAfterHire.actorId,
        status: ContractStatus.DRAFT,
        lifecycleStatus: ContractLifecycleStatus.DRAFT,
        value: 15000,
        currency: 'RON',
      },
    });

    const assignmentCreate = await request(server)
      .post('/workforce/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        applicationId,
        contractId: contract.id,
        projectId: project.id,
      });

    await prisma.identityProfile.update({
      where: { userId: candidateUser.id },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    await request(server)
      .post(`/workforce/contracts/${contract.id}/send`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    const activateResponse = await request(server)
      .post(`/workforce/contracts/${contract.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Activate workforce for operational execution.' });

    const assignmentId = assignmentCreate.body.data.id;

    const createTimesheet = await request(server)
      .post('/timesheets')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        periodStart: '2026-05-05T00:00:00.000Z',
        periodEnd: '2026-05-11T23:59:59.999Z',
      });
    const timesheetId = createTimesheet.body.data.id;

    await request(server)
      .post(`/timesheets/${timesheetId}/entries`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workDate: '2026-05-05T00:00:00.000Z',
        hoursWorked: 8,
        overtimeHours: 2,
        notes: 'Site prep and coordination.',
      });
    const secondEntry = await request(server)
      .post(`/timesheets/${timesheetId}/entries`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workDate: '2026-05-06T00:00:00.000Z',
        hoursWorked: 7.5,
        overtimeHours: 1,
        notes: 'Equipment checks.',
      });

    const submittedTimesheet = await request(server)
      .post(`/timesheets/${timesheetId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ note: 'Weekly log complete.' });

    const approvedTimesheet = await request(server)
      .post(`/admin/timesheets/${timesheetId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Hours approved.' });

    const approvedImmutable = await request(server)
      .post(`/timesheets/${timesheetId}/entries`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workDate: '2026-05-07T00:00:00.000Z',
        hoursWorked: 4,
        overtimeHours: 0,
        notes: 'Should fail after approval.',
      });

    const secondTimesheet = await request(server)
      .post('/timesheets')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        periodStart: '2026-05-12T00:00:00.000Z',
        periodEnd: '2026-05-18T23:59:59.999Z',
      });
    const rejectedTimesheetId = secondTimesheet.body.data.id;

    await request(server)
      .post(`/timesheets/${rejectedTimesheetId}/entries`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workDate: '2026-05-12T00:00:00.000Z',
        hoursWorked: 6,
        overtimeHours: 0,
        notes: 'Short day due to weather.',
      });
    await request(server)
      .post(`/timesheets/${rejectedTimesheetId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ note: 'Second weekly submission.' });
    const rejectedTimesheet = await request(server)
      .post(`/admin/timesheets/${rejectedTimesheetId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Need clearer day-level detail.' });
    const editableAfterReject = await request(server)
      .post(`/timesheets/${rejectedTimesheetId}/entries`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workDate: '2026-05-13T00:00:00.000Z',
        hoursWorked: 5,
        overtimeHours: 0.5,
        notes: 'Added requested clarification.',
      });

    const checkIn = await request(server)
      .post('/attendance/check-in')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        source: 'MOBILE',
        locationMetadata: { site: 'Bucharest', gate: 'A1' },
      });
    const duplicateCheckIn = await request(server)
      .post('/attendance/check-in')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        source: 'MOBILE',
      });
    const checkOut = await request(server)
      .post('/attendance/check-out')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        locationMetadata: { site: 'Bucharest', gate: 'A1', exit: true },
      });

    const suspendedContract = await request(server)
      .post(`/workforce/contracts/${contract.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Temporary hold for safety audit.' });
    const blockedOnSuspend = await request(server)
      .post('/attendance/check-in')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        source: 'MANUAL',
      });

    const terminatedContract = await request(server)
      .post(`/workforce/contracts/${contract.id}/terminate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Project execution completed.' });
    const blockedAfterTerminate = await request(server)
      .post('/attendance/check-in')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        workforceAssignmentId: assignmentId,
        source: 'MANUAL',
      });

    const adminTimesheets = await request(server)
      .get('/admin/timesheets')
      .set('Authorization', `Bearer ${adminToken}`);
    const adminTimesheetDetail = await request(server)
      .get(`/admin/timesheets/${timesheetId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const adminAttendance = await request(server)
      .get('/admin/attendance')
      .set('Authorization', `Bearer ${adminToken}`);
    const myTimesheets = await request(server)
      .get('/timesheets/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const myAttendance = await request(server)
      .get('/attendance/me')
      .set('Authorization', `Bearer ${candidateToken}`);
    const nonAdminBlocked = await request(server)
      .get('/admin/timesheets')
      .set('Authorization', `Bearer ${candidateToken}`);
    const noTokenBlocked = await request(server).get('/admin/timesheets');

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

    const finalApprovedTimesheet = await prisma.timesheet.findUniqueOrThrow({
      where: { id: timesheetId },
      include: { entries: true },
    });
    const finalRejectedTimesheet = await prisma.timesheet.findUniqueOrThrow({
      where: { id: rejectedTimesheetId },
      include: { entries: true },
    });
    const finalAssignment = await prisma.workforceAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
    });

    console.log(
      JSON.stringify(
        {
          activeWorkforceCreatesTimesheet:
            createTimesheet.status === 201 || createTimesheet.status === 200,
          addEntries:
            secondEntry.status === 201 || secondEntry.status === 200,
          totalsAutoCalculated:
            finalApprovedTimesheet.totalHours === 15.5 &&
            finalApprovedTimesheet.overtimeHours === 3,
          submitTimesheet:
            submittedTimesheet.status === 201 || submittedTimesheet.status === 200,
          approvedTimesheetImmutable: approvedImmutable.status === 400,
          rejectedTimesheetEditable:
            rejectedTimesheet.status === 201 &&
            editableAfterReject.status === 201 &&
            finalRejectedTimesheet.status === 'DRAFT',
          checkInWorks: checkIn.status === 201 || checkIn.status === 200,
          duplicateCheckInBlocked: duplicateCheckIn.status === 400,
          checkOutWorks:
            checkOut.status === 201 || checkOut.status === 200,
          suspendedContractBlocksAttendance: blockedOnSuspend.status === 400,
          terminatedWorkforceBlocked: blockedAfterTerminate.status === 400,
          adminApproveRejectWorks:
            approvedTimesheet.status === 201 &&
            rejectedTimesheet.status === 201,
          adminTimesheetsVisible:
            adminTimesheets.status === 200 && adminTimesheets.body.data.length >= 2,
          adminAttendanceVisible:
            adminAttendance.status === 200 && adminAttendance.body.data.length >= 1,
          workerViewsVisible:
            myTimesheets.status === 200 && myAttendance.status === 200,
          nonAdminBlocked: nonAdminBlocked.status === 403 && noTokenBlocked.status === 401,
          authRemainsStable: authStable.status === 200,
          onboardingRemainsStable: onboardingStable.status === 200,
          subscriptionsRemainStable: subscriptionsStable.status === 200,
          billingRemainsStable: billingStable.status === 200,
          assignmentActiveAfterContractActivation:
            activateResponse.body.data.assignments[0]?.status === 'ACTIVE',
          finalAssignmentStatus: finalAssignment.status,
          finalContractLifecycleStatus: terminatedContract.body.data.contract.lifecycleStatus,
          attendanceDurationCaptured:
            typeof checkOut.body.data.durationHours === 'number' &&
            checkOut.body.data.durationHours >= 0,
          adminTimesheetDetailEntries:
            adminTimesheetDetail.status === 200 &&
            adminTimesheetDetail.body.data.entries.length === 2,
          rejectedReasonPersisted:
            finalRejectedTimesheet.rejectionReason === null &&
            editableAfterReject.body.data.entries.length === 2,
          suspendedLifecycleStatus:
            suspendedContract.body.data.contract.lifecycleStatus === 'SUSPENDED',
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
