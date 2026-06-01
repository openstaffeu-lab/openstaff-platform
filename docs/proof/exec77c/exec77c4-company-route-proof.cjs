const fs = require("fs");
const http = require("http");
const path = require("path");

function loadPlaywright() {
  const candidates = [
    "playwright",
    path.join(
      process.env.LOCALAPPDATA || "",
      "npm-cache",
      "_npx",
      "e41f203b7505f1fb",
      "node_modules",
      "playwright",
    ),
    path.join(
      process.env.LOCALAPPDATA || "",
      "npm-cache",
      "_npx",
      "420ff84f11983ee5",
      "node_modules",
      "playwright",
    ),
  ];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next known local Playwright location.
    }
  }

  throw new Error("Playwright runtime was not found");
}

const { chromium } = loadPlaywright();

const baseUrl = process.env.EXEC77C_COMPANY_BASE_URL || "http://127.0.0.1:3007";
const mockApiPort = Number(process.env.EXEC77C_COMPANY_MOCK_API_PORT || 3001);
const screenshotDir = path.resolve(__dirname, "screenshots");
const outputPath = path.resolve(__dirname, "exec77c4-company-route-proof.json");

const companySlug = "exec77c-company-proof";

const marketplaceProfile = {
  id: "exec77c-subcontractor-pool",
  slug: companySlug,
  type: "SUBCONTRACTOR_POOL",
  title: "OpenStaff Verified Company Pool",
  description: "Approved cross-border company capability profile for route validation.",
  summary: "Approved company and subcontractor discovery profile.",
  domain: "Infrastructure",
  location: "Romania, European Union",
  status: "LIVE",
  visibility: "PUBLIC",
  moderationStatus: "APPROVED",
  value: "Available for engagement",
  ownerName: "OpenStaff Verified Company Pool",
  ownerType: "COMPANY",
  bannerUrl: null,
  experienceLabel: "Enterprise workforce operations",
  certifications: "ISO 9001",
  certificationsOffered: null,
  escoCodes: ["1323.1"],
  naceCodes: ["41.20"],
  uniclassCodes: ["Ss_25_30_95"],
  languageCodes: ["en", "ro"],
  classificationJson: {},
  fiscalMetadataJson: {},
  media: [],
  mediaAssets: [],
  documents: [],
  externalLinks: [],
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-06-01T08:00:00.000Z",
};

const publicCompanyProfile = {
  id: "exec77c-company-profile",
  slug: companySlug,
  displayName: "OpenStaff Verified Company Pool",
  companyName: "OpenStaff Verified Company Pool",
  profileType: "SUBCONTRACTOR_POOL",
  publicHeadline: "Enterprise workforce operations partner",
  summary: "Approved company profile used for company route validation.",
  description: "Approved company profile used for company route validation.",
  websiteUrl: "https://openstaff.eu",
  publicEmail: "info@openstaff.eu",
  publicPhone: "+40 770 123 456",
  visibility: "PUBLIC",
  moderationStatus: "APPROVED",
  status: "LIVE",
  availabilityStatus: "AVAILABLE",
  geography: {
    country: { id: "ro", code: "RO", name: "Romania" },
    region: { id: "bucharest-ilfov", name: "Bucharest-Ilfov" },
    city: { id: "bucharest", name: "Bucharest" },
  },
  languages: [
    { id: "en", code: "en", name: "English" },
    { id: "ro", code: "ro", name: "Romanian" },
  ],
  escoSkills: [{ id: "esco-1323-1", code: "1323.1", title: "Construction managers" }],
  naceCodes: [{ id: "nace-4120", code: "41.20", title: "Construction of buildings" }],
  uniclassCodes: [{ id: "uniclass-ss", code: "Ss_25_30_95", title: "Workforce systems" }],
  contractorProfile: {
    tradeFocus: "Infrastructure, compliance, and cross-border workforce operations",
    teamSize: 24,
    serviceArea: "European Union",
  },
  professionalProfile: null,
  assets: {
    logoUrl: null,
    photoUrl: null,
    bannerUrl: null,
    portfolioUrls: [],
  },
  trust: {
    status: "APPROVED",
    verificationStatus: "APPROVED",
  },
  companyPage: {
    seo: {
      title: "OpenStaff Verified Company Pool | OpenStaff",
      description: "Approved company profile used for company route validation.",
    },
    bannerUrl: null,
    logoUrl: null,
    gallery: [],
    projects: [
      {
        id: "exec77c-company-project",
        slug: "exec77c-company-project",
        title: "Structured Workforce Deployment",
        summary: "Company project proof for public company page routing.",
        description: "Company project proof for public company page routing.",
        domain: "Infrastructure",
        location: "Romania",
        value: "To be confirmed",
        status: "LIVE",
        bannerUrl: null,
        taxonomy: {
          escoCodes: ["1323.1"],
          naceCodes: ["41.20"],
          uniclassCodes: ["Ss_25_30_95"],
        },
        media: [],
        documents: [],
      },
    ],
    certifications: ["ISO 9001"],
    taxonomy: {
      esco: [{ id: "esco-1323-1", code: "1323.1", title: "Construction managers" }],
      nace: [{ id: "nace-4120", code: "41.20", title: "Construction of buildings" }],
      uniclass: [{ id: "uniclass-ss", code: "Ss_25_30_95", title: "Workforce systems" }],
    },
    aiSummary: {
      text: "Approved company profile used for company route validation.",
      sourceResultId: null,
      status: "APPROVED",
      score: 94,
      fallbackUsed: false,
    },
    contactCta: {
      email: "info@openstaff.eu",
      phone: "+40 770 123 456",
      website: "https://openstaff.eu",
    },
    moderation: {
      visibility: "PUBLIC",
      moderationStatus: "APPROVED",
      lifecycleStatus: "LIVE",
      rule: "Approved public company profile.",
    },
  },
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-06-01T08:00:00.000Z",
};

