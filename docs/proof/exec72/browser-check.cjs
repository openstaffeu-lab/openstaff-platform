const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..", "..", "..");
const playwrightRoot = path.join(root, ".logs", "exec62-playwright", "node_modules");
const { chromium, devices } = require(path.join(playwrightRoot, "playwright"));

const apiPort = 18080;
const webPort = 3100;
const apiBase = `http://127.0.0.1:${apiPort}`;
const webBase = `http://127.0.0.1:${webPort}`;
const proofPath = path.join(__dirname, "browser-proof.json");

const companyProfile = {
  id: "profile-exec72-company",
  slug: "exec72-company",
  profileType: "CONTRACTOR",
  displayName: "Exec72 Critical Works SRL",
  companyName: "Exec72 Critical Works SRL",
  publicHeadline: "Industrial contractor for data center, energy, and fit-out packages",
  summary:
    "Exec72 Critical Works SRL delivers moderated industrial packages with verified crews, documented certifications, and RELU-assisted project matching.",
  description:
    "Approved public company profile used for EXEC-72 browser proof.",
  websiteUrl: "https://openstaff.eu",
  publicEmail: "ops@example.openstaff.eu",
  publicPhone: "+40 700 000 072",
  visibility: "PUBLIC",
  moderationStatus: "APPROVED",
  status: "LIVE",
  availabilityStatus: "AVAILABLE",
  geography: {
    country: { id: "country-ro", code: "RO", name: "Romania" },
    region: { id: "region-b", name: "Bucharest" },
    city: { id: "city-b", name: "Bucharest" },
  },
  languages: [{ id: "lang-en", code: "en", name: "English" }],
  escoSkills: [{ id: "esco-7412", code: "7412.1", title: "Electrician" }],
  naceCodes: [{ id: "nace-4321", code: "43.21", title: "Electrical installation" }],
  uniclassCodes: [{ id: "uniclass-pr75", code: "Pr_75_50", title: "Electrical systems" }],
  contractorProfile: {
    tradeFocus: "Electrical and low-voltage delivery",
    teamSize: 42,
    serviceArea: "Romania and EU mobilization",
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
    verificationStatus: "VERIFIED",
  },
  createdAt: "2026-05-26T12:00:00.000Z",
  updatedAt: "2026-05-26T12:00:00.000Z",
  companyPage: {
    seo: {
      title: "Exec72 Critical Works SRL | OpenStaff company profile",
      description:
        "Approved OpenStaff company profile with RELU AI persistence and moderation proof.",
    },
    bannerUrl: null,
    logoUrl: null,
    gallery: [],
    projects: [
      {
        id: "post-exec72-project",
        slug: "exec72-data-center-electrical-package",
        title: "Data center electrical package",
        summary: "Approved public project package linked to the company.",
        description:
          "Electrical panels, cable containment, QA, and handover documentation.",
        domain: "Data Center / Electrical",
        location: "Frankfurt, Germany",
        value: "EUR 480,000",
        status: "LIVE",
        bannerUrl: null,
        taxonomy: {
          escoCodes: ["7412.1"],
          naceCodes: ["43.21"],
          uniclassCodes: ["Pr_75_50"],
        },
        media: [],
        documents: [],
      },
    ],
    certifications: ["Low voltage", "Working at height", "HSE"],
    taxonomy: {
      esco: [{ id: "esco-7412", code: "7412.1", title: "Electrician" }],
      nace: [{ id: "nace-4321", code: "43.21", title: "Electrical installation" }],
      uniclass: [{ id: "uniclass-pr75", code: "Pr_75_50", title: "Electrical systems" }],
    },
    aiSummary: {
      text:
        "RELU mapped Exec72 Critical Works SRL to electrical installation, low-voltage delivery, and data center package readiness.",
      sourceResultId: "relu-result-exec72-company",
      status: "COMPLETED",
      score: 91,
      fallbackUsed: false,
    },
    contactCta: {
      email: "ops@example.openstaff.eu",
      phone: "+40 700 000 072",
      website: "https://openstaff.eu",
    },
    moderation: {
      visibility: "PUBLIC",
      moderationStatus: "APPROVED",
      lifecycleStatus: "LIVE",
      rule:
        "Only PUBLIC, APPROVED, LIVE company profiles and approved media/projects render on this page.",
    },
  },
};

