# OpenStaff Platform Status

Last updated: 2026-05-14

## EXEC-02 Sprint 1A Auth Consolidation

| Task | Status | Confirmat prin |
|---|---|---|
| Auth contract unic | ✅ | `auth.controller.ts` expune `register`, `login`, `me`, `refresh`, `logout`, `firebase-exchange`; `apps/admin/api -> npm run build` succes |
| `/auth/register` | ✅ | `POST /auth/register` returnează `201` cu `user`, `accessToken`, `refreshToken`, fără `password`/`refreshTokenHash` |
| `/auth/login` | ✅ | `POST /auth/login` returnează `200` cu `user`, `accessToken`, `refreshToken` |
| `/auth/me valid` | ✅ | `GET /auth/me` cu access token valid returnează `200` și model `User`, nu `Actor` |
| `/auth/me invalid` | ✅ | `GET /auth/me` cu token invalid returnează `401 Unauthorized` |
| `/auth/refresh` | ✅ | `POST /auth/refresh` returnează `200` și emite `accessToken` + `refreshToken` noi |
| `/auth/logout` | ✅ | `POST /auth/logout` cu access token valid returnează `204` |
| `/auth/refresh după logout` | ✅ | `POST /auth/refresh` cu refresh token vechi după logout returnează `401` |
| `/auth/firebase-exchange` | 🚧 | Ruta mapată la boot; implementată pe `User`, dar netestată runtime fără token Firebase valid și DB funcțională |
| `FirebaseAuthGuard` legacy | ✅ | `apps/admin/api/src/auth/firebase-auth.guard.ts` marcat `@deprecated`; documentat în `apps/admin/api/src/LEGACY.md` |
| `auth/service.ts` legacy | ✅ | `apps/admin/api/src/auth/service.ts` marcat `@deprecated`; documentat în `apps/admin/api/src/LEGACY.md` |
| Public web auth aligned | ✅ | `apps/admin/web -> npm run build` succes; `AuthContext`, `login`, `register`, `refresh`, `logout` mutate pe contractul JWT `/auth/*` |
| Admin auth aligned | ✅ | `apps/admin -> npm run build` succes; login admin folosește același `/auth/login` + `/auth/me`, cu verificare rol `ADMIN/SUPERADMIN` |
| Build API | ✅ | `apps/admin/api -> npx prisma validate` succes; `apps/admin/api -> npm run build` succes |
| Build web | ✅ | `apps/admin/web -> npm run build` succes |
| Build admin | ✅ | `apps/admin -> npm run build` succes |

## EXEC-02C Local PostgreSQL Recovery & Auth Runtime Finalization

Status general: `RESOLVED - runtime validation completed on local DB`

| Task | Status | Confirmat prin |
|---|---|---|
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `migration` | 🚧 | `prisma migrate dev` rămâne incompatibil cu istoricul vechi SQLite-style, dar DB-ul local disponibil a permis validarea runtime auth |
| `/auth/register` | ✅ | test HTTP local returnează `201` |
| `/auth/login` | ✅ | test HTTP local returnează `200` |
| `/auth/me valid` | ✅ | test HTTP local returnează `200` |
| `/auth/me invalid 401` | ✅ | `GET /auth/me` cu token invalid returnează `401` |
| `/auth/refresh` | ✅ | test HTTP local returnează `200` |
| `/auth/logout` | ✅ | test HTTP local returnează `204` |
| `refresh după logout invalid` | ✅ | test HTTP local returnează `401` |
| Build API | ✅ | `cd apps/admin/api && npm.cmd run build` |
| Build web | ✅ | `cd apps/admin/web && npm.cmd run build` |
| Build admin | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-02 Runtime Validation

Verdict: `PASS`

| Task | Status | Confirmat prin |
|---|---|---|
| `health` | ✅ | `GET http://127.0.0.1:8080/health` returnează `200` cu `status: ok`, `environment: development` |
| `register` | ✅ | `POST /auth/register` returnează `201` și include `user`, `accessToken`, `refreshToken` |
| `login` | ✅ | `POST /auth/login` returnează `200` |
| `me valid` | ✅ | `GET /auth/me` cu token valid returnează `200` și model `User` |
| `me invalid` | ✅ | `GET /auth/me` cu token invalid returnează `401` |
| `refresh` | ✅ | `POST /auth/refresh` returnează `200` |
| `refresh tokens changed` | ✅ | validare explicită că `accessToken` și `refreshToken` se schimbă după refresh |
| `logout` | ✅ | `POST /auth/logout` returnează `204` |
| `refresh after logout` | ✅ | `POST /auth/refresh` cu refresh token vechi returnează `401` |
| `API build` | ✅ | `cd apps/admin/api && npm.cmd run build` |
| `web build` | ✅ | `cd apps/admin/web && npm.cmd run build` |
| `admin build` | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-03 Subscription Plans, Entitlements & Gating

Status general: `PASS - backend-first subscription contract, upgrade requests, and entitlement gating validated locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `SubscriptionPlan` catalog | ✅ | Prisma schema include `SubscriptionPlan`; `GET /plans` răspunde `200` |
| `PlanEntitlement` model | ✅ | Prisma schema include `PlanEntitlement`; seed minim pentru feature-uri și limite |
| `AccountSubscription` model | ✅ | Prisma schema include `AccountSubscription`; userii noi primesc automat planul `BASIC` |
| `UsageMeter` model | ✅ | Prisma schema include `UsageMeter`; utilizat pentru `PRIVATE_CONTACTS` |
| seed planuri minime | ✅ | `npx.cmd prisma db seed` creează `BASIC`, `BRONZE`, `GOLD`, `ENTERPRISE` |
| `GET /plans` | ✅ | test HTTP local returnează `200` și 4 planuri |
| `/auth/me.subscription` | ✅ | `GET /auth/me` returnează `subscription.planCode`, `contactLimit`, `contactsUsed`, `features` |
| `GET /subscriptions/me` | ✅ | test HTTP local returnează `200` pentru user autentificat |
| project gating web | ✅ | `/projects` și `/projects/new` blochează crearea când `projectIngestion = false` |
| admin subscription visibility | ✅ | dashboard admin afișează planul activ și contactele private rămase |
| private chat gating UI | ✅ | paginile job/professional și `MessagingDock` afișează planul și limitele rămase |
| `PRIVATE_CONTACTS` runtime enforcement | ✅ | primele 5 `POST /private-conversations` returnează `201`, a 6-a returnează `403` pe planul `BASIC` |
| `UsageMeter` increment runtime | ✅ | după 5 conversații private, `GET /auth/me` returnează `contactsUsed = 5`, `contactLimit = 5`, `planCode = BASIC` |
| `/pricing` conectat la `GET /plans` | ✅ | pagina publică `/pricing` compilează și afișează planurile din backend-first contract |
| upgrade CTA pentru private contact limit | ✅ | `MessagingDock`, `DirectConversationsPanel`, `jobs/[id]`, `professionals/[id]` trimit către `/pricing` când limita sau `403` blochează fluxul |
| Build API | ✅ | `cd apps/admin/api && npm.cmd run build` |
| Build web | ✅ | `cd apps/admin/web && npm.cmd run build` |
| Build admin | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-04 Billing & Commercial Foundations

Status general: `PASS - admin approval now activates plans, records billing events, and logs audit entries`

| Task | Status | Confirmat prin |
|---|---|---|
| `BillingEvent` model | ✅ | Prisma schema include `BillingEvent` cu `type`, `amount`, `currency`, `status`, `metadata` |
| audit log commercial | ✅ | approve flow și manual plan change creează `AuditLog` cu `entityType`, `action`, `beforeJson`, `afterJson` |
| approve upgrade request endpoint | ✅ | `POST /admin/subscription-upgrade-requests/:id/approve` returnează `200` |
| upgrade request `APPROVED` -> plan activated | ✅ | approve runtime returnează `request.status = APPROVED`, `subscription.planCode = GOLD` |
| `/auth/me` reflects approved plan | ✅ | după approve, `GET /auth/me` pentru userul normal returnează `subscription.planCode = GOLD` |
| manual plan change endpoint | ✅ | `POST /admin/users/:userId/subscription` returnează `200` și schimbă planul la `BRONZE` |
| usage reset on plan change | ✅ | după manual change, `GET /auth/me` returnează `contactsUsed = 0` |
| admin UI approve action | ✅ | `apps/admin/app/admin/subscriptions/page.tsx` compilează cu buton `Approve` și hook admin API |
| non-admin protected | ✅ | approve endpoint și manual change endpoint returnează `401/403` fără token și cu token non-admin |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-04B Billing Engine Foundation

Status general: `PASS - invoice aggregation, webhook intake, reconciliation placeholder, and renewals validated locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `BillingInvoice` model | ✅ | Prisma schema include `BillingInvoice` cu `invoiceNumber`, `status`, `subtotal`, `total`, `issuedAt`, `dueAt` |
| `BillingInvoiceLine` model | ✅ | Prisma schema include `BillingInvoiceLine` legat optional la `BillingEvent` |
| `PaymentRecord` model | ✅ | Prisma schema include `PaymentRecord` cu `provider`, `status`, `amount`, `paidAt` |
| `BillingWebhookEvent` model | ✅ | Prisma schema include `BillingWebhookEvent` cu `provider`, `eventType`, `status`, `payload` |
| `SubscriptionRenewal` model | ✅ | Prisma schema include `SubscriptionRenewal` cu `periodStart`, `periodEnd`, `scheduledAt`, `billingInvoiceId` |
| invoice generation | ✅ | `POST /admin/billing/invoices/generate` returneaza `200`, `status = ISSUED`, `lines.Count = 1` |
| mark invoice paid | ✅ | `POST /admin/billing/invoices/:id/mark-paid` returneaza `200`, invoice `PAID` |
| payment reconciliation placeholder | ✅ | dupa mark paid, `PaymentRecord.status = RECONCILED` si `BillingEvent.status = PAID` |
| webhook receive | ✅ | `POST /billing/webhooks/stripe-placeholder` returneaza `200`, `status = RECEIVED` |
| webhook process placeholder | ✅ | `POST /admin/billing/webhooks/:id/process` returneaza `200`, `status = PROCESSED` |
| renewal generation | ✅ | `POST /admin/billing/renewals/generate` returneaza `200`, `createdCount = 2` pe subscriptions active platite |
| renewal process | ✅ | `POST /admin/billing/renewals/:id/process` returneaza `200`, `renewal.status = PROCESSED`, `invoice.id` prezent |
| admin billing page | ✅ | `apps/admin/app/admin/billing/page.tsx` compileaza si ruta `/admin/billing` apare in build |
| admin protected endpoints | ✅ | `GET /admin/billing/invoices` fara token si cu token non-admin returneaza `401/403` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-04C Billing Profile, VAT & Fiscalization Integration

