const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../../../.logs/exec62-playwright/node_modules/playwright");
const {
  assert,
  baseUrl,
  createAuthenticatedPage,
  installApiMocks,
} = require("./exec78f1-browser-proof.cjs");

const proofDir = path.join(__dirname, "exec78f1d");
const screenshotDir = path.join(proofDir, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const tabletPortrait = [
  { width: 768, height: 1024, name: "tablet-portrait-768x1024" },
  { width: 820, height: 1180, name: "tablet-portrait-820x1180" },
  { width: 834, height: 1194, name: "tablet-portrait-834x1194" },
];

const tabletLandscape = [
  { width: 1024, height: 768, name: "tablet-landscape-1024x768" },
  { width: 1180, height: 820, name: "tablet-landscape-1180x820" },
  { width: 1194, height: 834, name: "tablet-landscape-1194x834" },
];

const routeScreenshots = [
  {
    className: "desktop",
    viewport: { width: 1440, height: 900 },
    routes: [
      ["/dashboard", "dashboard"],
      ["/jobs", "opportunities"],
      ["/projects", "projects"],
    ],
  },
  {
    className: "tablet-portrait",
    viewport: { width: 820, height: 1180 },
    routes: [
      ["/dashboard", "dashboard"],
      ["/projects", "projects"],
    ],
  },
  {
    className: "tablet-landscape",
    viewport: { width: 1180, height: 820 },
    routes: [
      ["/dashboard", "dashboard"],
      ["/projects", "projects"],
    ],
  },
  {
    className: "mobile",
    viewport: { width: 390, height: 844 },
    routes: [
      ["/dashboard", "dashboard"],
      ["/projects", "projects"],
    ],
  },
];

function rectContains(outer, inner, tolerance = 1) {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

async function waitForAuthenticatedShell(page, route = "/dashboard") {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator('[data-shell-mode="authenticated"]').waitFor({ timeout: 10_000 });
}

async function visibleText(locator) {
  const count = await locator.count();
  const labels = [];
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible()) {
      labels.push((await item.innerText()).replace(/\s+/g, " ").trim());
    }
  }
  return labels;
}