const publicPosts = [
  {
    id: "post-exec72-project",
    slug: "exec72-data-center-electrical-package",
    type: "PROJECT",
    title: "Data center electrical package",
    description:
      "Electrical panels, cable containment, QA, and handover documentation.",
    summary: "Approved public project package linked to the company.",
    domain: "Data Center / Electrical",
    location: "Frankfurt, Germany",
    status: "LIVE",
    moderationStatus: "APPROVED",
    visibility: "PUBLIC",
    value: "EUR 480,000",
    ownerName: "Exec72 Critical Works SRL",
    ownerType: "Contractor",
    classificationJson: { standards: "ESCO 7412.1 / NACE 43.21 / Uniclass Pr_75_50" },
    certifications: "Low voltage, Working at height, HSE",
    media: [],
    mediaAssets: [],
    documents: [],
    externalLinks: [],
    createdAt: "2026-05-26T12:00:00.000Z",
    updatedAt: "2026-05-26T12:00:00.000Z",
  },
  {
    id: "post-exec72-professional",
    slug: "exec72-electrical-supervisor",
    type: "PROFESSIONAL",
    title: "Electrical QA supervisor",
    description: "Approved professional proof record for RELU discovery.",
    summary: "Electrical QA supervisor with data center commissioning exposure.",
    domain: "Data Center / QA",
    location: "Bucharest, Romania",
    status: "LIVE",
    moderationStatus: "APPROVED",
    visibility: "PUBLIC",
    value: "Available for project work",
    ownerName: "Exec72 QA Supervisor",
    ownerType: "Professional",
    classificationJson: { standards: "ESCO 7412.1 / NACE 43.21" },
    certifications: "Low voltage, QA",
    media: [],
    mediaAssets: [],
    documents: [],
    externalLinks: [],
    createdAt: "2026-05-26T12:00:00.000Z",
    updatedAt: "2026-05-26T12:00:00.000Z",
  },
  {
    id: "post-exec72-pool",
    slug: "exec72-electrical-pool",
    type: "SUBCONTRACTOR_POOL",
    title: "Electrical subcontractor pool",
    description: "Approved subcontractor pool proof record.",
    summary: "Electrical crew pool for moderated discovery.",
    domain: "Electrical",
    location: "Romania",
    status: "LIVE",
    moderationStatus: "APPROVED",
    visibility: "PUBLIC",
    value: "Available for packages",
    ownerName: "Exec72 Electrical Pool",
    ownerType: "Subcontractor Pool",
    classificationJson: { standards: "ESCO 7412.1 / NACE 43.21" },
    certifications: "Low voltage, HSE",
    media: [],
    mediaAssets: [],
    documents: [],
    externalLinks: [],
    createdAt: "2026-05-26T12:00:00.000Z",
    updatedAt: "2026-05-26T12:00:00.000Z",
  },
];

function json(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(data));
}

function startMockApi() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, apiBase);
    if (
      url.pathname === "/companies/public/exec72-company" ||
      url.pathname === "/profiles/public/exec72-company"
    ) {
      json(res, { status: "ok", data: companyProfile });
      return;
    }
    if (url.pathname === "/ui-config") {
      json(res, {
        status: "ok",
        data: {
          header: {
            logoDataUrl: "",
            logoAlt: "OpenStaff logo",
            menu: [
              { label: "Active Projects", href: "/projects" },
              { label: "Professionals", href: "/professionals" },
              { label: "Subcontracting Pools", href: "/pools" },
              { label: "Compliance", href: "/compliance" },
              { label: "Logistics", href: "/logistics" },
              { label: "Relu AI", href: "/ai" },
            ],
          },
          footer: {
            logoDataUrl: "",
            logoAlt: "OpenStaff footer logo",
            columns: [],
            bottomText: "EXEC-72 browser proof",
          },
          branding: {
            primaryColor: "#1A237E",
            accentColor: "#00E676",
            backgroundColor: "#F5F7FA",
            textColor: "#263238",
          },
        },
      });
      return;
    }
    if (url.pathname === "/public-posts") {
      const type = url.searchParams.get("type");
      json(res, {
        status: "ok",
        data: type ? publicPosts.filter((post) => post.type === type) : publicPosts,
      });
      return;
    }
    if (url.pathname === "/onboarding/defaults") {
      json(res, {
        status: "ok",
        data: {
          inferredFrom: ["browser-proof"],
          country: "Romania",
          countryCode: "RO",
          language: "en",
          currency: "RON",
          vatMode: "domestic",
          timezone: "Europe/Bucharest",
          city: "Bucharest",
          phonePrefix: "+40",
          explanation: "EXEC-72 mocked defaults",
        },
      });
      return;
    }
    json(res, { status: "ok", data: {} });
  });

  return new Promise((resolve) => {
    server.listen(apiPort, "127.0.0.1", () => resolve(server));
  });
}

