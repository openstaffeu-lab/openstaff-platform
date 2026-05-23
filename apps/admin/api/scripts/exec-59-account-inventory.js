#!/usr/bin/env node
'use strict';

require('dotenv/config');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {
    json: false,
    fullEmails: false,
    email: null,
  };

  for (const entry of argv) {
    if (entry === '--json') {
      args.json = true;
      continue;
    }
    if (entry === '--full-emails') {
      args.fullEmails = true;
      continue;
    }
    if (entry.startsWith('--email=')) {
      args.email = entry.slice('--email='.length).trim().toLowerCase() || null;
    }
  }

  return args;
}

function maskEmail(value) {
  if (!value || !value.includes('@')) {
    return 'invalid-email';
  }

  const [localPart, domain] = value.split('@');
  return `${(localPart || '*').slice(0, 1)}***@${domain}`;
}

function authSourceForUser(user) {
  const hasPassword = Boolean(user.password && String(user.password).trim());
  const hasFirebaseUid = Boolean(user.firebaseUid && String(user.firebaseUid).trim());

  if (hasFirebaseUid && hasPassword) {
    return 'firebase_plus_local_password';
  }
  if (hasFirebaseUid) {
    return 'external_auth_only';
  }
  if (hasPassword) {
    return 'local_password';
  }
  return 'unknown';
}

function resetEligibilityForUser(user) {
  if (!user) {
    return 'not_found';
  }

  if (!user.email || !String(user.email).trim()) {
    return 'missing_email';
  }

  if (user.accountStatus === 'SUSPENDED' || user.approvalStatus === 'REJECTED') {
    return 'disabled';
  }

  const hasPassword = Boolean(user.password && String(user.password).trim());
  const hasFirebaseUid = Boolean(user.firebaseUid && String(user.firebaseUid).trim());

  if (hasFirebaseUid && !hasPassword) {
    return 'external_auth_only';
  }

  if (hasPassword) {
    return 'eligible_password_reset';
  }

  return 'unknown_auth_state';
}

function accountTypeForUser(user) {
  if (user.identityCompanyProfiles && user.identityCompanyProfiles.length > 0) {
    return 'COMPANY';
  }

  if (user.profile?.profileType) {
    const companyLike = new Set([
      'CONTRACTOR',
      'SUBCONTRACTOR',
      'SUPPLIER',
      'GENERAL_CONTRACTOR',
      'TRAINING_COMPANY',
    ]);
    return companyLike.has(user.profile.profileType) ? 'COMPANY' : 'PROFESSIONAL';
  }

  return 'UNKNOWN';
}

function summarizeUser(user, options) {
  const emailValue = String(user.email ?? '').trim().toLowerCase();
  const eligibility = resetEligibilityForUser(user);
  const authSource = authSourceForUser(user);

  return {
    id: user.id,
    email: options.fullEmails ? emailValue : maskEmail(emailValue),
    emailMasked: maskEmail(emailValue),
    role: user.role,
    accountType: accountTypeForUser(user),
    authSource,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    approvalStatus: user.approvalStatus,
    accountStatus: user.accountStatus,
    onboarding: user.onboardingSession
      ? {
          status: user.onboardingSession.status,
          currentStep: user.onboardingSession.currentStep,
          completionPercent: user.onboardingSession.completionPercent,
          completedAt: user.onboardingSession.completedAt,
        }
      : null,
    profile: user.profile
      ? {
          id: user.profile.id,
          slug: user.profile.slug,
          profileType: user.profile.profileType,
          visibility: user.profile.visibility,
          moderationStatus: user.profile.moderationStatus,
          status: user.profile.status,
        }
      : null,
    identityProfile: user.identityProfile
      ? {
          id: user.identityProfile.id,
          publicSlug: user.identityProfile.publicSlug,
          displayName: user.identityProfile.displayName,
          completionPercent: user.identityProfile.profileCompletionPercent,
          verificationStatus: user.identityProfile.verificationStatus,
        }
      : null,
    companyProfiles: (user.identityCompanyProfiles || []).map((item) => ({
      id: item.id,
      companyName: item.companyName,
      verificationStatus: item.verificationStatus,
      onboardingCompletedAt: item.onboardingCompletedAt,
    })),
    passwordResetEligibility: eligibility,
    passwordResetEligible: eligibility === 'eligible_password_reset',
    isDisabled: eligibility === 'disabled',
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const where = options.email ? { email: options.email } : undefined;
  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }],
    select: {
      id: true,
      email: true,
      password: true,
      firebaseUid: true,
      role: true,
      approvalStatus: true,
      accountStatus: true,
      createdAt: true,
      lastLoginAt: true,
      profile: {
        select: {
          id: true,
          slug: true,
          profileType: true,
          visibility: true,
          moderationStatus: true,
          status: true,
        },
      },
      identityProfile: {
        select: {
          id: true,
          publicSlug: true,
          displayName: true,
          profileCompletionPercent: true,
          verificationStatus: true,
        },
      },
      identityCompanyProfiles: {
        select: {
          id: true,
          companyName: true,
          verificationStatus: true,
          onboardingCompletedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      onboardingSession: {
        select: {
          status: true,
          currentStep: true,
          completionPercent: true,
          completedAt: true,
        },
      },
    },
  });

  const summaryUsers = users.map((user) => summarizeUser(user, options));
  const counts = {
    totalAccounts: summaryUsers.length,
    resetEligibility: summaryUsers.reduce((acc, user) => {
      acc[user.passwordResetEligibility] = (acc[user.passwordResetEligibility] ?? 0) + 1;
      return acc;
    }, {}),
    authSources: summaryUsers.reduce((acc, user) => {
      acc[user.authSource] = (acc[user.authSource] ?? 0) + 1;
      return acc;
    }, {}),
    accountTypes: summaryUsers.reduce((acc, user) => {
      acc[user.accountType] = (acc[user.accountType] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const payload = {
    success: true,
    filters: {
      email: options.email ? (options.fullEmails ? options.email : maskEmail(options.email)) : null,
      fullEmails: options.fullEmails,
    },
    counts,
    users: summaryUsers,
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Account inventory summary: total=${counts.totalAccounts}`);
  console.log(`Reset eligibility: ${JSON.stringify(counts.resetEligibility)}`);
  console.log(`Auth sources: ${JSON.stringify(counts.authSources)}`);
  console.log(`Account types: ${JSON.stringify(counts.accountTypes)}`);
  for (const user of summaryUsers) {
    console.log(
      [
        user.id,
        user.email,
        user.role,
        user.accountType,
        user.authSource,
        user.passwordResetEligibility,
        user.accountStatus,
        user.approvalStatus,
      ].join(' | '),
    );
  }
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          success: false,
          error: error instanceof Error ? error.message : 'unknown_error',
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
