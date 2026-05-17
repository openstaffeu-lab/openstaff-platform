const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const LIVE = {
  web: "https://openstaff.eu",
  www: "https://www.openstaff.eu",
  pricing: "https://openstaff.eu/pricing",
  apiHealth: "https://api.openstaff.eu/health",
  apiStatus: "https://api.openstaff.eu/status",
  admin: "https://backoffice.openstaff.eu",
  adminBilling: "https://api.openstaff.eu/admin/billing/invoices",
};

async function request(url, options = {}) {
  const args = ["-sS"];

  if (options.method === "HEAD") {
    args.push("-I");
  } else {
    args.push("-D", "-");
  }

  const mergedHeaders = {
    "user-agent": "openstaff-exec20-launch-check",
    ...(options.headers ?? {}),
  };

  for (const [key, value] of Object.entries(mergedHeaders)) {
    args.push("-H", `${key}: ${value}`);
  }

  args.push(
    "-w",
    "\n__CURL_STATUS__:%{http_code}\n__CURL_REDIRECT__:%{redirect_url}\n",
    url,
  );

  const { stdout } = await execFileAsync("curl.exe", args, { encoding: "utf8" });
  const statusMatch = stdout.match(/__CURL_STATUS__:(\d+)/);
  const redirectMatch = stdout.match(/__CURL_REDIRECT__:(.*)\n?$/m);
  const status = statusMatch ? Number(statusMatch[1]) : 0;
  const redirectUrl = redirectMatch ? redirectMatch[1].trim() : "";

  const withoutTrailer = stdout.replace(/\n__CURL_STATUS__:[\s\S]*$/m, "");
  const headerSplitIndex = withoutTrailer.indexOf("\r\n\r\n");
  const headersRaw =
    headerSplitIndex >= 0 ? withoutTrailer.slice(0, headerSplitIndex) : "";
  const body =
    headerSplitIndex >= 0 ? withoutTrailer.slice(headerSplitIndex + 4) : withoutTrailer;

  const headers = new Map();
  for (const line of headersRaw.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex > 0) {
      headers.set(
        line.slice(0, separatorIndex).trim().toLowerCase(),
        line.slice(separatorIndex + 1).trim(),
      );
    }
  }

  return {
    response: {
      status,
      headers: {
        get(name) {
          if (name.toLowerCase() === "redirect-url") {
            return redirectUrl || null;
          }

          return headers.get(name.toLowerCase()) ?? null;
        },
      },
    },
    text: body,
  };
}

