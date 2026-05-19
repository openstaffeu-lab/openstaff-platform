# UX Trust Review

Last updated: `2026-05-19`  
Scope: `EXEC-28`

## Purpose

This review checks whether public-facing copy matches the real operational contract.

Trust rules:

1. no fake automation
2. no instant-activation promises
3. no unsupported commercial language
4. no misleading moderation wording

## Verdict

`PASS with targeted copy hardening applied in EXEC-28`

## Review Summary

| Surface | Status | Notes |
|---|---|---|
| pricing | ✅ strong | explicitly says manual request, no automatic checkout, no instant activation |
| onboarding | ✅ improved | internal rollout jargon removed from first-user screens |
| moderation messaging | ✅ improved | publish flow now uses plain operator-review language |
| approval/rejection messaging | ✅ acceptable for controlled rollout | runtime states are truthful, but richer rejection guidance is still future work |
| legal/privacy tone | ✅ acceptable | public/legal pages do not currently promise unsupported automation |
| operational disclaimers | ✅ strong | current rollout limitations remain visible in docs and pricing |

## Reviewed Surfaces

### Pricing

Observed strengths:

1. says “request upgrade” rather than promising checkout
2. says plan is not activated automatically
3. says billing remains operator-reviewed until approval and invoice issuance

Assessment:

1. pricing is aligned with `billingPayments = manual_only`
2. this copy must remain the reference model for support responses

### Onboarding

Observed improvements:

1. removed internal milestone language from onboarding welcome
2. company and completion steps now speak in user-facing operational language
3. copy still keeps privacy and public-visibility boundaries visible

Assessment:

1. onboarding is now more trustworthy for first users
2. remaining improvement area is richer explanation of review timing

### Moderation and publishing

Observed improvements:

1. publish flow no longer exposes `PublicPost` implementation wording
2. “moderation placeholder task” wording was removed
3. upload messaging remains explicit that content stays hidden until approval

Assessment:

1. this is now operationally truthful
2. moderation remains manual and support-dependent, which is acceptable for current rollout

### Public detail browsing

Observed improvements:

1. public job/professional detail pages no longer present “legacy fallback” content to visitors
2. temporary-unavailable states are now explicit instead of pretending fallback content is acceptable live content

Assessment:

1. this is a material trust improvement
2. users should only see approved live content or an honest failure state

## Trust Risks Still To Watch

1. operators could still accidentally over-promise manual billing as if it were immediate automation
2. rejected-content explanations remain light in self-serve UX and may require support intervention
3. verification timing and approval expectations still depend on operator clarity rather than in-product SLA messaging

## Copy Governance Rules

The following language remains approved:

1. `request upgrade`
2. `manual review`
3. `operator review`
4. `pending approval`
5. `temporarily unavailable`

The following language remains disallowed unless the runtime contract changes:

1. `pay now`
2. `instant activation`
3. `automatic checkout`
4. `automated email` as a guaranteed live feature
5. `automated SMS` as a guaranteed live feature

## Final Assessment

The UX trust layer is now suitable for controlled first-user onboarding because the public language more closely matches real operational behavior and avoids implying automation that does not exist.
