# UX Trust Review

Last updated: `2026-05-20`  
Scope: `EXEC-43`

## Purpose

This review checks whether public-facing and account-facing copy matches the real operational contract.

Trust rules:

1. no fake automation
2. no instant-activation promises
3. no hidden account-existence leakage
4. no misleading moderation wording
5. no internal execution framing on public surfaces

## Verdict

`PASS with additional onboarding, password-recovery, homepage, and admin RELU hardening applied through EXEC-43, while provider-backed reset delivery remains open`

## Review Summary

| Surface | Status | Notes |
|---|---|---|
| pricing | strong | still says request upgrade, not automatic checkout |
| onboarding | improved | lighter first step, fewer dense fields, no internal rollout language in the touched flow |
| password recovery | improved, but live provider closure pending | reset request messaging stays neutral and does not confirm account existence; EXEC-43 adds provider-capable transactional delivery wiring |
| moderation messaging | improved | pending versus approved visibility remains explicit |
| homepage feed trust | improved | approved-content framing now replaces artificial execution-style copy on the homepage |
| company lookup trust | improved | provider labels, trusted-source state, and lookup timestamps are now part of the onboarding company lookup contract |
| admin RELU trust | improved | RELU confidence, taxonomy comparison, and missing-information hints are now visible to operators instead of remaining hidden inference |
| legal and privacy tone | acceptable | public legal pages still avoid unsupported promises |

## Pricing

Observed strengths:

1. says `request upgrade` rather than promising checkout
2. says the plan is not activated automatically
3. says billing remains operator-reviewed until approval and invoice issuance

Assessment:

1. pricing remains aligned with `billingPayments = manual_only`
2. this copy must remain the reference model for support responses

## Onboarding

Observed improvements:

1. the initial register step now asks only for account type, email, and password
2. locale defaults are explained as inferred values, not hidden truth
3. company autofill remains editable and visibly advisory
4. RELU AI output is now visible as suggestions rather than invisible automation

Assessment:

1. onboarding is now more trustworthy because it asks for less before trust is earned
2. the next trust upgrade should explain review timing and public-visibility timing even more clearly

## Password Recovery

Observed improvements:

1. login now exposes a forgot-password path
2. reset-request success copy does not confirm whether an account exists
3. reset-confirmation copy explains that the previous password and active sessions are revoked

Assessment:

1. trust is stronger because account recovery now exists
2. full production trust closure still depends on provider-backed reset-link delivery and a live clicked-reset proof

## Homepage Visibility

Observed improvements:

1. homepage hero now frames the marketplace around approved companies, professionals, and projects
2. approved profile cards no longer rely on noisy synthetic trust language
3. empty states now explain moderation truthfully instead of implying a demo feed

Assessment:

1. this reduces the feeling of staged or artificial public content
2. the homepage is now closer to a truthful approved-content surface

## Admin RELU Visibility

Observed improvements:

1. admin onboarding now shows RELU confidence instead of hiding the result behind implicit automation
2. operators can compare AI taxonomy suggestions against current user selections
3. missing-information hints are now visible before moderation or profile follow-up

Assessment:

1. this is more trustworthy because AI remains visible and contestable
2. the remaining trust work is proving the surrounding admin pages without residual failed requests during browser validation

## Trust Risks Still To Watch

1. operators could still over-promise manual billing as if it were immediate automation
2. provider-backed password-reset delivery is still missing because `emailDelivery = not_configured`
3. company lookup still needs live provider proof before it should be described as external verification
4. partial browser proof still includes residual failed requests around Edge/mobile/admin flows, so trust closure should not be overstated yet

## Approved Language

1. `request upgrade`
2. `manual review`
3. `operator review`
4. `pending approval`
5. `temporarily unavailable`
6. `suggested by RELU AI`

## Disallowed Language

1. `pay now`
2. `instant activation`
3. `automatic checkout`
4. `automated email` as a guaranteed live feature
5. `automated SMS` as a guaranteed live feature
6. internal execution labels or test framing on public surfaces

## Final Assessment

The UX trust layer is now stronger for controlled onboarding because the register, recovery, homepage, and admin RELU surfaces are closer to the real contract. The main remaining trust gaps are provider-backed delivery for password reset, live Romanian provider proof, and clearing the residual browser-validation request failures.
