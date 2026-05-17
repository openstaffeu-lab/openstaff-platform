const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const EXPECTED = {
  webRevision: "openstaff-web-00010-pgt",
  adminRevision: "openstaff-admin-00011-dqr",
  minCommit: "e3c3d7c",
};

async function runCommand(command, args, cwd) {
  const { stdout } = await execFileAsync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 30000,
  });
  return stdout.trim();
}

function resolveCommand(name, args = []) {
  if (name === "git") {
    return {
      command: "C:\\Program Files\\Git\\cmd\\git.exe",
      args,
    };
  }

  if (name === "gcloud") {
    return {
      command: "C:\\Windows\\System32\\cmd.exe",
      args: [
        "/c",
        "C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd",
        ...args,
      ],
    };
  }

  return {
    command: name,
    args,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "../../../..");
  const pricingPath = path.join(repoRoot, "apps/admin/web/app/pricing/pricing-page-client.tsx");
  const readinessPath = path.join(
    repoRoot,
    "apps/admin/app/admin/production-readiness/page.tsx",
  );

  const [pricingSource, readinessSource] = await Promise.all([
    fs.readFile(pricingPath, "utf8"),
    fs.readFile(readinessPath, "utf8"),
  ]);

  const gitHead = resolveCommand("git", ["rev-parse", "--short", "HEAD"]);
  const localHead = await runCommand(gitHead.command, gitHead.args, repoRoot);
  const remoteHead = await runCommand(
    resolveCommand("git", ["rev-parse", "--short", "origin/feature/work-in-progress"]).command,
    resolveCommand("git", ["rev-parse", "--short", "origin/feature/work-in-progress"]).args,
    repoRoot,
  );
  let webRevision = process.env.EXEC20_WEB_REVISION || "";
  let adminRevision = process.env.EXEC20_ADMIN_REVISION || "";

  if (!webRevision) {
    const webSpec = resolveCommand("gcloud", [
      "run",
      "services",
      "describe",
      "openstaff-web",
      "--region",
      "europe-west1",
      "--format=value(status.latestReadyRevisionName)",
    ]);
    webRevision = await runCommand(webSpec.command, webSpec.args, repoRoot);
  }

  if (!adminRevision) {
    const adminSpec = resolveCommand("gcloud", [
      "run",
      "services",
      "describe",
      "openstaff-admin",
      "--region",
      "europe-west1",
      "--format=value(status.latestReadyRevisionName)",
    ]);
    adminRevision = await runCommand(adminSpec.command, adminSpec.args, repoRoot);
  }

  const blockers = [];
  const confirmations = [];

  try {
    const forbiddenPricingPhrases = [
      "pay now",
      "instant activation",
    ];

    for (const phrase of forbiddenPricingPhrases) {
      assert(
        !pricingSource.toLowerCase().includes(phrase),
        `Forbidden pricing phrase found: "${phrase}".`,
      );
    }

    assert(
      pricingSource.includes("request upgrade") ||
        pricingSource.includes("Request Bronze") ||
        pricingSource.includes("Request Gold") ||
        pricingSource.includes("Contact Sales"),
      'Pricing source is missing request-upgrade/contact-sales language.',
    );
    assert(
      pricingSource.includes("does not activate the plan automatically"),
      'Pricing source is missing "does not activate the plan automatically".',
    );
    assert(
      pricingSource.includes("does not create an automatic checkout"),
      'Pricing source is missing "does not create an automatic checkout".',
    );
    assert(
      pricingSource.includes("operator-reviewed"),
      'Pricing source is missing explicit operator-reviewed/manual review language.',
    );

    confirmations.push("pricing source confirms manual-only commercial copy");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    const requiredReadinessMarkers = [
      "Commercial Mode",
      "Billing Mode",
      "Webhook",
      "Email / SMS",
      "manual_only",
      "billingPayments",
      "billingWebhook",
      "emailDelivery",
      "smsDelivery",
      "integrations?.commercial?.emailDelivery",
      "integrations?.commercial?.smsDelivery",
      "integrations?.billingPayments?.mode",
      "integrations?.billingWebhook?.mode",
    ];

    for (const marker of requiredReadinessMarkers) {
      assert(
        readinessSource.includes(marker),
        `Production readiness source is missing marker: "${marker}".`,
      );
    }

    confirmations.push("production readiness source renders commercial readiness fields");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    assert(localHead === remoteHead, "Local HEAD and remote HEAD are not aligned.");
    assert(
      localHead === EXPECTED.minCommit || remoteHead === EXPECTED.minCommit,
      `Expected synced commit ${EXPECTED.minCommit} but got local=${localHead} remote=${remoteHead}.`,
    );
    confirmations.push("git remote sync is aligned on EXEC-20 signoff commit");
  } catch (error) {
    blockers.push(error.message);
  }

  try {
    assert(
      webRevision === EXPECTED.webRevision,
      `Expected web revision ${EXPECTED.webRevision} but found ${webRevision}.`,
    );
    assert(
      adminRevision === EXPECTED.adminRevision,
      `Expected admin revision ${EXPECTED.adminRevision} but found ${adminRevision}.`,
    );
    confirmations.push("deployed web/admin revisions match EXEC-20 rollout targets");
  } catch (error) {
    blockers.push(error.message);
  }

  const summary = {
    status: blockers.length === 0 ? "pass_for_repo_deploy_consistency" : "in_progress",
    localHead,
    remoteHead,
    webRevision,
    adminRevision,
    confirmations,
    blockers,
    note:
      blockers.length === 0
        ? "Repo copy, admin readiness source, git sync, and deployed revisions are internally consistent. External browser proof is still a separate operator-side confirmation step."
        : "Static repo/deploy proof is incomplete; see blockers.",
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
