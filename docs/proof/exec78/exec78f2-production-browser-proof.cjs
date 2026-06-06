const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const baseUrl = process.env.EXEC78F2_BASE_URL || "https://openstaff.eu";
const authFile = process.env.EXEC78F2_AUTH_FILE;
const proofRoot = path.resolve(__dirname, "exec78f2");
const screenshotRoot = path.join(proofRoot, "screenshots");

if (!authFile) {
  throw new Error("EXEC78F2_AUTH_FILE is required.");
}

const auth = JSON.parse(fs.readFileSync(authFile, "utf8"));
if (!auth.accessToken || !auth.refreshToken) {
  throw new Error("Production access and refresh tokens are required.");
}

fs.mkdirSync(screenshotRoot, { recursive: true });

const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-portrait-820x1180", width: 820, height: 1180 },
  { name: "tablet-landscape-1180x820", width: 1180, height: 820 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-narrow-320x720", width: 320, height: 720 },
];

const publicRoutes = [
  "/",
  "/jobs",
  "/companies",
  "/professionals",
  "/login",
  "/register",
];

const authenticatedRoutes = [
  "/dashboard",
  "/jobs",
  "/companies",
  "/professionals",
  "/projects",
  "/messages",
  "/notifications",
  "/profile",
  "/security",
];

const forbiddenShellText = [
  "Institutions",
  "Procurement",
  "Governance",
  "Contracts",
  "Documents",
  "Compliance",
  "RELU",
  "Coming soon",
];

const sensitivePatterns = [
  /\b(?:access|refresh)[_-]?token\b/i,
  /\b(?:api|secret)[_-]?key\b/i,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\b(?:stack trace|unhandled exception)\b/i,
  /\b(?:gemini api|generativelanguage)\b/i,
  /\{\s*"[^"]+"\s*:/,
];

function safeName(route) {
  return route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
}

function shouldCapture(route, viewportName, authenticated) {
  if (viewportName === "desktop-1440x900") {
    return true;
  }

  if (
    authenticated &&
    ["/dashboard", "/projects", "/messages", "/notifications"].includes(route)
  ) {
    return true;
  }

  return !authenticated && route === "/" && viewportName === "mobile-390x844";
}

function isExpectedFailedRequest(url) {
  return (
    url.startsWith("data:") ||
    (url.includes("?_rsc=") && url.startsWith(baseUrl)) ||
    url.includes("google-analytics.com") ||
    url.includes("googletagmanager.com")
  );
}

async function runRoute(page, route, viewport, authenticated) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  const onConsole = (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  const onPageError = (error) => pageErrors.push(error.message);
  const onRequestFailed = (request) => {
    if (!isExpectedFailedRequest(request.url())) {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText ?? "unknown",
      });
    }
  };
  const onResponse = (response) => {
    const responseUrl = response.url();
    if (
      response.status() >= 400 &&
      (responseUrl.startsWith(baseUrl) ||
        responseUrl.startsWith("https://api.openstaff.eu"))
    ) {
      badResponses.push({
        url: responseUrl,
        status: response.status(),
        method: response.request().method(),
      });
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => {});

  const metrics = await page.evaluate(
    ({ forbidden, patterns, expectedAuthenticated, routePath }) => {
      const bodyText = document.body?.innerText ?? "";
      const shellMode = document.querySelector("[data-shell-mode]")?.getAttribute(
        "data-shell-mode",
      );
      const authenticatedHeader = document.querySelector(
        '[data-authenticated-shell="header"]',
      );
      const mobileNavigation = document.querySelector(
        '[data-authenticated-shell="mobile-navigation"]',
      );
      const authenticatedNavigation = document.querySelector(
        'nav[aria-label="Authenticated navigation"]',
      );
      const publicNavigation = document.querySelector(
        'nav[aria-label="Primary navigation"]',
      );
      const shellText = [
        authenticatedHeader?.textContent ?? "",
        mobileNavigation?.textContent ?? "",
      ].join(" ");
      const activeLinks = Array.from(
        document.querySelectorAll('[aria-current="page"]'),
      ).map((element) => element.getAttribute("href"));
      const searchElements = Array.from(
        authenticatedHeader?.querySelectorAll(
          'input[type="search"], [role="search"], input[placeholder*="Search" i]',
        ) ?? [],
      ).filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      const disabledEntries = Array.from(
        document.querySelectorAll(
          'nav [aria-disabled="true"], nav button:disabled, nav a[href="#"]',
        ),
      ).length;
      const headerStyle = authenticatedHeader
        ? window.getComputedStyle(authenticatedHeader)
        : null;
      const bodyStyle = window.getComputedStyle(document.body);
      const hasFloatingRelu = Boolean(
        document.querySelector(
          '[data-relu-assistant], [aria-label*="RELU" i][class*="fixed"], [aria-label*="assistant" i][class*="fixed"]',
        ),
      );
      const hasRightCommercialPanel = Boolean(
        document.querySelector(
          '[data-commercial-panel], aside [data-upgrade], aside [href*="pricing"]',
        ),
      );
      const rawIdVisible = Array.from(document.querySelectorAll("main *")).some(
        (element) => {
          if (element.children.length > 0) return false;
          const text = (element.textContent ?? "").trim();
          return (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              text,
            ) || /^[a-z0-9_-]{32,}$/i.test(text)
          );
        },
      );

      return {
        title: document.title,
        pathname: window.location.pathname,
        shellMode,
        authenticatedHeader: Boolean(authenticatedHeader),
        authenticatedNavigation: Boolean(authenticatedNavigation),
        publicNavigation: Boolean(publicNavigation),
        mobileNavigation: Boolean(mobileNavigation),
        activeLinks,
        searchCount: searchElements.length,
        forbiddenText: forbidden.filter((item) =>
          shellText.toLowerCase().includes(item.toLowerCase()),
        ),
        disabledEntries,
        hasFloatingRelu,
        hasRightCommercialPanel,
        rawIdVisible,
        sensitiveText: patterns.filter((source) =>
          new RegExp(source, "i").test(bodyText),
        ),
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
        headerHeight: authenticatedHeader?.getBoundingClientRect().height ?? null,
        headerBackground: headerStyle?.backgroundColor ?? null,
        bodyBackground: bodyStyle.backgroundColor,
        expectedAuthenticated,
        routePath,
      };
    },
    {
      forbidden: forbiddenShellText,
      patterns: sensitivePatterns.map((pattern) => pattern.source),
      expectedAuthenticated: authenticated,
      routePath: route,
    },
  );

  let screenshot = null;
  if (shouldCapture(route, viewport.name, authenticated)) {
    const fileName = `${authenticated ? "signed-in" : "signed-out"}-${viewport.name}-${safeName(route)}.png`;
    screenshot = path.join(screenshotRoot, fileName);
    await page.screenshot({ path: screenshot, fullPage: true });
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("requestfailed", onRequestFailed);
  page.off("response", onResponse);

  const routePassed =
    response?.status() < 400 &&
    metrics.pathname === route &&
    !metrics.overflow &&
    metrics.forbiddenText.length === 0 &&
    metrics.disabledEntries === 0 &&
    !metrics.hasFloatingRelu &&
    !metrics.hasRightCommercialPanel &&
    !metrics.rawIdVisible &&
    metrics.sensitiveText.length === 0 &&
    consoleErrors.length === 0 &&
    pageErrors.length === 0 &&
    failedRequests.length === 0 &&
    badResponses.length === 0 &&
    (authenticated
      ? metrics.shellMode === "authenticated" &&
        metrics.authenticatedHeader &&
        metrics.searchCount === 0 &&
        metrics.headerBackground === "rgb(15, 23, 42)"
      : metrics.shellMode === "public" && !metrics.authenticatedHeader);

  return {
    route,
    viewport: viewport.name,
    authenticated,
    status: response?.status() ?? null,
    screenshot: screenshot
      ? path.relative(path.resolve(__dirname), screenshot).replaceAll("\\", "/")
      : null,
    ...metrics,
    consoleErrors,
    pageErrors,
    failedRequests,
    badResponses,
    passed: routePassed,
  };
}

