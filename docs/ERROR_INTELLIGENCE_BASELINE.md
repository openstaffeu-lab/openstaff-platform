# Error Intelligence Baseline

Last updated: `2026-05-19`  
Scope: `EXEC-29`

## Purpose

This baseline classifies the errors that matter most during controlled rollout so both users and operators get truthful expectations.

## Error Families

| Error family | Example | Retryable | Severity | User expectation | Operator action |
|---|---|---|---|---|---|
| auth failure | invalid credentials, expired/revoked session | sometimes | medium | explain that login failed without implying account deletion or suspension unless true | review auth bursts, throttling, or account state if repeated |
| rate limit / abuse control | `429` on repeated login or webhook abuse | yes after cooldown | medium | explain temporary protection and try-again later | watch for burst patterns or hostile traffic |
| moderation restriction | pending/rejected asset or post not public yet | no until status changes | low to medium | say content is waiting for review or was rejected; do not imply instant review | confirm queue state and next operator action |
| upload failure | media/document persistence failed | often | medium | tell the user the upload did not complete and can be retried | inspect storage/runtime health and error trend |
| webhook failure | invalid signature, missing invoice, failed processing | depends | high | no public promise; keep this operator-facing unless user impact is real | inspect billing webhook queue and reconcile safely |
| storage failure | missing approved asset or storage misconfiguration | depends | high | acknowledge the file is unavailable, not “hidden” or “still processing” unless true | inspect bucket/runtime/storage delivery |
| operator-facing workflow failure | approval/review action fails in admin | depends | medium to high | internal/admin-facing only | retry if safe, inspect audit/security/runtime data |

## Severity Rules

1. `low`: user can continue elsewhere and truth remains intact
2. `medium`: flow is blocked for one user or one item, but platform safety holds
3. `high`: billing, storage delivery, moderation control, or repeated auth failure suggests operational degradation
4. `critical`: evidence of broad outage, data integrity risk, or sustained operator inability to control rollout

## User Wording Expectations

1. never promise automation that does not exist
2. say “request received”, “waiting for moderation”, or “retry later” only when those states are real
3. distinguish retryable failures from operator-reviewed states
4. avoid exposing internal stack traces, secrets, or storage internals

## Operator Action Expectations

1. check `/status` rollout summaries first
2. inspect auth/security events for login bursts and rate limits
3. inspect moderation backlog before assuming a user issue is runtime-related
4. inspect webhook failure counts and billing admin views before manually reconciling
5. log feedback or escalation when the same confusion repeats

## Escalation Triggers

1. auth failures spike in a 15-minute window
2. upload failures recur across multiple users or surfaces
3. webhook failures appear in consecutive rollout reports
4. moderation backlog grows while operator action rate drops
5. repeated user confusion indicates wording or workflow drift rather than isolated support effort

## Verdict

OpenStaff now has an explicit error-intelligence baseline for controlled rollout. The next maturity step is routine reporting against these classes instead of relying only on ad hoc debugging.