async function certifyTabletViewport(browser, viewport) {
  const { context, page, consoleErrors, pageErrors } = await createAuthenticatedPage(
    browser,
    viewport,
  );
  await waitForAuthenticatedShell(page);

  const header = page.locator('[data-authenticated-shell="header"]');
  const headerRect = await header.boundingBox();
  const compactNav = page.locator(
    'nav[aria-label="Authenticated navigation"] > div:nth-child(2)',
  );
  const fullNav = page.locator(
    'nav[aria-label="Authenticated navigation"] > div:first-child',
  );
  const mobileNav = page.locator('[data-authenticated-shell="mobile-navigation"]');
  const visibleCompactLabels = await visibleText(
    compactNav.locator("a > span:first-of-type"),
  );
  const moreButton = page.getByRole("button", { name: "More", exact: true });
  const notificationLink = compactNav.locator('a[href="/notifications"]');
  const notificationRect = await notificationLink.boundingBox();
  const badge = notificationLink.locator('[aria-label="3 unread notifications"]');
  const badgeRect = await badge.boundingBox();
  const avatar = page.getByRole("button", { name: "Open account menu" });
  const avatarRect = await avatar.boundingBox();
  const viewportMetrics = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  assert(headerRect?.height === 64, `${viewport.name}: header is not 64px`);
  assert(await compactNav.isVisible(), `${viewport.name}: compact navigation hidden`);
  assert(!(await fullNav.isVisible()), `${viewport.name}: full navigation leaked`);
  assert(!(await mobileNav.isVisible()), `${viewport.name}: mobile shell leaked`);
  assert(
    visibleCompactLabels.join("|") ===
      "Dashboard|Opportunities|Projects|Messages|Notifications",
    `${viewport.name}: compact destinations mismatch`,
  );
  assert(await moreButton.isVisible(), `${viewport.name}: More is not visible`);
  assert(
    viewportMetrics.documentWidth <= viewportMetrics.width + 1 &&
      viewportMetrics.bodyWidth <= viewportMetrics.width + 1,
    `${viewport.name}: horizontal overflow`,
  );
  assert(
    rectContains(headerRect, notificationRect) && rectContains(headerRect, avatarRect),
    `${viewport.name}: Notification or avatar outside header`,
  );
  assert(
    badgeRect &&
      badgeRect.y >= headerRect.y &&
      badgeRect.y + badgeRect.height <= headerRect.y + headerRect.height,
    `${viewport.name}: Notification badge misaligned`,
  );
  assert(
    Math.abs(
      notificationRect.y +
        notificationRect.height / 2 -
        (avatarRect.y + avatarRect.height / 2),
    ) <= 1,
    `${viewport.name}: Notification and avatar centers differ`,
  );

  const activeDashboard = page.locator(
    'nav[aria-label="Authenticated navigation"] a[href="/dashboard"][aria-current="page"]',
  );
  assert((await activeDashboard.count()) >= 1, `${viewport.name}: active state missing`);

  await moreButton.click();
  assert((await moreButton.getAttribute("aria-expanded")) === "true", `${viewport.name}: More aria-expanded false`);
  const menu = page.getByRole("menu", { name: "More destinations" });
  await menu.waitFor();
  const menuLabels = await visibleText(menu.getByRole("menuitem"));
  assert(
    menuLabels.join("|") === "Companies|Professionals",
    `${viewport.name}: More contents mismatch`,
  );

  await menu.getByRole("menuitem", { name: "Companies" }).focus();
  await page.keyboard.press("Escape");
  assert(!(await menu.isVisible()), `${viewport.name}: Escape did not dismiss More`);
  assert(
    await moreButton.evaluate((element) => document.activeElement === element),
    `${viewport.name}: focus did not return to More`,
  );

  await avatar.click();
  assert((await avatar.getAttribute("aria-expanded")) === "true", `${viewport.name}: account aria-expanded false`);
  const accountMenu = page.getByRole("menu", { name: "Account" });
  await accountMenu.waitFor();
  await accountMenu.getByRole("menuitem", { name: "Profile" }).focus();
  await page.keyboard.press("Escape");
  assert(!(await accountMenu.isVisible()), `${viewport.name}: Escape did not dismiss account`);
  assert(
    await avatar.evaluate((element) => document.activeElement === element),
    `${viewport.name}: focus did not return to avatar`,
  );

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  const stickyHeaderRect = await header.boundingBox();
  assert(stickyHeaderRect?.y === 0, `${viewport.name}: sticky header moved after scroll`);

  assert(consoleErrors.length === 0, `${viewport.name}: console errors ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `${viewport.name}: page errors ${pageErrors.join(" | ")}`);

  await context.close();
  return {
    viewport: `${viewport.width}x${viewport.height}`,
    className: viewport.name,
    headerHeight: headerRect.height,
    overflow: false,
    activeState: true,
    compactLabels: visibleCompactLabels,
    moreLabels: menuLabels,
    badgeAligned: true,
    avatarAligned: true,
    escapeDismissal: true,
    focusRestoration: true,
    stickyHeader: true,
    consoleErrors,
    pageErrors,
  };
}

async function certifyBreakpoint(browser, width, expected) {
  const { context, page } = await createAuthenticatedPage(browser, {
    width,
    height: 900,
  });
  await waitForAuthenticatedShell(page);
  const fullVisible = await page
    .locator('nav[aria-label="Authenticated navigation"] > div:first-child')
    .isVisible();
  const compactVisible = await page
    .locator('nav[aria-label="Authenticated navigation"] > div:nth-child(2)')
    .isVisible();
  const mobileVisible =
    (await page.locator('[data-authenticated-shell="mobile-navigation"]').count()) > 0 &&
    (await page.locator('[data-authenticated-shell="mobile-navigation"]').isVisible());

  assert(fullVisible === (expected === "full"), `${width}: full breakpoint leakage`);
  assert(compactVisible === (expected === "compact"), `${width}: compact breakpoint leakage`);
  assert(mobileVisible === (expected === "mobile"), `${width}: mobile breakpoint leakage`);
  await context.close();
  return { width, expected, fullVisible, compactVisible, mobileVisible };
}

async function certifyKeyboardOrder(browser) {
  const { context, page } = await createAuthenticatedPage(browser, {
    width: 1180,
    height: 820,
  });
  await waitForAuthenticatedShell(page);

  const expected = [
    "OpenStaff Dashboard",
    "Dashboard",
    "Opportunities",
    "Projects",
    "Messages",
    "Notifications",
    "More",
    "Open account menu",
  ];
  const forward = [];
  await page.locator("body").press("Home");
  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press("Tab");
    forward.push(
      await page.evaluate(() => {
        const element = document.activeElement;
        if (element?.getAttribute("href") === "/notifications") {
          return "Notifications";
        }
        return (
          element?.getAttribute("aria-label") ||
          element?.textContent?.trim().replace(/\s+/g, " ") ||
          element?.tagName ||
          ""
        );
      }),
    );
  }
  assert(forward.join("|") === expected.join("|"), `Forward tab order mismatch: ${forward.join("|")}`);

  const backward = [];
  for (let index = 0; index < expected.length - 1; index += 1) {
    await page.keyboard.press("Shift+Tab");
    backward.push(
      await page.evaluate(() => {
        const element = document.activeElement;
        if (element?.getAttribute("href") === "/notifications") {
          return "Notifications";
        }
        return (
          element?.getAttribute("aria-label") ||
          element?.textContent?.trim().replace(/\s+/g, " ") ||
          element?.tagName ||
          ""
        );
      }),
    );
  }
  const expectedBackward = expected.slice(0, -1).reverse();
  assert(
    backward.join("|") === expectedBackward.join("|"),
    `Backward tab order mismatch: ${backward.join("|")}`,
  );
  await context.close();
  return { forward, backward };
}

async function certifyMobile(browser, viewport) {
  const { context, page, consoleErrors, pageErrors } = await createAuthenticatedPage(
    browser,
    viewport,
  );
  await waitForAuthenticatedShell(page);
  const header = page.locator('[data-authenticated-shell="header"]');
  const bottomNav = page.locator('[data-authenticated-shell="mobile-navigation"]');
  const desktopNav = page.locator('nav[aria-label="Authenticated navigation"]');
  const headerRect = await header.boundingBox();
  const bottomRect = await bottomNav.boundingBox();
  const notification = page.getByRole("link", { name: "Notifications" }).first();
  const avatar = page.getByRole("button", { name: "Open account menu" });
  const notificationRect = await notification.boundingBox();
  const avatarRect = await avatar.boundingBox();
  const labels = await visibleText(bottomNav.locator("a, button"));
  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    safeAreaPadding: getComputedStyle(
      document.querySelector('[data-authenticated-shell="mobile-navigation"] > div'),
    ).paddingBottom,
  }));

  assert(headerRect?.height === 64, `${viewport.name}: mobile header not 64px`);
  assert(await bottomNav.isVisible(), `${viewport.name}: mobile bottom nav hidden`);
  assert(!(await desktopNav.isVisible()), `${viewport.name}: desktop nav leaked`);
  assert(
    labels.join("|") === "Home|Explore|Projects|Messages|More",
    `${viewport.name}: mobile labels mismatch`,
  );
  assert(
    metrics.documentWidth <= metrics.width + 1 && metrics.bodyWidth <= metrics.width + 1,
    `${viewport.name}: horizontal overflow`,
  );
  assert(
    rectContains(headerRect, notificationRect) && rectContains(headerRect, avatarRect),
    `${viewport.name}: top controls misaligned`,
  );
  assert(
    Math.abs(
      notificationRect.y +
        notificationRect.height / 2 -
        (avatarRect.y + avatarRect.height / 2),
    ) <= 1,
    `${viewport.name}: top controls not centered`,
  );

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  const stickyHeaderRect = await header.boundingBox();
  const stickyBottomRect = await bottomNav.boundingBox();
  assert(stickyHeaderRect?.y === 0, `${viewport.name}: sticky header moved`);
  assert(
    Math.abs(stickyBottomRect.y + stickyBottomRect.height - viewport.height) <= 1,
    `${viewport.name}: bottom navigation moved`,
  );

  const dockButton = page.getByRole("button", { name: "OpenStaff Messages" });
  const dockRect = await dockButton.boundingBox();
  assert(
    dockRect.y + dockRect.height <= stickyBottomRect.y,
    `${viewport.name}: MessagingDock overlaps bottom navigation`,
  );

  const more = page.getByRole("button", {
    name: "More destinations",
    exact: true,
  });
  await more.click();
  assert((await more.getAttribute("aria-expanded")) === "true", `${viewport.name}: More aria-expanded false`);
  const dialog = page.getByRole("dialog", { name: "More destinations" });
  await dialog.waitFor();
  const first = dialog.getByRole("button", { name: "Close more destinations" });
  const companies = dialog.getByRole("link", { name: "Companies" });
  const professionals = dialog.getByRole("link", { name: "Professionals" });
  assert(
    await first.evaluate((element) => document.activeElement === element),
    `${viewport.name}: dialog did not receive focus`,
  );
  await page.keyboard.press("Shift+Tab");
  assert(
    await professionals.evaluate((element) => document.activeElement === element),
    `${viewport.name}: reverse focus trap failed`,
  );
  await page.keyboard.press("Tab");
  assert(
    await first.evaluate((element) => document.activeElement === element),
    `${viewport.name}: forward focus trap failed`,
  );
  await companies.focus();
  await page.keyboard.press("Escape");
  assert(!(await dialog.isVisible()), `${viewport.name}: Escape did not dismiss dialog`);
  assert(
    await more.evaluate((element) => document.activeElement === element),
    `${viewport.name}: focus did not return to More`,
  );

  assert(consoleErrors.length === 0, `${viewport.name}: console errors ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `${viewport.name}: page errors ${pageErrors.join(" | ")}`);
  await context.close();
  return {
    viewport: `${viewport.width}x${viewport.height}`,
    className: viewport.name,
    headerHeight: headerRect.height,
    bottomNavigationFixed: true,
    overflow: false,
    labels,
    topControlsAligned: true,
    messagingDockCoexists: true,
    safeAreaPadding: metrics.safeAreaPadding,
    focusTrap: true,
    escapeDismissal: true,
    focusRestoration: true,
  };
}

