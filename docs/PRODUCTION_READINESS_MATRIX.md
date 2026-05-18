# Production Readiness Matrix

Last updated: `2026-05-18`  
Scope: `EXEC-24`

## Matrix

| Area | Status | Current baseline | Evidence / Notes |
|---|---|---|---|
| infrastructure | stable | Cloud Run healthy, Cloud SQL hardened, storage configured | active revisions healthy; Cloud SQL `RUNNABLE`, backups/PITR on, `ENCRYPTED_ONLY` |
| auth / security | stable | `firebase-admin`, audit/security flows operational, IAM least-privilege improved | temp `SUPERADMIN` login `200`; compute SA no longer has `roles/editor` |
| moderation | stable | live admin moderation still works after IAM hardening | EXEC-24 smoke: post create `201`, approve media/document/post `200` |
| billing | stable for controlled rollout | manual commercial flow remains explicit; webhook path alive | signed webhook path returned controlled app response `400 BAD_REQUEST` from signature verification logic |
| storage | stable | GCS upload and public delivery remain healthy after IAM hardening | EXEC-24 smoke: media/document upload `201`, public delivery `200` |
| monitoring | stable | shared Monitoring dashboards now exist | dashboard ids `03d08d77-...`, `5520ed58-...` |
| alerting | stable | notification channel + live alert policies exist | email channel id `16914670128256150084`; `10` live policies |
| backups | stable | backups + PITR enabled and retained | Cloud SQL posture unchanged and healthy |
| restore drill | stable | rehearsal executed on isolated recovery instance | restore duration `4m 59.686s`, SQL validation passed, cleanup completed |
| SEO / public UX | stable for rollout | public domains and pricing UX remain aligned | EXEC-20/22 proof still valid; EXEC-24 smoke kept `/health` and `/status` healthy |
| operator tooling | stable | admin moderation, billing, security, readiness pages usable | EXEC-24 smoke: `/admin/public-posts = 200` with temp `SUPERADMIN` |
| support readiness | documented and usable | SOPs and rollout ownership exist | EXEC-21 docs remain active |
| rollout limitations | explicit | manual billing, no automated email, no SMS requirement | `/status.integrations` remains aligned |
| future automation gaps | partial | alerting is live, but some business automation remains intentionally manual | `billingPayments = manual_only`, `emailDelivery = not_configured` |
| capacity baseline | stable for current rollout | Cloud Run and Cloud SQL limits documented; dashboards now expose health trends | no load/stress test performed in EXEC-24 |
| IAM least privilege | closed for current blocker | runtime SA reduced to Cloud SQL + Secret Manager + bucket object access | `roles/editor` and `roles/iam.serviceAccountUser` removed from compute SA |
| cleanup posture | improved | legacy secret removed; temporary recovery resources deleted | `WEBHOOK_SECRET` deleted; temp job and recovery instance removed |

## Stabilization Verdict

`EXEC-24 PASS`

The production baseline is now operationally closed for observability and recovery maturity:

1. at least one notification channel exists and is attached to live policies
2. core alert policies exist for runtime, database, auth, billing, moderation, storage, and security proxy signals
3. shared Cloud Monitoring dashboards exist
4. restore rehearsal proof exists with measured timing and SQL validation
5. least-privilege cleanup removed the previously broad runtime roles

## Accepted Remaining Limitations

1. `billingPayments = manual_only`
2. `publicUpgradeFlow = request_upgrade`
3. `operatorReviewRequired = true`
4. `emailDelivery = not_configured`
5. `smsDelivery = not_required`
6. critical security alerting currently uses Cloud Logging-visible proxy signals until database-native security events are exported as metrics
