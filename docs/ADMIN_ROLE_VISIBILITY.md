# Admin Role Visibility

Date: 2026-05-26

## EXEC-73 Visibility Model

Operational Admin:

- dashboard
- moderation
- media and documents
- companies and workforce
- contracts
- financial engine
- countries and VAT
- RELU moderation
- trust and security
- users

AI Moderator:

- RELU moderation
- taxonomy-facing review through approved operational flows
- confidence and correction workflows

DevOps / Technical SuperAdmin:

- AI agent settings
- prompts and policies
- AI queue diagnostics
- taxonomy imports
- delivery event diagnostics
- production readiness telemetry
- UI configuration
- implementation status

## Code Proof

- `apps/admin/components/AdminLayoutShell.tsx` filters Technical links to `SUPERADMIN`.
- `apps/admin/components/TechnicalModeGate.tsx` blocks direct technical-route visibility for non-superadmin users.
- Dashboard shortcuts no longer expose prompt/config/queue links to default admins.

## Verdict

`PASS`

Default admin users cannot see technical infrastructure in navigation or direct technical route content.
