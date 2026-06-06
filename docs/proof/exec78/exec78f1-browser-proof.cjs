const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const baseUrl = process.env.EXEC78F1_WEB_BASE_URL || "http://127.0.0.1:3011";
const apiOrigins = ["https://api.openstaff.eu", "http://localhost:8080"];
const proofDir = path.join(__dirname, "exec78f1");
const screenshotDir = path.join(proofDir, "screenshots");

fs.mkdirSync(screenshotDir, { recursive: true });

const user = {
  id: "exec78f1-user",
  email: "shell-proof@openstaff.eu",
  role: "USER",
  approvalStatus: "APPROVED",
  accountStatus: "LIVE",
  displayName: "Shell Proof User",
  actorType: "PROFESSIONAL",
  onboardingStep: 5,
  onboardingDone: true,
  onboardingCurrentStep: "COMPLETED",
  onboardingCompletedSteps: ["IDENTITY", "PROFILE", "COMPANY", "COMPLETION"],
  identityState: {
    hasProfessionalIdentity: true,
    hasCompanyIdentity: true,
    selectedIdentityType: "BOTH",
    identityProfileStatus: "APPROVED",
    companyProfileStatus: "APPROVED",
  },
  profile: {
    id: "exec78f1-profile",
    slug: "shell-proof-user",
    displayName: "Shell Proof User",
    companyName: "Shell Proof Company",
    profileType: "BOTH",
    visibility: "PUBLIC",
    moderationStatus: "APPROVED",
    status: "LIVE",
  },
  subscription: {
    planCode: "GOLD",
    planName: "Gold",
    status: "ACTIVE",
    startedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    contactLimit: 0,
    contactsUsed: 0,
    features: {
      aiProfileSetup: true,
      projectIngestion: true,
      timesheets: true,
      invoices: true,
      complianceAdvanced: true,
    },
  },
};

const marketplacePost = {
  id: "civic-retrofit",
  slug: "bucharest-civic-retrofit",
  type: "PROJECT",
  title: "Bucharest Civic Retrofit",
  description: "Electrical and building services package for an active civic retrofit.",
  summary: "Verified contractors and professionals may review this opportunity.",
  domain: "Construction",
  location: "Bucharest",
  status: "LIVE",
  moderationStatus: "APPROVED",
  visibility: "PUBLIC",
  value: "EUR 250,000",
  currencyCode: "EUR",
  vatRate: 19,
  budgetMin: 200000,
  budgetMax: 250000,
  salaryMin: null,
  salaryMax: null,
  ownerName: "Bucharest Civic Works",
  ownerType: "COMPANY",
  bannerUrl: null,
  experienceLabel: "Commercial retrofit delivery",
  certifications: "Electrical installation",
  certificationsOffered: null,
  escoCodes: ["7411.1"],
  naceCodes: ["43.21"],
  uniclassCodes: ["Ss_25_30_95"],
  languageCodes: ["en", "ro"],
  classificationJson: {},
  fiscalMetadataJson: {},
  country: { id: "ro", name: "Romania", code: "RO" },
  region: { id: "b", name: "Bucuresti-Ilfov" },
  city: { id: "bucharest", name: "Bucharest" },
  media: [],
  mediaAssets: [],
  documents: [],
  externalLinks: [],
  createdAt: "2026-06-01T10:00:00.000Z",
  updatedAt: "2026-06-05T10:00:00.000Z",
};

const professionalPost = {
  ...marketplacePost,
  id: "electrical-professional",
  slug: "electrical-professional",
  type: "PROFESSIONAL",
  title: "Electrical Project Specialist",
  ownerName: "Elena Ionescu",
  ownerType: "PROFESSIONAL",
  value: "Available for verified projects",
};

const companyPost = {
  ...marketplacePost,
  id: "retrofit-contractor",
  slug: "retrofit-contractor",
  type: "SUBCONTRACTOR_POOL",
  title: "Retrofit Contractor Network",
  ownerName: "Civic Retrofit Contractors",
  ownerType: "COMPANY",
  value: "B2B delivery capacity",
};

