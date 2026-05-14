require('dotenv').config({ path: '.env' });

const { spawn } = require('node:child_process');
const {
  PrismaClient,
  AccountApprovalStatus,
  AccountLifecycleStatus,
  PublicModerationStatus,
  ReluTaskStatus,
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

async function multipart(baseUrl, path, options = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(options.fields ?? {})) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  if (options.file) {
    const blob = new Blob([options.file.content], { type: options.file.mimeType });
    formData.append(options.file.fieldName ?? 'file', blob, options.file.fileName);
  }

  const headers = options.token ? { Authorization: `Bearer ${options.token}` } : undefined;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
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
  const port = 8096;
  const baseUrl = `http://127.0.0.1:${port}`;
  const suffix = `exec08-${Date.now()}`;
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
    admin: { email: `${suffix}.admin@example.com`, displayName: 'Exec08 Admin' },
    owner: { email: `${suffix}.owner@example.com`, displayName: 'Exec08 Owner' },
    stranger: { email: `${suffix}.stranger@example.com`, displayName: 'Exec08 Stranger' },
  };

  try {
    await waitForServer(baseUrl);

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
    await register(baseUrl, {
      email: users.stranger.email,
      password,
      displayName: users.stranger.displayName,
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
    });

    const [adminUser, ownerUser, strangerUser] = await Promise.all([
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
        where: { email: users.stranger.email },
        data: {
          role: Role.PROFESSIONAL,
          approvalStatus: AccountApprovalStatus.APPROVED,
          accountStatus: AccountLifecycleStatus.LIVE,
        },
      }),
    ]);

    const [adminLogin, ownerLogin, strangerLogin] = await Promise.all([
      login(baseUrl, users.admin.email, password),
      login(baseUrl, users.owner.email, password),
      login(baseUrl, users.stranger.email, password),
    ]);

    const adminToken = adminLogin.body.accessToken;
    const ownerToken = ownerLogin.body.accessToken;
    const strangerToken = strangerLogin.body.accessToken;

    const createPost = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        type: 'PROJECT',
        title: `Exec08 Public Feed ${suffix}`,
        summary: 'Moderated public feed validation post',
        description: 'Created during EXEC-08 runtime validation.',
        domain: 'Data Center',
        location: 'Romania - Bucharest',
        value: 'EUR 25,000',
        ownerName: users.owner.displayName,
        ownerType: 'Professional',
        visibility: 'PUBLIC',
        naceCodesJson: ['43.21'],
      },
    });

    const postId = createPost.body.data.id;

    const pendingPublicList = await http(baseUrl, '/public-posts');
    const pendingPublicDetail = await http(baseUrl, `/public-posts/${postId}`);

    const ownerView = await http(baseUrl, '/public-posts/me', {
      token: ownerToken,
    });

    const strangerCannotEdit = await http(baseUrl, `/public-posts/${postId}`, {
      method: 'PATCH',
      token: strangerToken,
      body: {
        title: 'Unauthorized edit attempt',
      },
    });

    const nonAdminCannotModerate = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: strangerToken,
      body: {
        moderationStatus: 'APPROVED',
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });

    const approvePost = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: 'APPROVED',
        status: 'LIVE',
        visibility: 'PUBLIC',
      },
    });

    const publicAfterApprove = await http(baseUrl, '/public-posts');
    const approvedPublicDetailBeforeAssets = await http(baseUrl, `/public-posts/${postId}`);

    const uploadMedia = await multipart(baseUrl, `/public-posts/${postId}/media`, {
      token: ownerToken,
      fields: {
        role: 'GALLERY',
        alt: 'Exec08 image asset',
      },
      file: {
        content: Buffer.from('fake-image-content'),
        mimeType: 'image/png',
        fileName: 'exec08-image.png',
      },
    });

    const uploadDocument = await multipart(baseUrl, `/public-posts/${postId}/documents`, {
      token: ownerToken,
      fields: {
        title: 'Exec08 document',
        description: 'Moderation document validation',
      },
      file: {
        content: Buffer.from('%PDF-1.4 fake pdf content'),
        mimeType: 'application/pdf',
        fileName: 'exec08-document.pdf',
      },
    });

    const uploadExternalLink = await http(baseUrl, `/public-posts/${postId}/external-links`, {
      method: 'POST',
      token: ownerToken,
      body: {
        url: 'https://example.com/exec08-public-reference',
      },
    });

    const mediaId = uploadMedia.body.data.id;
    const documentId = uploadDocument.body.data.id;
    const externalLinkId = uploadExternalLink.body.data.id;

    const publicDetailBeforeAssetApproval = await http(baseUrl, `/public-posts/${postId}`);

    const approveMedia = await http(baseUrl, `/admin/public-post-media/${mediaId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'APPROVED',
      },
    });

    const approveDocument = await http(baseUrl, `/admin/public-post-documents/${documentId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'APPROVED',
      },
    });

    const approveExternalLink = await http(baseUrl, `/admin/external-links/${externalLinkId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        securityStatus: 'APPROVED',
      },
    });

    const publicDetailAfterAssetApproval = await http(baseUrl, `/public-posts/${postId}`);

    const rejectPost = await http(baseUrl, `/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: 'REJECTED',
        status: 'REJECTED',
        visibility: 'PUBLIC',
      },
    });

    const publicListAfterReject = await http(baseUrl, '/public-posts');
    const publicDetailAfterReject = await http(baseUrl, `/public-posts/${postId}`);

    const moderationTasks = await prisma.reluTask.findMany({
      where: {
        requestedByUserId: ownerUser.id,
        status: ReluTaskStatus.PENDING,
        contextEntityType: {
          in: [
            'PUBLIC_POST',
            'PUBLIC_POST_MEDIA',
            'PUBLIC_POST_DOCUMENT',
            'PUBLIC_POST_EXTERNAL_LINK',
          ],
        },
      },
    });

    const externalLinkRecord = await prisma.externalLinkSubmission.findUnique({
      where: { id: externalLinkId },
    });

    const documentRecord = await prisma.publicPostDocument.findUnique({
      where: { id: documentId },
    });

    const authStable = await http(baseUrl, '/auth/me', { token: ownerToken });
    const subscriptionsStable = await http(baseUrl, '/subscriptions/me', { token: ownerToken });
    const billingStable = await http(baseUrl, '/billing/profile/me', { token: ownerToken });
    const onboardingStable = await http(baseUrl, '/onboarding/me', { token: ownerToken });

    const pendingListIds = Array.isArray(pendingPublicList.body?.data)
      ? pendingPublicList.body.data.map((item) => item.id)
      : [];
    const approvedListIds = Array.isArray(publicAfterApprove.body?.data)
      ? publicAfterApprove.body.data.map((item) => item.id)
      : [];
    const rejectedListIds = Array.isArray(publicListAfterReject.body?.data)
      ? publicListAfterReject.body.data.map((item) => item.id)
      : [];

    console.log(
      JSON.stringify(
        {
          registerNormalUser: createPost.status === 201 || createPost.status === 200,
          createPublicPostPendingModeration:
            createPost.body.data.status === 'PENDING_MODERATION' &&
            createPost.body.data.moderationStatus === 'PENDING',
          pendingPostHiddenFromPublicFeed:
            pendingPublicList.status === 200 && !pendingListIds.includes(postId),
          pendingPostHiddenFromPublicDetail: pendingPublicDetail.status === 403,
          ownerCanSeeOwnPendingPost:
            ownerView.status === 200 &&
            ownerView.body.data.some((item) => item.id === postId),
          adminApproveMakesPostLive:
            approvePost.status === 200 &&
            approvePost.body.data.status === 'LIVE' &&
            approvePost.body.data.moderationStatus === 'APPROVED',
          approvedPostVisiblePublicly:
            publicAfterApprove.status === 200 &&
            approvedListIds.includes(postId) &&
            approvedPublicDetailBeforeAssets.status === 200,
          uploadMediaDocumentExternalLink:
            uploadMedia.status === 201 &&
            uploadDocument.status === 201 &&
            uploadExternalLink.status === 201,
          pendingAssetsHiddenPublicly:
            publicDetailBeforeAssetApproval.status === 200 &&
            publicDetailBeforeAssetApproval.body.data.media.length === 0 &&
            publicDetailBeforeAssetApproval.body.data.documents.length === 0 &&
            publicDetailBeforeAssetApproval.body.data.externalLinks.length === 0,
          approveAssetsVisiblePublicly:
            approveMedia.status === 200 &&
            approveDocument.status === 200 &&
            approveExternalLink.status === 200 &&
            publicDetailAfterAssetApproval.status === 200 &&
            publicDetailAfterAssetApproval.body.data.media.length === 1 &&
            publicDetailAfterAssetApproval.body.data.documents.length === 1 &&
            publicDetailAfterAssetApproval.body.data.externalLinks.length === 1,
          rejectPostHiddenPublicly:
            rejectPost.status === 200 &&
            !rejectedListIds.includes(postId) &&
            publicDetailAfterReject.status === 403,
          nonOwnerCannotEdit: strangerCannotEdit.status === 403,
          nonAdminCannotModerate: nonAdminCannotModerate.status === 403,
          reluModerationPlaceholderCreated:
            moderationTasks.length >= 4 &&
            moderationTasks.some((task) => task.contextEntityType === 'PUBLIC_POST') &&
            moderationTasks.some((task) => task.contextEntityType === 'PUBLIC_POST_MEDIA') &&
            moderationTasks.some((task) => task.contextEntityType === 'PUBLIC_POST_DOCUMENT') &&
            moderationTasks.some((task) => task.contextEntityType === 'PUBLIC_POST_EXTERNAL_LINK'),
          assetRecordsPersistedWithApproval:
            documentRecord?.status === PublicModerationStatus.APPROVED &&
            externalLinkRecord?.securityStatus === 'APPROVED',
          authStable: authStable.status === 200,
          subscriptionsStable: subscriptionsStable.status === 200,
          billingStable: billingStable.status === 200,
          onboardingStable: onboardingStable.status === 200,
          finalReluTaskCount: moderationTasks.length,
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