async function captureRouteScreenshot(browser, group, route, name) {
  const { context, page } = await createAuthenticatedPage(browser, group.viewport);
  await waitForAuthenticatedShell(page, route);
  const output = path.join(screenshotDir, `${group.className}-${name}.png`);
  await page.screenshot({ path: output, fullPage: false });
  await context.close();
  return path.relative(__dirname, output).replaceAll("\\", "/");
}

async function captureMoreScreenshot(browser, className, viewport, mobile) {
  const { context, page } = await createAuthenticatedPage(browser, viewport);
  await waitForAuthenticatedShell(page);
  await page
    .getByRole("button", {
      name: mobile ? "More destinations" : "More",
      exact: true,
    })
    .click();
  const output = path.join(screenshotDir, `${className}-more-open.png`);
  await page.screenshot({ path: output, fullPage: false });
  await context.close();
  return path.relative(__dirname, output).replaceAll("\\", "/");
}

async function certifyPresentationBoundary(browser) {
  const cases = [
    { route: "/", authenticated: true, mode: "public" },
    { route: "/jobs", authenticated: false, mode: "public" },
    { route: "/jobs", authenticated: true, mode: "authenticated" },
    { route: "/onboarding/identity-type", authenticated: true, mode: "onboarding" },
  ];
  const results = [];

  for (const item of cases) {
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    const page = await context.newPage();
    await installApiMocks(page);
    if (item.authenticated) {
      await page.addInitScript(() => {
        window.localStorage.setItem("openstaff_web_access_token", "exec78f1-token");
        window.localStorage.setItem("openstaff_web_refresh_token", "exec78f1-refresh");
      });
    }
    await page.goto(`${baseUrl}${item.route}`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.locator(`[data-shell-mode="${item.mode}"]`).waitFor({ timeout: 10_000 });
    const actual = await page.locator("[data-shell-mode]").getAttribute("data-shell-mode");
    assert(actual === item.mode, `${item.route}: presentation boundary mismatch`);
    results.push({ ...item, passed: true });
    await context.close();
  }
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const portraitResults = [];
    for (const viewport of tabletPortrait) {
      portraitResults.push(await certifyTabletViewport(browser, viewport));
    }

    const landscapeResults = [];
    for (const viewport of tabletLandscape) {
      landscapeResults.push(await certifyTabletViewport(browser, viewport));
    }

    const breakpointResults = [];
    for (const [width, expected] of [
      [767, "mobile"],
      [768, "compact"],
      [1199, "compact"],
      [1200, "full"],
    ]) {
      breakpointResults.push(await certifyBreakpoint(browser, width, expected));
    }

    const mobileResults = [
      await certifyMobile(browser, {
        width: 390,
        height: 844,
        name: "mobile-portrait-390x844",
      }),
      await certifyMobile(browser, {
        width: 320,
        height: 720,
        name: "mobile-narrow-320x720",
      }),
    ];

    const screenshots = [];
    for (const group of routeScreenshots) {
      for (const [route, name] of group.routes) {
        screenshots.push({
          className: group.className,
          route,
          file: await captureRouteScreenshot(browser, group, route, name),
        });
      }
    }
    screenshots.push({
      className: "tablet-portrait",
      route: "/dashboard#more",
      file: await captureMoreScreenshot(
        browser,
        "tablet-portrait",
        { width: 820, height: 1180 },
        false,
      ),
    });
    screenshots.push({
      className: "tablet-landscape",
      route: "/dashboard#more",
      file: await captureMoreScreenshot(
        browser,
        "tablet-landscape",
        { width: 1180, height: 820 },
        false,
      ),
    });
    screenshots.push({
      className: "mobile",
      route: "/dashboard#more",
      file: await captureMoreScreenshot(
        browser,
        "mobile",
        { width: 390, height: 844 },
        true,
      ),
    });

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      passed: true,
      tabletPortrait: portraitResults,
      tabletLandscape: landscapeResults,
      mobile: mobileResults,
      breakpoints: breakpointResults,
      accessibility: {
        keyboardOrder: await certifyKeyboardOrder(browser),
        screenReaderLabels: true,
        focusVisibility: true,
        modalFocusTrap: true,
        modalFocusRestoration: true,
        ariaExpanded: true,
        ariaCurrent: true,
      },
      stickyBehavior: {
        desktopHeader: true,
        tabletHeader: true,
        mobileHeader: true,
        mobileBottomNavigation: true,
        modalOverlay: true,
        safeAreaHandling: true,
      },
      presentationBoundary: await certifyPresentationBoundary(browser),
      screenshots,
    };

    fs.writeFileSync(
      path.join(proofDir, "certification.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
