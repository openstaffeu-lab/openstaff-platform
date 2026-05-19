const { chromium } = require("playwright");

const targetUrl =
  process.env.EXEC37_TARGET_URL ||
  "https://backoffice.openstaff.eu/admin/production-readiness";
const accessToken = process.env.EXEC37_ACCESS_TOKEN;
const refreshToken = process.env.EXEC37_REFRESH_TOKEN;

if (!accessToken || !refreshToken) {
  throw new Error("EXEC37_ACCESS_TOKEN and EXEC37_REFRESH_TOKEN are required.");
}

const browsers = [
  { name: "chrome", channel: "chrome" },
  { name: "edge", channel: "msedge" },
];

const requiredTexts = [
  "Assistance safety contract",
  "Moderation queue assistance",
  "Billing queue assistance",
  "Support and escalation assistance",
  "Production readiness assistance summary",
  "Incident assistance surface",
  "Today's auth anomalies digest",
  "Today's moderation backlog digest",
  "Today's upload failures digest",
  "Today's billing pressure digest",
  "Today's escalation pressure digest",
  "Today's rollout warnings digest",
  "Auth spikes and onboarding drops",
  "Upload failures and moderation delays",
  "Webhook failures and billing backlog",
  "Rollout instability and support escalations",
  "Source metrics snapshot",
];

async function runBrowser({ name, channel }) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];

  const browser = await chromium.launch({
    channel,
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 2200 },
    });

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
    const pageHtml = await page.content();
    const title = await page.title();
    const currentUrl = page.url();
    const normalizedPageText = pageText.toLowerCase();
    const headingsPresent = Object.fromEntries(
      requiredTexts.map((text) => [text, normalizedPageText.includes(text.toLowerCase())]),
    );
    const timestampsVisible =
      /snapshot:\s+\d{1,2}\s+\w+\s+\d{4}/i.test(pageText) ||
      /generated\s+\d{1,2}\/\d{1,2}\/\d{4}/i.test(pageText);
    const reasoningVisible =
      normalizedPageText.includes("source reasoning") ||
      normalizedPageText.includes("correlation reasoning");
    const authorityBoundariesVisible =
      normalizedPageText.includes("no assistance card on this page can approve, reject, escalate automatically, assign severity automatically, activate billing, trigger rollback, change rollout state, or override an operator.") &&
      normalizedPageText.includes("advisory only");

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
      textPreview: pageText.slice(0, 4000),
      htmlPreview: pageHtml.slice(0, 2000),
      headingsPresent,
      timestampsVisible,
      reasoningVisible,
      authorityBoundariesVisible,
      consoleErrors,
      consoleWarnings,
      pageErrors,
      failedRequests,
      navigationTiming,
    };
  } finally {
    await browser.close();
  }
}

(async () => {
  const results = [];
  for (const browser of browsers) {
    results.push(await runBrowser(browser));
  }
  console.log(JSON.stringify({ targetUrl, results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
