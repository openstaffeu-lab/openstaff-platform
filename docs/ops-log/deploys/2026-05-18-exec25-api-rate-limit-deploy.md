# EXEC-25 API Deploy

- Date: 2026-05-18
- Owner: Technical Ops
- Environment: production
- Category: deploy
- Related execution / incident: EXEC-25

## Summary

Deployed the API rate-limit and abuse-protection changes that closed the EXEC-25 resilience hardening slice.

## Affected Systems

1. `openstaff-api`
2. Cloud Build / Artifact Registry deploy path

## Actions Taken

1. built and deployed API via Cloud Build `b7e78555-6a7d-4cca-8037-7999fdd7fe92`
2. promoted new revision `openstaff-api-00009-jmx`
3. validated `/health`, `/status`, auth, moderation, uploads, and webhook guard behavior

## Validation

1. `/health = 200`
2. `/status = 200`
3. `SUPERADMIN` path healthy
4. post create/upload/moderation/public delivery healthy

## Follow-Up

1. keep the dedicated build/deploy identity as the release baseline
