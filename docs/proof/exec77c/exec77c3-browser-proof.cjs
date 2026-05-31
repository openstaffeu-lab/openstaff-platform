const fs = require("fs");
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

const baseUrl = "https://openstaff.eu";
const screenshotDir = path.resolve(__dirname, "screenshots");
const outputPath = path.resolve(__dirname, "exec77c3-browser-proof.json");

const routes = [
  { path: "/", name: "home" },
  { path: "/projects", name: "projects" },
  { path: "/professionals", name: "professionals" },
  { path: "/pricing", name: "pricing" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
  { path: "/onboarding/company", name: "onboarding-company" },
];

const forbiddenPatterns = [
  { name: "rawJson", pattern: /{\s*"(?:id|status|data|error|message)"\s*:/i },
  { name: "runId", pattern: /\brunId\b|ReluProcessingRun/i },
  { name: "actorId", pattern: /\bactorId\b/i },
  { name: "entityId", pattern: /\bentityId\b/i },
  { name: "stackTrace", pattern: /\b(stack trace|at\s+\w+\s*\(|TypeError:|ReferenceError:|Unhandled Runtime Error)\b/i },
  { name: "apiKey", pattern: /\bAIza[0-9A-Za-z_-]{20,}\b|api[_-]?key/i },
  { name: "geminiInternals", pattern: /\bgemini\b|generativelanguage\.googleapis\.com/i },
];

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

  const pageStatus = response ? response.status() : null;
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const title = await page.title().catch(() => "");
  const overflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth,
  }));

  const rawExposure = forbiddenPatterns
    .filter((item) => item.pattern.test(text))
    .map((item) => item.name);

  const checks = {};
  if (route.path === "/") {
    checks.header = await page.getByRole("link", { name: /OpenStaff/i }).first().isVisible().catch(() => false);
    checks.hero = text.includes("Your place where projects find the right professionals.");
    checks.quickActionBoard = text.includes("Business & Operations") && text.includes("Quick Contact");
    checks.footer = text.includes("Global coverage") && text.includes("Business & Operations");
    if (viewportName === "desktop") {
      checks.login = text.includes("Login");
      checks.register = text.includes("Register");
      await page.screenshot({ path: path.join(screenshotDir, "homepage-desktop.png"), fullPage: true });
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(screenshotDir, "footer-desktop.png"), fullPage: false });
      await page.getByRole("button", { name: "Contact" }).click();
      checks.contactModalOpen = await page.getByRole("heading", { name: "Tell us what you need" }).isVisible();
      await page.screenshot({ path: path.join(screenshotDir, "contact-modal.png"), fullPage: false });
      await page.getByRole("button", { name: "Close contact modal" }).click();
      checks.contactModalClosed = !(await page.getByRole("heading", { name: "Tell us what you need" }).isVisible().catch(() => false));
    } else {
      await page.screenshot({ path: path.join(screenshotDir, "homepage-mobile.png"), fullPage: true });
      checks.mobileMenuButton = await page.getByLabel("Toggle navigation").isVisible().catch(() => false);
      await page.getByLabel("Toggle navigation").click();
      checks.mobileMenuLogin = await page.getByRole("link", { name: "Login" }).isVisible().catch(() => false);
      checks.mobileMenuRegister = await page.getByRole("link", { name: "Register" }).isVisible().catch(() => false);
      checks.loginRegisterAccessible = checks.mobileMenuLogin && checks.mobileMenuRegister;
    }
  }

  if (route.path === "/projects" && viewportName === "desktop") {
    await page.screenshot({ path: path.join(screenshotDir, "projects-page.png"), fullPage: true });
  }

  if (route.path === "/professionals" && viewportName === "desktop") {
    await page.screenshot({ path: path.join(screenshotDir, "professionals-page.png"), fullPage: true });
  }

  return {
    route: route.path,
    viewport: viewportName,
    pageStatus,
    title,
    consoleErrors,
    pageErrors,
    badResponses,
    overflow,
    rawExposure,
    checks,
  };
}

(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const viewport of [
    { name: "desktop", size: { width: 1440, height: 1100 } },
    { name: "mobile", size: { width: 390, height: 900 } },
  ]) {
    for (const route of routes) {
      const context = await browser.newContext({ viewport: viewport.size });
      const page = await context.newPage();
      try {
        results.push(await runRoute(page, route, viewport.name));
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes: routes.map((route) => route.path),
    screenshots: fs.readdirSync(screenshotDir).sort(),
    failures: results.filter(
      (result) =>
        result.pageStatus >= 400 ||
        result.consoleErrors.length ||
        result.pageErrors.length ||
        result.badResponses.length ||
        result.overflow.hasHorizontalOverflow ||
        result.rawExposure.length ||
        Object.values(result.checks).some((value) => value === false),
    ),
    results,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (summary.failures.length > 0) {
    process.exitCode = 1;
  }
})();
