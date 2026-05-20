# Live Onboarding Validation

Last updated: 2026-05-20

## Scope

This baseline defines the production proof expected before onboarding can be called fully closed:

1. COMPANY registration
2. PROFESSIONAL registration
3. password recovery request and reset completion
4. company lookup autofill
5. RELU AI profile suggestions
6. document and media submission
7. dashboard visibility for pending content
8. admin moderation visibility
9. homepage and public profile visibility after approval

## Required Browser Matrix

- Chrome desktop
- Edge desktop
- Mobile Chrome

## Required Runtime Checks

- `GET /health = 200`
- `GET /status = 200`
- onboarding API routes return healthy structured responses
- admin moderation routes remain protected and healthy
- approved public visibility remains distinct from pending visibility

## EXEC-43 Reality

As of 2026-05-20, the codebase is closer to production closure because:

- password reset notifications can now target real transactional email providers when credentials are configured
- company lookup can now use a configured Romanian provider and official VIES VAT validation
- admin onboarding now exposes first-class RELU AI review visibility
- fresh production promotions now exist on `openstaff-api-00011-ggv`, `openstaff-web-00011-ngt`, and `openstaff-admin-00017-cc4`
- Chrome desktop company registration was rerun clean after the production CORS fix for `X-Timezone`

The execution is still not fully closed live because:

- no production email provider secret is configured yet
- no Romanian company provider secret or URL is configured yet
- Edge, mobile, and admin browser sessions still show residual failed requests
- no fresh approval cycle proof yet confirms pending hidden, approved public visibility, rejected hidden, and homepage/search/public-profile visibility on the promoted revisions

## Browser Evidence Snapshot

- Chrome desktop company registration ✅: `domContentLoadedMs = 242`, `loadEventMs = 349`, `failedRequests = []`, `consoleErrors = []`, `pageErrors = []`
- Edge desktop professional registration + RELU ✅ partial: `domContentLoadedMs = 286`, `loadEventMs = 361`, residual failed request `GET /onboarding/me`
- Mobile Chrome company lookup ✅ partial: `domContentLoadedMs = 3000`, `loadEventMs = 3108`, no horizontal overflow, residual failed requests on `uniclass`, `countries`, `esco`, `profile`, `nace`, and one public-web RSC request
- Chrome desktop admin onboarding RELU review ✅ partial: `domContentLoadedMs = 244`, `loadEventMs = 344`, RELU confidence and comparison visible, residual adjacent admin/stat requests still failing

## Validation Verdict Rule

`EXEC-43 PASS` is allowed only when:

1. live provider-backed reset email is received and completed successfully
2. live company lookup returns real provider-backed data
3. RELU AI admin visibility is proven on the deployed admin revision
4. homepage/public visibility proof is captured after moderation approval
5. browser reruns no longer show residual critical request failures
