const fs = require("node:fs");
const path = require("node:path");
const { test, devices } = require("@playwright/test");

const root = path.resolve(__dirname, "../..");
const runtimeProofPath =
  process.env.EXEC62_PROOF_PATH || path.join(root, "docs/proof/exec62/runtime-live.json");
const browserProofPath =
  process.env.EXEC62_BROWSER_PROOF_PATH ||
  path.join(root, "docs/proof/exec62/browser-proof.json");
const webBaseUrl = process.env.EXEC62_WEB_BASE_URL || "https://openstaff.eu";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function safeDevice(name, fallback) {
  return devices[name] ? { ...devices[name] } : fallback;
}

function normalizeUrl(urlPath) {
  if (/^https?:\/\//i.test(urlPath)) {
    return urlPath;
  }

  return `${webBaseUrl}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
}

async function waitForPageText(page, expectedText) {
  if (!expectedText) {
    return true;
  }

  const needle = expectedText.toLowerCase();
  try {
    await page.waitForFunction(
      (text) => document.body?.innerText?.toLowerCase().includes(text),
      needle,
      { timeout: 45000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function capturePageProof(page, route, expectedTexts) {
  const response = await page.goto(normalizeUrl(route), {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });

  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
  const textResults = {};
  for (const text of expectedTexts) {
    textResults[text] = await waitForPageText(page, text);
  }

  const metrics = await page.evaluate(() => {
    const bodyText = document.body?.innerText ?? "";
    const mediaNodes = Array.from(document.querySelectorAll("img, video"));
    const backgroundImageNodes = Array.from(document.querySelectorAll("*")).filter((node) => {
      const value = window.getComputedStyle(node).backgroundImage;
      return value && value !== "none";
    });

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      bodyTextLength: bodyText.length,
      mediaNodeCount: mediaNodes.length,
      videoNodeCount: document.querySelectorAll("video").length,
      backgroundImageNodeCount: backgroundImageNodes.length,
      h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    };
  });

  return {
    route,
    url: page.url(),
    httpStatus: response?.status() ?? null,
    expectedTexts: textResults,
    metrics,
  };
}

async function runBrowserMatrix(browser, proof) {
  const firstProfessional = proof.professionalPosts[0];
  const firstCompany = proof.companyPosts[0];
  const firstProject = proof.projectPosts[0];
  const hvacProject =
    proof.projectPosts.find((post) => /hvac/i.test(`${post.title} ${post.domain}`)) ??
    firstProject;
  const firstActor = proof.professionals[0];

  const browserRuns = [
    {
      name: "Desktop Chrome",
      kind: "desktop",
      contextOptions: { viewport: { width: 1440, height: 1200 } },
    },
    {
      name: "Android Chrome simulation",
      kind: "mobile",
      contextOptions: safeDevice("Pixel 7", {
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36",
      }),
    },
    {
      name: "iPhone Safari simulation",
      kind: "mobile",
      contextOptions: safeDevice("iPhone 14", {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      }),
    },
  ];

  const routes = [
    { route: "/", expectedTexts: ["Real companies", firstProject.title] },
    { route: "/professionals", expectedTexts: [firstProfessional.title, firstCompany.title] },
    { route: "/professionals/" + firstProfessional.id, expectedTexts: [firstProfessional.title] },
    { route: "/jobs", expectedTexts: [firstProject.title] },
    {
      route: "/jobs?category=CONSTRUCTION&region=Bucharest&nace=41.20",
      expectedTexts: [firstProject.title],
    },
    { route: "/jobs/" + firstProject.id, expectedTexts: [firstProject.title, firstProject.ownerName] },
    { route: "/jobs/" + hvacProject.id, expectedTexts: [hvacProject.title] },
    { route: "/profiles/" + firstActor.slug, expectedTexts: [firstActor.name] },
    { route: "/pools", expectedTexts: ["subcontracting capacity"] },
  ];

  const results = [];
  for (const run of browserRuns) {
    const consoleErrors = [];
    const pageErrors = [];
    const badResponses = [];
    const failedRequests = [];

    const context = await browser.newContext(run.contextOptions);
    const page = await context.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && !url.endsWith("/favicon.ico")) {
        badResponses.push({ status, url });
      }
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "unknown";
      if (!/ERR_ABORTED/i.test(failure)) {
        failedRequests.push({ method: request.method(), url: request.url(), failure });
      }
    });

    const pages = [];
    for (const route of routes) {
      pages.push(await capturePageProof(page, route.route, route.expectedTexts));
    }

    const professionalCardRoute = "/professionals/" + firstProfessional.id;
    await page.goto(normalizeUrl("/professionals"), {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await waitForPageText(page, firstProfessional.title);
    const cardLinkCount = await page.locator(`a[href="${professionalCardRoute}"]`).count();
    let cardClickStatus = null;
    if (cardLinkCount > 0) {
      await page.locator(`a[href="${professionalCardRoute}"]`).first().click();
      await waitForPageText(page, firstProfessional.title);
      cardClickStatus = page.url().includes(professionalCardRoute) ? "PASS" : "WRONG_DESTINATION";
    } else {
      cardClickStatus = "LINK_NOT_FOUND";
    }

    const assetChecks = [];
    for (const assetUrl of [
      firstProject.media.url,
      firstProject.document.url,
      hvacProject.media.url,
      firstProfessional.media.url,
    ]) {
      const response = await context.request.get(assetUrl, { timeout: 60000 });
      assetChecks.push({
        url: assetUrl,
        status: response.status(),
        contentType: response.headers()["content-type"] ?? null,
      });
    }

    await context.close();

    results.push({
      browser: run.name,
      kind: run.kind,
      pages,
      interactions: {
        professionalCardRoute,
        professionalCardLinkCount: cardLinkCount,
        professionalCardClickStatus: cardClickStatus,
      },
      assetChecks,
      consoleErrors,
      pageErrors,
      badResponses,
      failedRequests,
      unauthorizedResponses: badResponses.filter((item) => item.status === 401),
      horizontalOverflowPages: pages
        .filter((item) => item.metrics.horizontalOverflow)
        .map((item) => item.route),
    });
  }

  return results;
}

test("EXEC-62 public marketplace browser and mobile proof", async ({ browser }) => {
  test.setTimeout(300000);
  const runtimeProof = readJson(runtimeProofPath);
  const results = await runBrowserMatrix(browser, runtimeProof);

  const flatPages = results.flatMap((result) => result.pages);
  const missingTexts = flatPages.flatMap((page) =>
    Object.entries(page.expectedTexts)
      .filter(([, present]) => !present)
      .map(([text]) => ({ route: page.route, text })),
  );
  const consoleErrors = results.flatMap((result) => result.consoleErrors);
  const pageErrors = results.flatMap((result) => result.pageErrors);
  const badResponses = results.flatMap((result) => result.badResponses);
  const unauthorizedResponses = results.flatMap((result) => result.unauthorizedResponses);
  const horizontalOverflowPages = results.flatMap((result) =>
    result.horizontalOverflowPages.map((route) => `${result.browser}: ${route}`),
  );
  const failedRequests = results.flatMap((result) => result.failedRequests);
  const failedAssetChecks = results.flatMap((result) =>
    result.assetChecks
      .filter((asset) => asset.status < 200 || asset.status >= 300)
      .map((asset) => ({ browser: result.browser, ...asset })),
  );
  const failedInteractions = results
    .filter((result) => result.interactions.professionalCardClickStatus !== "PASS")
    .map((result) => ({
      browser: result.browser,
      interactions: result.interactions,
    }));

  const browserProof = {
    execution: "EXEC-62",
    generatedAt: new Date().toISOString(),
    webBaseUrl,
    runtimeProofPath,
    results,
    summary: {
      pass:
        missingTexts.length === 0 &&
        consoleErrors.length === 0 &&
        pageErrors.length === 0 &&
        badResponses.length === 0 &&
        unauthorizedResponses.length === 0 &&
        horizontalOverflowPages.length === 0 &&
        failedRequests.length === 0 &&
        failedAssetChecks.length === 0 &&
        failedInteractions.length === 0,
      consoleErrors,
      pageErrors,
      badResponses,
      unauthorizedResponses,
      horizontalOverflowPages,
      failedRequests,
      missingTexts,
      failedAssetChecks,
      failedInteractions,
      checkedBrowsers: results.map((result) => result.browser),
      checkedRoutes: [...new Set(flatPages.map((page) => page.route))],
    },
  };

  runtimeProof.browserProof = browserProof;
  runtimeProof.readiness = {
    ...(runtimeProof.readiness ?? {}),
    classification: browserProof.summary.pass ? "PENDING_CLEANUP" : "BLOCKED",
    blockers: browserProof.summary.pass
      ? []
      : [
          missingTexts.length ? "One or more public pages did not render expected marketplace content." : null,
          consoleErrors.length ? "Console errors were detected during public browser validation." : null,
          pageErrors.length ? "Page runtime errors were detected during public browser validation." : null,
          badResponses.length ? "HTTP 4xx/5xx responses were detected during public browser validation." : null,
          horizontalOverflowPages.length ? "Mobile or desktop horizontal overflow was detected." : null,
          failedRequests.length ? "Non-aborted request failures were detected." : null,
          failedAssetChecks.length ? "Media/document asset readback failed." : null,
          failedInteractions.length ? "Marketplace card interaction did not reach the expected detail page." : null,
        ].filter(Boolean),
  };

  writeJson(browserProofPath, browserProof);
  writeJson(runtimeProofPath, runtimeProof);
});
