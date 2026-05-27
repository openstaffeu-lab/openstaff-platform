const fs = require("node:fs/promises");
const path = require("node:path");

const { chromium, devices } = require("../../../.logs/exec62-playwright/node_modules/playwright");

const repoRoot = path.resolve(__dirname, "../../..");
const proofPath = path.join(__dirname, "runtime-live-proof.json");
const tokenPath = path.join(repoRoot, ".logs", "exec76-browser-tokens.json");
const outputPath = path.join(__dirname, "browser-proof.json");
const screenshotDir = path.join(__dirname, "screenshots");
const adminBase = "https://backoffice.openstaff.eu";
const webBase = "https://openstaff.eu";
const apiBase = "https://api.openstaff.eu";

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  const runtime = JSON.parse(await fs.readFile(proofPath, "utf8"));
  const tokens = JSON.parse(await fs.readFile(tokenPath, "utf8"));
  const companySlug = runtime.publicAssets.companySlug || tokens.companySlug;
  const pendingAsset = runtime.publicAssets.uploadStatuses.find(
    (item) => item.assetKind === "PHOTO",
  );

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    results.push(
      await runDesktop(browser, "ADMIN technical direct routes", tokens.admin, [
        { url: `${adminBase}/ai-config`, mustInclude: "Technical tools are isolated" },
        { url: `${adminBase}/admin/imports`, mustInclude: "Technical tools are isolated" },
        { url: `${adminBase}/admin/workforce`, mustNotMatch: /storage|bucket|raw json|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i },
      ]),
    );
    results.push(
      await runDesktop(browser, "AI_MODERATOR RELU access", tokens.aiModerator, [
        { url: `${adminBase}/admin/relu`, mustInclude: "RELU" },
        { url: `${adminBase}/ai-queue`, mustInclude: "This role is limited to RELU review" },
      ]),
    );
    results.push(
      await runDesktop(browser, "SUPERADMIN technical access", tokens.superadmin, [
        { url: `${adminBase}/ai-config`, mustNotInclude: "Technical tools are isolated" },
        { url: `${adminBase}/admin/imports`, mustNotInclude: "Technical tools are isolated" },
      ]),
    );
    results.push(
      await runPublic(browser, "Chrome public company/profile", companySlug, pendingAsset, null),
    );
    results.push(
      await runPublic(browser, "Mobile Chrome public company/profile", companySlug, pendingAsset, devices["Pixel 5"]),
    );
  } finally {
    await browser.close();
  }

  const summary = summarize(results);
  const proof = {
    checkedAtUtc: new Date().toISOString(),
    adminBase,
    webBase,
    apiBase,
    companySlug,
    summary,
    results,
  };

  await fs.writeFile(outputPath, JSON.stringify(proof, null, 2));

  if (!summary.pass) {
    console.error(JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(summary, null, 2));
}

async function runDesktop(browser, label, token, routes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await seedAdminToken(context, token);
  const page = await context.newPage();
  const observed = observe(page);
  const failedChecks = [];
  const pages = [];

  try {
    for (const route of routes) {
      const response = await page.goto(route.url, { waitUntil: "networkidle", timeout: 45000 });
      await page.screenshot({
        path: path.join(screenshotDir, `${slug(label)}-${slug(new URL(route.url).pathname)}.png`),
        fullPage: true,
      });
      const text = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
      const overflow = await hasHorizontalOverflow(page);
      pages.push({ url: route.url, status: response?.status() ?? null, overflow });

      if (route.mustInclude && !text.includes(route.mustInclude)) {
        failedChecks.push(`${route.url} did not include "${route.mustInclude}"`);
      }
      if (route.mustNotInclude && text.includes(route.mustNotInclude)) {
        failedChecks.push(`${route.url} unexpectedly included "${route.mustNotInclude}"`);
      }
      if (route.mustNotMatch && route.mustNotMatch.test(text)) {
        failedChecks.push(`${route.url} exposed raw technical text matching ${route.mustNotMatch}`);
      }
    }
  } finally {
    await context.close();
  }

  return { label, ...observed.snapshot(), failedChecks, pages };
}

