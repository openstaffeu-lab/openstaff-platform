# OpenStaff Technical Debt Register

Last updated: `2026-05-20`  
Scope: `EXEC-43`

## Purpose

This register captures the engineering debt that most affects sustainability, release safety, and lifecycle governance. It is intentionally biased toward debt that changes how we operate production, not just code style.

## Audit Method

The EXEC-27 and EXEC-28 audits reviewed:

1. active Prisma migration folders and legacy archives
2. package manifests and lockfile warnings
3. legacy/deprecated boundaries in API, public web, and admin
4. fallback, placeholder, and manual-only behavior in active runtime paths
5. repo hygiene artifacts and doc drift

Important note:

1. no high-signal `TODO` or `FIXME` backlog was found in active handwritten runtime code
2. the main debt is structural and operational, not a pile of inline markers

## Debt Register

| Severity | Area | Current state | Why it matters | Planned handling |
|---|---|---|---|---|
| critical | domain model boundary | the active product model is `User/Profile/Project/PublicPost`, but legacy `Actor/Job` flows and `FirebaseAuthGuard` are still present and tracked as legacy | this keeps auth, profile ownership, and long-term schema ownership ambiguous | choose one direction: formally bridge the models or retire the legacy layer in a dedicated execution |
| medium | residual fallback and demo helper surfaces | public detail pages no longer render fallback marketplace content to visitors, but fallback/demo helper logic still exists in supporting helpers such as `apps/admin/web/lib/public-posts.ts` | retained fallback/helper logic can still confuse future changes if it is not clearly bounded away from public truth surfaces | keep fallback logic out of public-rendered detail views and continue retiring helper-level demo/fallback paths as replacement coverage improves |
| medium | parallel onboarding surfaces | the new register plus `welcome/identity/company/completion` flow now carries the intended onboarding path, but legacy `step-*` onboarding routes still exist beside it | duplicate onboarding surfaces increase product drift, support ambiguity, and regression risk | retire or redirect the legacy `step-*` routes once the new flow is production-proven |
| medium | placeholder runtime behaviors | active runtime still contains placeholder-oriented responses for areas such as public feedback, admin roles, NACE fallback, compliance exports, and parts of billing/payroll metadata | placeholder responses are acceptable for controlled rollout, but they complicate support expectations and PASS discipline | keep only where explicitly documented; convert each surviving placeholder to either a real workflow or a gated non-production feature |
| medium | dependency drift between frontends | `apps/admin` uses `next 16.2.3` while `apps/admin/web` uses `next 16.2.4`; both use the same React major line | patch-version drift makes support and rollback analysis harder than it needs to be | unify both frontend apps on one validated Next patch during the next dependency sweep |
| medium | deprecated transitive dependencies | current lockfiles report deprecated transitive packages such as older `uuid`, older `glob`, and `inflight` | transitive deprecations increase long-term patch risk even when the direct dependency list looks healthy | review dependency tree during the next patch window and upgrade or replace the upstream packages that still pull them in |
| medium | hardcoded operational assumptions | Cloud Build YAMLs duplicate public Firebase client config values and production topology assumptions | duplication increases drift risk between build config, docs, and future project moves | keep public values centralized in docs and review the Cloud Build substitutions each release cycle |
| medium | manual commercial dependency | billing, upgrades, email delivery, and some support operations remain intentionally manual | the manual model is accepted, but it limits scaling and creates operator dependency | keep documented as accepted debt until a provider-backed commercial flow is explicitly funded and approved |
| medium | password recovery delivery operations gap | the secure reset flow now includes provider-capable email wiring, but production still has no mounted provider credential | the code path is stronger, but live account recovery is still not fully proven | mount a provider secret and capture browser plus delivery proof |
| medium | Romanian company provider configuration gap | onboarding now supports VIES plus a configurable Romanian provider path, but the production environment still lacks Romanian provider configuration | VAT-only fallback is not enough for the full company-autofill promise | configure a trusted Romanian provider and capture proof on live input cases |
| medium | RELU suggestion application gap | RELU AI suggestions are now visible both in onboarding and in admin review, but applying them into structured profile fields still depends on manual editing | visible suggestions are useful, but the flow still has avoidable clerical steps | add structured accept or reject actions for RELU outputs in a follow-up execution |
| medium | residual onboarding/admin request failures | EXEC-43 browser proof improved materially, but Edge professional onboarding, mobile company lookup, and admin RELU review still show failed adjacent requests | partial browser proof is useful, but not clean enough to support a full production-closure claim | investigate the failed requests, remove dead prefetches where appropriate, and rerun the browser matrix cleanly |
| low | tracked local SQLite artifact | `apps/admin/api/prisma/dev.db` is still tracked even though production uses PostgreSQL and the active migration baseline is in `prisma/migrations/` | tracked local state is confusing and is easy to mistake for an active baseline artifact | retain for now, then remove in a controlled local-dev cleanup once historical need is cleared |
| low | archived folders kept in repo | `apps/admin/legacy/backend-like/` and `apps/admin/openstaff/` are still retained | they are not active runtime paths, but they increase repo surface and onboarding noise | keep until a dedicated cleanup pass verifies they are no longer needed for historical reference |
| accepted debt | AI fallback behavior | Relu/Gemini intentionally fall back when `GEMINI_API_KEY` is unavailable | fallback keeps the platform operable, but lowers result quality and complicates interpretation | retain while AI remains non-blocking for the controlled rollout baseline |
| accepted debt | limited runtime stress evidence | production has strong smoke, governance, and recovery proof, but not a formal load-test baseline | the platform is suitable for controlled growth, not proven for aggressive scale | add load/capacity testing only when user growth or cost pressure justifies it |

## Debt Classification Rules

### Critical

Use `critical` when debt can distort production truth, block safe schema evolution, or weaken incident response.

### Medium

Use `medium` when debt raises release cost, support burden, or change risk, but does not immediately invalidate production operations.

### Low

Use `low` when debt mainly affects repo clarity, onboarding speed, or future cleanup cost.

### Accepted Debt

Use `accepted debt` only when:

1. the limitation is visible in governance docs
2. the current business model intentionally tolerates it
3. rollback or operator procedures already account for it

## Next Review Expectations

The debt register must be reviewed when:

1. a release changes auth boundaries
2. Prisma migration ownership changes
3. the commercial model stops being `manual_only`
4. legacy folders or tracked local state are removed
