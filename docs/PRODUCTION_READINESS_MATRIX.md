# Production Readiness Matrix

Last updated: `2026-05-18`
Scope: `EXEC-23`

## Matrix

| Area | Status | Current baseline | Evidence / Notes |
|---|---|---|---|
| infrastructure | stable | Cloud Run healthy, Cloud SQL hardened, storage configured | active revisions healthy; Cloud SQL `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| auth / security | stable with follow-up | `firebase-admin`, audit/security flows operational | `/status` healthy; admin security routes available; critical events currently `0` |
| moderation | stable | first live moderated post/media/document flow proven | EXEC-22 public/admin flow passed |
| billing | stable for controlled rollout | manual commercial flow proven | upgrade request + admin approval + invoice visibility passed live |
| storage | stable | GCS upload/delivery proven | approved media delivery `200`, rejected document remained hidden |
| monitoring | partial | human/operator monitoring exists | no Monitoring dashboards, policies, or channels configured live |
| alerting | blocker | no incident fan-out baseline | `0` policies, `0` channels |
| backups | technically ready | backups + PITR enabled | Cloud SQL backup and PITR posture confirmed live |
| restore drill | partial | documented but not rehearsed | restore flow documented; no timed rehearsal executed |
| SEO / public UX | stable for rollout | public domains and pricing UX healthy | EXEC-20/22 proof remains aligned |
| operator tooling | stable for rollout | admin moderation, billing, security, readiness pages usable | validated live in EXEC-22 |
| support readiness | documented | SOPs and rollout ownership exist | EXEC-21 docs in place |
| rollout limitations | explicit | manual billing, no email automation, SMS not required | `/status.integrations` aligned |
| future automation gaps | open | alerting, dashboards, email delivery, payment automation | accepted for now, but not closed in EXEC-23 |
| capacity baseline | partial | scaling documented, not stress-tested | Cloud Run maxScale documented; no load rehearsal captured |
| IAM least privilege | open | runtime works, permissions still broad | compute SA still has `roles/editor` |
| cleanup posture | partial | no unsafe removals made | stale revisions retained; legacy `WEBHOOK_SECRET` still present |

## Stabilization Verdict

Operational production is usable and controlled-rollout ready, but not yet fully stabilized.

EXEC-23 can only move to `PASS` after these blockers are closed:

1. at least one notification channel exists
2. alert policies are created for the core failure domains
3. baseline Monitoring dashboards are created

## What Is Already Strong

1. public/auth/moderation/commercial flows are proven on real production objects
2. Cloud SQL hardening and storage posture are in place
3. rollout SOPs, monitoring checklist, and support model already exist
4. operator tooling is strong enough for controlled rollout execution

## What Still Needs Closure

1. alert fan-out and paging
2. GCP dashboarding
3. timed restore rehearsal
4. least-privilege IAM cleanup
5. legacy secret cleanup
