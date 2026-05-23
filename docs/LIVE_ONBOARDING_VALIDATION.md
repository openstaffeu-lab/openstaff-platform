# Live Onboarding Validation

Last updated: 2026-05-23

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

## EXEC-46 Reality

As of 2026-05-21, the codebase is closer to production closure because:

- password reset notifications can now target real transactional email providers when credentials are configured
- company lookup can now use a configured Romanian provider and official VIES VAT validation
- public company lookup attempts now persist first-class audit evidence with provider, status, fallback, and returned metadata
- admin onboarding now exposes first-class RELU AI review visibility
- fresh production promotions now exist on `openstaff-api-00012-bz7`, `openstaff-web-00013-7p6`, and `openstaff-admin-00019-88r`
- browser reruns are now clean across company onboarding, professional RELU, mobile lookup, admin RELU, homepage, jobs, professionals, and public profile
- approved homepage/jobs/professionals/public-profile visibility is now re-proven live on the EXEC-44 cohort

The execution is still not fully closed live because:

- no production email provider secret is configured yet
- no Romanian company provider secret or URL is configured yet
- `gcloud secrets list --project openstaff-platform` confirms the required provider secrets do not exist in Secret Manager today
- `gcloud run services describe openstaff-api --region europe-west1 --project openstaff-platform --format=json` confirms the active runtime still mounts no email-provider or Romanian-provider env
- live provider-backed reset delivery is still impossible because `/status` remains `emailDelivery = not_configured`
- live Romanian provider-backed lookup is still impossible because the provider URL/API key is still absent in production

## Browser Evidence Snapshot

- Chrome desktop company onboarding clean: `httpStatus = 200`, `failedRequests = []`, `badResponses = []`, `consoleErrors = []`, `pageErrors = []`
- Edge desktop professional onboarding + RELU clean: `httpStatus = 200`, `failedRequests = []`, `badResponses = []`, `consoleErrors = []`, `pageErrors = []`
- Mobile Chrome company lookup clean: `httpStatus = 200`, `failedRequests = []`, `badResponses = []`, `consoleErrors = []`, `pageErrors = []`, no horizontal overflow
- Chrome desktop admin onboarding RELU review clean: `httpStatus = 200`, `failedRequests = []`, `badResponses = []`, `consoleErrors = []`, `pageErrors = []`
- Chrome desktop homepage/jobs/professionals/public-profile clean: all four public visibility routes now render the approved EXEC-44 cohort content with `failedRequests = []`, `badResponses = []`, `consoleErrors = []`, `pageErrors = []`

## Validation Verdict Rule

`EXEC-46 PASS` is allowed only when:

1. live provider-backed reset email is received and completed successfully
2. live Romanian company lookup returns real provider-backed data
3. RELU AI admin visibility is proven on the deployed admin revision
4. homepage/public visibility proof is captured after moderation approval
5. browser reruns no longer show residual critical request failures

## EXEC-47 Reality

As of 2026-05-21, the onboarding codepath is closer to immediate provider activation because:

- the API now supports generic `EMAIL_PROVIDER` + `EMAIL_API_KEY` activation
- the API now supports real `SMTP_URL` delivery
- register defaults now return `phonePrefix`
- the register form now starts the phone field from the inferred prefix instead of a blank value

The execution is still not fully closed live because:

- Secret Manager still contains no real transactional email provider secret
- Secret Manager still contains no Romanian company provider secret
- `/status` still reports `integrations.emailDelivery.mode = not_configured`
- the final provider-backed forgot-password flow still cannot be exercised in production
- the final full browser matrix was not rerun without a live provider-backed reset flow

`EXEC-47 PASS` is allowed only when:

1. live provider-backed reset email is received and completed successfully
2. live Romanian company lookup returns real provider-backed data
3. localization defaults, company autofill, and RELU AI suggestions are revalidated in the browser on the latest deployed revisions
4. homepage/public visibility proof is captured after moderation approval on the same fresh revisions
5. browser reruns return `failedRequests = []`, `consoleErrors = []`, `pageErrors = []`, and no mobile overflow

