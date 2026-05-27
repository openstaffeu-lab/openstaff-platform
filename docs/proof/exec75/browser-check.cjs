const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");

const { chromium, devices } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const repoRoot = path.resolve(__dirname, "../../..");
const adminRoot = path.join(repoRoot, "apps", "admin");
const webRoot = path.join(repoRoot, "apps", "admin", "web");
const screenshotDir = path.join(__dirname, "screenshots");
const apiPort = 18085;
const adminPort = 3115;
const webPort = 3116;
const apiBase = `http://127.0.0.1:${apiPort}`;
const adminBase = `http://127.0.0.1:${adminPort}`;
const webBase = `http://127.0.0.1:${webPort}`;

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const users = {
  "admin-token": user("admin-exec75", "ops.admin@openstaff.eu", "ADMIN", "Operations Admin"),
  "ai-token": user("ai-exec75", "ai.moderator@openstaff.eu", "AI_MODERATOR", "AI Moderator"),
  "super-token": user("super-exec75", "superadmin@openstaff.eu", "SUPERADMIN", "Technical Superadmin"),
};

const companyProfile = {
  id: "profile-exec75-company",
  slug: "exec75-company",
  profileType: "CONTRACTOR",
  displayName: "Exec75 Asset Works SRL",
  companyName: "Exec75 Asset Works SRL",
  publicHeadline: "Approved public company assets through anonymous profile asset delivery",
  summary: "Approved company profile used for EXEC-75 public asset browser proof.",
  description: "Logo, banner, and gallery assets are served through /profiles/assets/:documentId.",
  websiteUrl: "https://openstaff.eu",
  publicEmail: "ops@example.openstaff.eu",
  publicPhone: "+40 700 000 075",
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
    tradeFocus: "Electrical retrofit and data center delivery",
    teamSize: 38,
    serviceArea: "Romania and EU mobilization",
  },
  professionalProfile: null,
  assets: {
    logoUrl: "/profiles/assets/exec75-logo",
    photoUrl: null,
    bannerUrl: "/profiles/assets/exec75-banner",
    portfolioUrls: ["/profiles/assets/exec75-gallery"],
  },
  trust: {
    status: "APPROVED",
    verificationStatus: "VERIFIED",
  },
  createdAt: "2026-05-26T18:00:00.000Z",
  updatedAt: "2026-05-26T18:00:00.000Z",
  companyPage: {
    seo: {
      title: "Exec75 Asset Works SRL | OpenStaff company profile",
      description: "Approved company page with public-safe approved asset delivery.",
    },
    bannerUrl: "/profiles/assets/exec75-banner",
    logoUrl: "/profiles/assets/exec75-logo",
    gallery: ["/profiles/assets/exec75-gallery"],
    projects: [],
    certifications: ["Low voltage", "HSE"],
    taxonomy: {
      esco: [{ id: "esco-7412", code: "7412.1", title: "Electrician" }],
      nace: [{ id: "nace-4321", code: "43.21", title: "Electrical installation" }],
      uniclass: [{ id: "uniclass-pr75", code: "Pr_75_50", title: "Electrical systems" }],
    },
    aiSummary: {
      text: "RELU mapped this company to approved electrical installation delivery.",
      sourceResultId: null,
      status: "REVIEWED",
      score: 93,
      fallbackUsed: false,
    },
    contactCta: {
      email: "ops@example.openstaff.eu",
      phone: "+40 700 000 075",
      website: "https://openstaff.eu",
    },
    moderation: {
      visibility: "PUBLIC",
      moderationStatus: "APPROVED",
      lifecycleStatus: "LIVE",
      rule: "Public rendering requires approved profile and approved asset.",
    },
  },
};

const reluResult = {
  kind: "classification",
  id: "relu-result-exec75",
  runId: "relu-run-exec75",
  sourceType: "PUBLIC_POST",
  sourceId: "post-exec75",
  userId: "user-exec75",
  domain: "TAXONOMY",
  status: "COMPLETED",
  inputSnapshot: { title: "Electrical retrofit", location: "Bucharest" },
  outputData: {
    category: "Electrical installation",
    confidence: 93,
    summary: "Approved moderation summary without raw infrastructure payloads.",
  },
  score: 93,
  explanation: "High confidence taxonomy match.",
  overrideData: null,
  fallbackUsed: false,
  errorMessage: null,
  createdAt: "2026-05-26T18:00:00.000Z",
  updatedAt: "2026-05-26T18:00:00.000Z",
  reviewedAt: null,
  reviewedBy: null,
  run: null,
};

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  const apiServer = await startMockApi();
  const adminServer = startDevServer(adminRoot, adminPort);
  const webServer = startDevServer(webRoot, webPort);

  try {
    await waitFor(`${adminBase}/login`, 120_000);
    await waitFor(`${webBase}/companies/exec75-company`, 120_000);
    const proof = await runBrowserChecks();
    await fs.writeFile(path.join(__dirname, "browser-proof.json"), JSON.stringify(proof, null, 2));

    if (!proof.summary.pass) {
      console.error(JSON.stringify(proof.summary, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(proof.summary, null, 2));
    }
  } finally {
    adminServer.kill();
    webServer.kill();
    await new Promise((resolve) => apiServer.close(resolve));
  }
}