Status general: `PASS - billing profile, VAT logic, proforma/fiscal invoice lifecycle validated locally on PostgreSQL`

| Task | Status | Confirmat prin |
|---|---|---|
| `BillingProfile` model | ✅ | Prisma schema include `BillingProfile` cu date de facturare, `currency`, `isCompany`, `isVatPayer`, `vatMode` |
| `BillingVatMode` enum | ✅ | Prisma schema include `DOMESTIC`, `EU_REVERSE_CHARGE`, `EXPORT`, `EXEMPT` |
| `BillingInvoice` fiscal fields | ✅ | Prisma schema include `invoiceType`, `fiscalSeries`, `fiscalNumber`, `proformaReference`, plus `subtotal`, `taxAmount`, `total` |
| `BillingService.calculateVat(...)` | ✅ | serviciul aplică `RO -> 19%`, `EU B2B + VAT -> 0% reverse charge`, `EU B2C -> TVA standard`, `NON-EU -> 0%` |
| billing profile endpoints | ✅ | `GET /billing/profile/me` și `PUT /billing/profile/me` adăugate în `BillingProfileController` |
| upgrade approved -> invoice generated | ✅ | `SubscriptionsService.approveUpgradeRequest()` creează `BillingEvent` și cheamă `BillingService.generateInvoice(...)` |
| payment placeholder on invoice issue | ✅ | `BillingService.createInvoiceForEvents()` creează `PaymentRecord` `PENDING` la emiterea proformei |
| mark invoice paid -> fiscal invoice finalized | ✅ | `BillingService.markInvoicePaid()` transformă proforma în `FISCAL`, setează `fiscalSeries`, `fiscalNumber`, `proformaReference` |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push --accept-data-loss` |
| `PUT /billing/profile/me` | ✅ | update runtime returnează profil fiscal cu `country = Romania`, `vatId = RO12345678`, `vatMode = DOMESTIC` |
| approve upgrade -> auto invoice | ✅ | `POST /admin/subscription-upgrade-requests/:id/approve` returnează `request.status = APPROVED`, `subscription.planCode = GOLD`, `invoice.invoiceType = PROFORMA` |
| payment placeholder created | ✅ | `GET /admin/billing/invoices/:id` după approve include `payments[0].status = PENDING`, `placeholder = true` |
| mark invoice paid | ✅ | `POST /admin/billing/invoices/:id/mark-paid` returnează `invoice.status = PAID`, `payment.status = RECONCILED` |
| fiscal invoice finalized | ✅ | după `mark-paid`, factura are `invoiceType = FISCAL`, `fiscalSeries = OS`, `fiscalNumber` setat, `proformaReference` populat |
| VAT amount correct | ✅ | pentru `subtotal = 130` și `Romania`, runtime returnează `taxAmount = 24.7`, `total = 154.7` |
| `/auth/me` reflects approved plan | ✅ | după approve, `GET /auth/me` returnează `subscription.planCode = GOLD`, `contactLimit = 100` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-05 Onboarding & Digital Identity Completion

Verdict: `PASS`

| Task | Status | Confirmat prin |
|---|---|---|
| `IdentityProfile` model | âœ… | Prisma schema include `IdentityProfile` cu `publicSlug`, `verificationStatus`, `profileCompletionPercent` |
| `IdentityCompanyProfile` model | âœ… | Prisma schema include model separat pentru company identity, fara conflict cu legacy `CompanyProfile` din actor domain |
| `OnboardingSession` model | âœ… | Prisma schema include `OnboardingSession` cu `currentStep`, `completedSteps`, `completionPercent`, `status` |
| register auto-creates onboarding session | âœ… | `POST /auth/register` urmat de `GET /onboarding/me` returneaza `onboardingSession.id` si `currentStep = welcome` |
| `GET /onboarding/me` | âœ… | test HTTP local returneaza `identityProfile`, `companyProfile`, `onboardingSession`, `completionPercent`, `verificationStates` |
| `PUT /onboarding/identity-profile` | âœ… | test HTTP local returneaza `200` si `publicSlug = exec05-identity` |
| `PUT /onboarding/company-profile` | âœ… | test HTTP local returneaza `200` si `companyProfile.companyName = Exec05 Builders` |
| `PATCH /onboarding/steps` | âœ… | test HTTP local returneaza `status = COMPLETED` |
| completion engine recalculates | âœ… | `GET /onboarding/progress` returneaza `completionPercent = 90`, `status = COMPLETED` |
| slug uniqueness handling | âœ… | doi useri cu acelasi `displayName` au primit `exec05-identity` si `exec05-identity-2` |
| `GET /profiles/:slug` public-safe | âœ… | test HTTP local returneaza `displayName = Exec05 Identity` fara email/billing/auth data |
| admin onboarding list | âœ… | `GET /admin/onboarding/sessions` cu admin token returneaza `200` si include userul de test |
| admin endpoint protected fara token | âœ… | `GET /admin/onboarding/sessions` fara token returneaza `401` |
| admin endpoint protected non-admin | âœ… | `GET /admin/onboarding/sessions` cu user non-admin returneaza `403` |
| auth still stable | âœ… | `GET /auth/me` dupa onboarding returneaza `subscription.planCode = BASIC` si contractul existent |
| subscriptions still stable | âœ… | `GET /subscriptions/me` dupa onboarding returneaza `planCode = BASIC` |
| billing still stable | âœ… | `GET /billing/profile/me` pentru userul de test ramane functional si returneaza `null` fara regresie |
| public onboarding UX pages | âœ… | `/onboarding`, `/onboarding/welcome`, `/onboarding/identity`, `/onboarding/company`, `/onboarding/completion` compileaza in buildul public |
| admin onboarding page | âœ… | `/admin/onboarding` compileaza in buildul admin |
| API build | âœ… | `cd apps/admin/api && npx.cmd prisma validate && npx.cmd prisma generate && npx.cmd prisma db push && npm.cmd run build` |
| web build | âœ… | `cd apps/admin/web && npm.cmd run build` |
| admin build | âœ… | `cd apps/admin && npm.cmd run build` |

## EXEC-06 KYC, Compliance Documents & Verification Workflow

Verdict: `PASS - verification workflow, evidence linking, admin review, and public-safe verification indicators validated locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `VerificationCase` model | ✅ | Prisma schema include `VerificationCase` pentru `IDENTITY_PROFILE` si `COMPANY_PROFILE` |
| `VerificationCaseDocument` model | ✅ | Prisma schema include legaturi spre `ProfileDocument`, `ActorDocument`, `ActorCertification`, `MedicalFitnessCertificate` |
| `VerificationDecision` model | ✅ | Prisma schema include timeline pentru `SUBMIT`, `REQUEST_INFO`, `APPROVE`, `REJECT`, `REOPEN` |
| verification enums | ✅ | `VerificationCaseSubjectType`, `VerificationCaseStatus`, `VerificationDecisionType`, `VerificationAssetType` adaugate in schema |
| `GET /verification/me` | ✅ | runtime local returneaza `identityProfile`, `companyProfile`, `identityCase`, `companyCase`, `availableEvidence` |
| `POST /verification/identity/submit` | ✅ | runtime local returneaza `case.status = SUBMITTED` |
| `POST /verification/company/submit` | ✅ | runtime local returneaza `case.status = SUBMITTED` |
| `GET /admin/verifications/cases` | ✅ | runtime local cu admin token returneaza `200` si `adminCasesCount = 2` |
| `GET /admin/verifications/cases/:id` | ✅ | runtime local returneaza `adminCaseDetailStatus = SUBMITTED` |
| `POST /admin/verifications/cases/:id/review` | ✅ | runtime local cu `decision = APPROVE` returneaza `status = APPROVED` si `identityProfile.verificationStatus = VERIFIED` |
| onboarding linked to verification summary | ✅ | `GET /onboarding/me` dupa review returneaza `verificationSummary.identityCase.status = APPROVED` si `overallStatus = PENDING` |
| profile completion linked to verification workflow | ✅ | dupa submit/review runtime local returneaza `completionPercent = 87` |
| public profile verification indicators | ✅ | `GET /profiles/:slug` returneaza `publicIndicators.verificationStatus = VERIFIED` si `verificationCaseStatus = APPROVED` |
| admin verification page | ✅ | `/admin/verifications` compileaza in buildul admin si consuma review actions |
| onboarding completion verification actions | ✅ | `/onboarding/completion` compileaza cu butoane pentru submit identity/company verification |
| onboarding completion evidence selection | ✅ | flow-ul public afiseaza `availableEvidence` si trimite explicit `profileDocumentIds`, `actorDocumentIds`, `actorCertificationIds`, `medicalFitnessCertificateIds` |
| verification submit links evidence | ✅ | runtime local: `POST /verification/identity/submit` si `POST /verification/company/submit` au creat cazuri cu `linkedDocuments = 4` |
| admin case detail shows linked evidence | ✅ | `GET /admin/verifications/cases/:id` returneaza `documents.Count = 4` pentru identity si company case |
| full review closes overall status | ✅ | dupa approve pentru ambele cazuri, `GET /onboarding/me` returneaza `identityCase = APPROVED`, `companyCase = APPROVED`, `overallStatus = VERIFIED` |
| admin endpoint protected fara token | ✅ | `GET /admin/verifications/cases` fara token returneaza `401` |
| admin endpoint protected non-admin | ✅ | `GET /admin/verifications/cases` cu user non-admin returneaza `403` |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |

