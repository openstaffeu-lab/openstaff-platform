Task: Implement OpenStaff UI/UX Design System & Global Infrastructure.

Backoffice: apps/admin
Public web: apps/admin/web
Backend: apps/admin/api
Do not deploy.

Brand:
OpenStaff
Slogan: The Structure for Global Work.
Entity: ACA STRATEGIC SOLUTIONS S.R.L.
CUI 52313191
J2025060195004

Colors:
Primary Navy: #1A237E
Accent Mint: #00E676
Neutral Slate: #F5F7FA
Text Charcoal: #263238

Typography:
Headings: Montserrat
Body/UI: Inter

Requirements:
- Create shared design tokens.
- Improve backoffice readability and fix low contrast.
- Update public web header, footer, homepage hero, role switcher, marketplace preview, taxonomy preview.
- Add public homepage sections:
  Build Your Global Team on OpenStaff
  Search Projects / Talents
  ESCO / NACE / Uniclass taxonomy
  Compliance Vault
  Logistics Hub
  Pricing Matrix
- Footer must include:
  ACA STRATEGIC SOLUTIONS S.R.L.
  CUI 52313191
  J2025060195004
  info@openstaff.eu
  gdpr@openstaff.eu
  contact@openstaff.eu
  office@openstaff.eu
- Public frontend should use GET /ui-config with fallback default config.
- Add mobile-first improvements and accessible contrast.
- Do not deploy.

Run:
cd apps/admin
npm.cmd run lint
npm.cmd run build

cd web
npm.cmd run build

Output:
- files modified
- UI changes
- backoffice build status
- public web build status
- remaining issues before deploy