async function runPublic(browser, label, companySlug, pendingAsset, device) {
  const context = await browser.newContext(
    device ? { ...device } : { viewport: { width: 1440, height: 1000 } },
  );
  const page = await context.newPage();
  const observed = observe(page);
  const failedChecks = [];
  const pages = [];
  const assetResponses = [];

  try {
    for (const target of [`${webBase}/companies/${companySlug}`, `${webBase}/profiles/${companySlug}`]) {
      const response = await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
      await page.screenshot({
        path: path.join(screenshotDir, `${slug(label)}-${slug(new URL(target).pathname)}.png`),
        fullPage: true,
      });
      const text = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
      const html = await page.content();
      const overflow = await hasHorizontalOverflow(page);
      pages.push({ url: target, status: response?.status() ?? null, overflow });

      if (/\/profiles\/[^/]+\/documents\/[^"')\s<]+/.test(html)) {
        failedChecks.push(`${target} exposed authenticated profile document URL`);
      }
      if (/\bstorageKey\b|\bstorageBucket\b|\bgcs\b|raw json/i.test(text)) {
        failedChecks.push(`${target} exposed raw storage/internal wording`);
      }

      const assetUrls = await page.$$eval("img", (images) =>
        images
          .map((image) => image.currentSrc || image.src)
          .filter((src) => src.includes("/profiles/assets/")),
      );

      for (const url of Array.from(new Set(assetUrls))) {
        const assetResponse = await context.request.get(url);
        assetResponses.push({ url: sanitizeAssetUrl(url), status: assetResponse.status() });
      }
    }

    if (pendingAsset?.assetUrl) {
      const pendingResponse = await context.request.get(`${apiBase}${pendingAsset.assetUrl}`);
      assetResponses.push({
        url: sanitizeAssetUrl(`${apiBase}${pendingAsset.assetUrl}`),
        status: pendingResponse.status(),
        expectedHidden: true,
      });
      if (![403, 404].includes(pendingResponse.status())) {
        failedChecks.push(`pending asset returned ${pendingResponse.status()} instead of 403/404`);
      }
    }

    if (!assetResponses.some((item) => item.status === 200 && !item.expectedHidden)) {
      failedChecks.push("no approved public profile asset returned 200");
    }
  } finally {
    await context.close();
  }

  return { label, ...observed.snapshot(), failedChecks, pages, assetResponses };
}

async function seedAdminToken(context, token) {
  await context.addInitScript((value) => {
    window.localStorage.setItem("openstaff_admin_access_token", value);
    window.localStorage.removeItem("openstaff_admin_refresh_token");
  }, token);
}

function observe(page) {
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
      badResponses.push({ url: response.url(), status });
    }
  });

  return {
    snapshot() {
      return {
        consoleErrors,
        pageErrors,
        badResponses: badResponses.map((item) => ({
          ...item,
          url: sanitizeUrl(item.url),
        })),
      };
    },
  };
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      viewportWidth: window.innerWidth,
      documentScrollWidth: root.scrollWidth,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      hasOverflow:
        root.scrollWidth > window.innerWidth + 1 ||
        (body ? body.scrollWidth > window.innerWidth + 1 : false),
    };
  });
}

function summarize(results) {
  const consoleErrors = results.flatMap((item) => item.consoleErrors);
  const pageErrors = results.flatMap((item) => item.pageErrors);
  const badResponses = results.flatMap((item) => item.badResponses);
  const failedChecks = results.flatMap((item) => item.failedChecks);
  const overflowPages = results.flatMap((item) =>
    (item.pages || [])
      .filter((page) => page.overflow?.hasOverflow)
      .map((page) => ({ label: item.label, url: page.url, overflow: page.overflow })),
  );

  return {
    pass:
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      badResponses.length === 0 &&
      failedChecks.length === 0 &&
      overflowPages.length === 0,
    consoleErrors,
    pageErrors,
    badResponses,
    failedChecks,
    overflowPages,
  };
}

function sanitizeUrl(value) {
  return value.replace(/([?&](token|accessToken|refreshToken)=)[^&]+/gi, "$1[redacted]");
}

function sanitizeAssetUrl(value) {
  return sanitizeUrl(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "[document-id]");
}

function slug(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "page";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