## EXEC-07A Hiring Pipeline Foundation

Verdict: `PASS - hiring pipeline models, recruiter workflow, candidate self-service, admin UI, and runtime validations completed locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `ApplicationStage` enum | ✅ | Prisma schema include `APPLIED`, `SCREENING`, `INTERVIEW`, `SHORTLISTED`, `OFFER_SENT`, `HIRED`, `REJECTED`, `WITHDRAWN` |
| `ApplicationDecision` enum | ✅ | Prisma schema include `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` |
| `HiringPipelineStatus` enum | ✅ | Prisma schema include `ACTIVE`, `PAUSED`, `CLOSED` |
| `HiringPipeline` model | ✅ | Prisma schema leaga operational `Job -> HiringPipeline` cu `jobId` unic si counters agregati |
| `ApplicationStageHistory` model | ✅ | Prisma schema pastreaza istoric imutabil pentru tranzitiile de stage |
| `HiringDecision` model | ✅ | Prisma schema adauga timeline formal pentru approve/reject decisions |
| `Application` extended safely | ✅ | modelul existent a fost extins additiv cu `candidateUserId`, `currentStage`, `stageChangedAt`, `withdrawnAt`, `stageHistory[]`, `hiringDecisions[]` |
| Hiring module backend | ✅ | `apps/admin/api/src/hiring/` include `hiring.module.ts`, `hiring.controller.ts`, `hiring.service.ts`, `dto/*` |
| `GET /hiring/jobs/:jobId/pipeline` | ✅ | runtime local returneaza `pipeline`, `applicantsByStage`, `counters`, `shortlistStats`, `hiredStats` |
| `GET /hiring/applications/:id` | ✅ | runtime local returneaza `application`, `candidateIdentitySummary`, `stageHistory`, `decisions` |
| `POST /hiring/applications/:id/stage` | ✅ | runtime local muta candidatul in `SCREENING` si persista nota recruiterului |
| `POST /hiring/applications/:id/shortlist` | ✅ | runtime local muta candidatul in `SHORTLISTED` |
| `POST /hiring/applications/:id/approve` | ✅ | runtime local muta candidatul in `HIRED` si creeaza `HiringDecision APPROVED` |
| `POST /hiring/applications/:id/reject` | ✅ | runtime local muta aplicatia in `REJECTED` si creeaza `HiringDecision REJECTED` |
| `GET /applications/me` | ✅ | runtime local returneaza aplicatiile candidatului cu `currentStage`, `recruiterStatus`, `stageChangedAt`, `withdrawnAt` |
| `POST /applications/:id/withdraw` | ✅ | runtime local seteaza `currentStage = WITHDRAWN` si `withdrawnAt` doar pentru owner |
| pipeline auto-created | ✅ | prima aplicare la job creeaza automat `HiringPipeline` pentru fiecare job de test |
| immutable stage history | ✅ | runtime local confirma timeline `APPLIED -> SCREENING -> SHORTLISTED -> HIRED` pentru cazul aprobat |
| counters auto-updated | ✅ | dupa hire, `GET /hiring/jobs/:jobId/pipeline` returneaza `totalHired = 1` si counters consistente |
| rejected immutable | ✅ | dupa `REJECTED`, `POST /hiring/applications/:id/stage` returneaza `400` |
| withdrawn immutable | ✅ | dupa `WITHDRAWN`, `POST /hiring/applications/:id/stage` returneaza `400`, iar al doilea withdraw returneaza `400` |
| hired reject blocked | ✅ | dupa `HIRED`, `POST /hiring/applications/:id/reject` returneaza `400` |
| hired withdraw blocked | ✅ | dupa `HIRED`, `POST /applications/:id/withdraw` returneaza `400` |
| non-admin blocked | ✅ | `GET /hiring/jobs/:jobId/pipeline` cu token `PROFESSIONAL` returneaza `403`; fara token returneaza `401` |
| auth remains stable | ✅ | `GET /auth/me` cu token candidat ramane functional dupa flow-ul de hiring |
| onboarding remains stable | ✅ | `GET /onboarding/me` cu token candidat ramane functional dupa flow-ul de hiring |
| subscriptions remains stable | ✅ | `GET /subscriptions/me` cu token candidat returneaza in continuare planul `BASIC` |
| billing remains stable | ✅ | `GET /billing/profile/me` cu token candidat ramane functional si returneaza `null` fara regresie |
| admin hiring UI | ✅ | `apps/admin/app/admin/hiring/page.tsx` compileaza si expune overview, grouped applicants, filters, stage actions si decision controls |
| admin nav wiring | ✅ | `apps/admin/components/AdminLayoutShell.tsx` include intrarea `Hiring` |
| admin API helpers | ✅ | `apps/admin/lib/api.ts` include tipurile si helperii pentru pipelines, application detail, move, shortlist, approve si reject |
| runtime validation | ✅ | validare locala in-process cu Nest + `supertest`: recruiter/admin/candidate create, 3 joburi create, 3 aplicari, approve/reject/withdraw si reguli de imutabilitate confirmate |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |
| Blockers | ✅ | niciun blocker deschis pentru aceasta faza; hire/reject/withdraw rules validate local |

## EXEC-07B Contracts Lifecycle & Workforce Assignment

Verdict: `PASS - workforce assignments, contract lifecycle controls, worker visibility, and runtime validations completed locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `ContractLifecycleStatus` enum | ✅ | Prisma schema include `DRAFT`, `PENDING_SIGNATURE`, `ACTIVE`, `SUSPENDED`, `TERMINATED`, `COMPLETED` |
| `AssignmentStatus` enum | ✅ | Prisma schema include `PENDING`, `ACTIVE`, `ENDED` |
| `ContractLifecycleEventType` enum | ✅ | Prisma schema include `CREATED`, `SENT`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `REACTIVATED`, `TERMINATED`, `COMPLETED` |
| `WorkforceAssignment` model | ✅ | Prisma schema leaga `user`, `project`, `job`, `contract`, `application` si gestioneaza `assignedAt`, `startedAt`, `endedAt` |
| `ContractLifecycleEvent` model | ✅ | Prisma schema adauga timeline imutabil pentru contracte cu `actorUserId`, `metadata`, `createdAt` |
| `Contract` extended safely | ✅ | modelul existent a fost extins additiv cu `lifecycleStatus`, `lifecycleEvents[]`, `workforceAssignments[]` |
| `Application` extended safely | ✅ | modelul existent a fost extins additiv cu relatia optionala `workforceAssignment` |
| Workforce module backend | ✅ | `apps/admin/api/src/workforce/` include `workforce.module.ts`, `workforce.controller.ts`, `workforce.service.ts`, `dto/*` |
| `POST /workforce/assignments` | ✅ | runtime local creeaza assignment doar pentru aplicatie `HIRED` si leaga automat `user`, `job`, `contract`, `application` |
| `GET /workforce/assignments` | ✅ | runtime local returneaza overview-ul assignment-urilor cu filtre si contract lifecycle status |
| `GET /workforce/assignments/:id` | ✅ | runtime local returneaza detail complet plus `timeline` |
| `POST /workforce/contracts/:id/send` | ✅ | runtime local muta contractul in `PENDING_SIGNATURE` si adauga event `SENT` |
| `POST /workforce/contracts/:id/activate` | ✅ | runtime local muta contractul in `ACTIVE`, creeaza event `ACTIVATED`, assignment-ul devine `ACTIVE` |
| `POST /workforce/contracts/:id/suspend` | ✅ | runtime local muta contractul in `SUSPENDED`, creeaza event `SUSPENDED`, assignment-ul iese din starea activa |
| `POST /workforce/contracts/:id/terminate` | ✅ | runtime local muta contractul in `TERMINATED`, creeaza event `TERMINATED`, assignment-ul devine `ENDED` |
| `GET /workforce/contracts/:id/timeline` | ✅ | runtime local returneaza timeline-ul imutabil `CREATED -> SENT -> ACTIVATED -> SUSPENDED -> TERMINATED` |
| `GET /workforce/me` | ✅ | runtime local returneaza assignment-urile workerului cu `contractStatus`, `activeProjects`, `lifecycleState` |
| create workforce assignment from HIRED candidate | ✅ | validare locala: `POST /hiring/applications/:id/approve` urmat de `POST /workforce/assignments` |
| assignment auto-links correctly | ✅ | runtime local confirma `user.id`, `job.id`, `contract.id`, `application.id` pentru assignment-ul creat |
| verification requirement enforced | ✅ | `POST /workforce/contracts/:id/activate` returneaza `400` pana cand `identityProfile.verificationStatus = VERIFIED` |
| activate contract -> assignment ACTIVE | ✅ | dupa verificare, runtime local returneaza `assignments[0].status = ACTIVE` |
| suspend contract blocks active workforce state | ✅ | runtime local muta assignment-ul din `ACTIVE` in `PENDING` cand contractul este suspendat |
| terminate contract -> assignment ENDED | ✅ | runtime local confirma `finalContractLifecycleStatus = TERMINATED`, `finalAssignmentStatus = ENDED` |
| terminated contract immutable | ✅ | dupa `TERMINATED`, un nou `POST /workforce/contracts/:id/activate` returneaza `400` |
| lifecycle timeline created | ✅ | runtime local confirma `detailTimelineCount = 5` si event-urile asteptate |
| non-admin blocked | ✅ | `GET /workforce/assignments` cu token `PROFESSIONAL` returneaza `403`; fara token returneaza `401` |
| auth remains stable | ✅ | `GET /auth/me` cu token candidat ramane functional dupa flow-ul de workforce |
| onboarding remains stable | ✅ | `GET /onboarding/me` cu token candidat ramane functional dupa flow-ul de workforce |
| subscriptions remains stable | ✅ | `GET /subscriptions/me` cu token candidat ramane functional dupa flow-ul de workforce |
| billing remains stable | ✅ | `GET /billing/profile/me` cu token candidat ramane functional si returneaza `200` |
| admin workforce UI | ✅ | `apps/admin/app/admin/workforce/page.tsx` compileaza cu overview, filtre, assignment create, lifecycle controls si timeline view |
| admin nav wiring | ✅ | `apps/admin/components/AdminLayoutShell.tsx` include intrarea `Workforce` |
| admin API helpers | ✅ | `apps/admin/lib/api.ts` include tipurile si helperii pentru assignments, contract actions si timeline |
| runtime validation | ✅ | `cd apps/admin/api && node scripts/exec-07b-runtime-check.js` confirma hire -> contract -> assignment -> activate/suspend/terminate si stabilitatea modulelor existente |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |
| Blockers | ✅ | niciun blocker deschis pentru aceasta faza; lifecycle si guard rails validate local |

## EXEC-07C Timesheets, Attendance & Operational Workforce Execution

Verdict: `PASS - operational timesheets, attendance execution, approval flows, admin oversight, and worker self-service validated locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `TimesheetStatus` enum | ✅ | Prisma schema include `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` |
| `AttendanceStatus` enum | ✅ | Prisma schema include `CHECKED_IN`, `CHECKED_OUT`, `MISSED` |
| `WorkSessionSource` enum | ✅ | Prisma schema include `MANUAL`, `SYSTEM`, `MOBILE` |
| `Timesheet` model | ✅ | Prisma schema leaga `workforceAssignment`, `user`, `project`, perioada, totaluri, aprobare si motiv de reject |
| `TimesheetEntry` model | ✅ | Prisma schema adauga evidenta zilnica cu `workDate`, `hoursWorked`, `overtimeHours`, `notes` |
| `AttendanceRecord` model | ✅ | Prisma schema adauga check-in/check-out operational cu `source`, `locationMetadata`, timestamps si status |
| `WorkforceAssignment` extended safely | ✅ | modelul existent a fost extins additiv cu `timesheets[]` si `attendanceRecords[]` |
| `User` extended safely | ✅ | modelul existent a fost extins additiv cu `operationalTimesheets[]`, `approvedOperationalTimesheets[]`, `attendanceRecords[]` |
| `Project` extended safely | ✅ | modelul existent a fost extins additiv cu `operationalTimesheets[]` |
| Timesheets module backend | ✅ | `apps/admin/api/src/timesheets/` include `timesheets.module.ts`, `timesheets.controller.ts`, `timesheets.service.ts`, `dto/*` |
| `POST /timesheets` | ✅ | runtime local creeaza timesheet doar pentru `ACTIVE` workforce assignment cu contract activ |
| `POST /timesheets/:id/entries` | ✅ | runtime local adauga intrari zilnice si recalculeaza `totalHours` si `overtimeHours` |
| `POST /timesheets/:id/submit` | ✅ | runtime local muta timesheet-ul in `SUBMITTED` si il blocheaza pentru editare directa |
| `GET /timesheets/me` | ✅ | runtime local returneaza timesheet-urile workerului cu assignment, contract, job, project si entries |
| `POST /attendance/check-in` | ✅ | runtime local creeaza sesiune de prezenta pentru assignment activ si contract activ |
| `POST /attendance/check-out` | ✅ | runtime local inchide sesiunea deschisa si calculeaza `durationHours` |
| `GET /attendance/me` | ✅ | runtime local returneaza istoricul personal de attendance cu starea contractului si project linkage |
| `GET /admin/timesheets` | ✅ | runtime local returneaza overview pentru admin/recruiter cu filtre si statusuri |
| `GET /admin/timesheets/:id` | ✅ | runtime local returneaza detail complet cu entries, assignment, contract si aprobare |
| `POST /admin/timesheets/:id/approve` | ✅ | runtime local muta timesheet-ul in `APPROVED` si seteaza `approvedAt`, `approvedByUserId` |
| `POST /admin/timesheets/:id/reject` | ✅ | runtime local muta timesheet-ul in `REJECTED` si persista motivul de respingere |
| `GET /admin/attendance` | ✅ | runtime local returneaza attendance table operational pentru admin/recruiter |
| only active assignment can submit | ✅ | `node scripts/exec-07c-runtime-check.js` valideaza flow-ul doar dupa activarea contractului si assignment-ului |
| only active contract can check-in | ✅ | attendance functioneaza dupa `POST /workforce/contracts/:id/activate`; suspend/terminate blocheaza check-in-ul |
| totals auto-calculated | ✅ | runtime local confirma `totalHours = 15.5` si `overtimeHours = 3` dupa doua entries |
| duplicate open attendance blocked | ✅ | al doilea `POST /attendance/check-in` fara check-out returneaza `400` |
| check-out required before new check-in | ✅ | runtime local blocheaza sesiunea noua pana la `POST /attendance/check-out` |
| approved timesheets immutable | ✅ | dupa approve, `POST /timesheets/:id/entries` returneaza `400` |
| rejected timesheets editable again | ✅ | dupa reject, un nou `POST /timesheets/:id/entries` reuseste si readuce documentul in `DRAFT` |
| attendance duration auto-calculated | ✅ | `POST /attendance/check-out` returneaza `durationHours` numeric |
| suspended contract blocks attendance | ✅ | dupa `POST /workforce/contracts/:id/suspend`, `POST /attendance/check-in` returneaza `400` |
| terminated workforce blocked | ✅ | dupa `POST /workforce/contracts/:id/terminate`, `POST /attendance/check-in` returneaza `400`; assignment-ul ramane `ENDED` |
| verification requirement preserved | ✅ | operational execution rule reuseaza guard rail-ul `VERIFIED` din activarea contractului/workforce lifecycle |
| admin approve/reject works | ✅ | runtime local confirma approve pentru primul timesheet si reject pentru al doilea |
| non-admin blocked | ✅ | `GET /admin/timesheets` cu token `PROFESSIONAL` returneaza `403`; fara token returneaza `401` |
| admin timesheets UI | ✅ | `apps/admin/app/admin/timesheets/page.tsx` compileaza cu approvals, attendance table, filters, KPIs si rejection flow |
| worker workforce pages | ✅ | `apps/admin/web/app/workforce/dashboard`, `/timesheets`, `/attendance` compileaza si folosesc contractul operational nou |
| admin nav wiring | ✅ | `apps/admin/components/AdminLayoutShell.tsx` include intrarea `Timesheets` |
| public API helpers | ✅ | `apps/admin/web/lib/api.ts` include helperii pentru worker timesheets si attendance |
| admin API helpers | ✅ | `apps/admin/lib/api.ts` include helperii pentru admin timesheets, detail, approve, reject si attendance |
| runtime validation | ✅ | `cd apps/admin/api && node scripts/exec-07c-runtime-check.js` confirma create timesheet, totals, submit, approve, reject, attendance, suspend/terminate blocks si stabilitatea modulelor existente |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |
| Blockers | ✅ | niciun blocker deschis pentru aceasta faza; operational guard rails si approval flows validate local |

## EXEC-07D Payroll Preparation, Compensation Engine & Settlement Foundations

Verdict: `PASS - compensation agreements, payroll cycles, settlement preparation, admin approvals, and worker payroll visibility validated locally`

| Task | Status | Confirmat prin |
|---|---|---|
| `CompensationType` enum | ✅ | Prisma schema include `HOURLY`, `DAILY`, `WEEKLY`, `MONTHLY`, `FIXED_PROJECT` |
| `PayrollCycleStatus` enum | ✅ | Prisma schema include `OPEN`, `PROCESSING`, `LOCKED`, `EXPORTED` |
| `SettlementStatus` enum | ✅ | Prisma schema include `PENDING`, `APPROVED`, `REJECTED`, `READY_FOR_PAYMENT`, `PAID` |
| `CompensationAgreement` model | ✅ | Prisma schema leaga assignment-ul de rate, prag overtime, currency si perioada de valabilitate |
| `PayrollCycle` model | ✅ | Prisma schema adauga fereastra operationala cu total workers, total gross, `processedAt`, `lockedAt`, `exportedAt` |
| `PayrollSettlement` model | ✅ | Prisma schema adauga snapshot per worker cu `approvedTimesheetIds`, ore, sume, status si timestamps de aprobare/plata |
| `PayrollSettlementLine` model | ✅ | Prisma schema pastreaza breakdown imutabil pentru regular/overtime/fixed compensation |
| `WorkforceAssignment` extended safely | ✅ | modelul existent a fost extins additiv cu `compensationAgreements[]` si `payrollSettlements[]` |
| `User` extended safely | ✅ | modelul existent a fost extins additiv cu `payrollSettlements[]` si `approvedPayrollSettlements[]` |
| Payroll module backend | ✅ | `apps/admin/api/src/payroll/` include `payroll.module.ts`, `payroll.controller.ts`, `payroll.service.ts`, `dto/*` |
| `POST /admin/payroll/compensation` | ✅ | runtime local creeaza acorduri de compensare pentru workforce assignment activ |
| `POST /admin/payroll/cycles` | ✅ | runtime local creeaza payroll cycle pentru perioada de procesare |
| `GET /admin/payroll/cycles` | ✅ | runtime local returneaza payroll cycles cu counters si settlements agregate |
| `GET /admin/payroll/cycles/:id` | ✅ | runtime local returneaza detaliu complet, settlements si status final `LOCKED` |
| `POST /admin/payroll/cycles/:id/process` | ✅ | runtime local proceseaza timesheet-urile aprobate in settlements si blocheaza duplicatele |
| `GET /admin/payroll/settlements` | ✅ | runtime local returneaza settlements cu filtre, user, assignment, contract si lines |
| `GET /admin/payroll/settlements/:id` | ✅ | runtime local returneaza breakdown detaliat si attendance summary |
| `POST /admin/payroll/settlements/:id/approve` | ✅ | runtime local seteaza `APPROVED`, `approvedAt`, `approvedByUserId` si pregateste lock-ul ciclului |
| `POST /admin/payroll/settlements/:id/reject` | ✅ | runtime local muta settlement-ul in `REJECTED` si permite reprocesarea lui |
| `GET /payroll/me` | ✅ | runtime local returneaza assignments, compensation agreements, payroll cycles si settlements pentru worker |
| `GET /payroll/me/settlements` | ✅ | runtime local returneaza istoricul workerului cu gross/net preview si payout status visibility |
| approved timesheets feed payroll | ✅ | `node scripts/exec-07d-runtime-check.js` confirma includerea doar a timesheet-urilor `APPROVED` |
| overtime auto-calculated | ✅ | runtime local confirma `regularHours = 12.5`, `overtimeHours = 3`, `grossAmount = 850` pentru workerul `alpha` si `grossAmount = 340` pentru `beta` |
| deductions placeholder structure | ✅ | settlements persista `deductionsAmount = 0` si `netAmount = grossAmount - deductionsAmount` |
| immutable settlement snapshots | ✅ | settlement lines si `approvedTimesheetIds` sunt snapshot-uri persistate la procesare |
| duplicate processing blocked | ✅ | al doilea `POST /admin/payroll/cycles/:id/process` returneaza `400` cand aceleasi timesheet-uri au fost deja procesate |
| same timesheet cannot be processed twice | ✅ | payroll engine exclude timesheet-urile deja referentiate in settlements non-rejected |
| rejected settlements editable/reprocessable | ✅ | dupa reject pentru `beta`, reprocesarea ciclului genereaza settlement nou `PENDING`, ulterior aprobat |
| locked payroll cycle immutable | ✅ | dupa aprobarea tuturor settlement-urilor, ciclul devine `LOCKED`, iar o noua procesare returneaza `400` |
| terminated assignments excluded | ✅ | workerul `gamma` cu contract `TERMINATED` nu apare in settlements |
| suspended contracts excluded | ✅ | workerul `delta` cu contract `SUSPENDED` nu apare in settlements |
| attendance optional validation support | ✅ | settlement detail expune `attendanceSummary`; runtime local a confirmat campul fara a lega procesarea de un provider extern |
| admin payroll UI | ✅ | `apps/admin/app/admin/payroll/page.tsx` compileaza cu cycles table, totals overview, settlement actions, filters si detail panel |
| worker payroll pages | ✅ | `apps/admin/web/app/payroll`, `/payroll/settlements`, `/payroll/history` compileaza si expun settlement history, hours summary si cycle visibility |
| admin nav wiring | ✅ | `apps/admin/components/AdminLayoutShell.tsx` include intrarea `Payroll` |
| admin API helpers | ✅ | `apps/admin/lib/api.ts` include helperii pentru compensation, cycles, settlements, approve si reject |
| worker API helpers | ✅ | `apps/admin/web/lib/api.ts` include helperii pentru `GET /payroll/me` si `GET /payroll/me/settlements` |
| runtime validation | ✅ | `cd apps/admin/api && node scripts/exec-07d-runtime-check.js` confirma compensation agreement creation, payroll processing, reject/reprocess/approve, lock, excluderi si stabilitatea modulelor existente |
| auth remains stable | ✅ | runtime local confirma `GET /auth/me = 200` dupa flow-ul de payroll |
| onboarding remains stable | ✅ | runtime local confirma `GET /onboarding/me = 200` dupa flow-ul de payroll |
| subscriptions remains stable | ✅ | runtime local confirma `GET /subscriptions/me = 200` dupa flow-ul de payroll |
| billing remains stable | ✅ | runtime local confirma `GET /billing/profile/me = 200` dupa flow-ul de payroll |
| workforce remains stable | ✅ | runtime local confirma `GET /workforce/me = 200` dupa flow-ul de payroll |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |
| Blockers | ✅ | niciun blocker deschis pentru aceasta faza; payroll preparation si settlement guard rails validate local |

## EXEC-07E Settlement to Billing Bridge & Workforce Financial Closure

Verdict: `PASS - approved payroll settlements now bridge into billing events/invoices, admin visibility is extended, and financial closure validations passed locally`

| Task | Status | Confirmat prin |
|---|---|---|
| payroll vs billing audit | ✅ | audit local pe `apps/admin/api/src/billing/*`, `apps/admin/api/src/payroll/*`, `schema.prisma`, `STATUS.md`: `PayrollSettlement` nu era legat persistent de `BillingEvent`/`BillingInvoice`, worker history era stabil, iar admin billing nu expunea originile workforce |
| `SettlementBillingStatus` enum | ✅ | Prisma schema include `NOT_BILLED`, `BILLING_EVENT_CREATED`, `INVOICED`, `PAID`, `CANCELLED` |
| `WorkforceBillingLink` model | ✅ | Prisma schema adauga bridge-ul dintre `PayrollSettlement`, `BillingEvent` si optional `BillingInvoice` |
| `BillingEventType.WORKFORCE_SETTLEMENT` | ✅ | Prisma schema + billing integration adauga tip dedicat pentru settlements din workforce |
| `PayrollSettlement` extended safely | ✅ | modelul existent a fost extins additiv cu relatia `billingLink` |
| `BillingEvent` extended safely | ✅ | modelul existent a fost extins additiv cu relatia `billingLink` |
| `BillingInvoice` extended safely | ✅ | modelul existent a fost extins additiv cu `workforceBillingLinks[]` |
| bridge backend logic | ✅ | `apps/admin/api/src/payroll/payroll.service.ts` creeaza link imutabil settlement -> billing event si blocheaza duplicatele |
| `POST /admin/payroll/settlements/:id/create-billing-event` | ✅ | runtime local creeaza billing event doar pentru settlement `APPROVED/READY_FOR_PAYMENT` |
| `POST /admin/payroll/cycles/:id/create-billing-events` | ✅ | runtime local creeaza batch billing events doar pentru settlements aprobate si fara link existent |
| `GET /admin/payroll/billing-links` | ✅ | runtime local returneaza bridge overview cu settlement, billing event si invoice refs |
| only approved settlements billable | ✅ | settlement `PENDING` returneaza `400`, iar settlement `REJECTED` returneaza `400` la create billing event |
| duplicate billing event blocked | ✅ | al doilea `POST /admin/payroll/settlements/:id/create-billing-event` pe acelasi settlement returneaza `400` |
| locked cycles still billable | ✅ | dupa lock-ul payroll cycle, settlement-urile `READY_FOR_PAYMENT` pot genera billing events fara a rescrie payroll-ul |
| workforce settlement metadata propagated | ✅ | `BillingEvent.metadata` include `payrollSettlementId`, `payrollCycleId`, `workforceAssignmentId`, `workerUserId`, `regularHours`, `overtimeHours` |
| invoice generation still works | ✅ | `POST /admin/billing/invoices/generate` accepta billing event de tip `WORKFORCE_SETTLEMENT` si genereaza proforma valida |
| mark invoice paid still works | ✅ | `POST /admin/billing/invoices/:id/mark-paid` actualizeaza invoice-ul, payment-ul si bridge-ul la `PAID` |
| settlement paid propagation | ✅ | dupa `mark-paid`, settlement-ul legat trece in `PAID` si `WorkforceBillingLink.status = PAID` |
| admin payroll UI bridge actions | ✅ | `apps/admin/app/admin/payroll/page.tsx` compileaza cu buton `Create billing event`, badge de billing status si batch action pe cycle |
| admin billing visibility | ✅ | `apps/admin/app/admin/billing/page.tsx` compileaza si afiseaza `WORKFORCE_SETTLEMENT`, settlement id si worker reference |
| admin API helpers | ✅ | `apps/admin/lib/api.ts` include helperii pentru billing links, settlement billing event si cycle batch billing events |
| worker API helpers stable | ✅ | `apps/admin/web/lib/api.ts` expune billing link visibility in istoricul de settlement fara a schimba contractul payroll existent |
| runtime validation | ✅ | `cd apps/admin/api && node scripts/exec-07e-runtime-check.js` confirma settlement aprobat, create billing event, duplicate blocked, pending/rejected blocked, batch create, invoice generate, mark-paid si stabilitatea modulelor existente |
| auth stable | ✅ | runtime local confirma `GET /auth/me = 200` dupa bridge-ul settlement -> billing |
| onboarding stable | ✅ | runtime local confirma `GET /onboarding/me = 200` dupa bridge-ul settlement -> billing |
| subscriptions stable | ✅ | runtime local confirma `GET /subscriptions/me = 200` dupa bridge-ul settlement -> billing |
| workforce stable | ✅ | runtime local confirma `GET /workforce/me = 200` dupa bridge-ul settlement -> billing |
| payroll stable | ✅ | runtime local confirma `GET /payroll/me/settlements = 200` dupa bridge-ul settlement -> billing |
| billing stable | ✅ | runtime local confirma list/invoice/mark-paid pentru fluxul workforce-originated |
| `prisma validate` | ✅ | `cd apps/admin/api && npx.cmd prisma validate` |
| `prisma generate` | ✅ | `cd apps/admin/api && npx.cmd prisma generate` |
| `prisma db push` | ✅ | `cd apps/admin/api && npx.cmd prisma db push` |
| API build | ✅ | `cd apps/admin/api && npm.cmd run build` |
| web build | ✅ | `cd apps/admin/web && npm.cmd run build` |
| admin build | ✅ | `cd apps/admin && npm.cmd run build` |
| Blockers | ✅ | niciun blocker deschis pentru aceasta faza; bridge-ul settlement -> billing si financial closure local sunt validate |

## Prompt 8 Video Audit Snapshot

Surse analizate:
- `C:\Users\admin\Downloads\Înregistrare 2026-05-05 202301.mp4`
- `C:\Users\admin\Downloads\Înregistrare 2026-05-05 202532.mp4`
- cadre extrase local in `.tmp-video-frames/`

### Concluzie executiva

Platforma este vizibil live pe domeniile publice si backoffice, dar este inca intr-o stare mixta:
- designul public de homepage si login este deployat si vizibil
- multe ecrane de backoffice sunt deployate vizual, dar unele sunt alimentate cu mock data sau lovesc erori de API/CORS
- exista functionalitati locale extinse care nu sunt inca pe GitHub `origin/main`
- autentificarea de backoffice functioneaza pana la nivel de login Firebase, dar accesul `SUPERADMIN` este inca blocat deoarece custom claims nu au fost setate cu cheia JSON reala

### Ce se vede in productia publica din capturi

| Zona | Observatie din video | Status |
|---|---|---|
| `https://openstaff.eu` homepage | Hero, categorii, CTA-uri, navbar si buton floating chat sunt vizibile si coerente vizual | ✅ |
| `https://openstaff.eu` proiecte active | Sectiunea afiseaza mesajul `Nu exista proiecte active momentan. Fii primul!` | 🚧 |
| `https://openstaff.eu/logistics` | Ruta intoarce `404 This page could not be found` | ❌ |
| `https://openstaff.eu/login` | Ecran de login public este deployat si stilizat; formularul este prezent | ✅ |

### Ce se vede in backoffice din capturi

| Zona | Observatie din video | Status |
|---|---|---|
| `https://backoffice.openstaff.eu` meniu lateral | Shell vizual de backoffice este prezent, cu navigatie extinsa (`Dashboard`, `Projects`, `Contracts`, `Professionals`, `Financial`, `AI Control`, `Posts`, `Media`, `Private Messages`, `Admin Users`, `Admin Roles`, `Status`) | ✅ |
| `https://backoffice.openstaff.eu/contracts` | Pagina `Contract Management` este vizibila cu KPI cards si tabel; pare populata cu date demonstrative | 🚧 |
| `https://backoffice.openstaff.eu/admin/posts` | Pagina exista, dar afiseaza eroare: `API-ul nu raspunde sau requestul este blocat de CORS. Verifica backendul, CORS si NEXT_PUBLIC_API_URL.` | ❌ |
| `https://backoffice.openstaff.eu/ai-control` | Pagina exista, dar afiseaza `Eroare API` si mesaj ca backendul nu raspunde sau requestul este blocat de CORS | ❌ |
| `https://backoffice.openstaff.eu/unauthorized` | Loginul Firebase reuseste, dar accesul administrativ ramane blocat deoarece lipsesc claims `admin: true` sau `role: "SUPERADMIN"` | 🚧 |
| `https://backoffice.openstaff.eu/admin/private-messages` si moderare | Meniurile exista vizual; in cadrul extras continutul central nu este inca relevant populat | 🚧 |

### Implementat local vs GitHub vs deploy

| Domeniu | Local workspace | GitHub `origin/main` | Deploy observat |
|---|---|---|---|
| Public web | Implementare ampla in `apps/admin/web` cu homepage, login, onboarding, profile, projects, professionals | Nu apare in `origin/main`; remote contine doar `README.md`, `cloudbuild.api.yaml`, `cloudbuild.web.yaml` | Homepage si login sunt live; cel putin o ruta secundara (`/logistics`) lipseste |
| Backoffice | Implementare ampla in `apps/admin/app`, `components`, `context`, `lib` cu multe rute si shell de administrare | Nu apare in `origin/main` | Shell, contracts si alte pagini sunt live; unele views dau erori API/CORS; auth admin incomplet |
| API | Implementare ampla locala in `apps/admin/api/src/*` cu module pentru auth, actors, jobs, taxonomy, documents, gemini, relu, messaging etc. | Nu apare in `origin/main` | API este deployat si raspunde pe health, dar anumite integrari din backoffice par sa nu fie conectate corect |
| DevOps / deploy | Dockerfiles, `.gcloudignore`, Cloud Build YAML-uri, Artifact Registry si Cloud Run | Pe GitHub exista doar YAML-urile vechi/minime din root | Deployul curent ruleaza pe infrastructura noua, dar sursa nu este inca sincronizata cu GitHub |

### Diferenta concreta local vs GitHub

Audit Git la momentul curent:
- branch local: `main`
- ultim commit local: `507c3d2 ASS JOBS - stable base: admin + api + prisma + projects`
- remote `origin/main` are istorie separata si foarte mica:
  - `08a82a3 Create cloudbuild.web.yaml`
  - `f1685ee Create cloudbuild.api.yaml`
  - `6c62264 Initial commit`
- comparatia `HEAD...origin/main` arata `1 3`, iar `git log --all` confirma ca nu exista inca o baza comuna utila intre starea bogata locala si istoricul remote minimalist

Consecinta:
- aproape tot ce se vede functional in capturi vine din workspace-ul local / deployul facut manual, nu din ce este actualmente versionat pe `origin/main`

### Functionalitati publice - status extins

| Arie | Status | Comentariu |
|---|---|---|
| Branding vizual | ✅ | Directie navy + green este consistenta si recognoscibila |
| Homepage | ✅ | Deployat si lizibil pe desktop, cu structura clara |
| Search bar / top nav | 🚧 | Vizibil in header, dar nu este demonstrat in video ca produce rezultate reale |
| Categorii | ✅ | Cards vizibile si bine stilizate |
| Job feed live | 🚧 | Sectiunea exista, dar in video nu are continut real |
| Professionals listing | 🚧 | Sectiunea exista pe homepage, dar nu este demonstrat un listing complet in video |
| Rute secundare marketing | ❌ | Cel putin `/logistics` lipseste in deploy |
| Login public | ✅ | Vizual complet si deployat |
| Chatbot floating | ✅ | Butonul flotant este prezent vizual in homepage |

### Functionalitati backoffice - status extins

| Arie | Status | Comentariu |
|---|---|---|
| Admin shell / nav | ✅ | Implementat si deployat |
| Role badge `Super Admin` | ✅ | Vizibil in headerul backoffice |
| Login Firebase | ✅ | Userul poate intra pana la nivelul sesiunii autentificate |
| Autorizare `SUPERADMIN` | ❌ | Blocata de lipsa custom claims setate corect |
| Contracts view | 🚧 | UI puternic si deployat, dar natura datelor pare demonstrativa |
| AI Control | ❌ | Deployat, dar nefunctional din cauza erorii API/CORS |
| Public Posts moderation | ❌ | Deployat, dar nefunctional din cauza erorii API/CORS |
| Private Messages / Comments / Admin Roles | 🚧 | Exista in navigatie si partial in layout, dar video-ul nu confirma un flux functional complet |

### Blocaje actuale observabile

1. Claims Firebase pentru `openstaff.eu@gmail.com` nu sunt inca setate.
   Cauza imediata: fisierul local `firebase-admin-openstaff-platform.json` este gresit; contine snippet de exemplu, nu cheia JSON reala.
2. Exista cel putin doua pagini de backoffice care raporteaza explicit probleme de integrare API/CORS:
   - `AI Control`
   - `Public Posts`
3. Exista rute publice promise de UI care nu sunt deployate:
   - `openstaff.eu/logistics` intoarce `404`
4. GitHub `origin/main` este foarte in urma fata de ce ruleaza local si fata de ce s-a deployat manual.

### Ce este deja deployat, dar nu este sustinut de GitHub-ul actual

- `apps/admin` backoffice complet cu shell, login, unauthorized, contracts, AI control, moderare
- `apps/admin/web` homepage publica si login public
- `apps/admin/api` backend Nest cu module extinse
- infrastructura Docker / Cloud Build / Artifact Registry / Cloud Run folosita pentru deploy

### Recomandari imediate

1. Inlocuieste continutul fisierului `firebase-admin-openstaff-platform.json` cu JSON-ul real din `Downloads`, nu cu snippetul de documentatie.
2. Ruleaza scriptul de setare claims pentru:
   - `admin: true`
   - `role: "SUPERADMIN"`
3. Refaceti loginul in backoffice dupa setarea claims.
4. Verificati configurarea `NEXT_PUBLIC_API_URL` si CORS pentru paginile:
   - `AI Control`
   - `Public Posts`
5. Decideti daca rutele publice lipsa, precum `/logistics`, trebuie:
   - implementate efectiv
   - sau scoase temporar din navigatie
6. Sincronizati in GitHub codul real care deja sustine deployul, altfel statusul deploy vs source control va ramane nealiniat.

## Prompt 7 Cloud Deploy Snapshot

| Componenta | Status | Confirmat prin |
|---|---|---|
| `.gcloudignore` creat | ✅ | Fisier prezent in root |
| Upload redus sub 5000 fisiere | ✅ | `gcloud builds submit` raporteaza `Creating temporary archive of 411 file(s)` |
| ADC `openstaff.eu@gmail.com` | 🚧 | Contul `gcloud` este cel corect, dar fluxul ADC nu a fost inchis complet in aceasta iteratie |
| Artifact Registry creat | ✅ | `gcloud artifacts repositories list --project=openstaff-platform` afiseaza `openstaff-repo`, `DOCKER`, `europe-west1` |
| IAM Cloud Build permissions | ✅ | `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`, `roles/secretmanager.secretAccessor` au fost aplicate pentru `605639023972@cloudbuild.gserviceaccount.com` |
| `apps/admin/Dockerfile` creat | ✅ | Fisier prezent |
| `next.config` output standalone | ✅ | `apps/admin/next.config.ts` si `apps/admin/web/next.config.ts` contin `output: "standalone"` |
| `cloudbuild.api.yaml` Artifact Registry | ✅ | Imagine `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-api:*` |
| `cloudbuild.web.yaml` Artifact Registry | ✅ | Imagine `europe-west1-docker.pkg.dev/openstaff-platform/openstaff-repo/openstaff-web:*` |
| `cloudbuild.admin.yaml` creat | ✅ | Fisier prezent in `apps/admin/cloudbuild.admin.yaml` |
| BUILD `openstaff-api` SUCCESS | ✅ | Build `ee017b11-852b-476e-95a1-f27a29deea0b` |
| BUILD `openstaff-web` SUCCESS | ✅ | Build `7d95da69-bfa5-4c12-a226-9021d51e495b` |
| BUILD `openstaff-admin` SUCCESS | ✅ | Build `d5840f45-e9d5-4b8f-885a-75a20524a741` |
| Cloud Run `openstaff-api` UP | ✅ | `https://openstaff-api-bmv5rzc6zq-ew.a.run.app/health` raspunde `200` cu `{ "status": "ok" }` |
| Cloud Run `openstaff-web` UP | ✅ | `https://openstaff-web-bmv5rzc6zq-ew.a.run.app` raspunde `200` si serveste HTML |
| Cloud Run `openstaff-admin` UP | ✅ | `https://openstaff-admin-bmv5rzc6zq-ew.a.run.app` raspunde `200` si serveste HTML |
| Cloud SQL `openstaff-db` creat | 🚧 | Nu a fost creat inca |
| `DATABASE_URL` in Secret Manager | 🚧 | Secretul nu a fost creat inca |
| `GEMINI_API_KEY` in Secret Manager | 🚧 | Secretul nu a fost creat inca |
| `FIREBASE_SA` in Secret Manager | 🚧 | Secretul nu a fost creat inca |
| `openstaff.eu` DNS mapat | 🚧 | Domain mapping neexecutat |
| `admin.openstaff.eu` DNS mapat | 🚧 | Domain mapping neexecutat |
| `api.openstaff.eu/health` -> 200 | 🚧 | Domeniul custom nu este mapat inca; serviciul Cloud Run raspunde pe URL-ul `*.run.app` |
| `git push origin main` | 🚧 | Nu a fost executat in aceasta iteratie |

### Prompt 7 Notes

- Buildul API a avut initial doua blocaje reale rezolvate in cod:
  - etapa Docker `production-deps` nu copia schema Prisma inainte de `npx prisma generate`
  - bootstrap-ul de productie oprea serviciul daca Secret Manager sau `DATABASE_URL` nu erau gata
- Pentru API a fost adaugat fallback graceful pe `GET /taxonomy/nace`, astfel incat fara DB endpoint-ul raspunde acum cu `{ "results": [] }` in loc de `500`.
- Toate cele 3 servicii Cloud Run au avut nevoie de binding explicit `allUsers -> roles/run.invoker`, deoarece `--allow-unauthenticated` nu a deschis automat accesul public in proiectul curent.
- Verificare live API:
  - `/health` -> `200 OK`
  - `/status` -> `api: "ok"`, `db: "error"`, ceea ce este asteptat pana la Cloud SQL si `DATABASE_URL`
  - `/taxonomy/nace?q=electric` -> `{ "results": [] }`

## Prompt 6 Verification Snapshot

| Componentă                     | Status | Confirmat prin |
|--------------------------------|--------|----------------|
| GET /actors/me (bypass fix)    | 🚧 | Ruta este mapată în logul `npm run start:dev`, dar verificarea `curl` este blocată de `PrismaClientInitializationError P1001` deoarece `localhost:5432` nu răspunde |
| POST /jobs (FK fix)            | 🚧 | Fluxul folosește acum actorul dev upsert-uit în `FirebaseAuthGuard`, dar `curl` nu a putut fi executat până la `201` din cauza lipsei PostgreSQL local |
| GET /jobs/stats                | 🚧 | Ruta `/jobs/stats` este mapată la boot, însă requestul real nu poate fi confirmat fără DB local funcțional |
| GET /actors/stats              | 🚧 | Ruta `/actors/stats` este mapată la boot, însă requestul real nu poate fi confirmat fără DB local funcțional |
| Cloud Storage dev fallback     | 🚧 | `DocumentsService` returnează acum URL dev `http://localhost:8080/dev-files/...`, dar uploadul real nu a putut fi confirmat fără DB local funcțional |
| Homepage cu date reale         | 🚧 | `apps/admin/web` build trece și homepage-ul folosește `getJobs()` + `getActors()`, dar nu a fost validat în browser local |
| JobCard + ActorCard            | 🚧 | Componentele noi compilează în build-ul public, dar nu au fost validate vizual în browser local |
| GeminiChatbot floating         | 🚧 | Componenta nouă compilează și folosește `/gemini/chat`, dar nu a fost validată interactiv în browser local |
| NaceSearchInput autocomplete   | 🚧 | Componenta nouă compilează și cheamă `/taxonomy/nace`, dar nu a fost testată cu DB local activ |
| Onboarding wizard step 1-5     | 🚧 | Rutele și persistența localStorage compilează în `apps/admin/web`, dar flow-ul complet nu a fost parcurs în browser local |
| Dashboard backoffice KPI       | 🚧 | Dashboard-ul compilează și consumă `/jobs/stats`, `/actors/stats`, `/relu/queue`, dar nu a fost confirmat runtime din cauza blocajului DB |
| AI Config page edit agents     | 🚧 | Pagina compilează și trimite `PATCH /gemini/agents/:id`, dar nu a fost confirmat save runtime fără DB local |
| npm build toate 3 apps         | ✅ | `apps/admin/api -> npm run build`, `apps/admin -> npm run build`, `apps/admin/web -> npm run build` au trecut fără erori |

### Prompt 6 Notes

- `npm.cmd run start:dev` în `apps/admin/api` pornește NestJS, mapează rutele noi (`/actors/stats`, `/jobs/stats`, `/documents/upload`) și apoi lovește `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
- `Test-NetConnection localhost -Port 5432` a returnat `TcpTestSucceeded = False`.
- `docker compose up -d postgres` nu a putut porni în mediul curent deoarece Docker Desktop engine nu este disponibil.

## Local (development)

| Componenta | Status | Port | Note |
|---|---|---:|---|
| Frontend public | WARNINGS | 3000 | `apps/admin/web` starts and listens on `127.0.0.1:3000`. Firebase Auth client code is integrated, but no local Firebase config was provided and several public routes still return `404` (`/professionals`, `/pools`, `/compliance`, `/logistics`, `/ai`). |
| Admin panel | WARNINGS | 3001 | `apps/admin` starts and listens on `127.0.0.1:3001`. Firebase Auth admin guard and `/unauthorized` route are integrated, but the dev log shows a Turbopack worker panic, so runtime stability is not fully confirmed. |
| API server | WARNINGS | 8080 | NestJS loads secrets through `loadSecrets()`, starts on `8080`, and exposes `/health` and `/status`. Local `DATABASE_URL` now points to PostgreSQL, `prisma validate` passes, but Docker Desktop could not start the local Postgres container so `db push` and `db seed` are still blocked. |
| Firebase Auth emulator | ERRORS | 9099 | `firebase.json` exists and `dev:all` is ready to start emulators, but the Firebase CLI was not installed on this machine during validation. |
| Firestore emulator | ERRORS | 8090 | Configured in `firebase.json`, but not started because Firebase CLI is missing. |
| Storage emulator | ERRORS | 9199 | Configured in `firebase.json`, but not started because Firebase CLI is missing. |
| Emulator UI | ERRORS | 4000 | Configured in `firebase.json`, but not started because Firebase CLI is missing. |

## Production GCP

| Componenta | Status | URL | Serviciu GCP |
|---|---|---|---|
| Frontend public | ERRORS | https://openstaff.eu | Cloud Run: `openstaff-public` |
| Admin panel | WARNINGS | https://admin.openstaff.eu | Cloud Run: `openstaff-admin` |
| API server | WARNINGS | https://api.openstaff.eu | Cloud Run: `openstaff-api` |
| Firebase Auth | ERRORS | Firebase Console | - |
| Firestore | ERRORS | Firebase Console | - |
| Cloud Storage | HEALTHY | GCP Console | - |
| Secret Manager | ERRORS | GCP Console | API secrets |

## Prompt 4 S0-FIX

| Componenta | Status | Note |
|---|---|---|
| Docker Compose Postgres | HEALTHY | Root `docker-compose.yml` is in place and `docker compose up -d postgres` now starts `openstaff_postgres` on `localhost:5432` with a healthy container state. |
| prisma validate | HEALTHY | `npx prisma validate` passed with the PostgreSQL datasource after updating `apps/admin/api/.env`. |
| prisma db push | HEALTHY | `npx prisma db push --skip-generate` completed successfully after PostgreSQL became reachable and after the new Actor/Job schema was added. |
| prisma db seed | HEALTHY | `npx prisma db seed` completed successfully after replacing the legacy seed with the Prompt 4 taxonomy/currency/gemini seed. |
| Docker port 5432 | HEALTHY | `Test-NetConnection localhost -Port 5432` returned `TcpTestSucceeded = True`. |

## Prompt 4 S1-S4

| Componenta | Status | Note |
|---|---|---|
| Actor / Job schema | HEALTHY | New Prisma models `Actor`, `CompanyProfile`, `Job`, `Application`, `Contract`, `Dispute`, `Review`, `Document`, `Taxonomy`, `GeminiAgent`, and `Currency` were added without removing the legacy `User/Profile/Project` domain. |
| Seed data | HEALTHY | New seed populates `Currency`, `Taxonomy` (`NACE`, `ESCO`, `UNICLASS`) and `GeminiAgent`. |
| ActorsModule API | WARNINGS | Module, DTOs, controller, and service compile and are wired in `AppModule`, but endpoints were not smoke-tested with real Firebase tokens yet. |
| JobsModule API | WARNINGS | Public list/detail plus authenticated create/update/apply endpoints compile and are wired, but runtime flows were not exercised end-to-end yet. |
| TaxonomyModule API | WARNINGS | New `/taxonomy/nace`, `/taxonomy/esco`, `/taxonomy/uniclass`, and `/taxonomy/import` endpoints compile; autocomplete behavior was not request-tested yet. |
| DocumentsModule API | WARNINGS | Upload validation, local/GCS storage branching, and verify/list endpoints compile, but file upload was not manually exercised yet. |
| NotificationsModule API | WARNINGS | Actor-scoped notification endpoints compile, but they were not request-tested yet. |
| GeminiModule | WARNINGS | Skeleton `501 not_implemented` endpoints are wired and compile. |
| ReluModule | WARNINGS | Placeholder queue endpoints are wired and compile. |
| Brand tokens CSS | HEALTHY | Brand tokens were added in `apps/admin/web/lib/brand.ts`, `apps/admin/lib/brand.ts`, and CSS variables were aligned to navy/green/bg in `apps/admin/web/app/globals.css`. |
| OpenStaffLogo component | HEALTHY | Inline SVG logo component exists at `apps/admin/web/components/OpenStaffLogo.tsx`. |
| Navbar branded | HEALTHY | Branded navbar exists at `apps/admin/web/components/Navbar.tsx` and is now used by the public header. |
| API build | HEALTHY | `npm.cmd run build` passed in `apps/admin/api`. |
| Admin build | HEALTHY | `npm.cmd run build` passed in `apps/admin`. |
| Public build | HEALTHY | `npm.cmd run build` passed in `apps/admin/web` after fixing the homepage import path. |

## Notes

- Prompt 4 S0-FIX changes were applied locally: root `docker-compose.yml` exists, root package scripts now include `db:start`, `db:stop`, `db:reset`, and `db:studio`, and `scripts/dev-all.ps1` now attempts to start PostgreSQL through Docker before the app stack.
- Docker Desktop initially blocked startup on 2026-05-02, but the local Postgres container was later brought up successfully and Prisma was revalidated against it.
- Existing public app candidate in this repo is `apps/admin/web`. No new `apps/public` app was created because `apps/openstaff` is empty and `apps/admin/web` already acts as the public frontend candidate.
- Firebase Auth client integration was added to `apps/admin/web` and `apps/admin`, but it still depends on real `NEXT_PUBLIC_FIREBASE_*` values in local env files and on a deployed Firebase project in production.
- Admin-only routing is enforced client-side through Firebase custom claims (`admin: true`) in the local codebase. This is not yet verified in deployed production runtime.
- API production readiness improved in code through Secret Manager loading plus the new Firebase-aware backend modules, but Firebase token verification was not exercised end-to-end in local runtime because no service account key was supplied in `.env`.
- `dev:all` now attempts to start PostgreSQL first, then emulators, then API `:8080`, admin `:3001`, and public `:3000`, writing logs into `.logs/`.
- Local API startup previously required one extra fix during validation: `TaxonomyModule` was missing `PrismaModule` in its imports.
- The old Prisma seed was replaced because it targeted the legacy `Country/Region/Profile` setup and failed against the fresh PostgreSQL runtime. The current seed focuses on the new Prompt 4 domain tables.

## Recommended next steps

1. Add a real `FIREBASE_SERVICE_ACCOUNT_KEY` locally and request-test the new actor/job/document endpoints with valid Firebase bearer tokens.
2. Install Firebase CLI locally and rerun `npm run dev:all` to validate emulators on `9099`, `8090`, `9199`, and `4000`.
3. Exercise document upload with a real `STORAGE_BUCKET` to confirm the Cloud Storage path and signed URL behavior.
4. Decide whether the legacy `User/Profile/Project` domain should be bridged into the new `Actor/Job` domain or gradually retired; both now coexist in the schema.
5. Enable Secret Manager, Firebase Auth, and Firestore in the GCP project before marking production as ready.
6. Investigate the Next.js Turbopack panic in the admin dev server log before considering the local admin runtime fully healthy.
