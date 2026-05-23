require('dotenv').config({ path: '.env' });

const fs = require('node:fs');
const path = require('node:path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email ?? '';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

async function http(baseUrl, route, options = {}) {
  const headers = {
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${baseUrl}${route}`, {
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

async function multipart(baseUrl, route, { token, filePath, fieldName = 'file', fields = {} }) {
  const form = new FormData();
  const buffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const mimeType = mimeTypeFromFile(filePath);
  form.append(fieldName, new Blob([buffer], { type: mimeType }), filename);

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
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

function unwrapData(response) {
  return response?.body?.data ?? response?.body ?? null;
}

function mimeTypeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    case '.mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
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

async function forgotPassword(baseUrl, email) {
  return http(baseUrl, '/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  });
}

function summarizeReluResults(result) {
  const classifications = Array.isArray(result?.classifications) ? result.classifications : [];
  const recommendations = Array.isArray(result?.recommendations) ? result.recommendations : [];
  return {
    classificationsCount: classifications.length,
    recommendationsCount: recommendations.length,
    firstClassification: classifications[0]
      ? {
          status: classifications[0].status,
          confidence: classifications[0].confidence,
          explanation: classifications[0].explanation,
        }
      : null,
    firstRecommendation: recommendations[0]
      ? {
          status: recommendations[0].status,
          confidence: recommendations[0].confidence,
          explanation: recommendations[0].explanation,
        }
      : null,
  };
}

async function main() {
  const baseUrl = process.env.EXEC60_BASE_URL || 'https://api.openstaff.eu';
  const adminEmail = process.env.EXEC60_ADMIN_EMAIL;
  const adminPassword = process.env.EXEC60_ADMIN_PASSWORD;
  const assetsDir = process.env.EXEC60_ASSETS_DIR;
  const runId = `exec60-${Date.now()}`;
  const password = process.env.EXEC60_ACCOUNT_PASSWORD || 'OpenStaff!123';

  assert(adminEmail && adminPassword, 'EXEC60_ADMIN_EMAIL and EXEC60_ADMIN_PASSWORD are required.');
  assert(assetsDir && fs.existsSync(assetsDir), 'EXEC60_ASSETS_DIR must point to an existing directory.');

  const tinyPicture = path.join(assetsDir, 'tiny-picture.png');
  const pdfPath = path.join(assetsDir, 'proof.pdf');
  const docxPath = path.join(assetsDir, 'single-paragraph.docx');
  const txtPath = path.join(assetsDir, 'profile.txt');
  const mp4Path = path.join(assetsDir, 'sample.mp4');

  const status = await http(baseUrl, '/status');
  assert(status.status === 200, '/status must return 200');
  const statusBody = unwrapData(status);

  const adminLogin = await login(baseUrl, adminEmail, adminPassword);
  assert(adminLogin.status === 200, 'Admin login must succeed.');
  const adminToken = unwrapData(adminLogin).accessToken;

  const defaults = await http(baseUrl, '/onboarding/defaults');
  assert(defaults.status === 200, '/onboarding/defaults must return 200.');

  const escoResponse = await http(baseUrl, '/taxonomy/esco?q=electric&limit=5');
  const naceResponse = await http(baseUrl, '/taxonomy/nace?q=construct&limit=5');
  const uniclassResponse = await http(baseUrl, '/taxonomy/uniclass?q=electrical&limit=5');
  const countriesResponse = await http(baseUrl, '/countries', { token: adminToken });
  const escoLegacyResponse = await http(baseUrl, '/esco', { token: adminToken });

  const escoResults = escoResponse.body?.results ?? [];
  const naceResults = naceResponse.body?.results ?? [];
  const uniclassResults = uniclassResponse.body?.results ?? [];
  const countriesResults = unwrapData(countriesResponse);
  const legacyEscoResults = unwrapData(escoLegacyResponse);
  const romaniaCountry = Array.isArray(countriesResults)
    ? countriesResults.find((country) => country.code === 'RO')
    : null;
  const actorRegionByKey = {
    professional: 'Bucuresti-Ilfov',
    companyProject: 'Cluj',
    contractor: 'Bucuresti-Ilfov',
  };
  const actorCityByKey = {
    professional: 'Bucharest',
    companyProject: 'Cluj-Napoca',
    contractor: 'Bucharest',
  };

  assert(escoResults.length > 0, 'ESCO search must return at least one result.');
  assert(naceResults.length > 0, 'NACE search must return at least one result.');
  assert(Array.isArray(countriesResults) && countriesResults.length > 0, 'Countries endpoint must return at least one country.');
  assert(Array.isArray(legacyEscoResults) && legacyEscoResults.length > 0, 'Legacy ESCO endpoint must return at least one entry.');

  const actors = {
    professional: {
      email: `${runId}-professional@openstaff.eu`,
      displayName: 'Exec 60 Professional',
      actorType: 'INDIVIDUAL',
      profileType: 'PROFESSIONAL',
      ownerName: 'Exec 60 Professional',
      postType: 'PROFESSIONAL',
      publicSlug: `${runId}-professional-profile`,
    },
    companyProject: {
      email: `${runId}-project-company@openstaff.eu`,
      displayName: 'Exec 60 Project Company',
      actorType: 'COMPANY',
      profileType: 'GENERAL_CONTRACTOR',
      ownerName: 'Exec 60 Project Company',
      postType: 'PROJECT',
      publicSlug: `${runId}-project-company-profile`,
    },
    contractor: {
      email: `${runId}-subcontractor@openstaff.eu`,
      displayName: 'Exec 60 Subcontractor',
      actorType: 'COMPANY',
      profileType: 'SUBCONTRACTOR',
      ownerName: 'Exec 60 Subcontractor',
      postType: 'SUBCONTRACTOR_POOL',
      publicSlug: `${runId}-subcontractor-profile`,
    },
  };

  const results = {
    runId,
    latestStatus: {
      emailDeliveryMode: statusBody?.integrations?.emailDelivery?.mode ?? null,
      warnings: statusBody?.readiness?.warnings ?? [],
      errors: statusBody?.readiness?.errors ?? [],
    },
    defaults: unwrapData(defaults),
    taxonomy: {
      esco: escoResults.slice(0, 3),
      nace: naceResults.slice(0, 3),
      uniclass: uniclassResults.slice(0, 3),
      liveDatasetHealth: {
        countriesStatus: countriesResponse.status,
        countriesCount: Array.isArray(countriesResults) ? countriesResults.length : null,
        legacyEscoStatus: escoLegacyResponse.status,
        legacyEscoCount: Array.isArray(legacyEscoResults) ? legacyEscoResults.length : null,
      },
    },
    accounts: {},
    publicVisibility: {},
    media: {},
    relu: {},
    passwordResetSmoke: null,
  };

  for (const [key, actor] of Object.entries(actors)) {
    const registration = await register(baseUrl, {
      email: actor.email,
      password,
      displayName: actor.displayName,
      actorType: actor.actorType,
      profileType: actor.profileType,
      companyName: actor.actorType === 'COMPANY' ? actor.displayName : undefined,
    });
    assert(registration.status === 201, `${key} registration must succeed.`);

    const loginResponse = await login(baseUrl, actor.email, password);
    assert(loginResponse.status === 200, `${key} login must succeed.`);
    const auth = unwrapData(loginResponse);
    const token = auth.accessToken;
    const userId = auth.user.id;
    const initialProfileId = auth.user.profile?.id ?? null;

    const onboardingMeBefore = await http(baseUrl, '/onboarding/me', { token });
    assert(onboardingMeBefore.status === 200, `${key} onboarding/me must succeed before updates.`);

    const identityPayload = {
      publicSlug: actor.publicSlug,
      firstName: key === 'companyProject' || key === 'contractor' ? undefined : 'Andrei',
      lastName: key === 'companyProject' || key === 'contractor' ? undefined : 'Ionescu',
      displayName: actor.displayName,
      phone: '+40 721 000 123',
      language: 'ro',
      timezone: 'Europe/Bucharest',
      country: 'Romania',
      city: key === 'companyProject' ? 'Cluj-Napoca' : 'Bucharest',
      website: `https://${actor.publicSlug}.openstaff.eu`,
      linkedinUrl: 'https://www.linkedin.com/company/openstaff-eu/',
      portfolioUrl: key === 'professional' ? 'https://portfolio.openstaff.eu/electrician' : 'https://openstaff.eu/services',
      bio:
        key === 'professional'
          ? 'Electrician de constructii cu experienta in cablare, punere in functiune si coordonare pe santier.'
          : key === 'companyProject'
            ? 'Companie care publica proiecte reale pentru livrare de lucrari electrice, fotovoltaice si fit-out.'
            : 'Subcontractor disponibil pentru proiecte de infrastructura electrica, fotovoltaica si lucrari specializate.',
    };

    const identityUpdate = await http(baseUrl, '/onboarding/identity-profile', {
      method: 'PUT',
      token,
      body: identityPayload,
    });
    assert(identityUpdate.status === 200, `${key} identity profile update must succeed.`);

    let companyProfile = null;
    if (actor.actorType === 'COMPANY') {
      companyProfile = await http(baseUrl, '/onboarding/company-profile', {
        method: 'PUT',
        token,
        body: {
          companyName: actor.displayName,
          legalName: `${actor.displayName} SRL`,
          vatId: key === 'companyProject' ? 'RO12345678' : 'RO87654321',
          registrationNumber: key === 'companyProject' ? 'J40/1234/2026' : 'J40/9876/2026',
          country: 'Romania',
          city: key === 'companyProject' ? 'Cluj-Napoca' : 'Bucharest',
          addressLine1: key === 'companyProject' ? 'Str. Constructorilor 10' : 'Bd. Timisoara 25',
          postalCode: key === 'companyProject' ? '400001' : '061327',
          website: `https://${actor.publicSlug}.openstaff.eu`,
        },
      });
      assert(companyProfile.status === 200, `${key} company profile update must succeed.`);
    }

    const onboardingStepUpdate = await http(baseUrl, '/onboarding/steps', {
      method: 'PATCH',
      token,
      body: {
        currentStep: 'completion',
        completedSteps: ['welcome', 'identity', ...(actor.actorType === 'COMPANY' ? ['company'] : [])],
      },
    });
    assert(onboardingStepUpdate.status === 200, `${key} onboarding step update must succeed.`);

    const profilePayload = {
      profileType: actor.profileType,
      slug: actor.publicSlug,
      displayName: actor.displayName,
      companyName: actor.actorType === 'COMPANY' ? actor.displayName : null,
      publicHeadline:
        key === 'professional'
          ? 'Electrician si coordonator pentru proiecte industriale'
          : key === 'companyProject'
            ? 'Companie care publica proiecte si coordoneaza livrari'
            : 'Subcontractor disponibil pentru proiecte si parteneriate',
      summary:
        key === 'professional'
          ? 'Profil profesional pentru lucrari electrice, fotovoltaice si punere in functiune.'
          : key === 'companyProject'
            ? 'Companie activa in proiecte electrice, fotovoltaice si fit-out comercial.'
            : 'Subcontractor orientat pe executie, suport de santier si echipe specializate.',
      description: identityPayload.bio,
      websiteUrl: `https://${actor.publicSlug}.openstaff.eu`,
      publicEmail: actor.email,
      publicPhone: '+40 721 000 123',
      privateEmail: actor.email,
      privatePhone: '+40 721 000 123',
      companyRegistrationNumber: actor.actorType === 'COMPANY' ? (key === 'companyProject' ? 'J40/1234/2026' : 'J40/9876/2026') : null,
      taxNumber: actor.actorType === 'COMPANY' ? (key === 'companyProject' ? 'RO12345678' : 'RO87654321') : null,
      visibility: 'PUBLIC',
      countryCode: 'RO',
      countryName: 'Romania',
      regionName: actorRegionByKey[key],
      cityName: actorCityByKey[key],
      supportedEngagementModels: actor.actorType === 'COMPANY' ? ['B2B'] : ['B2B', 'B2C'],
      languageCodes: ['ro', 'en'],
      escoCodes: escoResults.slice(0, 2).map((item) => item.code),
      naceCodes: naceResults.slice(0, 2).map((item) => item.code),
      uniclassCodes: uniclassResults.slice(0, 2).map((item) => item.code),
      certificationsText: 'ANRE, HSE, santier, coordonare, executie.',
      availabilityStatus: 'AVAILABLE',
      contractorProfile:
        actor.profileType === 'SUBCONTRACTOR' || actor.profileType === 'GENERAL_CONTRACTOR'
          ? {
              tradeFocus: key === 'companyProject' ? 'Project delivery and coordination' : 'Electrical subcontracting and photovoltaic execution',
              teamSize: key === 'companyProject' ? 18 : 9,
              serviceArea: key === 'companyProject' ? 'Romania and EU project delivery' : 'Romania subcontracting and mobile execution teams',
            }
          : undefined,
      professionalProfile:
        actor.profileType === 'PROFESSIONAL'
          ? {
              headline: 'Electrical execution and commissioning',
              yearsExperience: 9,
              portfolioFocus: 'Industrial electrical systems, cable routing, fit-out, photovoltaic works',
            }
          : undefined,
    };

    const profileUpdate = await http(baseUrl, '/profile', {
      method: 'PUT',
      token,
      body: profilePayload,
    });
    assert(
      profileUpdate.status === 200,
      `${key} profile update must succeed. Received ${profileUpdate.status}: ${JSON.stringify(profileUpdate.body)}`,
    );
    const currentProfile = unwrapData(profileUpdate);
    const profileId = currentProfile.id ?? initialProfileId;
    assert(profileId, `${key} profile id must exist after update.`);

    const uploads = [];
    uploads.push(
      await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
        token,
        filePath: tinyPicture,
        fields: {
          title: `${actor.displayName} visual`,
          description: 'Primary visual asset',
          assetKind: key === 'professional' ? 'PHOTO' : 'LOGO',
          type: 'IMAGE',
        },
      }),
    );
    uploads.push(
      await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
        token,
        filePath: docxPath,
        fields: {
          title: `${actor.displayName} profile document`,
          description: 'Profile document for RELU extraction',
          assetKind: 'CV',
          type: 'CV',
        },
      }),
    );
    uploads.push(
      await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
        token,
        filePath: pdfPath,
        fields: {
          title: `${actor.displayName} compliance proof`,
          description: 'PDF evidence',
          type: 'CERTIFICATION',
        },
      }),
    );
    if (actor.actorType === 'COMPANY') {
      uploads.push(
        await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
          token,
          filePath: tinyPicture,
          fields: {
            title: `${actor.displayName} banner`,
            description: 'Banner preview',
            assetKind: 'BANNER',
            type: 'IMAGE',
          },
        }),
      );
    }
    uploads.push(
      await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
        token,
        filePath: mp4Path,
        fields: {
          title: `${actor.displayName} video`,
          description: 'Portfolio video',
          assetKind: 'PORTFOLIO',
          type: 'VIDEO',
        },
      }),
    );

    uploads.forEach((upload, index) => {
      assert(
        upload.status === 200 || upload.status === 201,
        `${key} profile upload ${index + 1} must succeed.`,
      );
    });

    const uploadedDocs = uploads.map((upload) => unwrapData(upload));
    const cvDoc = uploadedDocs.find((item) => item?.assetKind === 'CV') || uploadedDocs[1];
    const portfolioVideo = uploadedDocs.find((item) => item?.mimeType === 'video/mp4') ?? null;

    const extractCv = await http(
      baseUrl,
      `/profiles/${profileId}/documents/${cvDoc.id}/extract`,
      { method: 'POST', token },
    );
    assert(
      extractCv.status === 200 || extractCv.status === 201,
      `${key} CV extract must succeed. Received ${extractCv.status}: ${JSON.stringify(extractCv.body)}`,
    );

    const extractedCvText = await http(
      baseUrl,
      `/profiles/${profileId}/documents/${cvDoc.id}/extracted-text`,
      { token },
    );
    assert(
      extractedCvText.status === 200,
      `${key} extracted CV text must be readable. Received ${extractedCvText.status}: ${JSON.stringify(extractedCvText.body)}`,
    );

    const reluAssistant = await http(baseUrl, '/relu/onboarding-assistant', {
      method: 'POST',
      token,
      body: { message: 'Ajuta-ma sa completez profilul pentru proiecte electrice si fotovoltaice.' },
    });
    assert(
      reluAssistant.status === 200 || reluAssistant.status === 201,
      `${key} RELU onboarding assistant must succeed. Received ${reluAssistant.status}: ${JSON.stringify(reluAssistant.body)}`,
    );

    const reluEnrich = await http(baseUrl, `/relu/profiles/${profileId}/enrich`, {
      method: 'POST',
      token,
    });
    assert(
      reluEnrich.status === 200,
      `${key} RELU profile enrich must succeed. Received ${reluEnrich.status}: ${JSON.stringify(reluEnrich.body)}`,
    );

    const reluClassify = await http(baseUrl, `/relu/profiles/${profileId}/classify`, {
      method: 'POST',
      token,
    });
    assert(
      reluClassify.status === 200,
      `${key} RELU profile classify must succeed. Received ${reluClassify.status}: ${JSON.stringify(reluClassify.body)}`,
    );

    const reluResults = await http(baseUrl, `/relu/profiles/${profileId}/results`, { token });
    assert(
      reluResults.status === 200,
      `${key} RELU profile results must succeed. Received ${reluResults.status}: ${JSON.stringify(reluResults.body)}`,
    );

    const profileAfterRelu = await http(baseUrl, '/profile', { token });
    assert(profileAfterRelu.status === 200, `${key} profile read after RELU must succeed.`);

    const relogin = await login(baseUrl, actor.email, password);
    assert(relogin.status === 200, `${key} relogin must succeed.`);
    const reloginToken = unwrapData(relogin).accessToken;
    const profileAfterRelogin = await http(baseUrl, '/profile', { token: reloginToken });
    assert(profileAfterRelogin.status === 200, `${key} profile must persist after relogin.`);

    const postCreate = await http(baseUrl, '/public-posts', {
      method: 'POST',
      token,
      body: {
        type: actor.postType,
        title:
          key === 'professional'
            ? 'Electrician available for industrial and photovoltaic delivery'
            : key === 'companyProject'
              ? 'Project: electrical and photovoltaic fit-out package'
              : 'Subcontractor pool for cable routing and site execution',
        slug: `${actor.publicSlug}-${actor.postType.toLowerCase().replace(/_/g, '-')}`,
        description:
          key === 'professional'
            ? 'Professional profile available for approved marketplace discovery.'
            : key === 'companyProject'
              ? 'Company offering a real delivery package with media and documents.'
              : 'Subcontractor company looking for projects and partnerships.',
        summary: 'EXEC-60 live marketplace proof item.',
        domain: key === 'companyProject' ? 'Construction' : 'Electrical services',
        location: key === 'companyProject' ? 'Cluj-Napoca, Romania' : 'Bucharest, Romania',
        value: key === 'companyProject' ? 'Budget on request' : 'Available for engagement',
        ownerName: actor.ownerName,
        ownerType: actor.profileType,
        visibility: 'PUBLIC',
        escoCodesJson: escoResults.slice(0, 2).map((item) => item.code),
        naceCodesJson: naceResults.slice(0, 2).map((item) => item.code),
        uniclassCodesJson: uniclassResults.slice(0, 2).map((item) => item.code),
        languageCodesJson: ['ro', 'en'],
        classificationJson: {
          categories: [key === 'companyProject' ? 'PROJECT_DELIVERY' : 'ELECTRICAL'],
          subcategories: [key === 'contractor' ? 'SUBCONTRACTING' : 'SITE_EXECUTION'],
        },
      },
    });
    assert(postCreate.status === 200 || postCreate.status === 201, `${key} public post create must succeed.`);
    const post = unwrapData(postCreate);

    const pendingPublicDetail = await http(baseUrl, `/public-posts/${post.id}`);
    assert(
      pendingPublicDetail.status === 403,
      `${key} pending public post must stay hidden before approval.`,
    );

    const ownerPendingView = await http(baseUrl, '/public-posts/me', { token });
    assert(ownerPendingView.status === 200, `${key} owner pending list must succeed.`);

    const postMedia = await multipart(baseUrl, `/public-posts/${post.id}/media`, {
      token,
      filePath: key === 'companyProject' ? mp4Path : tinyPicture,
      fields: {
        title: `${actor.displayName} marketplace media`,
        description: 'Marketplace proof media',
      },
    });
    assert(
      postMedia.status === 200 || postMedia.status === 201,
      `${key} post media upload must succeed.`,
    );
    const media = unwrapData(postMedia);

    const postDocument = await multipart(baseUrl, `/public-posts/${post.id}/documents`, {
      token,
      filePath: pdfPath,
      fields: {
        title: `${actor.displayName} marketplace document`,
        description: 'Marketplace proof document',
      },
    });
    assert(
      postDocument.status === 200 || postDocument.status === 201,
      `${key} post document upload must succeed.`,
    );
    const document = unwrapData(postDocument);

    const approveUser = await http(baseUrl, `/users/${userId}/approval`, {
      method: 'PATCH',
      token: adminToken,
      body: { approvalStatus: 'APPROVED' },
    });
    assert(approveUser.status === 200, `${key} user approval must succeed.`);

    const activateUser = await http(baseUrl, `/users/${userId}/account-status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'LIVE' },
    });
    assert(activateUser.status === 200, `${key} user account status update must succeed.`);

    const approveProfile = await http(baseUrl, `/users/${userId}/profile-moderation`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        moderationStatus: 'APPROVED',
        status: 'LIVE',
      },
    });
    assert(approveProfile.status === 200, `${key} profile moderation must succeed.`);

    const approveMedia = await http(baseUrl, `/admin/public-post-media/${media.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED' },
    });
    assert(approveMedia.status === 200, `${key} media approval must succeed.`);

    const documentStatus = key === 'contractor' ? 'REJECTED' : 'APPROVED';
    const moderateDocument = await http(baseUrl, `/admin/public-post-documents/${document.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: documentStatus },
    });
    assert(moderateDocument.status === 200, `${key} document moderation must succeed.`);

    const approvePost = await http(baseUrl, `/admin/public-posts/${post.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'LIVE',
        moderationStatus: 'APPROVED',
        visibility: 'PUBLIC',
      },
    });
    assert(approvePost.status === 200, `${key} post approval must succeed.`);

    const publicDetail = await http(baseUrl, `/public-posts/${post.id}`);
    assert(publicDetail.status === 200, `${key} approved public post must be visible.`);

    const publicMedia = await http(baseUrl, `/public-posts/media/${media.id}`);
    assert(publicMedia.status === 200, `${key} approved media must be public.`);

    const publicDocument = await http(baseUrl, `/public-posts/documents/${document.id}`);
    if (documentStatus === 'APPROVED') {
      assert(publicDocument.status === 200, `${key} approved document must be public.`);
    } else {
      assert(publicDocument.status === 403, `${key} rejected document must stay hidden.`);
    }

    const publicProfileApi = await http(baseUrl, `/profiles/public/${actor.publicSlug}`);
    assert(publicProfileApi.status === 200, `${key} public profile API must be visible.`);

    results.accounts[key] = {
      email: maskEmail(actor.email),
      userId,
      profileId,
      slug: actor.publicSlug,
      actorType: actor.actorType,
      profileType: actor.profileType,
      onboardingMeBefore: unwrapData(onboardingMeBefore),
      identityUpdate: unwrapData(identityUpdate),
      companyProfile: companyProfile ? unwrapData(companyProfile) : null,
      profile: unwrapData(profileAfterRelogin),
      reloginProfile: unwrapData(profileAfterRelogin),
      publicProfile: unwrapData(publicProfileApi),
      publicPost: unwrapData(publicDetail),
      persistedTaxonomy: {
        languageCodes: Array.isArray(currentProfile?.languages) ? currentProfile.languages.map((item) => item.code) : [],
        escoCodes: Array.isArray(currentProfile?.escoSkills) ? currentProfile.escoSkills.map((item) => item.code) : [],
        naceCodes: Array.isArray(currentProfile?.naceCodes) ? currentProfile.naceCodes.map((item) => item.code) : [],
        uniclassCodes: Array.isArray(currentProfile?.uniclassCodes) ? currentProfile.uniclassCodes.map((item) => item.code) : [],
        geography: currentProfile?.geography ?? null,
      },
      pendingPublicDetailStatus: pendingPublicDetail.status,
      ownerPendingViewStatus: ownerPendingView.status,
    };

    results.media[key] = {
      profileUploads: uploadedDocs.map((item) => ({
        id: item.id,
        title: item.title,
        assetKind: item.assetKind,
        mimeType: item.mimeType,
        extractionStatus: item.extractionStatus,
        storage: item.storage,
      })),
      extractedCvStatus: unwrapData(extractCv),
      extractedCvText: unwrapData(extractedCvText),
      portfolioVideo: portfolioVideo
        ? {
            id: portfolioVideo.id,
            mimeType: portfolioVideo.mimeType,
            assetKind: portfolioVideo.assetKind,
          }
        : null,
      postMedia: {
        id: media.id,
        type: media.type,
        status: unwrapData(approveMedia)?.status ?? null,
        publicStatus: publicMedia.status,
      },
      postDocument: {
        id: document.id,
        moderationStatus: documentStatus,
        publicStatus: publicDocument.status,
      },
    };

    results.relu[key] = {
      onboardingAssistant: {
        status: reluAssistant.status,
        body: reluAssistant.body,
      },
      enrich: unwrapData(reluEnrich),
      classify: unwrapData(reluClassify),
      results: summarizeReluResults(unwrapData(reluResults)),
      profileAfterRelu: unwrapData(profileAfterRelu),
    };

    results.publicVisibility[key] = {
      publicProfileApiStatus: publicProfileApi.status,
      publicProfileRoute: `https://openstaff.eu/profiles/${actor.publicSlug}`,
      publicPostId: post.id,
      publicDetailStatus: publicDetail.status,
      publicMediaStatus: publicMedia.status,
      publicDocumentStatus: publicDocument.status,
    };
  }

  const publicFeed = await http(baseUrl, '/public-posts');
  assert(publicFeed.status === 200, 'Public feed must return 200.');
  const feedItems = unwrapData(publicFeed);

  results.publicFeedSummary = {
    total: Array.isArray(feedItems) ? feedItems.length : 0,
    containsProfessional: Array.isArray(feedItems)
      ? feedItems.some((item) => item.id === results.publicVisibility.professional?.publicPostId)
      : false,
    containsProject: Array.isArray(feedItems)
      ? feedItems.some((item) => item.id === results.publicVisibility.companyProject?.publicPostId)
      : false,
    containsSubcontractorPool: Array.isArray(feedItems)
      ? feedItems.some((item) => item.id === results.publicVisibility.contractor?.publicPostId)
      : false,
  };

  results.passwordResetSmoke = await forgotPassword(baseUrl, actors.professional.email);

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