const routes = [
  {
    path: "/companies",
    name: "companies-index",
    expectedFinalPath: "/professionals",
    expectedText: "Professionals and subcontractors",
  },
  {
    path: `/companies/${companySlug}`,
    name: "company-detail",
    expectedFinalPath: `/companies/${companySlug}`,
    expectedText: "OpenStaff Verified Company Pool",
  },
  {
    path: "/",
    name: "homepage-company-discovery",
    expectedFinalPath: "/",
    expectedText: "Companies and professionals ready for structured work.",
  },
  {
    path: "/professionals",
    name: "company-discovery-surface",
    expectedFinalPath: "/professionals",
    expectedText: "OpenStaff Verified Company Pool",
  },
];

function mockApiPayload(url) {
  if (url.includes("/ui-config")) {
    return {
      header: { logoDataUrl: "", logoAlt: "OpenStaff logo", menu: [] },
      footer: {
        logoDataUrl: "",
        logoAlt: "OpenStaff footer logo",
        columns: [],
        bottomText: "Copyright 2026 OpenStaff.eu. All rights reserved.",
      },
      branding: {
        primaryColor: "#1E3A8A",
        accentColor: "#14B8A6",
        backgroundColor: "#F8FAFC",
        textColor: "#1E293B",
      },
    };
  }

  if (url.includes("/companies/public/")) {
    return publicCompanyProfile;
  }

  if (url.includes("/public-posts")) {
    if (url.includes("type=PROJECT")) {
      return [];
    }

    if (url.includes("type=PROFESSIONAL")) {
      return [];
    }

    if (url.includes("type=SUBCONTRACTOR_POOL")) {
      return [marketplaceProfile];
    }

    return [marketplaceProfile];
  }

  if (url.includes("/health")) {
    return { status: "ok" };
  }

  if (url.includes("/status")) {
    return { status: "ok", db: "healthy", readiness: { errors: [], warnings: [] } };
  }

  if (url.includes("/auth/me")) {
    return { user: null };
  }

  if (url.includes("/profile")) {
    return { profile: null, data: null };
  }

  return { data: [], status: "ok" };
}

function startMockApiServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://127.0.0.1:${mockApiPort}`);
    const payload = mockApiPayload(requestUrl.toString());

    response.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type",
    });

    if (request.method === "OPTIONS") {
      response.end();
      return;
    }

    response.end(JSON.stringify(payload));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(mockApiPort, "127.0.0.1", () => resolve(server));
  });
}

async function configureApiMocks(page) {
  await page.route("**/*", async (requestRoute) => {
    const url = requestRoute.request().url();
    const isApiRequest =
      url.includes("api.openstaff.eu") ||
      url.includes("localhost:3001") ||
      url.includes("127.0.0.1:3001");

    if (!isApiRequest) {
      await requestRoute.continue();
      return;
    }

    await requestRoute.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockApiPayload(url)),
    });
  });
}

async function runRoute(page, route, viewportName) {
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      badResponses.push({ status, url: response.url() });
    }
  });

  const response = await page.goto(`${baseUrl}${route.path}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });

  const finalUrl = new URL(page.url());
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const overflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth,
  }));

  if (viewportName === "desktop" && route.name === "companies-index") {
    await page.screenshot({
      path: path.join(screenshotDir, "company-route-companies-desktop.png"),
      fullPage: true,
    });
  }

  if (viewportName === "mobile" && route.name === "companies-index") {
    await page.screenshot({
      path: path.join(screenshotDir, "company-route-companies-mobile.png"),
      fullPage: true,
    });
  }

  if (viewportName === "desktop" && route.name === "company-detail") {
    await page.screenshot({
      path: path.join(screenshotDir, "company-route-detail-desktop.png"),
      fullPage: true,
    });
  }

  const footerFindTalent = await page
    .locator("footer")
    .getByRole("link", { name: "Find Talent" })
    .getAttribute("href")
    .catch(() => null);

  const homepageCompanyDiscoveryLink =
    route.path === "/"
      ? await page
          .getByRole("link", { name: /View profiles/i })
          .getAttribute("href")
          .catch(() => null)
      : null;

  return {
    name: route.name,
    path: route.path,
    viewport: viewportName,
    initialStatus: response ? response.status() : null,
    finalPathname: finalUrl.pathname,
    expectedFinalPath: route.expectedFinalPath,
    expectedTextPresent: text.includes(route.expectedText),
    footerFindTalent,
    homepageCompanyDiscoveryLink,
    overflow,
    consoleErrors,
    pageErrors,
    badResponses,
    passed:
      finalUrl.pathname === route.expectedFinalPath &&
      text.includes(route.expectedText) &&
      !overflow.hasHorizontalOverflow &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      badResponses.length === 0,
  };
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });

  const mockApiServer = await startMockApiServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 1100 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      for (const route of routes) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        });
        await configureApiMocks(page);
        results.push(await runRoute(page, route, viewport.name));
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => mockApiServer.close(resolve));
  }

  const summary = {
    verdict: results.every((result) => result.passed) ? "PASS" : "FAIL",
    baseUrl,
    checkedAt: new Date().toISOString(),
    mockApiUrl: `http://127.0.0.1:${mockApiPort}`,
    rootCompaniesResolution: {
      source: "/companies",
      target: "/professionals",
      strategy: "permanentRedirect",
    },
    routesReviewed: routes.map((route) => route.path),
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  if (summary.verdict !== "PASS") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