const project = {
  id: "shell-project",
  slug: "shell-project",
  name: "Civic Retrofit Delivery",
  summary: "Active delivery workspace for the civic retrofit.",
  status: "ACTIVE",
  engagementModel: "B2B",
  visibility: "PRIVATE",
  location: "Bucharest",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-09-30T00:00:00.000Z",
  responseDeadline: null,
  publishedAt: null,
  archivedAt: null,
  budgetMinCents: 20000000,
  budgetMaxCents: 25000000,
  currencyCode: "EUR",
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
  createdById: user.id,
  owner: { id: user.id, email: user.email, role: user.role },
  geography: { country: null, region: null, city: null },
  primaryLanguage: null,
  classifications: { escoSkills: [], naceCodes: [], uniclassCodes: [] },
  counts: { jobRequests: 2, conditions: 1, documents: 3, aiInterpretation: 0 },
  aggregates: { jobRequestStatusCounts: { OPEN: 2 } },
  aiInterpretation: null,
  escoSkills: [],
  naceCodes: [],
  uniclassCodes: [],
};

const notificationPreference = {
  id: "notification-preference",
  userId: user.id,
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  categories: {
    ACCOUNT: true,
    BILLING: true,
    VERIFICATION: true,
    PROJECTS: true,
    MESSAGING: true,
    WORKFORCE: true,
    PAYROLL: true,
    RELU: true,
    ADMIN: true,
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-06-05T00:00:00.000Z",
};

function responseJson(data, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  };
}

async function installApiMocks(page) {
  const handler = async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname === "/auth/me") {
      return route.fulfill(responseJson(user));
    }
    if (pathname === "/ui-config") {
      return route.fulfill(
        responseJson({
          header: {
            logoDataUrl: "",
            logoAlt: "OpenStaff logo",
            menu: [
              { label: "Projects", href: "/projects" },
              { label: "Professionals", href: "/professionals" },
            ],
          },
          footer: {
            logoDataUrl: "",
            logoAlt: "OpenStaff footer logo",
            columns: [],
            bottomText: "OpenStaff",
          },
          branding: {
            primaryColor: "#1E3A8A",
            accentColor: "#10B981",
            backgroundColor: "#F8FAFC",
            textColor: "#1E293B",
          },
        }),
      );
    }
    if (pathname === "/notifications/unread-count") {
      return route.fulfill(responseJson({ unreadCount: 3 }));
    }
    if (pathname === "/notifications/preferences") {
      return route.fulfill(responseJson(notificationPreference));
    }
    if (pathname === "/notifications") {
      return route.fulfill(responseJson({ unreadCount: 3, items: [] }));
    }
    if (pathname === "/conversations" || pathname === "/messages/conversations") {
      return route.fulfill(responseJson([]));
    }
    if (pathname === "/public-posts/me") {
      return route.fulfill(responseJson([marketplacePost]));
    }
    if (pathname === "/public-posts") {
      const type = url.searchParams.get("type");
      if (type === "PROFESSIONAL") {
        return route.fulfill(responseJson([professionalPost]));
      }
      if (type === "SUBCONTRACTOR_POOL") {
        return route.fulfill(responseJson([companyPost]));
      }
      return route.fulfill(responseJson([marketplacePost]));
    }
    if (pathname === "/projects") {
      return route.fulfill(responseJson([project]));
    }

    return route.fulfill(responseJson({ ok: true }));
  };

  for (const origin of apiOrigins) {
    await page.route(`${origin}/**`, handler);
  }
}

async function createAuthenticatedPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installApiMocks(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("openstaff_web_access_token", "exec78f1-token");
    window.localStorage.setItem("openstaff_web_refresh_token", "exec78f1-refresh");
  });

  return { context, page, consoleErrors, pageErrors };
}

