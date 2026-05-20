const { chromium, devices } = require("playwright");

const targetUrl =
  process.env.EXEC39_TARGET_URL ||
  "https://backoffice.openstaff.eu/admin/production-readiness";
const accessToken = process.env.EXEC39_ACCESS_TOKEN;
const refreshToken = process.env.EXEC39_REFRESH_TOKEN;

if (!accessToken || !refreshToken) {
  throw new Error("EXEC39_ACCESS_TOKEN and EXEC39_REFRESH_TOKEN are required.");
}

const browserRuns = [
  {
    name: "chrome",
    channel: "chrome",
    contextOptions: {
      viewport: { width: 1440, height: 2200 },
    },
  },
  {
    name: "edge",
    channel: "msedge",
    contextOptions: {
      viewport: { width: 1440, height: 2200 },
    },
  },
  {
    name: "chrome-mobile",
    channel: "chrome",
    contextOptions: {
      ...devices["Pixel 7"],
    },
  },
];

const requiredTexts = [
  "Compressed operator orientation",
  "Unified operational state",
  "Quick orientation",
  "Queue acceleration",
  "Escalation readiness",
  "Blocked-state indicators",
  "Stale-action indicators",
  "Unresolved-review indicators",
  "Operator-load indicators",
  "Grouped next-action summaries",
  "Action-prep boundaries",
  "Integration posture",
  "Compressed source metrics",
];

async function runBrowser({ name, channel, contextOptions }) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];

  const browser = await chromium.launch({
    channel,
    headless: true,
  });

  try {
    const context = await browser.newContext(contextOptions);

    await context.addInitScript(
      ({ nextAccessToken, nextRefreshToken }) => {
        window.localStorage.setItem("openstaff_admin_access_token", nextAccessToken);
        window.localStorage.setItem("openstaff_admin_refresh_token", nextRefreshToken);
      },
      { nextAccessToken: accessToken, nextRefreshToken: refreshToken },
    );

    const page = await context.newPage();

    page.on("console", (message) => {
      const entry = `${message.type()}: ${message.text()}`;
      if (message.type() === "error") {
        consoleErrors.push(entry);
      }
      if (message.type() === "warning") {
        consoleWarnings.push(entry);
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText ?? "unknown",
      });
    });

    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    await page.waitForLoadState("networkidle", { timeout: 120000 });
    await page.waitForSelector(`text=${requiredTexts[0]}`, { timeout: 120000 });

    const pageText = await page.locator("body").innerText();
    const title = await page.title();
    const currentUrl = page.url();
    const normalizedPageText = pageText.toLowerCase();
    const headingsPresent = Object.fromEntries(
      requiredTexts.map((text) => [text, normalizedPageText.includes(text.toLowerCase())]),
    );
    const timestampsVisible =
      normalizedPageText.includes("snapshot") ||
      normalizedPageText.includes("generated") ||
      normalizedPageText.includes("timestamp");
    const nextActionsVisible =
      normalizedPageText.includes("next moderation action") ||
      normalizedPageText.includes("next billing action") ||
      normalizedPageText.includes("next escalation action");
    const authorityBoundariesVisible =
      normalizedPageText.includes("advisory") &&
      normalizedPageText.includes("approve moderation automatically") &&
      normalizedPageText.includes("activate billing automatically") &&
      normalizedPageText.includes("mutate production state autonomously");

    const layoutMetrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    }));

    const navigationTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0];
      if (!entry) {
        return null;
      }
      return {
        domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd),
        loadEventMs: Math.round(entry.loadEventEnd),
        transferSize: entry.transferSize,
      };
    });

    return {
      browser: name,
      channel,
      httpStatus: response?.status() ?? null,
      title,
      currentUrl,
      redirectedToLogin: currentUrl.includes("/login"),
      headingsPresent,
      timestampsVisible,
      nextActionsVisible,
      authorityBoundariesVisible,
      consoleErrors,
      consoleWarnings,
      pageErrors,
      failedRequests,
      layoutMetrics,
      navigationTiming,
      textPreview: pageText.slice(0, 4000),
    };
  } finally {
    await browser.close();
  }
}

(async () => {
  const results = [];
  for (const browserRun of browserRuns) {
    results.push(await runBrowser(browserRun));
  }
  console.log(JSON.stringify({ targetUrl, results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
