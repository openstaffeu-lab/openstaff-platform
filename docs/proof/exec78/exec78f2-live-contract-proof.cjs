const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const baseUrl = process.env.EXEC78F2_BASE_URL || "https://openstaff.eu";
const authFile = process.env.EXEC78F2_AUTH_FILE;
const outputFile = path.join(__dirname, "exec78f2", "live-contract-proof.json");

if (!authFile) {
  throw new Error("EXEC78F2_AUTH_FILE is required.");
}

const auth = JSON.parse(fs.readFileSync(authFile, "utf8"));

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(
      ({ accessToken, refreshToken }) => {
        window.localStorage.setItem("openstaff_web_access_token", accessToken);
        window.localStorage.setItem("openstaff_web_refresh_token", refreshToken);
      },
      auth,
    );

    const page = await context.newPage();
    const unreadResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === "https://api.openstaff.eu/notifications/unread-count" &&
        response.status() === 200,
      { timeout: 120000 },
    );
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    const unreadResponse = await unreadResponsePromise;
    const unreadPayload = await unreadResponse.json();
    await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => {});

    const dashboard = await page.evaluate(() => {
      const header = document.querySelector(
        '[data-authenticated-shell="header"]',
      );
      const messageLinks = Array.from(
        header?.querySelectorAll('a[href="/messages"]') ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const badge = Array.from(
        header?.querySelectorAll(
          'a[href="/notifications"] [aria-label$="unread notifications"]',
        ) ?? [],
      ).find((element) => element.getClientRects().length > 0);

      return {
        shellMode: document
          .querySelector("[data-shell-mode]")
          ?.getAttribute("data-shell-mode"),
        badgeLabel: badge?.getAttribute("aria-label") ?? null,
        visibleMessageLinks: messageLinks.length,
        messageLabels: messageLinks.map((element) =>
          (element.textContent ?? "").trim(),
        ),
        chatbotCount: document.querySelectorAll(
          '[data-gemini-chatbot], [aria-label*="chatbot" i], [aria-label*="assistant" i][class*="fixed"]',
        ).length,
      };
    });

    await page.goto(`${baseUrl}/onboarding/identity-type`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => {});
    const onboarding = await page.evaluate(() => ({
      shellMode: document
        .querySelector("[data-shell-mode]")
        ?.getAttribute("data-shell-mode"),
      authenticatedHeader: Boolean(
        document.querySelector('[data-authenticated-shell="header"]'),
      ),
      authenticatedNavigation: Boolean(
        document.querySelector('nav[aria-label="Authenticated navigation"]'),
      ),
      mobileNavigation: Boolean(
        document.querySelector(
          '[data-authenticated-shell="mobile-navigation"]',
        ),
      ),
      footer: Boolean(document.querySelector("footer")),
    }));

    const unreadCount = Number(
      unreadPayload.data?.unreadCount ?? unreadPayload.unreadCount ?? 0,
    );
    const expectedBadgeLabel =
      unreadCount > 0 ? `${unreadCount} unread notifications` : null;
    const report = {
      generatedAt: new Date().toISOString(),
      revision: process.env.EXEC78F2_REVISION ?? null,
      authenticatedIdentity: {
        email: auth.user?.email ?? "unknown",
        role: auth.user?.role ?? "unknown",
      },
      notificationTruth: {
        endpoint: "/notifications/unread-count",
        unreadCount,
        expectedBadgeLabel,
        renderedBadgeLabel: dashboard.badgeLabel,
        passed: dashboard.badgeLabel === expectedBadgeLabel,
      },
      messages: {
        visibleDestinationCount: dashboard.visibleMessageLinks,
        labels: dashboard.messageLabels,
        destinationOnly:
          dashboard.visibleMessageLinks === 1 &&
          dashboard.messageLabels.every((label) => label === "Messages"),
      },
      authenticatedReluBoundary: {
        chatbotCount: dashboard.chatbotCount,
        passed: dashboard.chatbotCount === 0,
      },
      onboarding,
      passed:
        dashboard.shellMode === "authenticated" &&
        dashboard.badgeLabel === expectedBadgeLabel &&
        dashboard.visibleMessageLinks === 1 &&
        dashboard.messageLabels.every((label) => label === "Messages") &&
        dashboard.chatbotCount === 0 &&
        onboarding.shellMode === "onboarding" &&
        !onboarding.authenticatedHeader &&
        !onboarding.authenticatedNavigation &&
        !onboarding.mobileNavigation &&
        !onboarding.footer,
    };

    fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) {
      process.exitCode = 1;
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
