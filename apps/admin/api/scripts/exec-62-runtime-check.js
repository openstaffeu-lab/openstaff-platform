require('dotenv').config({ path: '.env' });

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../..', '..');
const DEFAULT_PROOF_PATH = path.join(ROOT, 'docs/proof/exec62/runtime-live.json');
const DEFAULT_SESSION_PATH = path.join(ROOT, '.logs/exec62-session.json');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email ?? '';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function http(baseUrl, route, options = {}) {
  const headers = {
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  };

  const startedAt = Date.now();
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

  return { status: response.status, body, durationMs: Date.now() - startedAt };
}

function unwrap(response) {
  return response?.body?.data ?? response?.body ?? null;
}

function mimeTypeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.txt') return 'text/plain';
  if (ext === '.mp4') return 'video/mp4';
  return 'application/octet-stream';
}

async function multipart(baseUrl, route, { token, filePath, fieldName = 'file', fields = {} }) {
  const form = new FormData();
  const buffer = fs.readFileSync(filePath);
  form.append(
    fieldName,
    new Blob([buffer], { type: mimeTypeFromFile(filePath) }),
    path.basename(filePath),
  );

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }

  const startedAt = Date.now();
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

  return { status: response.status, body, durationMs: Date.now() - startedAt };
}

let publicUploadCount = 0;

async function publicPostMultipart(baseUrl, route, options) {
  const delayMs = Number.parseInt(process.env.EXEC62_PUBLIC_UPLOAD_DELAY_MS ?? '4500', 10);
  if (publicUploadCount > 0 && delayMs > 0) {
    await sleep(delayMs);
  }
  publicUploadCount += 1;

  const first = await multipart(baseUrl, route, options);
  if (first.status !== 429 && first.status < 500) {
    return first;
  }

  const retryDelayMs = Number.parseInt(process.env.EXEC62_PUBLIC_UPLOAD_RETRY_DELAY_MS ?? '65000', 10);
  await sleep(retryDelayMs);
  return multipart(baseUrl, route, options);
}

function createAssets(runKey) {
  const dir = path.join(ROOT, '.logs/exec62-assets', runKey);
  fs.mkdirSync(dir, { recursive: true });

  const png = path.join(dir, 'marketplace-visual.png');
  const cv = path.join(dir, 'marketplace-cv.txt');
  const pdf = path.join(dir, 'marketplace-document.pdf');
  const mp4 = path.join(dir, 'marketplace-video.mp4');

  fs.writeFileSync(
    png,
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAYAAABW4BTbAAAAAXNSR0IArs4c6QAAAKJJREFUaEPt1jEOgCAMQ9H//zq7CkYgKFLQYmxNdBEnwwksS5beq8vzvBGQOYCxAjIXMFZAvgCYCxgrIFMBYwXkCYCxAjIXMFZAvgCYCxgrIFMBYwXkCYCxAjIXMFZAvgCYCxgrIFMBYwXkCYCxAjIXMFZAvgCYCxgrIFMBYwXkCYCxAjIXMFZAvgCYCxgrIFMBYwXkCYCxAjIXMFbAnq6r+gLnd2Jr5wP4WQAAAABJRU5ErkJggg==',
      'base64',
    ),
  );
  fs.writeFileSync(
    cv,
    [
      'Marketplace profile CV',
      'Experience in construction delivery, engineering coordination, BIM workflows, HVAC, civil works, and site operations.',
      'Languages: Romanian and English.',
      'Certifications: HSE induction, site coordination, discipline-specific technical training.',
    ].join('\n'),
  );
  fs.writeFileSync(
    pdf,
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R>>endobj\n4 0 obj<</Length 67>>stream\nBT /F1 12 Tf 32 96 Td (OpenStaff marketplace validation document) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000198 00000 n \ntrailer<</Root 1 0 R/Size 5>>\nstartxref\n315\n%%EOF\n',
  );
  fs.writeFileSync(mp4, Buffer.from('AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAAAAG21kYXQ=', 'base64'));

  return { dir, png, cv, pdf, mp4 };
}

const professionalTemplates = [
  {
    key: 'constructionManager',
    name: 'Andrei Popescu',
    title: 'Construction manager for residential delivery',
    role: 'Construction manager',
    profileType: 'PROFESSIONAL',
    city: 'Bucharest',
    region: 'Bucuresti-Ilfov',
    domain: 'CONSTRUCTION MANAGEMENT',
    nace: ['41.20'],
    escoQuery: 'construction manager',
    uniclassQuery: 'residential construction',
    summary: 'Construction manager coordinating shell, envelope, fit-out, safety routines, and subcontractor handover on residential projects.',
  },
  {
    key: 'electricalEngineer',
    name: 'Elena Ionescu',
    title: 'Electrical engineer for industrial packages',
    role: 'Electrical engineer',
    profileType: 'PROFESSIONAL',
    city: 'Cluj-Napoca',
    region: 'Cluj',
    domain: 'ELECTRICAL ENGINEERING',
    nace: ['43.21'],
    escoQuery: 'electrical engineer',
    uniclassQuery: 'electrical systems',
    summary: 'Electrical engineer focused on LV distribution, cable routing, commissioning packs, and handover documentation.',
  },
  {
    key: 'bimSpecialist',
    name: 'Mihai Radu',
    title: 'BIM/Revit specialist for coordinated models',
    role: 'BIM/Revit specialist',
    profileType: 'SPECIALIST',
    city: 'Iasi',
    region: 'Iasi',
    domain: 'BIM COORDINATION',
    nace: ['71.12'],
    escoQuery: 'bim',
    uniclassQuery: 'building information modelling',
    summary: 'BIM specialist producing clash-ready Revit models, family libraries, model federation notes, and coordination exports.',
  },
  {
    key: 'hvacTechnician',
    name: 'Sofia Marin',
    title: 'HVAC technician for retrofit and balancing',
    role: 'HVAC technician',
    profileType: 'PROFESSIONAL',
    city: 'Brasov',
    region: 'Brasov',
    domain: 'HVAC SERVICES',
    nace: ['43.22'],
    escoQuery: 'hvac technician',
    uniclassQuery: 'ventilation',
    summary: 'HVAC technician covering ductwork inspection, equipment replacement, commissioning support, and airflow balancing.',
  },
  {
    key: 'civilEngineer',
    name: 'Radu Constantinescu',
    title: 'Civil engineer for infrastructure works',
    role: 'Civil engineer',
    profileType: 'PROFESSIONAL',
    city: 'Timisoara',
    region: 'Timis',
    domain: 'CIVIL ENGINEERING',
    nace: ['42.11'],
    escoQuery: 'civil engineer',
    uniclassQuery: 'civil engineering',
    summary: 'Civil engineer supporting drainage, road interfaces, material approvals, quantities, and site progress control.',
  },
  {
    key: 'projectCoordinator',
    name: 'Irina Pavel',
    title: 'Project coordinator for multilingual site teams',
    role: 'Project coordinator',
    profileType: 'PROFESSIONAL',
    city: 'Bucharest',
    region: 'Bucuresti-Ilfov',
    domain: 'PROJECT COORDINATION',
    nace: ['70.22'],
    escoQuery: 'project coordinator',
    uniclassQuery: 'project management',
    summary: 'Project coordinator managing Romanian-English site communication, document trackers, RFIs, and weekly delivery routines.',
  },
];

