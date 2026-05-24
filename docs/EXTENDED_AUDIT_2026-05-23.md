# OpenStaff Platform - Extended Audit

Data audit: 2026-05-23  
Branch: `feature/work-in-progress`  
Workspace: `C:\Users\admin\Desktop\openstaff-platform`

## EXEC-63 Delta - 2026-05-24

This section records what changed after the original 2026-05-23 audit and should be read as the current closure delta for release engineering and production hardening.

### Closed since the original audit

- `npm audit --omit=dev --audit-level=high` now exits cleanly in root, `apps/admin`, `apps/admin/web`, and `apps/admin/api`.
- Both frontend apps were patched to `next@16.2.6` and rebuilt successfully.
- `fast-xml-builder` is no longer a high-severity API blocker after dependency refresh.
- `xlsx` has been removed from `apps/admin/api`; taxonomy imports now operate in CSV-only hardened mode and reject `.xls` / `.xlsx` before parse.
- API test stability is closed:
  - `npm.cmd test -- --runInBand` in `apps/admin/api` now passes
  - `14/14` suites pass
  - `26/26` tests pass
- Public web lint now exits `0`.
- API lint now exits `0` using read-only scripts and a documented accepted warning baseline.
- `apps/admin/api/prisma/dev.db` and tracked sample uploads have been removed from the Git index.
- `/dev-files` static serving is now gated to development only.
- Cloud Build staging reliability is no longer an active blocker; current GCP IAM and the Cloud Build staging bucket permissions support recent successful deploy pipelines from `2026-05-23`.

### Still open after EXEC-63

- Auth tokens still persist in `window.localStorage` in both frontends.
- Moderate-only dependency advisories remain accepted upstream:
  - `postcss` via the current patched Next.js line
  - `uuid` via Firebase / Google transitive dependencies
- EXEC-63 validated recent deploy success and current production health, but did not deploy this exact hardening commit.

### Updated classification

- Build readiness: `OK`
- CI readiness: `OK`
- Release readiness: `BETA_READY`
- Production readiness: `NOT YET`

### Why not `PRODUCTION_READY` yet

1. The current token persistence model still relies on `localStorage`.
2. Accepted moderate dependency exceptions remain and must stay tracked.
3. Same-turn promotion proof for the exact EXEC-63 commit is not included in this execution.

## 1. Rezumat executiv

Proiectul este intr-o stare buna pentru compilare, dar nu este inca pregatit pentru release fara remedierea unor probleme de securitate, testare si igiena repository.

Ce merge bine:

- `apps/admin/api` se compileaza cu succes.
- `apps/admin` se compileaza cu succes si lint-ul are doar warnings.
- `apps/admin/web` se compileaza cu succes.
- Exista validare runtime pentru env-uri critice, CORS si flag-uri periculoase in productie.
- Schema Prisma este ampla si include indexuri pe multe fluxuri operationale: billing, onboarding, audit, messaging, compliance, workforce, payroll, Relu AI.
- Exista documentatie operationala consistenta in `docs/`, inclusiv runbook-uri, readiness, SLO, security posture si release governance.

Blocaje / riscuri principale:

- `npm audit` raporteaza vulnerabilitati high in Next.js pentru ambele frontenduri.
- API-ul are `xlsx` cu vulnerabilitati high si fara fix disponibil prin `npm audit`.
- Testele API pica in 13/14 suites din cauza modulelor de test incomplete si a unui spec gol.
- Lint-ul public web pica cu 54 probleme, dintre care 32 errors.
- Lint-ul API pica masiv din cauza Prettier/line endings si `no-unsafe-*`, desi build-ul trece.
- `apps/admin/api/prisma/dev.db` si fisiere sample din `apps/admin/api/uploads/` sunt deja trackuite de Git, desi `dev.db` este in `.gitignore`.
- Exista fisiere locale sensibile/nepotrivite in workspace, ignorate dar prezente: `firebase-admin-openstaff-platform.json`, `smtp.txt`, `.env`, `.env.local`, loguri runtime.

Verdict:

- Build readiness: partial OK.
- Release readiness: blocat de dependency audit, test suite broken si igiena repository.
- Security posture: medie, cu guardrails bune in runtime, dar dependinte vulnerabile si artefacte sensibile locale.
- Operational readiness: buna ca documentatie, dar trebuie reconfirmata prin CI verde si audit de secrete.

## 2. Scope auditat

Zone inspectate:

