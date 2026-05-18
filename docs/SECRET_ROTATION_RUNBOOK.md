# OpenStaff Secret Rotation Runbook

Last updated: `2026-05-18`  
Scope: `EXEC-25`

## Purpose

This runbook defines the baseline rotation process for production secrets used by OpenStaff. It is designed for controlled rotations with explicit validation and rollback expectations.

## Rotation Principles

1. rotate one secret class at a time unless an incident requires broader action
2. validate `/health`, `/status`, auth, moderation, uploads, and billing ingress after every rotation
3. prefer staged cutovers where the external provider supports overlap
4. keep rollback simple: revert the secret version reference or restore the last known good value

## Secret Inventory

Current production secret contract:

1. `DATABASE_URL`
2. `JWT_SECRET`
3. `JWT_REFRESH_SECRET`
4. `STRIPE_WEBHOOK_SECRET`
5. `FIREBASE_SERVICE_ACCOUNT_KEY`
6. `GEMINI_API_KEY`

## General Rotation Workflow

1. confirm current production health and active revisions
2. create the new secret version in Secret Manager
3. update the dependent runtime or external provider configuration
4. redeploy only if required by the secret consumption path
5. run the post-rotation validation checklist
6. keep the previous version available until the new state is proven stable

## `DATABASE_URL` Rotation

Use when:

1. database password is rotated
2. database user changes
3. host/socket contract changes

Expected operational impact:

1. likely requires API redeploy or revision restart to pick up the new value
2. database authentication failures are the primary rollback signal
3. short disruption is possible during cutover if the old credential is revoked too early

Recommended flow:

1. create the new Cloud SQL credential
2. update `DATABASE_URL` in Secret Manager
3. deploy a new API revision
4. validate `/health`, `/status`, login, admin route access, uploads, moderation, and public asset delivery
5. revoke the old credential only after the new revision is proven healthy

Rollback:

1. restore the previous `DATABASE_URL` secret version reference or value
2. redeploy the API revision
3. confirm `db = healthy` on `/status`

## `STRIPE_WEBHOOK_SECRET` Rotation

Use when:

1. Stripe signing secret is rotated intentionally
2. Stripe credential compromise is suspected

Expected operational impact:

1. no downtime required if the external cutover is sequenced correctly
2. invalid signatures are the primary failure symptom

Recommended flow:

1. create the replacement secret in Stripe
2. update `STRIPE_WEBHOOK_SECRET` in Secret Manager
3. deploy a new API revision
4. send a controlled invalid request and confirm guarded `400 BAD_REQUEST`
5. confirm real Stripe events reconcile successfully when available

Rollback:

1. restore the previous webhook signing secret
2. redeploy the API revision
3. confirm the guarded path behavior returns to normal

## `FIREBASE_SERVICE_ACCOUNT_KEY` Rotation

Use when:

1. the Firebase admin key is rotated
2. service account compromise is suspected
3. org policy requires periodic rotation

Expected operational impact:

1. API auth validation can fail if the new key is malformed or mismatched
2. admin and protected flows may break immediately if the key is invalid

Recommended flow:

1. obtain the new Firebase admin credential JSON
2. update `FIREBASE_SERVICE_ACCOUNT_KEY` in Secret Manager
3. deploy a new API revision
4. validate login, `/auth/me`, admin access, and any Firebase-backed flows

Rollback:

1. restore the previous key in Secret Manager
2. redeploy the API revision
3. confirm protected auth flows recover

## `JWT_SECRET` and `JWT_REFRESH_SECRET` Rotation

Expected operational impact:

1. active sessions can be invalidated
2. rolling both secrets together is effectively a global session reset

Recommended flow:

1. announce a controlled auth maintenance window if user impact matters
2. rotate one or both secrets in Secret Manager
3. deploy a new API revision
4. validate fresh login, `/auth/me`, refresh, logout, and admin auth

Rollback:

1. restore the previous secret values
2. redeploy the API revision
3. confirm fresh auth and refresh recover

Operational note:

1. rotating JWT secrets should be treated as a deliberate session invalidation event unless backward compatibility is explicitly engineered

## `GEMINI_API_KEY` Rotation

Expected operational impact:

1. no impact on core auth, moderation, uploads, or billing
2. AI-assisted flows may degrade or fail if the new key is invalid

Recommended flow:

1. update `GEMINI_API_KEY` in Secret Manager
2. deploy the API revision only if required by runtime secret loading behavior
3. validate any AI control or Relu paths that depend on Gemini

Rollback:

1. restore the previous API key
2. redeploy if needed

## Post-Rotation Validation Checklist

Run after every production rotation:

1. `GET https://api.openstaff.eu/health = 200`
2. `GET https://api.openstaff.eu/status = 200`
3. login flow succeeds
4. `SUPERADMIN` authenticated route succeeds
5. company or worker auth flow succeeds
6. public post create succeeds
7. media/document upload succeeds
8. moderation approve succeeds
9. public approved asset delivery succeeds
10. guarded billing webhook path still returns controlled app behavior

## Rollback Expectations

Common rollback triggers:

1. `/status` shows `db = error`
2. login or refresh fails unexpectedly
3. admin routes fail with valid admin credentials
4. uploads or moderation regress
5. webhook signature checks fail after a valid provider change

Common rollback action:

1. restore the prior secret version
2. redeploy the affected revision
3. rerun the validation checklist

## Downtime Expectations

Baseline expectations by secret type:

1. `DATABASE_URL`: low to moderate risk of brief disruption if cutover is mishandled
2. `STRIPE_WEBHOOK_SECRET`: zero expected downtime if provider sequencing is correct
3. `FIREBASE_SERVICE_ACCOUNT_KEY`: low risk if the replacement key is correct; immediate auth impact if not
4. `JWT_SECRET` and `JWT_REFRESH_SECRET`: no infrastructure downtime, but user session impact is expected
5. `GEMINI_API_KEY`: no core platform downtime expected