function startWeb() {
  const child = spawn(
    "cmd.exe",
    ["/c", "npm.cmd", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(webPort)],
    {
      cwd: path.join(root, "apps", "admin", "web"),
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: apiBase,
        NODE_ENV: "development",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout.on("data", () => undefined);
  child.stderr.on("data", () => undefined);
  return child;
}

async function waitForWeb(timeoutMs = 90000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(`${webBase}/companies/exec72-company`);
      if (res.ok) {
        return;
      }
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for public web dev server.");
}

async function runBrowser(run) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(run.contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  const horizontalOverflowPages = [];
  const routeChecks = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      badResponses.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  for (const route of run.routes) {
    await page.goto(`${webBase}${route}`, { waitUntil: "networkidle" });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (hasOverflow) {
      horizontalOverflowPages.push(route);
    }
    routeChecks.push({
      route,
      title: await page.title(),
      containsCompanyName: await page.getByText("Exec72 Critical Works SRL").count(),
      containsReluText: await page.getByText("RELU").count(),
      viewport: page.viewportSize(),
    });
  }

  await browser.close();

  return {
    browser: run.name,
    consoleErrors,
    pageErrors,
    badResponses,
    horizontalOverflowPages,
    routeChecks,
    pass:
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      badResponses.length === 0 &&
      horizontalOverflowPages.length === 0,
  };
}

async function main() {
  const mockApi = await startMockApi();
  const web = startWeb();
  const routes = [
    "/companies/exec72-company",
    "/profiles/exec72-company",
    "/professionals",
    "/publish",
    "/onboarding/company",
  ];

  try {
    await waitForWeb();
    const runs = [
      {
        name: "Chrome desktop",
        contextOptions: {
          viewport: { width: 1440, height: 1000 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
        routes,
      },
      {
        name: "Edge desktop",
        contextOptions: {
          viewport: { width: 1440, height: 1000 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
        },
        routes,
      },
      {
        name: "Android Chrome",
        contextOptions: devices["Pixel 5"],
        routes,
      },
      {
        name: "iPhone Safari",
        contextOptions: devices["iPhone 14"],
        routes,
      },
    ];

    const results = [];
    for (const run of runs) {
      results.push(await runBrowser(run));
    }

    const proof = {
      checkedAtUtc: new Date().toISOString(),
      apiBase,
      webBase,
      routes,
      summary: {
        pass: results.every((result) => result.pass),
        checkedBrowsers: results.map((result) => result.browser),
        consoleErrors: results.flatMap((result) => result.consoleErrors),
        pageErrors: results.flatMap((result) => result.pageErrors),
        badResponses: results.flatMap((result) => result.badResponses),
        horizontalOverflowPages: results.flatMap((result) =>
          result.horizontalOverflowPages.map((route) => `${result.browser}: ${route}`),
        ),
      },
      results,
    };

    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);

    if (!proof.summary.pass) {
      process.exitCode = 1;
    }
  } finally {
    if (web.pid) {
      try {
        execFileSync("taskkill", ["/pid", String(web.pid), "/t", "/f"], {
          stdio: "ignore",
        });
      } catch {
        web.kill();
      }
    }
    await new Promise((resolve) => mockApi.close(resolve));
  }
}

main()
  .then(() => {
    process.exit(process.exitCode ?? 0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

process.on("beforeExit", () => {
  process.exit(process.exitCode ?? 0);
});