- Root workspace: `package.json`, lockfile, `.gitignore`, `docker-compose.yml`, `README.md`.
- Backoffice frontend: `apps/admin`.
- Public frontend: `apps/admin/web`.
- Backend API NestJS/Prisma: `apps/admin/api`.
- Documentatie operationala: `docs/`.
- Artefacte Git si fisiere ignorate.

Verificari rulate:

- `git status --short --branch`
- `git ls-files` pe fisiere potential sensibile/runtime
- `npm.cmd run lint` in `apps/admin`
- `npm.cmd run lint` in `apps/admin/web`
- `npx.cmd eslint "{src,apps,libs,test}/**/*.ts"` in `apps/admin/api`, fara `--fix`
- `npm.cmd test -- --runInBand` in `apps/admin/api`
- `npm.cmd run build` in `apps/admin/api`
- `npm.cmd run build` in `apps/admin`
- `npm.cmd run build` in `apps/admin/web`
- `npm.cmd audit --omit=dev --audit-level=moderate` in root, `apps/admin`, `apps/admin/web`, `apps/admin/api`
- scan static pentru auth guards, public endpoints, env flags, localStorage, fetch, upload interceptors si runtime config.

## 3. Status Git si workspace

Status initial:

- Branch curent: `feature/work-in-progress`.
- Working tree initial: curat.

Status dupa verificari:

- Build artifacts sunt ignorate: `.next/`, `dist/`, `next-env.d.ts`, `node_modules/`.
- Fisiere ignorate dar prezente local includ env-uri, loguri si fisiere potential sensibile.
- Auditul a adaugat acest fisier nou: `docs/EXTENDED_AUDIT_2026-05-23.md`.

Observatii importante:

- `apps/admin/api/prisma/dev.db` este trackuit de Git.
- Fisierele sample upload din `apps/admin/api/uploads/profiles/...` sunt trackuite.
- `firebase-admin-openstaff-platform.json` si `smtp.txt` sunt ignorate, dar exista local in workspace.

Recomandare:

- Rotire / verificare credentiale pentru orice fisier secret aparut local.
- Eliminare din index pentru `apps/admin/api/prisma/dev.db` daca nu este intentionat.
- Stabilire politica clara pentru sample uploads: ori mutare in fixtures curate, ori eliminare din Git.

## 4. Rezultate verificari

### 4.1 Build

| Componenta | Comanda | Rezultat |
|---|---|---|
| API | `npm.cmd run build` | PASS |
| Backoffice `apps/admin` | `npm.cmd run build` | PASS |
| Public web `apps/admin/web` | `npm.cmd run build` | PASS |

Interpretare:

- Codul compileaza in toate aplicatiile active.
- Build-ul Next nu blocheaza pe lint errors din public web in configuratia curenta.
- Build verde nu inseamna release verde, pentru ca lint/test/audit inca pica.

### 4.2 Lint

| Componenta | Rezultat |
|---|---|
| Backoffice `apps/admin` | PASS cu 9 warnings |
| Public web `apps/admin/web` | FAIL: 54 probleme, 32 errors, 22 warnings |
| API `apps/admin/api` | FAIL: multe erori Prettier/line endings si erori `@typescript-eslint/no-unsafe-*` |

Backoffice warnings notabile:

- Missing dependencies in React hooks pe pagini admin: hiring, messages, payroll, timesheets, verifications, workforce.
- Variabile nefolosite: `HiringStage`, `onboardingFriction24h`.

Public web lint errors notabile:

- `no-explicit-any` in `apps/admin/web/api.ts`, `app/onboarding/step-1-type/page.tsx`, `components/EscoMultiSelect.tsx`, `lib/api.ts`.
- `react-hooks/set-state-in-effect` in pagini si componente importante: messages, pricing, profile, project detail, publish, onboarding, profile panels, project execution/timesheet/assignment panels, `AuthContext`.
- Warnings pentru missing hook dependencies si unused vars.

API lint notabil:

- Prettier reclama inconsistent line endings in multe fisiere.
- `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-return`, `no-unnecessary-type-assertion` apar in guards, services si notification/auth code.
- Scriptul `npm run lint` din API contine `--fix`; pentru audit a fost rulat eslint direct fara modificari automate.

Recomandare:

- Separare intre `lint` si `lint:fix` in API.
- Adaugare `.prettierrc`/`.editorconfig` explicite pentru `endOfLine`.
- Remediere public web lint errors inainte de release.

### 4.3 Teste

Comanda:

- `npm.cmd test -- --runInBand` in `apps/admin/api`

Rezultat:

- FAIL: 13 test suites failed, 1 passed.
- 12 tests failed, 1 passed.

Cauze principale:

