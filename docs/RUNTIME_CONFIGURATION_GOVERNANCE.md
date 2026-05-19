# OpenStaff Runtime Configuration Governance

Last updated: `2026-05-18`  
Scope: `EXEC-26`

## Purpose

This document defines the source of truth for production runtime configuration so the team does not drift back into ambiguity between repository defaults, build-time values, runtime secrets, and live service configuration.

## Source of Truth

### Secret-backed runtime values

Production secrets must come from Secret Manager:

1. `DATABASE_URL`
2. `JWT_SECRET`
3. `JWT_REFRESH_SECRET`
4. `STRIPE_WEBHOOK_SECRET`
5. `FIREBASE_SERVICE_ACCOUNT_KEY`
6. `GEMINI_API_KEY`

### Build-time public web/admin values

These are baked into the frontend builds and must be treated as build-time config:

1. `NEXT_PUBLIC_API_URL`
2. `NEXT_PUBLIC_WEB_URL`
3. `NEXT_PUBLIC_ADMIN_URL`
4. public Firebase client values, where applicable

### Runtime non-secret flags

These are runtime environment values for the API and remain part of the Cloud Run deploy contract:

1. `NODE_ENV`
2. `CORS_ORIGIN`
3. `PUBLIC_WEB_URL`
4. `ADMIN_WEB_URL`
5. demo and bypass flags

## Ownership Model

1. Technical Ops owns production Cloud Run environment and Secret Manager wiring
2. application owners own the semantic correctness of new config keys
3. security/compliance owns high-risk secret change review

## Build-Time vs Runtime Boundary

Build-time config:

1. frontend public env
2. anything compiled into static web/admin assets

Runtime config:

1. API secrets
2. API flags
3. API service URLs and CORS
4. Cloud SQL attachment and service account behavior

Rule:

1. if a change requires a frontend rebuild to take effect, it is build-time config
2. if a change requires a new API revision or runtime restart to take effect, it is runtime config

## Env Propagation Flow

1. config is defined in repo examples and deployment docs
2. secrets are stored in Secret Manager
3. Cloud Build deploy config references the required secrets and runtime vars
4. Cloud Run revisions become the live source of truth for deployed runtime state
5. `/status` is used as an operator-facing summary, not a full source of truth dump

## Rollback Expectations for Config Changes

1. secret changes roll back by restoring the previous secret version/value and redeploying if needed
2. runtime flag changes roll back by redeploying the previous known-good runtime contract
3. frontend build-time config changes roll back by promoting the last known healthy frontend revision

## Verification Checklist After Config Changes

1. `/health = 200`
2. `/status = 200`
3. auth path healthy
4. admin path healthy when relevant
5. uploads/moderation healthy when relevant
6. billing webhook guard healthy when relevant

## Anti-Drift Rules

1. never treat local `.env` as production truth
2. never treat historical STATUS notes as the active runtime source of truth
3. always verify current Cloud Run service config when production ambiguity exists
4. always document new config keys in env examples and deployment/governance docs