const companyTemplates = [
  {
    key: 'generalContractor',
    name: 'Northgate Construct SRL',
    profileType: 'GENERAL_CONTRACTOR',
    role: 'General contractor',
    city: 'Bucharest',
    region: 'Bucuresti-Ilfov',
    domain: 'GENERAL CONTRACTING',
    summary: 'General contractor delivering residential, commercial, and fit-out packages with structured subcontractor coordination.',
  },
  {
    key: 'engineeringConsultancy',
    name: 'Danube Engineering Studio SRL',
    profileType: 'CONTRACTOR',
    role: 'Engineering consultancy',
    city: 'Cluj-Napoca',
    region: 'Cluj',
    domain: 'ENGINEERING CONSULTANCY',
    summary: 'Engineering consultancy providing MEP design review, BIM coordination, and technical supervision for retrofit projects.',
  },
  {
    key: 'facilityManagement',
    name: 'Carpathia Facility Services SRL',
    profileType: 'SUPPLIER',
    role: 'Facility management company',
    city: 'Brasov',
    region: 'Brasov',
    domain: 'FACILITY MANAGEMENT',
    summary: 'Facility management company coordinating planned maintenance, HVAC upgrades, compliance records, and contractor access.',
  },
  {
    key: 'subcontractorPool',
    name: 'ElectroMontaj Partners SRL',
    profileType: 'SUBCONTRACTOR',
    role: 'Subcontractor pool company',
    city: 'Timisoara',
    region: 'Timis',
    domain: 'SUBCONTRACTOR POOL',
    summary: 'Subcontractor pool with mobile electrical, civil support, and site execution teams available for multi-week packages.',
  },
];

const projectTemplates = [
  {
    key: 'residentialConstruction',
    ownerKey: 'generalContractor',
    title: 'Bucharest residential structure and envelope coordination',
    slugBase: 'bucharest-residential-structure-envelope',
    domain: 'CONSTRUCTION',
    location: 'Bucharest, Romania',
    city: 'Bucharest',
    region: 'Bucuresti-Ilfov',
    value: 'EUR 180,000 - 260,000',
    budgetMin: 180000,
    budgetMax: 260000,
    nace: ['41.20'],
    escoQuery: 'construction manager',
    uniclassQuery: 'residential construction',
  },
  {
    key: 'industrialRetrofit',
    ownerKey: 'engineeringConsultancy',
    title: 'Cluj industrial retrofit electrical package',
    slugBase: 'cluj-industrial-retrofit-electrical',
    domain: 'CONSTRUCTION INDUSTRIAL RETROFIT',
    location: 'Cluj-Napoca, Romania',
    city: 'Cluj-Napoca',
    region: 'Cluj',
    value: 'EUR 95,000 - 140,000',
    budgetMin: 95000,
    budgetMax: 140000,
    nace: ['43.21'],
    escoQuery: 'electrical engineer',
    uniclassQuery: 'electrical systems',
  },
  {
    key: 'publicInfrastructure',
    ownerKey: 'generalContractor',
    title: 'Timis public infrastructure drainage and civil works',
    slugBase: 'timis-public-infrastructure-drainage',
    domain: 'CONSTRUCTION PUBLIC INFRASTRUCTURE',
    location: 'Timisoara, Romania',
    city: 'Timisoara',
    region: 'Timis',
    value: 'EUR 220,000 - 310,000',
    budgetMin: 220000,
    budgetMax: 310000,
    nace: ['42.11'],
    escoQuery: 'civil engineer',
    uniclassQuery: 'civil engineering',
  },
  {
    key: 'hvacUpgrade',
    ownerKey: 'facilityManagement',
    title: 'Brasov logistics facility HVAC upgrade',
    slugBase: 'brasov-logistics-hvac-upgrade',
    domain: 'CONSTRUCTION HVAC',
    location: 'Brasov, Romania',
    city: 'Brasov',
    region: 'Brasov',
    value: 'EUR 60,000 - 85,000',
    budgetMin: 60000,
    budgetMax: 85000,
    nace: ['43.22'],
    escoQuery: 'hvac technician',
    uniclassQuery: 'ventilation',
  },
  {
    key: 'bimCoordination',
    ownerKey: 'engineeringConsultancy',
    title: 'Bucharest BIM coordination for mixed-use fit-out',
    slugBase: 'bucharest-bim-coordination-fitout',
    domain: 'CONSTRUCTION BIM COORDINATION',
    location: 'Bucharest, Romania',
    city: 'Bucharest',
    region: 'Bucuresti-Ilfov',
    value: 'EUR 35,000 - 55,000',
    budgetMin: 35000,
    budgetMax: 55000,
    nace: ['71.12'],
    escoQuery: 'bim',
    uniclassQuery: 'building information modelling',
  },
];

async function login(baseUrl, email, password) {
  return http(baseUrl, '/auth/login', { method: 'POST', body: { email, password } });
}

async function register(baseUrl, payload) {
  return http(baseUrl, '/auth/register', { method: 'POST', body: payload });
}

function firstCodes(results, fallback) {
  const codes = Array.isArray(results)
    ? results.map((item) => item?.code).filter((value) => typeof value === 'string')
    : [];
  return Array.from(new Set([...codes, ...fallback])).slice(0, 2);
}

async function taxonomyFor(baseUrl, token, item) {
  const [esco, nace, uniclass] = await Promise.all([
    http(baseUrl, `/taxonomy/esco?q=${encodeURIComponent(item.escoQuery)}&limit=5`),
    http(baseUrl, `/taxonomy/nace?q=${encodeURIComponent(item.nace?.[0] ?? 'construction')}&limit=5`),
    http(baseUrl, `/taxonomy/uniclass?q=${encodeURIComponent(item.uniclassQuery)}&limit=5`),
  ]);
  assert(esco.status === 200, `ESCO search failed for ${item.key}`);
  assert(nace.status === 200, `NACE search failed for ${item.key}`);
  assert(uniclass.status === 200, `Uniclass search failed for ${item.key}`);
  return {
    escoCodes: firstCodes(esco.body?.results, ['7411.1', '3112.1']),
    naceCodes: firstCodes(nace.body?.results, item.nace ?? ['41.20']),
    uniclassCodes: firstCodes(uniclass.body?.results, ['Ss_25_30_95']),
  };
}

