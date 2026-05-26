const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");

const { chromium } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const repoRoot = path.resolve(__dirname, "../../..");
const adminRoot = path.join(repoRoot, "apps", "admin");
const screenshotDir = path.join(__dirname, "screenshots");
const apiPort = 18081;
const webPort = 3101;
const apiBase = `http://127.0.0.1:${apiPort}`;
const webBase = `http://127.0.0.1:${webPort}`;

const adminUser = {
  id: "admin-exec73",
  email: "ops.admin@openstaff.eu",
  role: "ADMIN",
  approvalStatus: "APPROVED",
  accountStatus: "ACTIVE",
  displayName: "Operations Admin",
  actorType: "ADMIN",
  onboardingStep: 5,
  onboardingDone: true,
  profile: null,
  subscription: null,
};

const reluResult = {
  kind: "classification",
  id: "relu-result-exec73",
  runId: "relu-run-exec73",
  sourceType: "PUBLIC_POST",
  sourceId: "post-exec73",
  userId: "user-exec73",
  domain: "TAXONOMY",
  status: "COMPLETED",
  inputSnapshot: {
    title: "Industrial electrical retrofit",
    documents: ["scope.pdf"],
    media: ["site-photo.jpg"],
    location: "Bucharest",
  },
  outputData: {
    category: "Industrial Electrical",
    confidence: 94,
    summary: "RELU matched the listing to electrical retrofit work with permits required.",
    certifications: ["ANRE", "SSM"],
  },
  score: 94,
  explanation: "Strong taxonomy and certification match for industrial electrical delivery.",
  overrideData: null,
  fallbackUsed: false,
  errorMessage: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  reviewedAt: null,
  reviewedBy: null,
  run: null,
};

const mockRoutes = {
  "GET /auth/me": { status: "ok", data: adminUser },
  "POST /auth/login": {
    accessToken: "exec73-token",
    refreshToken: "exec73-refresh",
    user: adminUser,
  },
  "GET /projects": [
    {
      id: "project-exec73",
      title: "Industrial electrical retrofit",
      companyName: "Exec73 Critical Works SRL",
      status: "LIVE",
      moderationStatus: "APPROVED",
      location: "Bucharest",
      category: "Industrial",
      summary: "Panel replacement and cable tray installation for a live industrial facility.",
      budgetMin: 180000,
      budgetMax: 240000,
      currencyCode: "EUR",
      updatedAt: new Date().toISOString(),
    },
  ],
  "GET /countries": [
    { id: "ro", name: "Romania", code: "RO", currency: "EUR", vatRate: 19 },
    { id: "de", name: "Germany", code: "DE", currency: "EUR", vatRate: 19 },
  ],
  "GET /jobs/stats": { liveJobs: 7, pendingJobs: 2 },
  "GET /actors/stats": { totalActors: 34, pendingActors: 3 },
  "GET /relu/queue": {
    summary: {
      pending: 2,
      running: 1,
      completedLast24Hours: 18,
      failedLast24Hours: 0,
      engineStatus: "operational",
    },
    tasks: [],
  },
  "GET /admin/relu/runs": [
    {
      id: "relu-run-exec73",
      taskId: null,
      sourceType: "PUBLIC_POST",
      sourceId: "post-exec73",
      userId: "user-exec73",
      triggeredByUserId: "admin-exec73",
      domain: "TAXONOMY",
      status: "COMPLETED",
      inputSnapshot: reluResult.inputSnapshot,
      outputData: reluResult.outputData,
      score: 94,
      explanation: reluResult.explanation,
      fallbackUsed: false,
      errorMessage: null,
      createdAt: reluResult.createdAt,
      updatedAt: reluResult.updatedAt,
      completedAt: reluResult.createdAt,
      task: null,
    },
  ],
  "GET /admin/relu/results": [reluResult],
  "GET /admin/public-post-media": [
    {
      id: "media-exec73",
      url: "",
      type: "IMAGE",
      alt: "Electrical room site photo",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      post: { id: "post-exec73", title: "Industrial electrical retrofit" },
    },
  ],
  "GET /admin/public-post-documents": [
    {
      id: "document-exec73",
      title: "Scope of Works",
      fileName: "scope-of-works.pdf",
      mimeType: "application/pdf",
      sizeBytes: 482000,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      post: { id: "post-exec73", title: "Industrial electrical retrofit" },
    },
  ],
  "GET /admin/public-posts": [
    {
      id: "post-exec73",
      type: "PROJECT",
      title: "Industrial electrical retrofit",
      summary: "Panel replacement and cable tray installation for a live industrial facility.",
      ownerName: "Exec73 Critical Works SRL",
      ownerType: "COMPANY",
      domain: "Industrial",
      location: "Bucharest",
      status: "PENDING",
      moderationStatus: "PENDING",
      visibility: "PUBLIC",
      value: "EUR 180,000 - 240,000",
      createdAt: new Date().toISOString(),
      media: [{ id: "media-exec73", role: "BANNER", status: "PENDING" }],
      documents: [{ id: "document-exec73" }],
      externalLinks: [],
      comments: [],
      reviews: [],
      privateConversations: [],
    },
  ],
};

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  const apiServer = await startMockApi();
  let devServer;

  try {
    devServer = startDevServer();
    await waitFor(`${webBase}/login`, 90_000);
    const proof = await runBrowserChecks();
    await fs.writeFile(
      path.join(__dirname, "browser-proof.json"),
      JSON.stringify(proof, null, 2),
    );

    if (!proof.summary.pass) {
      console.error(JSON.stringify(proof.summary, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(proof.summary, null, 2));
    }
  } finally {
    if (devServer) {
      devServer.kill();
    }
    await new Promise((resolve) => apiServer.close(resolve));
  }
}