## EXEC-49 Dependency Truth

As of 2026-05-22, the remaining onboarding closure blockers are no longer code-implementation blockers first. They are operator-side provider and test-data blockers:

- transactional email provider credentials are missing
- Romanian provider credentials are missing
- password-reset inbox proof is missing
- approved Romanian CUI/VAT test values are missing
- final company and professional test accounts are missing

EXEC-50 should start only after those inputs are supplied.

## EXEC-51 Runtime Contract Truth

As of `2026-05-22`, the live production contract remains operational and honest:

- `GET /health = 200`
- `GET /status = 200`
- `readiness.warnings = []`
- `readiness.errors = []`
- `integrations.emailDelivery.mode = not_configured`
- the active API runtime still mounts no transactional email provider secret
- the active API runtime still mounts no Romanian provider URL/API key

That means the platform is now in a very narrow readiness state:

- COMPANY and PROFESSIONAL onboarding are code-ready
- localization defaults are implemented at a useful baseline level
- RELU AI suggestion surfaces are implemented and visible
- homepage/jobs/professionals/public-profile proof already exists from EXEC-44
- final provider-backed password reset proof is still blocked externally
- final provider-backed Romanian autofill proof is still blocked externally

## EXEC-51 Activation Rule

`EXEC-51 PASS` is allowed only for orchestration and readiness closure.

`EXEC-52 PASS` is allowed only when:

1. Secret Manager contains the real chosen email-provider secrets
2. Secret Manager contains the real Romanian-provider secrets
3. `openstaff-api` mounts those secrets on the latest ready revision
4. `/status.integrations.emailDelivery.mode = configured`
5. a real reset email is received and used successfully
6. a real Romanian provider-backed lookup returns live provider data
7. RELU AI upload-to-profile proof is rerun fresh
8. Chrome, Edge, and Mobile Chrome reruns are clean on the same promoted revisions

## EXEC-53 Identity Form Reality

As of `2026-05-22`, the live public identity step on `openstaff-web-00018-fb5` is no longer the blocking UX/runtime issue it was before this execution:

- first name, last name, display/public name, phone, country, city, language, timezone, links, and bio now accept reliable typing without defaults overwriting active edits
- the identity page now explains required versus optional fields in clearer Romanian copy
- save/continue behavior is now explicit and no longer hides behind a long-running disabled CTA while prior data loads
- revisit and reload of `/onboarding/identity` now restore saved data quickly on the promoted public web revision
- relogin bootstrap now restores saved identity data again after authentication
- mobile validation now confirms no horizontal overflow on the identity step

EXEC-53 does **not** close the provider-backed EXEC-52 work. The live provider blockers remain:

- `integrations.emailDelivery.mode = not_configured`
- no Romanian provider secret is mounted in production

## EXEC-53 Browser Evidence Snapshot