async function createActor(baseUrl, runKey, password, assets, template, kind) {
  const slug = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${runKey}`;
  const email = `marketplace.${runKey}.${template.key}@openstaff.eu`;
  const registerResponse = await register(baseUrl, {
    email,
    password,
    displayName: template.name,
    actorType: kind === 'company' ? 'COMPANY' : 'INDIVIDUAL',
    profileType: template.profileType,
    companyName: kind === 'company' ? template.name : undefined,
  });
  assert(registerResponse.status === 201, `${template.key} registration failed: ${JSON.stringify(registerResponse.body)}`);
  const auth = unwrap(registerResponse);
  const token = auth.accessToken;
  const refreshToken = auth.refreshToken;
  const userId = auth.user.id;

  const taxonomy = await taxonomyFor(baseUrl, token, template);

  const identity = await http(baseUrl, '/onboarding/identity-profile', {
    method: 'PUT',
    token,
    body: {
      publicSlug: slug,
      firstName: kind === 'company' ? undefined : template.name.split(' ')[0],
      lastName: kind === 'company' ? undefined : template.name.split(' ').slice(1).join(' '),
      displayName: template.name,
      phone: '+40 721 100 200',
      language: 'ro,en',
      timezone: 'Europe/Bucharest',
      country: 'Romania',
      city: template.city,
      website: `https://openstaff.eu/profiles/${slug}`,
      linkedinUrl: 'https://www.linkedin.com/company/openstaff-eu/',
      portfolioUrl: `https://openstaff.eu/profiles/${slug}`,
      bio: template.summary,
    },
  });
  assert(identity.status === 200, `${template.key} identity onboarding failed`);

  let companyProfile = null;
  if (kind === 'company') {
    companyProfile = await http(baseUrl, '/onboarding/company-profile', {
      method: 'PUT',
      token,
      body: {
        companyName: template.name,
        legalName: template.name,
        vatId: `RO${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        registrationNumber: `J40/${Math.floor(1000 + Math.random() * 8999)}/2026`,
        country: 'Romania',
        city: template.city,
        addressLine1: 'Strada Constructorilor 12',
        postalCode: '010001',
        website: `https://openstaff.eu/profiles/${slug}`,
      },
    });
    assert(companyProfile.status === 200, `${template.key} company onboarding failed`);
  }

  const steps = await http(baseUrl, '/onboarding/steps', {
    method: 'PATCH',
    token,
    body: {
      currentStep: 'completion',
      completedSteps: ['welcome', 'identity', ...(kind === 'company' ? ['company'] : [])],
    },
  });
  assert(steps.status === 200, `${template.key} onboarding steps failed`);

  const profile = await http(baseUrl, '/profile', {
    method: 'PUT',
    token,
    body: {
      profileType: template.profileType,
      slug,
      displayName: template.name,
      companyName: kind === 'company' ? template.name : null,
      publicHeadline: template.title,
      summary: template.summary,
      description: `${template.summary}\n\nAvailable for Romanian and EU project teams. Works in Romanian and English.`,
      websiteUrl: `https://openstaff.eu/profiles/${slug}`,
      publicEmail: null,
      publicPhone: null,
      privateEmail: email,
      privatePhone: '+40 721 100 200',
      visibility: 'PUBLIC',
      countryCode: 'RO',
      countryName: 'Romania',
      regionName: template.region,
      cityName: template.city,
      supportedEngagementModels: ['B2B'],
      languageCodes: ['ro', 'en'],
      escoCodes: taxonomy.escoCodes,
      naceCodes: taxonomy.naceCodes,
      uniclassCodes: taxonomy.uniclassCodes,
      certificationsText: 'HSE induction, discipline-specific site training, Romanian-English documentation handover.',
      availabilityStatus: 'AVAILABLE',
      ...(kind === 'company'
        ? {
            contractorProfile: {
              tradeFocus: template.domain,
              teamSize: template.key === 'subcontractorPool' ? 14 : 24,
              serviceArea: `${template.region}, Romania and cross-border EU delivery`,
            },
          }
        : {
            professionalProfile: {
              headline: template.role,
              yearsExperience: template.key === 'projectCoordinator' ? 6 : 10,
              portfolioFocus: template.domain,
            },
          }),
    },
  });
  assert(profile.status === 200, `${template.key} profile update failed: ${JSON.stringify(profile.body)}`);
  const profileData = unwrap(profile);
  const profileId = profileData.id;

  const visualAssetKind = kind === 'company' ? 'LOGO' : 'PHOTO';
  const uploads = [];
  uploads.push(
    await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
      token,
      filePath: assets.png,
      fields: {
        title: `${template.name} ${visualAssetKind.toLowerCase()}`,
        description: `${template.role} visual identity`,
        assetKind: visualAssetKind,
        type: 'IMAGE',
      },
    }),
  );
  uploads.push(
    await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
      token,
      filePath: assets.cv,
      fields: {
        title: `${template.name} CV and capability profile`,
        description: 'Text CV used for extraction and profile quality validation',
        assetKind: 'CV',
        type: 'CV',
      },
    }),
  );
  if (kind === 'company') {
    uploads.push(
      await multipart(baseUrl, `/profiles/${profileId}/documents/upload`, {
        token,
        filePath: assets.png,
        fields: {
          title: `${template.name} banner`,
          description: 'Company banner visual',
          assetKind: 'BANNER',
          type: 'IMAGE',
        },
      }),
    );
  }
  uploads.forEach((upload, index) => {
    assert(upload.status === 200 || upload.status === 201, `${template.key} profile upload ${index + 1} failed`);
  });
  const uploaded = uploads.map((upload) => unwrap(upload));
  const cvDocument = uploaded.find((item) => item.assetKind === 'CV');
  const extract = await http(baseUrl, `/profiles/${profileId}/documents/${cvDocument.id}/extract`, {
    method: 'POST',
    token,
  });
  assert(extract.status === 200 || extract.status === 201, `${template.key} CV extraction failed`);
  const extractedText = await http(baseUrl, `/profiles/${profileId}/documents/${cvDocument.id}/extracted-text`, { token });
  assert(extractedText.status === 200, `${template.key} extracted CV text read failed`);

  const reluAssistant = await http(baseUrl, '/relu/onboarding-assistant', {
    method: 'POST',
    token,
    body: {
      message: `Improve this ${template.role} marketplace profile for project discovery. Keep existing user-entered facts editable and do not overwrite them.`,
    },
  });
  assert(reluAssistant.status === 200 || reluAssistant.status === 201, `${template.key} RELU assistant failed`);
  const reluEnrich = await http(baseUrl, `/relu/profiles/${profileId}/enrich`, { method: 'POST', token });
  assert(reluEnrich.status === 200, `${template.key} RELU enrich failed`);
  const reluClassify = await http(baseUrl, `/relu/profiles/${profileId}/classify`, { method: 'POST', token });
  assert(reluClassify.status === 200, `${template.key} RELU classify failed`);
  const reluResults = await http(baseUrl, `/relu/profiles/${profileId}/results`, { token });
  assert(reluResults.status === 200, `${template.key} RELU results failed`);
  const afterRelu = await http(baseUrl, '/profile', { token });
  assert(afterRelu.status === 200, `${template.key} profile after RELU failed`);

  return {
    key: template.key,
    kind,
    name: template.name,
    role: template.role,
    email,
    maskedEmail: maskEmail(email),
    token,
    refreshToken,
    userId,
    profileId,
    slug,
    taxonomy,
    profile: unwrap(afterRelu),
    identity: unwrap(identity),
    companyProfile: companyProfile ? unwrap(companyProfile) : null,
    uploads: uploaded,
    extraction: unwrap(extractedText),
    relu: {
      assistantStatus: reluAssistant.status,
      assistantMode: reluAssistant.body?.status ?? reluAssistant.body?.mode ?? null,
      enrichStatus: reluEnrich.status,
      classifyStatus: reluClassify.status,
      resultCounts: {
        classifications: Array.isArray(unwrap(reluResults)?.classifications)
          ? unwrap(reluResults).classifications.length
          : 0,
        recommendations: Array.isArray(unwrap(reluResults)?.recommendations)
          ? unwrap(reluResults).recommendations.length
          : 0,
      },
      nonDestructive: {
        displayNameKept: unwrap(afterRelu)?.displayName === template.name,
        summaryKept: unwrap(afterRelu)?.summary === template.summary,
      },
    },
  };
}

