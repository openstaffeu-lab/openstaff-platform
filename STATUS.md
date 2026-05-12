# OpenStaff Platform Status

Last updated: 2026-05-05

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