async function runMatrix(browser, authenticated) {
  const context = await browser.newContext();
  if (authenticated) {
    await context.addInitScript(
      ({ accessToken, refreshToken }) => {
        window.localStorage.setItem("openstaff_web_access_token", accessToken);
        window.localStorage.setItem("openstaff_web_refresh_token", refreshToken);
      },
      auth,
    );
  }

  const page = await context.newPage();
  const results = [];
  const routes = authenticated ? authenticatedRoutes : publicRoutes;

  for (const viewport of viewports) {
    for (const route of routes) {
      results.push(await runRoute(page, route, viewport, authenticated));
    }
  }

  if (authenticated) {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => {});
    const moreButton = page.getByRole("button", { name: "More" });
    await moreButton.click();
    const moreText = await page
      .getByRole("menu", { name: "More destinations" })
      .innerText();
    const moreScreenshot = path.join(
      screenshotRoot,
      "signed-in-tablet-landscape-1180x820-more-open.png",
    );
    await page.screenshot({ path: moreScreenshot, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => {});
    await page.getByRole("button", { name: "More destinations" }).click();
    const mobileMoreText = await page
      .getByRole("dialog", { name: "More destinations" })
      .innerText();
    const mobileMoreScreenshot = path.join(
      screenshotRoot,
      "signed-in-mobile-390x844-more-open.png",
    );
    await page.screenshot({ path: mobileMoreScreenshot, fullPage: true });

    results.push({
      supplemental: "more-menus",
      desktopCompactText: moreText,
      mobileText: mobileMoreText,
      passed:
        moreText.includes("Companies") &&
        moreText.includes("Professionals") &&
        mobileMoreText.includes("Companies") &&
        mobileMoreText.includes("Professionals"),
      screenshots: [
        path.relative(path.resolve(__dirname), moreScreenshot).replaceAll("\\", "/"),
        path
          .relative(path.resolve(__dirname), mobileMoreScreenshot)
          .replaceAll("\\", "/"),
      ],
    });
  }

  await context.close();
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const signedOut = await runMatrix(browser, false);
    const signedIn = await runMatrix(browser, true);
    const failures = [...signedOut, ...signedIn].filter((item) => !item.passed);
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      authenticatedIdentity: {
        email: auth.user?.email ?? "unknown",
        role: auth.user?.role ?? "unknown",
      },
      revision: process.env.EXEC78F2_REVISION ?? null,
      viewports,
      signedOut,
      signedIn,
      failures,
      passed: failures.length === 0,
    };

    fs.writeFileSync(
      path.join(proofRoot, "production-browser-proof.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