async function createPublicPost(baseUrl, token, actor, payload, assets, options = {}) {
  const postResponse = await http(baseUrl, '/public-posts', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(postResponse.status === 200 || postResponse.status === 201, `${payload.title} post create failed: ${JSON.stringify(postResponse.body)}`);
  const post = unwrap(postResponse);
  const pendingPublic = await http(baseUrl, `/public-posts/${post.id}`);
  assert(pendingPublic.status === 403, `${payload.title} pending post must be hidden`);

  const mediaFile = options.video ? assets.mp4 : assets.png;
  const media = await publicPostMultipart(baseUrl, `/public-posts/${post.id}/media`, {
    token,
    filePath: mediaFile,
    fields: {
      role: options.banner ? 'BANNER' : 'GALLERY',
      alt: `${payload.title} media`,
    },
  });
  assert(
    media.status === 200 || media.status === 201,
    `${payload.title} media upload failed: ${JSON.stringify(media.body)}`,
  );

  const document = await publicPostMultipart(baseUrl, `/public-posts/${post.id}/documents`, {
    token,
    filePath: assets.pdf,
    fields: {
      title: `${payload.title} public brief`,
      description: 'Public marketplace document for capability and trust validation',
    },
  });
  assert(
    document.status === 200 || document.status === 201,
    `${payload.title} document upload failed: ${JSON.stringify(document.body)}`,
  );

  return {
    ...post,
    authorKey: actor.key,
    pendingPublicStatus: pendingPublic.status,
    uploadedMedia: unwrap(media),
    uploadedDocument: unwrap(document),
  };
}

async function approveActorAndPosts(baseUrl, adminToken, actor, posts, documentStatusByPostId = {}) {
  const approval = await http(baseUrl, `/users/${actor.userId}/approval`, {
    method: 'PATCH',
    token: adminToken,
    body: { approvalStatus: 'APPROVED' },
  });
  assert(approval.status === 200, `${actor.key} approval failed`);
  const account = await http(baseUrl, `/users/${actor.userId}/account-status`, {
    method: 'PATCH',
    token: adminToken,
    body: { accountStatus: 'LIVE' },
  });
  assert(account.status === 200, `${actor.key} account activation failed`);
  const profile = await http(baseUrl, `/users/${actor.userId}/profile-moderation`, {
    method: 'PATCH',
    token: adminToken,
    body: { moderationStatus: 'APPROVED', status: 'LIVE' },
  });
  assert(profile.status === 200, `${actor.key} profile moderation failed`);

  const moderated = [];
  for (const post of posts) {
    const media = await http(baseUrl, `/admin/public-post-media/${post.uploadedMedia.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED' },
    });
    assert(media.status === 200, `${post.title} media approval failed`);
    const documentStatus = documentStatusByPostId[post.id] ?? 'APPROVED';
    const document = await http(baseUrl, `/admin/public-post-documents/${post.uploadedDocument.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: documentStatus },
    });
    assert(document.status === 200, `${post.title} document moderation failed`);
    const postStatus = await http(baseUrl, `/admin/public-posts/${post.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'LIVE', moderationStatus: 'APPROVED', visibility: 'PUBLIC' },
    });
    assert(postStatus.status === 200, `${post.title} post approval failed`);
    moderated.push({
      postId: post.id,
      mediaStatus: unwrap(media)?.status,
      documentStatus,
      postStatus: unwrap(postStatus)?.status,
    });
  }
  return moderated;
}

async function validateDiscovery(baseUrl, created) {
  const startedAt = Date.now();
  const [feed, projects, professionals, pools, hvac, bucharest, nace] = await Promise.all([
    http(baseUrl, '/public-posts'),
    http(baseUrl, '/public-posts?type=PROJECT&status=LIVE'),
    http(baseUrl, '/public-posts?type=PROFESSIONAL&status=LIVE'),
    http(baseUrl, '/public-posts?type=SUBCONTRACTOR_POOL&status=LIVE'),
    http(baseUrl, '/public-posts?type=PROJECT&status=LIVE&q=HVAC'),
    http(baseUrl, '/public-posts?type=PROJECT&status=LIVE&q=Bucharest'),
    http(baseUrl, '/public-posts?type=PROJECT&status=LIVE&q=electrical'),
  ]);
  [feed, projects, professionals, pools, hvac, bucharest, nace].forEach((response) => {
    assert(response.status === 200, `Discovery request failed with ${response.status}`);
  });
  const projectItems = unwrap(projects);
  const professionalItems = unwrap(professionals);
  const poolItems = unwrap(pools);
  const allItems = unwrap(feed);
  const projectIds = new Set(created.projectPosts.map((item) => item.id));
  const professionalPostIds = new Set(created.professionalPosts.map((item) => item.id));
  const companyPostIds = new Set(created.companyPosts.map((item) => item.id));
  const allCreated = [...projectIds, ...professionalPostIds, ...companyPostIds];
  const createdFeedItems = allItems.filter((item) => allCreated.includes(item.id));
  return {
    durationMs: Date.now() - startedAt,
    totals: {
      feed: Array.isArray(allItems) ? allItems.length : 0,
      projects: Array.isArray(projectItems) ? projectItems.length : 0,
      professionals: Array.isArray(professionalItems) ? professionalItems.length : 0,
      pools: Array.isArray(poolItems) ? poolItems.length : 0,
    },
    createdVisible: {
      projectPosts: created.projectPosts.every((item) => projectItems.some((post) => post.id === item.id)),
      professionalPosts: created.professionalPosts.every((item) => professionalItems.some((post) => post.id === item.id)),
      companyPoolPosts: created.companyPosts.every((item) => poolItems.some((post) => post.id === item.id)),
      anyInternalLabelPublic: createdFeedItems.some((item) =>
        /\bexec(?:[-\s]?\d+)?\b|\btest\b|\bproof\b/i.test(
          `${item.title} ${item.slug} ${item.summary} ${item.description}`,
        ),
      ),
    },
    filters: {
      qHvacCount: unwrap(hvac).length,
      qBucharestCount: unwrap(bucharest).length,
      qElectricalCount: unwrap(nace).length,
      categoryConstructionCount: projectItems.filter((item) => String(item.domain).includes('CONSTRUCTION')).length,
      geographyBucharestCount: projectItems.filter((item) => String(item.location).toLowerCase().includes('bucharest')).length,
      nace4321Count: projectItems.filter((item) => (item.naceCodes ?? []).some((code) => String(code).includes('43.21'))).length,
      escoPresenceCount: projectItems.filter((item) => (item.escoCodes ?? []).length > 0).length,
      uniclassPresenceCount: projectItems.filter((item) => (item.uniclassCodes ?? []).length > 0).length,
      multilingualPresenceCount: created.professionalActors.filter((item) => {
        const languages = item.profile?.languages ?? [];
        return languages.some((language) => language.code === 'ro') && languages.some((language) => language.code === 'en');
      }).length,
    },
  };
}

async function validatePublicAssets(baseUrl, created) {
  const visiblePost = created.projectPosts[0];
  const rejectedDocPost = created.companyPosts[0];
  const [media, doc, rejectedDoc, publicProfile, identityProfile] = await Promise.all([
    http(baseUrl, `/public-posts/media/${visiblePost.uploadedMedia.id}`),
    http(baseUrl, `/public-posts/documents/${visiblePost.uploadedDocument.id}`),
    http(baseUrl, `/public-posts/documents/${rejectedDocPost.uploadedDocument.id}`),
    http(baseUrl, `/profiles/public/${created.professionalActors[0].slug}`),
    http(baseUrl, `/profiles/${created.professionalActors[0].slug}`),
  ]);
  assert(media.status === 200, 'Approved public media must return 200');
  assert(doc.status === 200, 'Approved public document must return 200');
  assert(rejectedDoc.status === 403, 'Rejected public document must stay hidden');
  assert(publicProfile.status === 200, 'Public profile API must return 200');
  assert(identityProfile.status === 200, 'Public identity profile page API must return 200');
  return {
    approvedMediaStatus: media.status,
    approvedDocumentStatus: doc.status,
    rejectedDocumentStatus: rejectedDoc.status,
    publicProfileStatus: publicProfile.status,
    identityProfileStatus: identityProfile.status,
  };
}

async function runLive() {
  const baseUrl = process.env.EXEC62_BASE_URL || 'https://api.openstaff.eu';
  const proofPath = process.env.EXEC62_PROOF_PATH || DEFAULT_PROOF_PATH;
  const sessionPath = process.env.EXEC62_SESSION_PATH || DEFAULT_SESSION_PATH;
  const adminEmail = process.env.EXEC62_ADMIN_EMAIL || process.env.EXEC60_ADMIN_EMAIL;
  const adminPassword = process.env.EXEC62_ADMIN_PASSWORD || process.env.EXEC60_ADMIN_PASSWORD;
  const password = process.env.EXEC62_ACCOUNT_PASSWORD || `OpenStaff!${Date.now().toString(36)}A1`;
  const runKey = `m${Date.now().toString(36)}`;
  assert(adminEmail && adminPassword, 'EXEC62_ADMIN_EMAIL/EXEC62_ADMIN_PASSWORD or EXEC60_ADMIN_EMAIL/EXEC60_ADMIN_PASSWORD are required.');

  const assets = createAssets(runKey);
  const status = await http(baseUrl, '/status');
  assert(status.status === 200, '/status must return 200');
  const adminLogin = await login(baseUrl, adminEmail, adminPassword);
  assert(adminLogin.status === 200, `admin login failed: ${JSON.stringify(adminLogin.body)}`);
  const adminToken = unwrap(adminLogin).accessToken;

  const actors = [];
  for (const template of professionalTemplates) {
    actors.push(await createActor(baseUrl, runKey, password, assets, template, 'professional'));
  }
  for (const template of companyTemplates) {
    actors.push(await createActor(baseUrl, runKey, password, assets, template, 'company'));
  }

  const professionals = actors.filter((actor) => actor.kind === 'professional');
  const companies = actors.filter((actor) => actor.kind === 'company');
  const byKey = Object.fromEntries(actors.map((actor) => [actor.key, actor]));

  const actorPosts = [];
  for (const actor of professionals) {
    actorPosts.push(
      await createPublicPost(
        baseUrl,
        actor.token,
        actor,
        {
          type: 'PROFESSIONAL',
          title: actor.profile.publicHeadline,
          slug: `${actor.slug}-availability`,
          description: actor.profile.description,
          summary: actor.profile.summary,
          domain: actor.profile.publicHeadline?.toUpperCase() ?? 'PROFESSIONAL SERVICES',
          location: `${actor.profile.geography.city?.name ?? actor.profile.cityName ?? 'Romania'}, Romania`,
          value: 'Available for vetted projects',
          ownerName: actor.name,
          ownerType: actor.role,
          visibility: 'PUBLIC',
          escoCodesJson: actor.taxonomy.escoCodes,
          naceCodesJson: actor.taxonomy.naceCodes,
          uniclassCodesJson: actor.taxonomy.uniclassCodes,
          languageCodesJson: ['ro', 'en'],
          classificationJson: { role: actor.role, source: 'user-confirmed' },
        },
        assets,
        { banner: false },
      ),
    );
  }

  const companyPosts = [];
  for (const company of companies) {
    companyPosts.push(
      await createPublicPost(
        baseUrl,
        company.token,
        company,
        {
          type: 'SUBCONTRACTOR_POOL',
          title: `${company.name} capability pool`,
          slug: `${company.slug}-capability-pool`,
          description: company.profile.description,
          summary: company.profile.summary,
          domain: company.profile.contractorProfile?.tradeFocus ?? 'COMPANY CAPABILITY',
          location: `${company.profile.geography.city?.name ?? 'Romania'}, Romania`,
          value: 'Available for qualified collaboration',
          ownerName: company.name,
          ownerType: company.role,
          visibility: 'PUBLIC',
          escoCodesJson: company.taxonomy.escoCodes,
          naceCodesJson: company.taxonomy.naceCodes,
          uniclassCodesJson: company.taxonomy.uniclassCodes,
          languageCodesJson: ['ro', 'en'],
          classificationJson: { companyRole: company.role, source: 'user-confirmed' },
        },
        assets,
        { banner: true },
      ),
    );
  }

  const projectPosts = [];
  for (const project of projectTemplates) {
    const owner = byKey[project.ownerKey];
    const taxonomy = await taxonomyFor(baseUrl, owner.token, project);
    projectPosts.push(
      await createPublicPost(
        baseUrl,
        owner.token,
        owner,
        {
          type: 'PROJECT',
          title: project.title,
          slug: `${project.slugBase}-${runKey}`,
          description: `${project.title} requires qualified teams, documented coordination, verified media, and Romanian-English handover notes. Scope includes site coordination, technical documentation, safety alignment, and weekly progress control.`,
          summary: `Realistic marketplace opportunity for ${project.location} with taxonomy, geography, media, and document validation.`,
          domain: project.domain,
          location: project.location,
          value: project.value,
          budgetMin: project.budgetMin,
          budgetMax: project.budgetMax,
          currencyCode: 'EUR',
          ownerName: owner.name,
          ownerType: owner.role,
          visibility: 'PUBLIC',
          escoCodesJson: taxonomy.escoCodes,
          naceCodesJson: taxonomy.naceCodes,
          uniclassCodesJson: taxonomy.uniclassCodes,
          languageCodesJson: ['ro', 'en'],
          classificationJson: { projectType: project.key, source: 'user-confirmed' },
          certifications: 'HSE induction, project-specific method statement, Romanian site compliance.',
          certificationsOffered: 'Structured weekly reporting, bilingual handover, media-supported progress evidence.',
        },
        assets,
        { banner: project.key !== 'hvacUpgrade', video: project.key === 'hvacUpgrade' },
      ),
    );
  }

  const pendingHiddenPost = await createPublicPost(
    baseUrl,
    companies[0].token,
    companies[0],
    {
      type: 'PROJECT',
      title: 'Pre-moderation office fit-out package',
      slug: `pre-moderation-office-fitout-${runKey}`,
      description: 'This realistic pending project is intentionally left unapproved to validate moderation visibility rules.',
      summary: 'Pending moderation visibility validation item.',
      domain: 'CONSTRUCTION',
      location: 'Bucharest, Romania',
      value: 'Budget under review',
      ownerName: companies[0].name,
      ownerType: companies[0].role,
      visibility: 'PUBLIC',
    },
    assets,
  );
  const rejectedHiddenPost = await createPublicPost(
    baseUrl,
    companies[1].token,
    companies[1],
    {
      type: 'PROJECT',
      title: 'Rejected duplicate electrical maintenance package',
      slug: `rejected-duplicate-electrical-maintenance-${runKey}`,
      description: 'This realistic rejected project validates that rejected marketplace content remains hidden.',
      summary: 'Rejected moderation visibility validation item.',
      domain: 'CONSTRUCTION',
      location: 'Cluj-Napoca, Romania',
      value: 'Budget under review',
      ownerName: companies[1].name,
      ownerType: companies[1].role,
      visibility: 'PUBLIC',
    },
    assets,
  );

  for (const actor of actors) {
    const posts = [...actorPosts, ...companyPosts, ...projectPosts].filter((post) => post.authorKey === actor.key);
    const rejectedDocs = actor.key === companies[0].key && companyPosts[0] ? { [companyPosts[0].id]: 'REJECTED' } : {};
    await approveActorAndPosts(baseUrl, adminToken, actor, posts, rejectedDocs);
  }
  const rejectedStatus = await http(baseUrl, `/admin/public-posts/${rejectedHiddenPost.id}/status`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'REJECTED', moderationStatus: 'REJECTED', visibility: 'PUBLIC' },
  });
  assert(rejectedStatus.status === 200, 'Rejected hidden post moderation failed');

  const publicChecks = await Promise.all(
    [...actorPosts, ...companyPosts, ...projectPosts].map(async (post) => ({
      id: post.id,
      title: post.title,
      type: post.type,
      detailStatus: (await http(baseUrl, `/public-posts/${post.id}`)).status,
      mediaStatus: (await http(baseUrl, `/public-posts/media/${post.uploadedMedia.id}`)).status,
      documentStatus: (await http(baseUrl, `/public-posts/documents/${post.uploadedDocument.id}`)).status,
    })),
  );
  publicChecks.forEach((check) => {
    assert(check.detailStatus === 200, `${check.title} must be publicly visible`);
    assert(check.mediaStatus === 200, `${check.title} media must be public`);
  });
  const pendingStatus = await http(baseUrl, `/public-posts/${pendingHiddenPost.id}`);
  const rejectedStatusPublic = await http(baseUrl, `/public-posts/${rejectedHiddenPost.id}`);
  assert(pendingStatus.status === 403, 'Pending content must stay hidden');
  assert(rejectedStatusPublic.status === 403, 'Rejected content must stay hidden');

  const discovery = await validateDiscovery(baseUrl, {
    professionalActors: professionals,
    companyActors: companies,
    professionalPosts: actorPosts,
    companyPosts,
    projectPosts,
  });
  const assetsProof = await validatePublicAssets(baseUrl, {
    professionalActors: professionals,
    companyActors: companies,
    professionalPosts: actorPosts,
    companyPosts,
    projectPosts,
  });

  const stressStartedAt = Date.now();
  const stressResponses = await Promise.all([
    ...professionals.slice(0, 4).map((actor) => http(baseUrl, '/onboarding/me', { token: actor.token })),
    ...projectPosts.map((post) => http(baseUrl, `/public-posts/${post.id}`)),
    ...professionals.slice(0, 3).map((actor) =>
      http(baseUrl, '/relu/onboarding-assistant', {
        method: 'POST',
        token: actor.token,
        body: { message: 'Suggest one concise improvement for public marketplace discovery.' },
      }),
    ),
  ]);
  const stress = {
    durationMs: Date.now() - stressStartedAt,
    requestCount: stressResponses.length,
    statuses: stressResponses.map((response) => response.status),
    allSuccessful: stressResponses.every((response) => response.status >= 200 && response.status < 300),
  };

  const relogins = [];
  for (const actor of [professionals[0], professionals[1], companies[0]]) {
    const relogin = await login(baseUrl, actor.email, password);
    assert(relogin.status === 200, `${actor.key} relogin failed`);
    const profile = await http(baseUrl, '/profile', { token: unwrap(relogin).accessToken });
    assert(profile.status === 200, `${actor.key} relogin profile read failed`);
    relogins.push({ key: actor.key, status: relogin.status, profileStatus: profile.status });
  }

  const proof = {
    execution: 'EXEC-62',
    runKey,
    generatedAt: new Date().toISOString(),
    baseUrl,
    latestStatus: {
      health: status.status,
      readinessWarnings: unwrap(status)?.readiness?.warnings ?? [],
      readinessErrors: unwrap(status)?.readiness?.errors ?? [],
      emailDeliveryMode: unwrap(status)?.integrations?.emailDelivery?.mode ?? null,
    },
    professionals: professionals.map((actor) => publicActorSummary(actor)),
    companies: companies.map((actor) => publicActorSummary(actor)),
    professionalPosts: actorPosts.map(publicPostSummary),
    companyPosts: companyPosts.map(publicPostSummary),
    projectPosts: projectPosts.map(publicPostSummary),
    hiddenModerationProof: {
      pendingPostId: pendingHiddenPost.id,
      pendingPublicStatus: pendingStatus.status,
      rejectedPostId: rejectedHiddenPost.id,
      rejectedPublicStatus: rejectedStatusPublic.status,
    },
    publicChecks,
    discovery,
    assets: assetsProof,
    relu: {
      actorsValidated: actors.length,
      fallbackContinuityCount: actors.filter((actor) => String(actor.relu.assistantMode ?? '').toLowerCase().includes('error')).length,
      nonDestructiveCount: actors.filter((actor) => actor.relu.nonDestructive.displayNameKept && actor.relu.nonDestructive.summaryKept).length,
      summaries: actors.map((actor) => ({
        key: actor.key,
        assistantStatus: actor.relu.assistantStatus,
        assistantMode: actor.relu.assistantMode,
        resultCounts: actor.relu.resultCounts,
        nonDestructive: actor.relu.nonDestructive,
      })),
    },
    stress,
    relogins,
    browserProof: null,
    cleanup: { completed: false },
    readiness: {
      classification: 'PENDING_BROWSER_VALIDATION',
      blockers: [],
    },
  };

  writeJson(proofPath, proof);
  writeJson(sessionPath, {
    runKey,
    baseUrl,
    proofPath,
    adminToken,
    actors: actors.map((actor) => ({
      key: actor.key,
      token: actor.token,
      userId: actor.userId,
      slug: actor.slug,
      email: actor.email,
    })),
    posts: [...actorPosts, ...companyPosts, ...projectPosts, pendingHiddenPost, rejectedHiddenPost].map((post) => ({
      id: post.id,
      title: post.title,
    })),
  });

  console.log(JSON.stringify({
    runKey,
    proofPath,
    sessionPath,
    professionals: professionals.length,
    companies: companies.length,
    projectPosts: projectPosts.length,
    discovery: proof.discovery.createdVisible,
    stress: proof.stress,
  }, null, 2));
}

function publicActorSummary(actor) {
  return {
    key: actor.key,
    name: actor.name,
    role: actor.role,
    kind: actor.kind,
    maskedEmail: actor.maskedEmail,
    userId: actor.userId,
    profileId: actor.profileId,
    slug: actor.slug,
    publicProfileUrl: `https://openstaff.eu/profiles/${actor.slug}`,
    publicProfileApiUrl: `https://api.openstaff.eu/profiles/public/${actor.slug}`,
    taxonomy: actor.taxonomy,
    languages: (actor.profile.languages ?? []).map((item) => item.code),
    media: actor.uploads.map((item) => ({
      id: item.id,
      assetKind: item.assetKind,
      mimeType: item.mimeType,
      storage: item.storage,
      extractionStatus: item.extractionStatus,
    })),
    cvExtractionStatus: actor.extraction.extractionStatus,
    relu: actor.relu,
  };
}

function publicPostSummary(post) {
  return {
    id: post.id,
    slug: post.slug,
    type: post.type,
    title: post.title,
    domain: post.domain,
    location: post.location,
    ownerName: post.ownerName,
    url: post.type === 'PROJECT' ? `https://openstaff.eu/jobs/${post.id}` : `https://openstaff.eu/professionals/${post.id}`,
    pendingPublicStatus: post.pendingPublicStatus,
    media: {
      id: post.uploadedMedia.id,
      type: post.uploadedMedia.type,
      role: post.uploadedMedia.role,
      url: `https://api.openstaff.eu/public-posts/media/${post.uploadedMedia.id}`,
    },
    document: {
      id: post.uploadedDocument.id,
      fileName: post.uploadedDocument.fileName,
      status: post.uploadedDocument.status,
      url: `https://api.openstaff.eu/public-posts/documents/${post.uploadedDocument.id}`,
    },
    taxonomy: {
      escoCodes: post.escoCodes ?? [],
      naceCodes: post.naceCodes ?? [],
      uniclassCodes: post.uniclassCodes ?? [],
      languageCodes: post.languageCodes ?? [],
    },
  };
}

async function runCleanup() {
  const sessionPath = process.env.EXEC62_SESSION_PATH || DEFAULT_SESSION_PATH;
  assert(fs.existsSync(sessionPath), `Session file not found: ${sessionPath}`);
  const session = readJson(sessionPath);
  const proof = fs.existsSync(session.proofPath) ? readJson(session.proofPath) : {};
  let adminToken = session.adminToken;

  if (process.env.EXEC62_ADMIN_EMAIL && process.env.EXEC62_ADMIN_PASSWORD) {
    const adminLogin = await login(session.baseUrl, process.env.EXEC62_ADMIN_EMAIL, process.env.EXEC62_ADMIN_PASSWORD);
    assert(adminLogin.status === 200, 'cleanup admin login failed');
    adminToken = unwrap(adminLogin).accessToken;
  }
  assert(adminToken, 'cleanup requires admin token or admin credentials');

  const deletedPosts = [];
  for (const post of session.posts) {
    const removed = await http(session.baseUrl, `/public-posts/${post.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    deletedPosts.push({ id: post.id, status: removed.status });
  }

  const hiddenProfiles = [];
  const archivedIdentitySlugs = [];
  for (const actor of session.actors) {
    const profileHidden = await http(session.baseUrl, `/users/${actor.userId}/profile-moderation`, {
      method: 'PATCH',
      token: adminToken,
      body: { moderationStatus: 'PENDING', status: 'OFFLINE' },
    });
    const accountHidden = await http(session.baseUrl, `/users/${actor.userId}/account-status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'OFFLINE' },
    });
    const archiveSlug = `archived-${actor.slug}`;
    let actorToken = actor.token;
    let identityArchived = await http(session.baseUrl, '/onboarding/identity-profile', {
      method: 'PUT',
      token: actorToken,
      body: {
        publicSlug: archiveSlug,
        displayName: 'Marketplace profile unavailable',
        bio: 'This temporary marketplace profile is no longer active.',
        country: 'Romania',
        city: 'Bucharest',
        language: 'ro,en',
        timezone: 'Europe/Bucharest',
      },
    });
    if (
      identityArchived.status === 401 &&
      process.env.EXEC62_ACCOUNT_PASSWORD &&
      actor.email
    ) {
      const actorLogin = await login(session.baseUrl, actor.email, process.env.EXEC62_ACCOUNT_PASSWORD);
      if (actorLogin.status === 200) {
        actorToken = unwrap(actorLogin).accessToken;
        identityArchived = await http(session.baseUrl, '/onboarding/identity-profile', {
          method: 'PUT',
          token: actorToken,
          body: {
            publicSlug: archiveSlug,
            displayName: 'Marketplace profile unavailable',
            bio: 'This temporary marketplace profile is no longer active.',
            country: 'Romania',
            city: 'Bucharest',
            language: 'ro,en',
            timezone: 'Europe/Bucharest',
          },
        });
      }
    }
    const oldIdentity = await http(session.baseUrl, `/profiles/${actor.slug}`);
    const oldPublicProfile = await http(session.baseUrl, `/profiles/public/${actor.slug}`);
    hiddenProfiles.push({
      key: actor.key,
      profileModerationStatus: profileHidden.status,
      accountStatus: accountHidden.status,
      oldPublicProfileStatus: oldPublicProfile.status,
    });
    archivedIdentitySlugs.push({
      key: actor.key,
      oldSlug: actor.slug,
      archiveSlug,
      archiveStatus: identityArchived.status,
      oldIdentityStatus: oldIdentity.status,
    });
  }

  proof.cleanup = {
    completed: true,
    completedAt: new Date().toISOString(),
    deletedPosts,
    hiddenProfiles,
    archivedIdentitySlugs,
  };
  if (proof.readiness) {
    proof.readiness.classification = proof.browserProof?.summary?.pass ? 'BETA_READY' : 'BLOCKED';
    proof.readiness.blockers = proof.browserProof?.summary?.pass
      ? [
          'No dedicated public company listing page exists; company discovery is currently via projects and subcontractor pools.',
          'Public ESCO/Uniclass filtering is data-backed but not exposed as first-class public filter controls.',
          'Video upload/readback was exercised, but full media decode quality remains browser/player dependent.',
        ]
      : ['Browser proof did not pass cleanly.'];
  }
  writeJson(session.proofPath, proof);

  console.log(JSON.stringify({
    cleanup: proof.cleanup,
    readiness: proof.readiness,
  }, null, 2));
}