function user(id, email, role, displayName) {
  return {
    id,
    email,
    role,
    approvalStatus: "APPROVED",
    accountStatus: "ACTIVE",
    displayName,
    actorType: "ADMIN",
    onboardingStep: 5,
    onboardingDone: true,
    profile: null,
    subscription: null,
  };
}

function startMockApi() {
  const server = http.createServer((req, res) => {
    const method = req.method || "GET";
    const url = new URL(req.url || "/", apiBase);
    const origin = req.headers.origin || "*";
    const auth = req.headers.authorization || "";
    const token = auth.replace(/^Bearer\s+/i, "");

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname.startsWith("/profiles/assets/")) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(png);
      return;
    }

    if (url.pathname === "/auth/me") {
      const currentUser = users[token];
      if (!currentUser) {
        json(res, { status: "error", message: "Unauthorized" }, 401);
        return;
      }
      json(res, { status: "ok", data: currentUser });
      return;
    }

    if (url.pathname === "/companies/public/exec75-company") {
      json(res, { status: "ok", data: companyProfile });
      return;
    }

    if (url.pathname === "/ui-config") {
      json(res, {
        status: "ok",
        data: {
          header: {
            logoDataUrl: "",
            logoAlt: "OpenStaff",
            menu: [
              { label: "Projects", href: "/projects" },
              { label: "Professionals", href: "/professionals" },
              { label: "Companies", href: "/companies/exec75-company" },
            ],
          },
          footer: {
            logoDataUrl: "",
            logoAlt: "OpenStaff",
            columns: [],
            bottomText: "EXEC-75 proof",
          },
          branding: {
            primaryColor: "#0f766e",
            accentColor: "#06b6d4",
            backgroundColor: "#f8fafc",
            textColor: "#0f172a",
          },
        },
      });
      return;
    }

    if (url.pathname === "/admin/relu/runs") {
      json(res, [
        {
          id: "relu-run-exec75",
          sourceType: "PUBLIC_POST",
          sourceId: "post-exec75",
          domain: "TAXONOMY",
          status: "COMPLETED",
          score: 93,
          explanation: "High confidence taxonomy match.",
          fallbackUsed: false,
          errorMessage: null,
          inputSnapshot: reluResult.inputSnapshot,
          outputData: reluResult.outputData,
          createdAt: reluResult.createdAt,
          updatedAt: reluResult.updatedAt,
          completedAt: reluResult.createdAt,
          task: null,
        },
      ]);
      return;
    }

    if (url.pathname === "/admin/relu/results") {
      json(res, [reluResult]);
      return;
    }

    if (url.pathname === "/relu/prompts-policies") {
      json(res, [
        {
          id: "agent-exec75",
          name: "Technical Prompt Agent",
          type: "PROMPT",
          accessMode: "TECHNICAL",
          enabled: true,
          description: "Visible only to superadmin.",
          systemPrompt: "Infrastructure prompt library.",
          policyJson: { technical: true },
          updatedAt: "2026-05-26T18:00:00.000Z",
        },
      ]);
      return;
    }

    if (method === "PATCH" || method === "POST") {
      json(res, { status: "ok", data: reluResult });
      return;
    }

    json(res, { status: "error", message: `No mock for ${method} ${url.pathname}` }, 404);
  });

  return new Promise((resolve) => {
    server.listen(apiPort, "127.0.0.1", () => resolve(server));
  });
}

function startDevServer(cwd, port) {
  return spawn(
    "cmd.exe",
    ["/c", "npm.cmd", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: apiBase,
      },
      stdio: "ignore",
      windowsHide: true,
    },
  );
}

