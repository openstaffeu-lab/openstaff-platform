# Password Recovery Security

Last updated: `2026-05-20`  
Scope: `EXEC-42`

## Purpose

Define the safe password-recovery baseline for the public login flow.

## Current Baseline

The public auth flow now supports:

1. forgot-password entry from `/login`
2. password reset request page
3. password reset confirmation page
4. secure reset token generation
5. token expiry
6. token invalidation after successful use
7. reset request rate limiting
8. reset confirmation rate limiting
9. audit and security events
10. session revocation after password change

## Security Rules

1. account existence must not be leaked by the reset-request response
2. only hashed reset-token identifiers may be stored
3. expired tokens must be rejected
4. already-used tokens must be rejected
5. successful password reset must invalidate old refresh sessions
6. old password must no longer work after a successful reset

## Storage Baseline

The first EXEC-42 implementation stores reset-request state through the existing event and audit pathway rather than introducing a new dedicated password-reset table.

This keeps:

1. hashed token identifiers
2. expiry
3. used state
4. reset URL context
5. security-event traceability

## UX Rules

1. request success copy stays neutral and does not confirm account existence
2. expired or invalid token errors stay explicit
3. reused token errors stay explicit
4. success copy explains that existing sessions are revoked

## Honest Remaining Limitation

`emailDelivery = not_configured` still means the reset mechanism is implemented safely in application logic, but production-grade provider-backed delivery of the reset link remains a separate operational closure item.