async function runRecoverPartial() {
  const baseUrl = process.env.EXEC62_BASE_URL || 'https://api.openstaff.eu';
  const runKey = process.env.EXEC62_RECOVER_RUN_KEY;
  const adminEmail = process.env.EXEC62_ADMIN_EMAIL || process.env.EXEC60_ADMIN_EMAIL;
  const adminPassword = process.env.EXEC62_ADMIN_PASSWORD || process.env.EXEC60_ADMIN_PASSWORD;
  const accountPassword =
    process.env.EXEC62_ACCOUNT_PASSWORD ||
    (runKey ? `OpenStaff!${runKey.replace(/^m/, '')}A1` : null);
  const proofPath =
    process.env.EXEC62_RECOVER_PROOF_PATH ||
    path.join(ROOT, `docs/proof/exec62/partial-cleanup-${runKey || 'unknown'}.json`);

  assert(runKey, 'EXEC62_RECOVER_RUN_KEY is required for partial recovery.');
  assert(adminEmail && adminPassword, 'Admin credentials are required for partial recovery.');

  const adminLogin = await login(baseUrl, adminEmail, adminPassword);
  assert(adminLogin.status === 200, `partial recovery admin login failed: ${JSON.stringify(adminLogin.body)}`);
  const adminToken = unwrap(adminLogin).accessToken;

  const usersResponse = await http(baseUrl, '/users', { token: adminToken });
  assert(usersResponse.status === 200, 'partial recovery user list failed');
  const users = Array.isArray(unwrap(usersResponse)) ? unwrap(usersResponse) : [];
  const matchingUsers = users.filter((user) =>
    String(user.email ?? '').includes(runKey) ||
    String(user.profile?.slug ?? '').includes(runKey) ||
    String(user.profile?.displayName ?? '').includes(runKey),
  );

  const postsResponse = await http(baseUrl, '/admin/public-posts', { token: adminToken });
  assert(postsResponse.status === 200, 'partial recovery admin posts list failed');
  const adminPosts = Array.isArray(unwrap(postsResponse)) ? unwrap(postsResponse) : [];
  const matchingPosts = adminPosts.filter((post) => String(post.slug ?? '').includes(runKey));

  const deletedPosts = [];
  for (const post of matchingPosts) {
    const removed = await http(baseUrl, `/public-posts/${post.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    deletedPosts.push({ id: post.id, slug: post.slug, status: removed.status });
  }

  const hiddenUsers = [];
  for (const user of matchingUsers) {
    const profileHidden = await http(baseUrl, `/users/${user.id}/profile-moderation`, {
      method: 'PATCH',
      token: adminToken,
      body: { moderationStatus: 'PENDING', status: 'OFFLINE' },
    });
    const accountHidden = await http(baseUrl, `/users/${user.id}/account-status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'OFFLINE' },
    });
    hiddenUsers.push({
      userId: user.id,
      slug: user.profile?.slug ?? null,
      profileModerationStatus: profileHidden.status,
      accountStatus: accountHidden.status,
    });
  }

  const templates = [...professionalTemplates, ...companyTemplates];
  const archivedIdentities = [];
  if (accountPassword) {
    let actorLoginAttempts = 0;
    for (const template of templates) {
      if (actorLoginAttempts > 0 && actorLoginAttempts % 8 === 0) {
        await sleep(Number.parseInt(process.env.EXEC62_LOGIN_RETRY_DELAY_MS ?? '65000', 10));
      }
      const email = `marketplace.${runKey}.${template.key}@openstaff.eu`;
      const actorLogin = await login(baseUrl, email, accountPassword);
      actorLoginAttempts += 1;
      if (actorLogin.status !== 200) {
        archivedIdentities.push({
          key: template.key,
          oldSlug: `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${runKey}`,
          loginStatus: actorLogin.status,
          archiveStatus: null,
          oldIdentityStatus: null,
        });
        continue;
      }

      const token = unwrap(actorLogin).accessToken;
      const oldSlug = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${runKey}`;
      const archiveSlug = `private-record-${runKey}-${template.key}`;
      const archive = await http(baseUrl, '/onboarding/identity-profile', {
        method: 'PUT',
        token,
        body: {
          publicSlug: archiveSlug,
          displayName: 'Marketplace profile unavailable',
          bio: 'This temporary marketplace profile is no longer active.',
          country: 'Romania',
          city: 'Bucharest',
          language: 'ro,en',
          timezone: 'Europe/Bucharest',
        },
      });
      const oldIdentity = await http(baseUrl, `/profiles/${oldSlug}`);
      archivedIdentities.push({
        key: template.key,
        oldSlug,
        archiveSlug,
        loginStatus: actorLogin.status,
        archiveStatus: archive.status,
        oldIdentityStatus: oldIdentity.status,
      });
    }
  }

  const proof = {
    execution: 'EXEC-62 partial recovery',
    runKey,
    generatedAt: new Date().toISOString(),
    baseUrl,
    matchingUsers: matchingUsers.map((user) => ({
      id: user.id,
      maskedEmail: maskEmail(user.email),
      profileSlug: user.profile?.slug ?? null,
      displayName: user.profile?.displayName ?? null,
    })),
    matchingPosts: matchingPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      moderationStatus: post.moderationStatus,
    })),
    deletedPosts,
    hiddenUsers,
    archivedIdentities,
    cleanupPass:
      deletedPosts.every((item) => [200, 204, 404].includes(item.status)) &&
      hiddenUsers.every((item) => item.profileModerationStatus === 200 && item.accountStatus === 200) &&
      archivedIdentities.every((item) => item.archiveStatus === 200 && [403, 404].includes(item.oldIdentityStatus)),
  };

  writeJson(proofPath, proof);
  console.log(JSON.stringify({
    runKey,
    proofPath,
    deletedPosts: deletedPosts.length,
    hiddenUsers: hiddenUsers.length,
    archivedIdentities: archivedIdentities.length,
    cleanupPass: proof.cleanupPass,
  }, null, 2));
}

const mode = process.env.EXEC62_MODE || 'live';
if (mode === 'cleanup') {
  runCleanup().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (mode === 'recover-partial') {
  runRecoverPartial().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  runLive().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