function json(res, data, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function waitFor(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const status = await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          resolve(res.statusCode || 0);
        });
        req.on("error", reject);
        req.setTimeout(2000, () => req.destroy(new Error("timeout")));
      });
      if (status > 0 && status < 500) {
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runBrowserChecks() {
  const browser = await chromium.launch({ headless: true });
  const proof = {
    checkedAtUtc: new Date().toISOString(),
    apiBase,
    adminBase,
    webBase,
    screenshotDir: path.relative(repoRoot, screenshotDir),
    summary: {
      pass: false,
      checkedBrowsers: ["Chrome desktop", "Android Chrome"],
      consoleErrors: [],
      pageErrors: [],
      badResponses: [],
      failedChecks: [],
      assetResponses: [],
      horizontalOverflowPages: [],
    },
    results: [],
  };

  try {
    proof.results.push(await checkPublicCompany(browser, "Chrome desktop", {}));
    proof.results.push(
      await checkPublicCompany(browser, "Android Chrome", devices["Pixel 5"] || {
        viewport: { width: 393, height: 851 },
        isMobile: true,
      }),
    );
    proof.results.push(await checkRole(browser, "ADMIN", "admin-token"));
    proof.results.push(await checkRole(browser, "AI_MODERATOR", "ai-token"));
    proof.results.push(await checkRole(browser, "SUPERADMIN", "super-token"));
  } finally {
    await browser.close();
  }

  for (const result of proof.results) {
    proof.summary.consoleErrors.push(...result.consoleErrors);
    proof.summary.pageErrors.push(...result.pageErrors);
    proof.summary.badResponses.push(...result.badResponses);
    proof.summary.failedChecks.push(...result.failedChecks);
    if (result.assetResponses) {
      proof.summary.assetResponses.push(...result.assetResponses);
    }
    if (result.horizontalOverflowPages) {
      proof.summary.horizontalOverflowPages.push(...result.horizontalOverflowPages);
    }
  }

  proof.summary.pass =
    proof.summary.consoleErrors.length === 0 &&
    proof.summary.pageErrors.length === 0 &&
    proof.summary.badResponses.length === 0 &&
    proof.summary.failedChecks.length === 0 &&
    proof.summary.horizontalOverflowPages.length === 0 &&
    proof.summary.assetResponses.filter((item) => item.status === 200).length >= 6;

  return proof;
}

async function checkPublicCompany(browser, label, options) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    ...options,
  });
  const page = await context.newPage();
  const result = baseResult(label);
  result.assetResponses = [];
  result.horizontalOverflowPages = [];
  wirePage(page, result);

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/profiles/assets/")) {
      result.assetResponses.push({ url, status: response.status() });
    }
  });

  await page.goto(`${webBase}/companies/exec75-company`, { waitUntil: "networkidle" });
  await assertText(page, result, "Exec75 Asset Works SRL");
  await assertText(page, result, "Approved public company assets");
  await assertNoOverflow(page, result, "/companies/exec75-company");
  await page.screenshot({
    path: path.join(screenshotDir, `${slug(label)}-company.png`),
    fullPage: true,
  });
  await context.close();
  return result;
}

async function checkRole(browser, role, token) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(
    ({ tokenValue }) => {
      window.localStorage.setItem("openstaff_admin_access_token", tokenValue);
    },
    { tokenValue: token },
  );
  const page = await context.newPage();
  const result = baseResult(role);
  wirePage(page, result);

  if (role === "ADMIN") {
    await page.goto(`${adminBase}/ai-control`, { waitUntil: "networkidle" });
    await assertText(page, result, "Technical tools are isolated");
    await page.goto(`${adminBase}/admin/imports`, { waitUntil: "networkidle" });
    await assertText(page, result, "Technical tools are isolated");
  }

  if (role === "AI_MODERATOR") {
    await page.goto(`${adminBase}/admin/relu`, { waitUntil: "networkidle" });
    await assertText(page, result, "AI Interpretation Review");
    await page.goto(`${adminBase}/ai-control`, { waitUntil: "networkidle" });
    await assertText(page, result, "This role is limited to RELU review");
  }

  if (role === "SUPERADMIN") {
    await page.goto(`${adminBase}/ai-control`, { waitUntil: "networkidle" });
    await assertText(page, result, "Prompts and Policies");
    await assertText(page, result, "Technical Prompt Agent");
  }

  await assertNoOverflow(page, result, `${role} final route`);
  await page.screenshot({
    path: path.join(screenshotDir, `${slug(role)}.png`),
    fullPage: true,
  });
  await context.close();
  return result;
}

function baseResult(label) {
  return {
    label,
    consoleErrors: [],
    pageErrors: [],
    badResponses: [],
    failedChecks: [],
  };
}

function wirePage(page, result) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      result.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => result.pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.includes("favicon.ico")) {
      result.badResponses.push({ url, status: response.status() });
    }
  });
}

async function assertText(page, result, text) {
  const visible = await page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
  if (!visible) {
    result.failedChecks.push(`Missing text: ${text}`);
  }
}

async function assertNoOverflow(page, result, route) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth, body.scrollWidth) > window.innerWidth + 1;
  });
  if (overflow) {
    result.horizontalOverflowPages.push(route);
  }
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