function startMockApi() {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  );

  const server = http.createServer((req, res) => {
    const method = req.method || "GET";
    const url = new URL(req.url || "/", apiBase);
    const key = `${method} ${url.pathname}`;

    res.setHeader("Access-Control-Allow-Origin", `http://127.0.0.1:${webPort}`);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === "/public-posts/media/media-exec73") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(png);
      return;
    }

    if (url.pathname === "/public-posts/documents/document-exec73") {
      res.writeHead(200, { "Content-Type": "application/pdf" });
      res.end("%PDF-1.4\n% EXEC-73 preview\n");
      return;
    }

    if (method === "PATCH") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", data: reluResult }));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(mockRoutes, key)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(mockRoutes[key]));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: `No mock for ${key}` }));
  });

  return new Promise((resolve) => {
    server.listen(apiPort, "127.0.0.1", () => resolve(server));
  });
}

function startDevServer() {
  return spawn("cmd.exe", ["/c", "npm.cmd", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(webPort)], {
    cwd: adminRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiBase,
      BROWSER: "none",
    },
    stdio: "ignore",
    windowsHide: true,
  });
}

async function waitFor(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return;
      }
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runBrowserChecks() {
  const browsers = [
    { name: "Chrome desktop", viewport: { width: 1440, height: 1000 } },
    {
      name: "Edge desktop",
      viewport: { width: 1440, height: 1000 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
    },
    {
      name: "Android Chrome",
      viewport: { width: 393, height: 727 },
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "iPhone Safari",
      viewport: { width: 390, height: 664 },
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    },
  ];
  const routes = [
    "/dashboard",
    "/admin/relu",
    "/admin/media",
    "/countries-vat",
    "/projects",
    "/admin/taxonomy",
    "/ai-control",
  ];
  const rawTextPattern =
    /(API conectat|testare local|Rezultatele brute|gcs:\/\/|Internal Server Error|JSON Editor|Policy JSON|System prompt|Event bus and delivery oversight|Request ID|Storage key|Batch ID)/i;

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const browserConfig of browsers) {
      const context = await browser.newContext({
        viewport: browserConfig.viewport,
        userAgent: browserConfig.userAgent,
        isMobile: browserConfig.isMobile,
      });

      await context.route("**/*", async (route) => {
        if (isMockApiRequest(route.request().url())) {
          await fulfillApiRoute(route);
          return;
        }

        await route.continue();
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const badResponses = [];
      const requestFailures = [];
      const rawTextPages = [];
      const horizontalOverflowPages = [];
      const overflowDetails = [];
      const routeChecks = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("requestfailed", (request) => {
        const url = request.url();
        if (isMockApiRequest(url)) {
          requestFailures.push(`${request.failure()?.errorText ?? "failed"} ${url}`);
        }
      });
      page.on("response", (response) => {
        const status = response.status();
        if (status >= 400) {
          badResponses.push(`${status} ${response.url()}`);
        }
      });

      await page.goto(`${webBase}/login`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.evaluate(() => {
        window.localStorage.setItem("openstaff_admin_access_token", "exec73-token");
        window.localStorage.setItem("openstaff_admin_refresh_token", "exec73-refresh");
      });

      for (const route of routes) {
        await page.goto(`${webBase}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
        const text = await page.locator("body").innerText({ timeout: 10_000 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        const overflowDetail = overflow
          ? await page.evaluate(() => {
              const viewportWidth = document.documentElement.clientWidth;
              const offenders = Array.from(document.querySelectorAll("body *"))
                .map((element) => {
                  const rect = element.getBoundingClientRect();
                  return {
                    tag: element.tagName,
                    className: String(element.getAttribute("class") ?? "").slice(0, 140),
                    width: Math.round(rect.width),
                    right: Math.round(rect.right),
                    text: String(element.textContent ?? "").trim().slice(0, 80),
                  };
                })
                .filter((item) => item.right > viewportWidth + 1 || item.width > viewportWidth + 1)
                .sort((left, right) => right.right - left.right)
                .slice(0, 3);
              return { viewportWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
            })
          : null;

        if (rawTextPattern.test(text)) {
          rawTextPages.push(route);
        }

        if (overflow) {
          horizontalOverflowPages.push(route);
          overflowDetails.push({ route, detail: overflowDetail });
        }

        if (route === "/admin/relu" && !/RELU matched this item with/i.test(text)) {
          rawTextPages.push(`${route} missing RELU interpretation`);
        }

        if (route === "/admin/media" && /gcs:\/\//i.test(text)) {
          rawTextPages.push(`${route} exposed storage URL`);
        }

        if (route === "/admin/taxonomy" && !/Technical tools are isolated/i.test(text)) {
          rawTextPages.push(`${route} not role-gated`);
        }

        if (route === "/ai-control" && !/Technical tools are isolated/i.test(text)) {
          rawTextPages.push(`${route} not role-gated`);
        }

        routeChecks.push({
          route,
          title: await page.title(),
          overflow,
          rawText: rawTextPattern.test(text),
        });

        if (
          ["/dashboard", "/admin/relu", "/admin/media", "/countries-vat", "/projects"].includes(route)
        ) {
          const safeName = `${browserConfig.name}-${route.replaceAll("/", "-").replace(/^-/, "")}.png`
            .toLowerCase()
            .replace(/[^a-z0-9.-]+/g, "-");
          await page.screenshot({ path: path.join(screenshotDir, safeName), fullPage: true });
        }
      }

      results.push({
        browser: browserConfig.name,
        consoleErrors,
        pageErrors,
        badResponses,
        rawTextPages,
        horizontalOverflowPages,
        overflowDetails,
        requestFailures,
        routeChecks,
        pass:
          consoleErrors.length === 0 &&
          pageErrors.length === 0 &&
          badResponses.length === 0 &&
          requestFailures.length === 0 &&
          rawTextPages.length === 0 &&
          horizontalOverflowPages.length === 0,
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  return {
    checkedAtUtc: new Date().toISOString(),
    apiBase,
    webBase,
    screenshotDir: path.relative(repoRoot, screenshotDir),
    summary: {
      pass: results.every((result) => result.pass),
      checkedBrowsers: browsers.map((item) => item.name),
      consoleErrors: results.flatMap((result) => result.consoleErrors),
      pageErrors: results.flatMap((result) => result.pageErrors),
      badResponses: results.flatMap((result) => result.badResponses),
      requestFailures: results.flatMap((result) => result.requestFailures),
      rawTextPages: results.flatMap((result) => result.rawTextPages),
      horizontalOverflowPages: results.flatMap((result) => result.horizontalOverflowPages),
    },
    results,
  };
}

function isMockApiRequest(url) {
  if (url.startsWith(webBase)) {
    return false;
  }

  const parsed = new URL(url);
  const pathname = parsed.pathname;
  const knownApiPath =
    pathname === "/auth/me" ||
    pathname === "/auth/login" ||
    pathname === "/auth/refresh" ||
    pathname === "/projects" ||
    pathname === "/countries" ||
    pathname === "/jobs/stats" ||
    pathname === "/actors/stats" ||
    pathname === "/relu/queue" ||
    pathname === "/admin/relu/runs" ||
    pathname === "/admin/relu/results" ||
    pathname === "/admin/public-post-media" ||
    pathname === "/admin/public-post-documents" ||
    pathname === "/admin/public-posts" ||
    pathname.startsWith("/public-posts/media/") ||
    pathname.startsWith("/public-posts/documents/");

  return (
    knownApiPath ||
    url.startsWith(apiBase) ||
    url.startsWith("http://localhost:8080") ||
    url.startsWith("http://127.0.0.1:8080") ||
    url.startsWith("https://api.openstaff.eu")
  );
}

async function fulfillApiRoute(route) {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  const key = `${method} ${url.pathname}`;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  );

  if (url.pathname === "/public-posts/media/media-exec73") {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: png,
    });
    return;
  }

  if (url.pathname === "/public-posts/documents/document-exec73") {
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "%PDF-1.4\n% EXEC-73 preview\n",
    });
    return;
  }

  if (method === "PATCH") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", data: reluResult }),
    });
    return;
  }

  if (Object.prototype.hasOwnProperty.call(mockRoutes, key)) {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockRoutes[key]),
    });
    return;
  }

  await route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ message: `No mock for ${key}` }),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
