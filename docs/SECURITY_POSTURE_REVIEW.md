# OpenStaff Security Posture Review

Last updated: `2026-05-18`  
Scope: `EXEC-25`

## Executive Summary

OpenStaff production now has a documented and operator-validated security posture suitable for controlled real-user growth. The current baseline shows explicit CORS allowlists, Secret Manager-backed runtime secrets, protected admin APIs, hardened Cloud SQL transport, and new abuse protections on the most exposed routes.

The review also confirms several residual risks that remain accepted for the current operating model:

1. Cloud Run ingress is still `all`, so public `run.app` URLs remain reachable in addition to the mapped domains.
2. The admin shell is internet-facing for login, even though admin APIs remain protected by JWT and RBAC.
3. Cloud SQL still has a public IP, although transport is constrained by `connectorEnforcement = REQUIRED` and `sslMode = ENCRYPTED_ONLY`.
4. There is no external WAF layer in front of the public estate at this time.

## Internet-Facing Surface

Production internet-facing domains:

1. `https://openstaff.eu`
2. `https://api.openstaff.eu`
3. `https://backoffice.openstaff.eu`

Cloud Run also exposes public service URLs through `*.run.app` because ingress is currently set to `all` for:

1. `openstaff-web`
2. `openstaff-api`
3. `openstaff-admin`

## Public Application Surface

Expected public routes and endpoint groups include:

1. homepage, pricing, publish, jobs, professionals, login, register, legal pages
2. API `/health` and `/status`
3. auth routes for registration, login, refresh, logout, and Firebase token exchange
4. plans and subscription upgrade request routes
5. moderated public post list/detail and approved public asset delivery
6. Stripe webhook ingress

This surface is intentional for a controlled rollout and matches the documented operational contract.

## Admin Exposure Review

The admin web shell is intentionally reachable for authentication, but admin data routes are not anonymously exposed.

Validated live proof:

1. anonymous `GET /admin/public-posts` returned `401`
2. temporary `SUPERADMIN` login returned `200`
3. authenticated `SUPERADMIN` `GET /admin/public-posts` returned `200`

Conclusion:

1. there is no observed anonymous access to protected admin API routes
2. the public admin shell remains a login surface, not an open data surface

## Auth and Session Risk Review

Observed auth posture:

1. production auth mode remains `firebase-admin`
2. JWT-backed authenticated API flows remain healthy after EXEC-25 deploy
3. no runtime evidence was found of demo bypass flags being enabled in production

New abuse protections validated live:

1. repeated login attempts now hit `429`
2. repeated Firebase exchange attempts now hit `429`
3. repeated public webhook hits now hit `429`

Residual auth/session risks:

1. login remains internet-facing and therefore remains a brute-force target, albeit now throttled
2. Firebase exchange remains a public ingestion path and depends on upstream token integrity
3. the current baseline does not include external bot mitigation beyond app-layer throttling

## Rate Limiting and Abuse Resistance

EXEC-25 extended route-level throttling to exposed and operationally sensitive routes.

Live-proven protections now include:

1. login brute-force resistance
2. Firebase exchange abuse resistance
3. public upgrade request throttling
4. public billing webhook throttling
5. admin moderation mutation throttling
6. admin billing webhook reprocess throttling

These protections are documented in [docs/proof/exec25/README.md](/C:/Users/admin/Desktop/openstaff-platform/docs/proof/exec25/README.md:1).

## Webhook Exposure Review

Webhook posture:

1. Stripe webhook ingress is intentionally public
2. invalid unsigned requests return app-level `400 BAD_REQUEST`
3. burst traffic now rate-limits to `429`

Validated live proof:

1. webhook burst protection returned `429`
2. after cooldown, an unsigned Stripe request returned `400` with `Missing Stripe-Signature header.`

Conclusion:

1. the route is reachable as intended
2. the route remains guarded by signature verification logic
3. abuse resistance is materially better than the EXEC-24 baseline

## Upload and Storage Risk Review

Observed posture:

1. uploads are authenticated flows
2. public delivery only succeeds for approved assets
3. production storage remains on `gs://openstaff-platform-production`
4. runtime storage access is now bucket-scoped rather than broad project-level editor access

Validated live proof after EXEC-25 deploy:

1. media upload `201`
2. document upload `201`
3. approve media/document/post `200`
4. public approved media delivery `200`
5. public approved document delivery `200`

Residual risk:

1. uploads remain internet-driven and therefore need ongoing monitoring for object growth and abuse patterns

## CORS Review

Observed production CORS contract:

1. `https://openstaff.eu`
2. `https://backoffice.openstaff.eu`
3. `https://api.openstaff.eu`

Findings:

1. no wildcard `*` origin was observed
2. the allowed origins are explicit and production-specific
3. current CORS posture is appropriate for the present domain layout

## Secret Access Review

Current live secret inventory:

1. `DATABASE_URL`
2. `FIREBASE_SERVICE_ACCOUNT_KEY`
3. `GEMINI_API_KEY`
4. `JWT_REFRESH_SECRET`
5. `JWT_SECRET`
6. `STRIPE_WEBHOOK_SECRET`

Findings:

1. runtime secret delivery is Secret Manager-backed
2. `/status` exposes readiness booleans and summaries, not raw secret values
3. the legacy `WEBHOOK_SECRET` has already been removed

## Cloud Run Ingress Review

Current ingress model:

1. `openstaff-api`: `all`
2. `openstaff-web`: `all`
3. `openstaff-admin`: `all`

Implications:

1. mapped domains are not the only reachable origins
2. `run.app` service URLs remain directly reachable
3. this is acceptable for the current baseline, but it is broader than a private-ingress or load-balancer-only posture

## Cloud SQL Exposure Review

Observed production database posture:

1. primary instance: `openstaff-db`
2. public IP present
3. `connectorEnforcement = REQUIRED`
4. `sslMode = ENCRYPTED_ONLY`
5. backups and PITR enabled
6. no permanent authorized-network allowlist was observed during EXEC-25 review

Conclusion:

1. the instance is not private-IP-only
2. transport constraints materially reduce risk
3. database exposure is acceptable for current scale but remains a future hardening candidate

## Build and Runtime Identity Review

EXEC-25 closed an operational security weakness in the deploy path by separating build/deploy identity from runtime identity.

Current model:

1. runtime service account: `605639023972-compute@developer.gserviceaccount.com`
2. build/deploy service account: `openstaff-build@openstaff-platform.iam.gserviceaccount.com`

Benefits:

1. runtime no longer needs broad deploy-adjacent permissions
2. build/deploy keeps Artifact Registry, source bucket, logging, and Cloud Run deployment rights
3. `roles/iam.serviceAccountUser` is granted to the build identity on the runtime SA instead of being left on the runtime SA itself

## Overall Findings

Security posture is materially improved and operationally credible for controlled user growth.

Confirmed positives:

1. no wildcard CORS
2. no observed anonymous access to protected admin APIs
3. no raw secret leakage in runtime status surfaces
4. no restored broad `roles/editor` exposure on the runtime identity
5. abuse protections now cover several previously unthrottled routes

Accepted residual risks:

1. public `run.app` URLs remain reachable
2. Cloud Run ingress is still `all`
3. Cloud SQL still exposes a public IP
4. no external WAF or CDN-based security control is in place

## Recommended Next Hardening Steps

1. evaluate restricting Cloud Run ingress behind a load balancer or equivalent controlled edge
2. evaluate hiding or disabling direct `run.app` exposure where feasible
3. evaluate private IP Cloud SQL connectivity when the networking model and operations budget justify it
4. add bot or edge-layer filtering if auth or webhook pressure increases