- Specs NestJS creeaza module partiale si nu injecteaza providerii necesari:
  - `PrismaService`
  - `JwtService`
  - `Reflector`
  - `RuntimeConfigService`
  - `AuditService`
- `src/esco/esco.controller.spec.ts` nu contine niciun test.

Impact:

- CI nu poate fi considerat verde.
- Regressions pe auth, role guards, taxonomy, users, projects si services pot trece neobservate.

Recomandare:

- Introducere `TestingModuleFactory` comun cu mocks pentru `PrismaService`, `JwtService`, `RuntimeConfigService`, `AuditService`.
- Mutarea controller tests catre module integration minimal, sau mocking explicit pentru guards.
- Stergere/completare spec gol `esco.controller.spec.ts`.
- Adaugare smoke test pentru `AppModule` cu providers reali/mocked coerent.

## 5. Dependency audit

### 5.1 Root

Rezultat:

- 9 moderate vulnerabilities.

Pachete/advisories:

- `protobufjs <=7.5.7`, moderate DoS.
- `uuid <11.1.1`, moderate bounds check issue, prin lant Firebase/Google Cloud.
- Lant afectat: `firebase-admin`, `@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `gaxios`, `teeny-request`, `retry-request`.

Recomandare:

- Rulare `npm audit fix` controlat.
- Verificare daca update-ul Firebase Admin rezolva lantul fara downgrade/breaking change.

### 5.2 Backoffice `apps/admin`

Rezultat:

- 3 vulnerabilities: 1 high, 2 moderate.

Pachete/advisories:

- `next 16.2.3` intra in intervalul vulnerabil raportat de npm.
- `postcss <8.5.10`, moderate XSS in stringify output.
- `protobufjs <=7.5.7`, moderate DoS.

Fix sugerat de npm:

- `npm audit fix --force` ar instala `next@16.2.6`, in afara range-ului pinuit.

Recomandare:

- Actualizare controlata `next` si `eslint-config-next` la versiune compatibila patch.
- Rebuild + smoke test dupa update.

### 5.3 Public web `apps/admin/web`

Rezultat:

- 3 vulnerabilities: 1 high, 2 moderate.

Pachete/advisories:

- `next 16.2.4` raportat vulnerabil.
- `postcss <8.5.10`.
- `protobufjs <=7.5.7`.

Fix sugerat de npm:

- `next@16.2.6`, in afara range-ului curent.

Recomandare:

- Aliniere versiuni cu backoffice pentru Next si eslint config.
- Re-rulare lint/build dupa update.

### 5.4 API `apps/admin/api`

Rezultat:

- 13 vulnerabilities: 1 low, 10 moderate, 2 high.

Pachete/advisories:

- `fast-xml-builder <=1.1.6`, high.
- `xlsx *`, high, prototype pollution si ReDoS, fara fix disponibil.
- `protobufjs <=7.5.7`, moderate.
- `qs 6.11.1 - 6.15.1`, moderate.
- `uuid <11.1.1`, moderate, prin lant Google Cloud/Firebase.
- `@tootallnate/once <2.0.1`, low.

Impact special:

- `xlsx` este folosit intr-un API care pare sa aiba importuri/taxonomy/document flows. Daca fisiere externe ajung la parsare XLSX, suprafata este sensibila.

Recomandare:

- Evaluare inlocuire `xlsx` cu alternativa intretinuta sau izolarea parserului intr-un job separat/sandbox.
- Limitare stricta pentru upload/import: size limit, MIME validation, extensii permise, timeout, scanning si reject pentru formule/macros.
- `npm audit fix` controlat pentru `fast-xml-builder`, `qs`, `protobufjs`.
- Test regresie pe import taxonomy si document ingestion.

## 6. Securitate aplicatie

### 6.1 Puncte bune

- Runtime validation blocheaza in productie:
  - `SKIP_FIREBASE_AUTH=true`
  - `SKIP_JWT_AUTH=true`
  - `ENABLE_DEV_AUTH_BYPASS=true`
  - `DEMO_MODE=true`
  - `ENABLE_DEMO_PUBLIC_FEED=true`
  - `ENABLE_DEMO_MESSAGING=true`
- `ValidationPipe` global are `whitelist: true` si `transform: true`.
- CORS este configurat din env-uri.
- Public endpoints sensibile au rate limiting in auth, subscriptions si billing webhook.
- Logging/interceptor si exception filter sunt globale.
- Audit/security models exista in Prisma: `AuditLog`, `SecurityEvent`, `UserSession`, `UserDeviceFingerprint`.

### 6.2 Riscuri

#### High - token storage in `localStorage`

Atat backoffice cat si public web stocheaza access/refresh tokens in `window.localStorage`.

Impact:

- Orice XSS in frontend poate extrage tokenuri persistente.
- Riscul creste deoarece dependency audit raporteaza vulnerabilitati Next/PostCSS.

Recomandare:

- Migrare catre cookie-uri `HttpOnly`, `Secure`, `SameSite=Lax/Strict` pentru refresh token.
- Access token scurt, in memorie, cu refresh controlat server-side.
- CSP strict si audit XSS pe inputuri de continut public.

#### High - `xlsx` fara fix disponibil

`xlsx` este high risk in API si nu are fix disponibil prin npm.

Recomandare:

- Daca importul XLSX este necesar, izolati procesarea intr-un worker fara acces la secrete si cu limite dure.
- Preferati CSV strict validat sau o librarie alternativa intretinuta.

#### Medium - fisiere sensibile locale

Fisiere locale prezente:

- `firebase-admin-openstaff-platform.json`
- `smtp.txt`
- `apps/admin/api/.env`
- `apps/admin/.env.local`

Ele sunt ignorate, dar prezenta lor in workspace creste riscul de commit accidental sau exfiltrare locala.

Recomandare:

- Mutare in secret manager / vault.
- Scan secret in CI.
- Rotire credentiale daca valorile au fost expuse.

#### Medium - `dev.db` trackuit

`apps/admin/api/prisma/dev.db` este trackuit de Git, desi este ignorat.

Impact:

- Date locale sau fixtures pot ajunge in istoric.
- Migrarea dev/prod devine ambigua.

Recomandare:

- `git rm --cached apps/admin/api/prisma/dev.db` dupa confirmare.
- Inlocuire cu seed reproducibil.

#### Medium - endpoint static `/dev-files`

API monteaza `/dev-files` catre `uploads/actors`.

Impact:

- In productie, daca directorul exista si contine fisiere, poate expune fisiere locale.
- Nu este conditionat explicit pe development.

Recomandare:

- Conditionare pe `runtimeConfig.isDevelopment`.
- Pentru productie folositi GCS signed URLs sau media proxy cu ACL.

#### Medium - Firebase public config hardcodata in Cloud Build substitutions

`apps/admin/web/cloudbuild.web.yaml` contine valori publice Firebase in substitutions.

Nu este secret in sens clasic, dar trebuie tratat ca public runtime config si corelat cu reguli Firebase stricte.

Recomandare:

- Verificare Firebase Auth domain restrictions, Storage rules si App Check.
- Mutare substitutions in Cloud Build trigger variables daca doriti reducerea expunerii in repo.

## 7. Calitate cod si maintainability

### 7.1 Duplicare de suprafata frontend

Exista doua aplicatii Next:

- `apps/admin` pentru backoffice.
- `apps/admin/web` pentru public web.

Ambele au librarii similare: `lib/api.ts`, `lib/firebase.ts`, `lib/runtime-config.ts`, design tokens, app-status, components status reporter.

Risc:

- Fixurile de auth/config/securitate trebuie propagate manual.
- Drift intre implementari.

Recomandare:

- Extrage pachete comune pentru:
  - API client/auth session
  - runtime config parser
  - Firebase init
  - design tokens
- Sau documentati explicit diferentele daca monorepo package sharing nu este dorit.

### 7.2 TypeScript strictness partiala in API

`tsconfig.json` are:

- `strictNullChecks: true`
- `noImplicitAny: false`
- `skipLibCheck: true`

Risc:

- API-ul compileaza, dar multe `any`/unsafe access raman ascunse pana la runtime.

Recomandare:

- Intai reparati lint errors pe guards/services critice.
- Apoi cresteti strictness incremental: `noImplicitAny: true` pe module noi sau via overrides.

### 7.3 Lint policy inconsistente

- API `lint` ruleaza cu `--fix`, ceea ce poate modifica fisiere in CI/local fara intentie explicita.
- Frontend public are reguli noi React hooks care blocheaza lint, dar build trece.

Recomandare:

- Standardizare:
  - `lint`: read-only
  - `lint:fix`: modifica fisiere
  - `format:check`
  - `format:write`
- CI trebuie sa ruleze doar variante read-only.

## 8. Operare si deployment

Puncte bune:

- README defineste layout si comenzi build.
- Exista `DEPLOYMENT_RUNBOOK.md`, `RELEASE_GOVERNANCE.md`, `SLO_BASELINE.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, `SECRET_ROTATION_RUNBOOK.md`.
- Cloud Run/Cloud Build sunt parte din workflow.
- API are runtime status si production readiness page in backoffice.

