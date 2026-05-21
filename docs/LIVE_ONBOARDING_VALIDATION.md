# Live Onboarding Validation

Last updated: 2026-05-21

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