- Chrome desktop identity typing + save + revisit + reload: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`, revisit restore in `52ms`, reload restore in `18ms`
- Chrome desktop relogin bootstrap: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`, saved first name restored in `558ms`
- Edge desktop COMPANY identity save + revisit: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`, revisit restore in `74ms`
- Mobile Chrome identity save + revisit: `consoleErrors = []`, `pageErrors = []`, `badResponses = []`, revisit restore in `637ms`, post-save restore in `561ms`, and `scrollWidth = viewportWidth`
- Targeted diacritics proof accepted `Ștefan`, `București`, and `Mecanică, întreținere și coordonare.`

# EXEC-56 Public Auth Noise And Provider Reality

- public anonymous browser checks on promoted `openstaff-web-00020-wtl` across `/, /register, /login, /onboarding/welcome` stayed free of `401` responses, `4xx/5xx` responses, console errors, and page errors in Chrome desktop, Edge desktop, and mobile Chrome
- stale-access-token browser checks with no refresh token also stayed free of `401` responses after the client-side auth fallback was hardened; only navigation-aborted requests were observed during route transitions
- production still cannot claim password-reset delivery or Romanian provider-backed company autofill because Secret Manager and Cloud Run still expose no provider secrets or mounts
- `/status` remains the source of truth and still reports `integrations.emailDelivery.mode = not_configured`
- DNS inspection now matters for the remaining closure work: `_dmarc.openstaff.eu = "v=DMARC1; p=none;"`, no SPF TXT was visible at `openstaff.eu`, and DKIM could not be verified without the actual provider selector

# EXEC-57 Recovery Reality

- EXEC-56 public-auth cleanliness remains valid on the current live revisions
- transactional account recovery is still blocked entirely by missing runtime provider activation and incomplete deliverability hardening
- no new onboarding or public-browsing regression was discovered during the EXEC-57 re-audit

## EXEC-54 Identity Product Reality

As of `2026-05-22`, the public identity step on `openstaff-web-00019-5x7` now behaves much more like a guided onboarding flow:

- optional public links no longer behave like required fields
- invalid optional URLs now show soft inline guidance instead of hard save blockers
- RELU AI is visible directly on the identity step, not only later in completion
- category, ESCO, and Uniclass suggestions are now available during identity drafting
- the page now includes a public-preview card and local image preview guidance before completion

## EXEC-54 Browser Evidence Snapshot

- Chrome desktop: invalid GitHub input still allowed continuation, optional guidance was visible, RELU AI was visible, and revisit persistence succeeded in `34ms`
- Targeted Chrome RELU proof: `RELU AI a pregatit sugestii pentru descriere, expertiza si clasificare.` plus visible `ESCO sugerat`, `NACE sugerat`, and `Uniclass sugerat`
- Edge desktop COMPANY identity flow: revisit persistence succeeded in `46ms`
- Mobile Chrome: optional-social toggle visible, revisit persistence succeeded in `56ms`, and `scrollWidth = viewportWidth = bodyScrollWidth`
- `consoleErrors = []`
- `pageErrors = []`
- no `4xx/5xx` responses were observed during the EXEC-54 browser proof

Navigation-aborted requests were still observed during route transitions and background navigation, but they did not surface as `4xx/5xx` runtime failures and did not block completion of the identity step.
## EXEC-60 Note

EXEC-60 added fresh production proof that three real account shapes can register, save onboarding/profile data, upload proof assets, survive relogin, and reach moderated public visibility before cleanup. The same execution also exposed three honest remaining product/runtime gaps:

1. `POST /relu/onboarding-assistant` still returned `INTERNAL_ERROR`
2. profile-side structured taxonomy/geography relations remain incomplete because `/countries` and legacy `/esco` returned empty live datasets
3. uploaded proof assets still reported `storage.provider = local`, so durable GCS-backed persistence was not proven

## EXEC-61 Closure Note

EXEC-61 closes those remaining product/runtime gaps for the real account flow baseline:

- `POST /relu/onboarding-assistant` no longer returns `INTERNAL_ERROR`; it now returns advisory continuity-mode suggestions when Gemini quota is depleted
- `/countries` now returns a seeded Romania-first baseline when the production table is empty, and legacy `/esco` is backfilled from live taxonomy rows when needed
- `/profile` now persists geography and taxonomy selections through code/name fallback resolution instead of failing on sparse relation-only datasets
- live proof assets for profile uploads now persist as `storage.provider = gcs` with bucket `openstaff-platform-production`
- the approved subcontractor/company-looking-for-projects proof item now appears in the public feed summary, not only on its direct public detail route

Fresh rerun proof `exec60-1779554181293` on the promoted revisions confirmed:

- three real account shapes still register, log in, onboard, upload, moderate, and survive relogin
- RELU enrich/classify/results still work
- RELU onboarding-assistant is closure-safe for the user journey
- geography and taxonomy values persist across relogin
- public browser validation stayed clean across Chrome desktop, Edge desktop, and mobile Chrome