Riscuri:

- Root `cloudbuild.api.yaml` si `cloudbuild.web.yaml` sunt fisiere de 2 bytes, deci pot crea confuzie fata de Cloud Build configs reale din `apps/admin/api` si `apps/admin/web`.
- `docker-compose.yml` contine credentiale dev simple. Acceptabil local, dar trebuie clar marcat drept dev-only.
- Multe proof docs pot deveni greu de navigat fara index/status curent.

Recomandare:

- Adaugati `docs/READINESS_CURRENT.md` sau mentineti `STATUS.md` intr-un format sumar, nu urias.
- In root, fie stergeti cloudbuild placeholders de 2 bytes, fie documentati ca sunt intentionally empty.
- CI mandatory gates: build all, lint all, test API, audit minimum.

## 9. Data model si DB

Puncte bune:

- Schema Prisma are acoperire ampla pentru marketplace, billing, verification, compliance, audit, messaging, workforce, payroll si AI/Relu.
- Exista indexuri numeroase pentru status/createdAt/user/project flows.
- Migration baseline curenta exista in `20260516090000_exec15c_production_baseline`.

Riscuri:

- Schema este foarte mare intr-un singur fisier, peste 4000 linii.
- Exista `migrations_legacy_exec01_exec14` pe langa baseline, ceea ce poate crea confuzie pentru onboarding.
- `dev.db` trackuit poate da senzatia ca SQLite/local DB este sursa de adevar, desi providerul este PostgreSQL.

