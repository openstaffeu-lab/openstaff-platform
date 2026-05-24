# OpenStaff Production Hardening Review

Date: 2026-05-24  
Execution: `EXEC-63`  
Branch: `feature/work-in-progress`

## Verdict

Classification: `BETA_READY`

OpenStaff is no longer blocked by high-severity dependency audit findings, broken API tests, failing public-web lint, or the previously observed Cloud Build staging-permission concern. The platform is not yet honestly `PRODUCTION_READY` because token persistence still relies on `localStorage`, some moderate transitive advisories remain accepted, and EXEC-63 did not promote this exact hardening commit to production.

## What was hardened

- patched frontend runtime dependencies to the current safe patch line used in this repo
- removed the unsafe `xlsx` dependency from the API
- restricted taxonomy imports to CSV-only hardened mode
- converted `/dev-files` exposure to development-only behavior
- stabilized the API test harness with reusable mocks and deterministic setup
- standardized read-only lint / format scripts for CI use
- removed tracked runtime artifacts from the Git index
- verified that ignored local secret files remain untracked
- revalidated live production health and status endpoints
- revalidated recent successful Cloud Build deploy pipelines and Cloud Build staging-bucket IAM

## Current security posture

### Closed or reduced risks

- High-severity `xlsx` parser exposure is closed by removing the package and disabling workbook imports.
- Public upload exposure is reduced because `/dev-files` is no longer mounted in production mode.
- Dependency posture is materially better: no remaining `npm audit` high blockers.
- The API already blocks dangerous dev/demo runtime flags in production.

### Remaining risks

1. `localStorage` auth persistence
   - current level: `high`
   - impact: XSS could exfiltrate durable session tokens from public web or backoffice
   - next action: migrate refresh token handling to `HttpOnly`, `Secure`, `SameSite` cookies and keep short-lived access tokens in memory

2. accepted moderate transitive advisories
   - current level: `medium`
   - impact: no immediate release stop after EXEC-63, but they must stay tracked
   - scope:
     - `postcss` via current Next.js patch line
     - `uuid` via Firebase / Google Cloud transitive dependencies

3. public media access model still needs long-term review
   - current level: `medium`
   - note: existing moderation and GCS-backed persistence are acceptable for beta, but signed URL strategy and tighter ACL review should remain in the production-hardening backlog

## Low-risk hardening implemented now

- removed unsafe workbook parsing entirely instead of trying to sandbox it inside the current API process
- made import UI advertise CSV-only input
- preserved structured JSON responses for invalid import attempts
- kept CI-facing lint scripts read-only
- documented release gates and secret hygiene

## Larger hardening left as follow-up

- cookie-based session migration
- strict CSP for both frontends
- broader secret scanning automation in CI
- deeper signed-URL review for all private media/document surfaces
- upstream dependency refreshes when the accepted moderate advisories become patchable