async function shellSnapshot(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('[data-shell-mode="authenticated"]');
    const header = document.querySelector('[data-authenticated-shell="header"]');
    const links = Array.from(
      document.querySelectorAll(
        '[data-authenticated-shell="header"] a, [data-authenticated-shell="mobile-navigation"] a',
      ),
    ).map((link) => ({
      text: (link.textContent || "").trim().replace(/\s+/g, " "),
      href: link.getAttribute("href"),
      current: link.getAttribute("aria-current"),
    }));
    const forbiddenPattern =
      /Search|Institutions?|Procurement|Governance|Contracts|Documents|Compliance|RELU|coming soon/i;
    const shellText = [
      header?.textContent || "",
      document.querySelector('[data-authenticated-shell="mobile-navigation"]')?.textContent || "",
    ].join(" ");
    const desktopLabels = Array.from(
      document.querySelectorAll(
        'nav[aria-label="Authenticated navigation"] > div:first-child a > span:first-of-type',
      ),
    ).map((label) => (label.textContent || "").trim().replace(/\s+/g, " "));
    const mobileLabels = Array.from(
      document.querySelectorAll(
        '[data-authenticated-shell="mobile-navigation"] > div > a, [data-authenticated-shell="mobile-navigation"] > div > button',
      ),
    ).map((item) => (item.textContent || "").trim().replace(/\s+/g, " "));

    return {
      shellPresent: Boolean(shell && header),
      shellMode: document.querySelector("[data-shell-mode]")?.getAttribute("data-shell-mode"),
      links,
      activeLinks: links.filter((link) => link.current === "page"),
      forbiddenText: shellText.match(forbiddenPattern)?.[0] || null,
      searchCount: header?.querySelectorAll('input[type="search"], input[placeholder*="Caut"]').length || 0,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      overflow:
        document.documentElement.scrollWidth > window.innerWidth + 1 ||
        document.body.scrollWidth > window.innerWidth + 1,
      headerRect: header?.getBoundingClientRect().toJSON() || null,
      desktopLabels,
      mobileLabels,
    };
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function validateRoute({
  browser,
  route,
  expectedHref,
  viewport,
  viewportName,
  screenshotName,
}) {
  const { context, page, consoleErrors, pageErrors } = await createAuthenticatedPage(
    browser,
    viewport,
  );
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator('[data-shell-mode="authenticated"]').waitFor({ timeout: 10_000 });

  const before = await shellSnapshot(page);
  const expectedActive = before.activeLinks.filter((link) => link.href === expectedHref);

  assert(before.shellPresent, `${route}: authenticated shell missing`);
  assert(before.shellMode === "authenticated", `${route}: wrong shell mode`);
  assert(expectedActive.length >= 1, `${route}: expected active destination ${expectedHref}`);
  assert(before.searchCount === 0, `${route}: authenticated Search exposed`);
  assert(!before.forbiddenText, `${route}: forbidden shell text ${before.forbiddenText}`);
  assert(!before.overflow, `${route}: horizontal overflow detected`);
  assert(pageErrors.length === 0, `${route}: page errors ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `${route}: console errors ${consoleErrors.join(" | ")}`);

  let noLayoutShift = true;
  if (viewportName === "desktop") {
    assert(
      before.desktopLabels.join("|") ===
        "Dashboard|Opportunities|Companies|Professionals|Projects|Messages|Notifications",
      `${route}: desktop destination order mismatch`,
    );
    const hoverTarget = page.locator(
      'nav[aria-label="Authenticated navigation"] > div:first-child a[href="/jobs"]',
    );
    await hoverTarget.hover();
    const afterHover = await shellSnapshot(page);
    noLayoutShift =
      before.headerRect?.height === afterHover.headerRect?.height &&
      before.headerRect?.width === afterHover.headerRect?.width;
    assert(noLayoutShift, `${route}: header geometry shifted on hover`);
  } else {
    assert(
      before.mobileLabels.join("|") === "Home|Explore|Projects|Messages|More",
      `${route}: mobile destination order mismatch`,
    );
  }

  const screenshotPath = path.join(screenshotDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  await context.close();
  return {
    route,
    viewport: viewportName,
    screenshot: path.relative(__dirname, screenshotPath).replaceAll("\\", "/"),
    activeHref: expectedHref,
    shellMode: before.shellMode,
    searchCount: before.searchCount,
    forbiddenText: before.forbiddenText,
    overflow: before.overflow,
    headerHeight: before.headerRect?.height || null,
    noLayoutShift,
    desktopLabels: before.desktopLabels,
    mobileLabels: before.mobileLabels,
    consoleErrors,
    pageErrors,
  };
}

async function validateCompactDesktop(browser) {
  const { context, page } = await createAuthenticatedPage(browser, {
    width: 1024,
    height: 768,
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  const more = page.getByRole("button", { name: "More" });
  await more.click();
  const menu = page.getByRole("menu", { name: "More destinations" });
  await menu.waitFor();
  const menuText = (await menu.innerText()).replace(/\s+/g, " ").trim();
  assert(menuText === "Companies Professionals", `Compact More mismatch: ${menuText}`);
  const screenshotPath = path.join(screenshotDir, "desktop-1024-more.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();
  return {
    viewport: "desktop-compact",
    menuText,
    screenshot: path.relative(__dirname, screenshotPath).replaceAll("\\", "/"),
  };
}

async function validateMobileMore(browser) {
  const { context, page } = await createAuthenticatedPage(browser, {
    width: 320,
    height: 720,
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  const more = page.getByRole("button", { name: "More destinations" });
  await more.click();
  const dialog = page.getByRole("dialog", { name: "More destinations" });
  await dialog.waitFor();
  const dialogText = (await dialog.innerText()).replace(/\s+/g, " ").trim();
  assert(
    dialogText === "More destinations \u00d7 Companies Professionals",
    `Mobile More mismatch: ${dialogText}`,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assert(!overflow, "Mobile More has horizontal overflow");
  const screenshotPath = path.join(screenshotDir, "mobile-320-more.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();
  return {
    viewport: "mobile-narrow",
    dialogText,
    overflow,
    screenshot: path.relative(__dirname, screenshotPath).replaceAll("\\", "/"),
  };
}

async function validateAccountMenu(browser) {
  const { context, page } = await createAuthenticatedPage(browser, {
    width: 390,
    height: 844,
  });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByRole("button", { name: "Open account menu" }).click();
  const menu = page.getByRole("menu", { name: "Account" });
  await menu.waitFor();
  const text = (await menu.innerText()).replace(/\s+/g, " ").trim();
  assert(text.includes("Professional and company profiles"), "Descriptive identity missing");
  assert(text.includes("Profile") && text.includes("Security") && text.includes("Logout"), "Account actions missing");
  assert(!/Acting as|Authority|Delegation|Scope/i.test(text), "Authority semantics exposed");
  const screenshotPath = path.join(screenshotDir, "mobile-account-menu.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();
  return {
    safeIdentityPresentation: true,
    screenshot: path.relative(__dirname, screenshotPath).replaceAll("\\", "/"),
  };
}

async function validateMode(browser, route, expectedMode, authenticated) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await installApiMocks(page);
  if (authenticated) {
    await page.addInitScript(() => {
      window.localStorage.setItem("openstaff_web_access_token", "exec78f1-token");
      window.localStorage.setItem("openstaff_web_refresh_token", "exec78f1-refresh");
    });
  }
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator(`[data-shell-mode="${expectedMode}"]`).waitFor({ timeout: 10_000 });
  const mode = await page.locator("[data-shell-mode]").getAttribute("data-shell-mode");
  const authenticatedHeaderCount = await page
    .locator('[data-authenticated-shell="header"]')
    .count();
  assert(mode === expectedMode, `${route}: expected ${expectedMode}, got ${mode}`);
  assert(
    expectedMode === "authenticated" ? authenticatedHeaderCount === 1 : authenticatedHeaderCount === 0,
    `${route}: shell separation failed`,
  );
  await context.close();
  return { route, expectedMode, authenticated, passed: true };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const routes = [
      { route: "/dashboard", expectedHref: "/dashboard", name: "dashboard" },
      { route: "/jobs", expectedHref: "/jobs", name: "opportunities" },
      { route: "/projects", expectedHref: "/projects", name: "projects" },
      { route: "/messages", expectedHref: "/messages", name: "messages" },
      { route: "/notifications", expectedHref: "/notifications", name: "notifications" },
    ];

    for (const item of routes) {
      results.push(
        await validateRoute({
          browser,
          route: item.route,
          expectedHref: item.expectedHref,
          viewport: { width: 1440, height: 900 },
          viewportName: "desktop",
          screenshotName: `desktop-${item.name}.png`,
        }),
      );
    }

    for (const item of routes) {
      results.push(
        await validateRoute({
          browser,
          route: item.route,
          expectedHref: item.expectedHref,
          viewport: { width: 390, height: 844 },
          viewportName: "mobile",
          screenshotName: `mobile-${item.name}.png`,
        }),
      );
    }

    const supplemental = {
      compactDesktop: await validateCompactDesktop(browser),
      mobileMore: await validateMobileMore(browser),
      accountMenu: await validateAccountMenu(browser),
      modes: [
        await validateMode(browser, "/", "public", true),
        await validateMode(browser, "/jobs", "public", false),
        await validateMode(browser, "/jobs", "authenticated", true),
        await validateMode(browser, "/onboarding/identity-type", "onboarding", true),
      ],
    };

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      passed: true,
      routes: results,
      supplemental,
    };
    fs.writeFileSync(
      path.join(proofDir, "browser-proof.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

module.exports = {
  assert,
  baseUrl,
  createAuthenticatedPage,
  installApiMocks,
  shellSnapshot,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
