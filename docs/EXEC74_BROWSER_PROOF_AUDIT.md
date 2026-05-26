# EXEC-74 Browser Proof Audit

Date: 2026-05-26

## Status

STATUS: PARTIAL PASS

The browser proof scripts are useful UI smoke tests, but they are not sufficient evidence for the operational persistence and live lifecycle claims made by EXEC-72 and EXEC-73.

## EXEC-72 Proof

Files inspected:

- `docs/proof/exec72/browser-check.cjs`
- `docs/proof/exec72/browser-proof.json`

Evidence:

- The script starts a mock API on `127.0.0.1:18080`.
- The script starts the public web dev server on `127.0.0.1:3100`.
- It checks Chrome desktop, Edge desktop, Android Chrome, and iPhone Safari/Pixel device contexts.
- It records console errors, page errors, bad responses, and horizontal overflow.
- Routes checked: `/companies/exec72-company`, `/profiles/exec72-company`, `/professionals`, `/publish`, `/onboarding/company`.

Limits:

- The company, project, professional, and onboarding data are mock objects inside the script.
- No live API, live database, live upload, live moderation, live mailbox/contact, or live discovery update is exercised.
- Several route checks only record counts and page title; they do not fail when domain-specific content is absent. In the saved JSON, `/professionals`, `/publish`, and `/onboarding/company` had zero company-name and zero RELU text counts and still passed.
- The mock company has no assets, so public company banner/logo/gallery routing was not tested.

Verdict:

- Layout smoke coverage: PASS.
- Marketplace lifecycle proof: UNVERIFIED.
- Persistence proof: UNVERIFIED.

## EXEC-73 Proof

Files inspected:

- `docs/proof/exec73/browser-check.cjs`
- `docs/proof/exec73/browser-proof.json`
- `docs/proof/exec73/screenshots/*`

Evidence:

- The script uses a mock API and seeded local admin tokens.
- It checks Chrome desktop, Edge desktop, Android Chrome, and iPhone Safari user agents/viewports.
- It records console errors, page errors, bad responses, request failures, raw text matches, horizontal overflow, and overflow offenders.
- Routes checked: `/dashboard`, `/admin/relu`, `/admin/media`, `/countries-vat`, `/projects`, `/admin/taxonomy`, `/ai-control`.
- It asserts that normal admin sees "Technical tools are isolated" on `/admin/taxonomy` and `/ai-control`.
- It captures screenshots for dashboard, RELU, media, Countries/VAT, and projects across checked browsers.

Limits:

- The proof does not authenticate against production.
- It does not upload real files.
- It does not verify database persistence.
- It does not call backend technical APIs directly as a normal admin.
- It does not test hidden direct routes such as `/admin/workforce` and `/admin/imports`.
- It does not verify public/backoffice consistency against real public entities.

Verdict:

- Visible operational UI cleanup smoke proof: PASS.
- Backend isolation proof: FAIL.
- Live operational proof: UNVERIFIED.

## Fake-Pass Risk

The scripts do not fake results in the sense that they set `process.exitCode = 1` on their own failure criteria. The risk is scope, not dishonesty:

- mock data can make missing production data look healthy
- routes can pass without testing the actual lifecycle
- role isolation can pass in the UI while backend APIs remain reachable
- asset handling can pass when the mock has no assets

## Required Next Proof

To promote EXEC-72/EXEC-73 claims beyond partial local validation:

- run production or staging credentialed journeys against a real database
- create real uploads and reload pages after restart
- verify raw asset references are not public or visible to normal admins
- assert normal `ADMIN` gets 403 on technical APIs
- assert `SUPERADMIN` can access technical APIs
- assert the implemented AI moderator role/permission can access only RELU moderation endpoints
- verify public company pages with actual banner, logo, gallery, projects, and documents
