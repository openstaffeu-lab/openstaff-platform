# EXEC-78F.2 Authenticated Shell Production Rollout & Live Owner Proof

Date: 2026-06-06

Verdict: `PASS`

## A. Executive Summary

The certified authenticated Shell was committed, pushed, deployed through the normal Cloud Build and Cloud Run path, and proven live on `https://openstaff.eu`.

Final production state:

- Cloud Build: `7d0cbedc-8b8d-4d72-a2f1-eb3bd73f332e` succeeded.
- Cloud Run revision: `openstaff-web-00033-8dg`.
- Traffic: 100% on `openstaff-web-00033-8dg`.
- Authenticated proof identity: existing `openstaff.eu@gmail.com` account with live `SUPERADMIN` role.
- Production route checks: 75.
- Production screenshots: 34.
- Browser failures, page errors, console errors, unexpected 4xx/5xx responses, and horizontal overflows: 0.

No Dashboard, Feed, Workspace, post-card, context-menu, API, schema, permission, guard, authentication, authorization, Notification-domain, Message-domain, or RELU-domain redesign was introduced.

## B. Git Status

The certified F.1/F.1D implementation was committed as:

- `0c528e3 feat(exec78f1): implement certified authenticated shell`

Responsive rollout hardening and the production proof harness were committed as:

- `c1ed71c fix(exec78f2): harden responsive rollout proof`

Both commits were pushed to `origin/feature/work-in-progress` before the final deployment.

Unrelated untracked architecture/audit files and `src/` were not staged, modified, or removed.

## C. Deploy Results

The final deploy used:

`gcloud.cmd builds submit --config apps/admin/web/cloudbuild.web.yaml --service-account=projects/openstaff-platform/serviceAccounts/openstaff-build@openstaff-platform.iam.gserviceaccount.com .`

Result:

- build ID: `7d0cbedc-8b8d-4d72-a2f1-eb3bd73f332e`
- status: `SUCCESS`
- image digest: `sha256:ed5ad624f6181fe234b2b50ae998181df2cd8c21103936f0644b6e404ab5dfa7`

## D. New Cloud Run Revision

`openstaff-web-00033-8dg` is both the latest created and latest ready revision.

Traffic:

| Revision | Traffic | Status |
|---|---:|---|
| `openstaff-web-00033-8dg` | 100% | READY |

## E. Signed-Out Production Proof

The following routes passed at all five required viewports:

- `/`
- `/jobs`
- `/companies`
- `/professionals`
- `/login`
- `/register`

Confirmed:

- public Shell remained public
- authenticated Shell did not render
- routes returned 200
- no route regression
- no horizontal overflow
- no forbidden authenticated destinations
- no right-hand commercial panel
- no raw identifiers, raw JSON, stack traces, secrets, or Gemini internals

## F. Signed-In Owner/Superadmin Proof

The existing production owner account `openstaff.eu@gmail.com` was authenticated through Firebase and the production `/auth/firebase-exchange` flow. The returned account was `SUPERADMIN`, `APPROVED`, and `LIVE`.

The following routes passed at all five required viewports:

- `/dashboard`
- `/jobs`
- `/companies`
- `/professionals`
- `/projects`
- `/messages`
- `/notifications`
- `/profile`
- `/security`

The proof used real production APIs and did not mock route or domain responses.

## G. Desktop, Tablet, and Mobile Proof

Validated viewports:

| Viewport | Result |
|---|---|
| 1440x900 desktop | PASS |
| 820x1180 tablet portrait | PASS |
| 1180x820 tablet landscape | PASS |
| 390x844 mobile | PASS |
| 320x720 mobile narrow | PASS |

Companies and Professionals remained inside More at tablet/compact and mobile widths. The tablet and mobile More menus were opened and captured.

## H. Forbidden UX Proof

Authenticated Shell checks confirmed absence of:

- global Search
- Institution
- Procurement
- Governance
- Contracts aggregate
- Documents aggregate
- Compliance aggregate
- RELU destination
- floating RELU assistant/chatbot
- disabled destinations
- coming-soon destinations
- acting-entity switcher
- right-hand commercial panel

Messages remained destination-only with one visible `Messages` link and no shell preview or participant metadata.

## I. Visual Palette Proof

The live authenticated header computed to `rgb(15, 23, 42)`, matching `#0F172A`.

The deployed Shell preserves:

- active success accent `#22C55E`
- Opportunities/Explore accent `#D946EF`
- focus/action blue `#2563EB`
- muted navigation `#94A3B8`
- notification/destructive badge `#EF4444`
- primary body text `#1E293B`

The public header and narrow Jobs card received responsive containment only. No visual or information-architecture redesign was introduced.

## J. Build, Lint, and Typecheck

| Validation | Result |
|---|---|
| `npx.cmd tsc --noEmit` | PASS |
| `npm.cmd run lint` | PASS WITH 21 existing warnings and 0 errors |
| `npm.cmd run build` | PASS |
| original F.1 browser proof | PASS |
| F.1D responsive certification | PASS |

## K. Health and Status Results

Post-deploy:

- `GET https://api.openstaff.eu/health`: `status=ok`, `environment=production`
- `GET https://api.openstaff.eu/status`: `status=ok`, `db=healthy`
- readiness warnings: none
- readiness errors: none

The broader platform rollout-intelligence state remains `pause_rollout` because old moderation and upgrade items exceed one business day. This is an existing operational backlog and was not caused by the Shell deployment.

## L. Files Modified

Application hardening:

- `apps/admin/web/components/Navbar.tsx`
- `apps/admin/web/components/JobsPageClient.tsx`

Evidence:

- `EXEC78F2_PRODUCTION_AUTHENTICATED_SHELL_ROLLOUT.md`
- `docs/proof/exec78/exec78f2-production-browser-proof.cjs`
- `docs/proof/exec78/exec78f2-live-contract-proof.cjs`
- `docs/proof/exec78/exec78f2/production-browser-proof.json`
- `docs/proof/exec78/exec78f2/live-contract-proof.json`
- 34 screenshots under `docs/proof/exec78/exec78f2/screenshots/`
- `STATUS.md`
- `docs/proof/exec78/README.md`

## M. Commit SHA

Deployed application commit: `c1ed71c`.

The final documentation/evidence commit is recorded by the repository history after this report is committed.

## N. Push Status

The deployed application commits were pushed successfully to `origin/feature/work-in-progress`.

## O. Remaining Risks

1. Notification unread state remains polling/focus/navigation refreshed rather than domain-pushed in real time.
2. The production status endpoint reports existing failed Notification and RELU queue history and an old moderation/upgrade backlog.
3. Auth tokens remain stored in browser local storage under the existing authentication architecture.

These risks predate or sit outside the constrained Shell rollout. The live Shell itself met the required rollout gates.

## P. Final Verdict

Verdict: `PASS`.

The authenticated Shell is live on `openstaff.eu`, the final Cloud Run revision is READY with 100% traffic, real owner/superadmin production proof passed, all required viewport and route checks passed, forbidden Shell UX is absent, and no route/domain/security behavior was expanded.

EXEC-78F.2 PASS
