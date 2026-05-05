Task: Extend OpenStaff taxonomy system.

Backend: apps/admin/api
Backoffice: apps/admin
Do not deploy.

Requirements:
- Add normalized taxonomy schema: industries, categories, professions, tags.
- Sources: ESCO, NACE, UNICLASS, CUSTOM.
- Add industries: Construction, Tourism, Hotels, Restaurants, SPA, Facilities, Retail.
- Add professions: Waiter, Chef, Hotel Manager, SPA Therapist, Electrician, Plumber, Sales Agent, Installer, Housekeeper, Receptionist, General Contractor, Subcontractor, Site Supervisor.
- Add endpoints:
  GET /taxonomy
  GET /taxonomy/search?q=
  GET /taxonomy/by-industry/:industrySlug
  POST /taxonomy/professions
  PATCH /taxonomy/professions/:id
- Protect write endpoints with SUPERADMIN / WRITE permission.
- Update apps/admin/app/ai-control/page.tsx to show industries, categories, professions, tags, source, loading, empty, error.
- If DB tables are missing or empty, return fallback data, not 500.

Run:
cd apps/admin/api
npx.cmd prisma generate
npm.cmd run build

cd ../
npm.cmd run lint
npm.cmd run build

Output:
- files modified
- schema changes
- endpoints
- backend build status
- frontend lint/build status
Do not deploy.