async function safeRequest(url, options = {}) {
  try {
    const result = await request(url, options);
    return { ...result, error: null };
  } catch (error) {
    return {
      response: {
        status: 0,
        headers: {
          get() {
            return null;
          },
        },
      },
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "../../../..");
  const pricingSourcePath = path.join(
    repoRoot,
    "apps/admin/web/app/pricing/pricing-page-client.tsx",
  );
  const readinessSourcePath = path.join(
    repoRoot,
    "apps/admin/app/admin/production-readiness/page.tsx",
  );
  const statusFilePath = path.join(repoRoot, "STATUS.md");

  const [pricingSource, readinessSource, statusMarkdown] = await Promise.all([
    fs.readFile(pricingSourcePath, "utf8"),
    fs.readFile(readinessSourcePath, "utf8"),
    fs.readFile(statusFilePath, "utf8"),
  ]);

  const healthResult = await safeRequest(LIVE.apiHealth);
  const statusResult = await safeRequest(LIVE.apiStatus);
  const webResult = await safeRequest(LIVE.web);
  const wwwResult = await safeRequest(LIVE.www);
  const adminResult = await safeRequest(LIVE.admin);
  const protectedResult = await safeRequest(LIVE.adminBilling);

  const blockers = [];
  const notes = [];

  const transportErrors = [
    ["apiHealth", healthResult.error],
    ["apiStatus", statusResult.error],
    ["web", webResult.error],
    ["www", wwwResult.error],
    ["admin", adminResult.error],
    ["adminBilling", protectedResult.error],
  ].filter(([, error]) => Boolean(error));

  for (const [target, error] of transportErrors) {
    blockers.push(`Transport error for ${target}: ${error}`);
  }

  const health = healthResult.text ? JSON.parse(healthResult.text) : {};
  const status = statusResult.text ? JSON.parse(statusResult.text) : {};

  try {
    assert(healthResult.response.status === 200, "/health must return 200.");
    assert(health.status === "ok", "/health payload must report status=ok.");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    assert(statusResult.response.status === 200, "/status must return 200.");
    assert(status.status === "ok", "/status payload must report status=ok.");
    assert(Array.isArray(status.readiness?.errors), "/status.readiness.errors must exist.");
    assert(status.readiness.errors.length === 0, "/status.readiness.errors must be empty.");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    assert(webResult.response.status === 200, "openstaff.eu must return 200.");
    assert(wwwResult.response.status === 308, "www.openstaff.eu must return 308 redirect.");
    assert(
      wwwResult.response.headers.get("location") === "https://openstaff.eu/",
      "www redirect must point to https://openstaff.eu/.",
    );
    assert(adminResult.response.status === 200, "backoffice.openstaff.eu must return 200.");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    assert(
      protectedResult.response.status === 401 || protectedResult.response.status === 403,
      "Admin billing route must stay protected without a token.",
    );
  } catch (error) {
    blockers.push(error.message);
  }

  const pricingHasManualLanguage =
    pricingSource.includes("request upgrade") ||
    pricingSource.includes("Request Bronze") ||
    pricingSource.includes("Request Gold") ||
    pricingSource.includes("Contact Sales");
  const pricingHasNoAutoActivationCopy =
    pricingSource.includes("does not activate the plan automatically") &&
    pricingSource.includes("does not create an automatic checkout");

  if (!pricingHasManualLanguage || !pricingHasNoAutoActivationCopy) {
    blockers.push(
      "Pricing source is missing explicit manual-only commercial copy for upgrade/checkout behavior.",
    );
  }

  const readinessMentionsCommercialMode =
    readinessSource.includes("Commercial Mode") &&
    readinessSource.includes("Billing Mode") &&
    readinessSource.includes("Ready for controlled rollout");

  if (!readinessMentionsCommercialMode) {
    blockers.push(
      "Production readiness page is missing the expected launch mode / billing mode rollout indicators.",
    );
  }

  const hasExec19Pass = statusMarkdown.includes(
    "## EXEC-19 Commercial Operations Closure: Payments, Webhooks & External Notifications",
  ) && statusMarkdown.includes("Verdict: `PASS - controlled public launch mode");

  if (!hasExec19Pass) {
    blockers.push("STATUS.md does not reflect the finalized EXEC-19 PASS baseline.");
  }

  const commercialStatus = status.integrations?.commercial;
  if (!commercialStatus) {
    blockers.push(
      "Live /status does not yet expose the EXEC-19/EXEC-20 commercial readiness contract.",
    );
  } else {
    if (commercialStatus.launchMode !== "manual_only") {
      blockers.push("Live /status commercial.launchMode must be manual_only for controlled rollout.");
    }
    if (commercialStatus.emailDelivery !== "not_configured") {
      blockers.push("Live /status commercial.emailDelivery must be not_configured.");
    }
    if (
      commercialStatus.smsDelivery !== "manual_only" &&
      commercialStatus.smsDelivery !== "not_required"
    ) {
      blockers.push("Live /status commercial.smsDelivery must be manual_only or not_required.");
    }
  }

  if (status.integrations?.billingWebhook?.mode !== "configured") {
    blockers.push("Live /status billing webhook mode must be configured.");
  }

  if (blockers.length === 0) {
    notes.push("Controlled rollout is technically and commercially aligned for the current launch mode.");
  } else {
    notes.push(
      "Controlled rollout remains in progress until live runtime evidence and repository messaging are fully aligned.",
    );
  }

  const summary = {
    status: blockers.length === 0 ? "pass" : "in_progress",
    timestamp: new Date().toISOString(),
    live: {
      healthStatus: healthResult.response.status,
      statusStatus: statusResult.response.status,
      webStatus: webResult.response.status,
      wwwStatus: wwwResult.response.status,
      adminStatus: adminResult.response.status,
      adminProtectedStatus: protectedResult.response.status,
    },
    commercial: {
      liveStatusPresent: Boolean(commercialStatus),
      launchMode: commercialStatus?.launchMode ?? null,
      billingWebhookMode: status.integrations?.billingWebhook?.mode ?? null,
      emailMode: commercialStatus?.emailDelivery ?? null,
      smsMode: commercialStatus?.smsDelivery ?? null,
    },
    blockers,
    notes,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