Recomandare:

- Documentati clar strategia de migrare: baseline production vs legacy archive.
- Adaugati verificare CI pentru `prisma validate` si `prisma migrate diff`/migration drift, unde este sigur.
- Mutati seed data in `prisma/seed.ts` si fixtures text versionate, nu DB binar.

## 10. Prioritati recomandate

### P0 - inainte de urmatorul release

1. Actualizati Next in `apps/admin` si `apps/admin/web` la versiunea patch recomandata de audit si rulati build/lint.
2. Decideti strategia pentru `xlsx`: inlocuire, izolare sau blocare temporara a importurilor XLSX nesigure.
3. Reparati API test harness ca `npm test` sa fie verde.
4. Reparati public web lint errors sau ajustati regulile doar daca exista decizie explicita.
5. Eliminati din Git `apps/admin/api/prisma/dev.db` daca nu este intentionat.
6. Confirmati ca fisierele locale sensibile nu contin credentiale active; rotiti daca este cazul.

### P1 - urmatoarea iteratie

1. Standardizati lint/format scripts in toate pachetele.
2. Adaugati secret scanning in CI.
3. Conditionati `/dev-files` pe development.
4. Introduceti smoke tests pentru auth, status, billing webhook, subscriptions upgrade, public post upload.
5. Extrage shared API/runtime config intre frontenduri sau documentati diferenta.

### P2 - hardening

1. Migrare token refresh din `localStorage` catre cookies `HttpOnly`.
2. CSP strict pentru ambele frontenduri.
3. App Check/Firebase rules review.
4. SCA policy: Dependabot/Renovate + weekly audit.
5. Observability release gates: health check, uptime checks, alert policies validate automat.

## 11. Checklist de acceptanta pentru release

Release-ul poate fi considerat pregatit cand:

- `npm.cmd run build` trece in `apps/admin/api`, `apps/admin`, `apps/admin/web`.
- `npm.cmd run lint` trece in `apps/admin` si `apps/admin/web`.
- API are comanda read-only de lint si trece sau are baseline acceptat explicit.
- `npm.cmd test -- --runInBand` trece in API.
- `npm audit --omit=dev --audit-level=high` trece sau are exceptii documentate.
- Nu exista secrete reale in fisiere trackuite.
- `dev.db` nu este trackuit sau este documentat explicit ca fixture publica.
- Runtime production blocheaza dev/demo bypass flags.
- Smoke test manual sau automat confirma:
  - login
  - refresh/logout
  - status
  - public jobs/profiles
  - admin dashboard
  - billing webhook signature path
  - upload path cu limite

## 12. Concluzie

OpenStaff are fundatie operationala serioasa si buildurile trec, ceea ce este un semn bun. Blocajele reale nu sunt de compilare, ci de igiena release: dependency audit, teste rupte, lint public web si fisiere runtime/secret-like in workspace.

Ordinea cea mai eficienta este:

1. Patch dependinte Next/API audit.
2. Fix test harness API.
3. Curatare Git pentru `dev.db` si uploads daca nu sunt intentionate.
4. Lint public web.
5. Hardening token storage si upload/import flows.
