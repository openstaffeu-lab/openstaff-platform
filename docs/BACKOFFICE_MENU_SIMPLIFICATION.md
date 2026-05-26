# Backoffice Menu Simplification

Date: 2026-05-26

## New Menu Structure

Operations:

- Dashboard
- Moderation
- Media & Documents
- Companies & Workforce
- Contracts
- Financial Engine
- Countries & VAT

Trust:

- RELU AI Moderation
- Trust & Security
- Users
- Roles, visible only to SuperAdmin

Technical, visible only to SuperAdmin:

- AI Agent Settings
- Prompts & Policies
- AI Queue
- Taxonomy Imports
- Delivery Events
- Production Readiness
- UI Configuration
- Implementation Status

## Removed From Normal Admin Navigation

- prompt and policy editing
- AI infrastructure configuration
- raw AI queue diagnostics
- raw taxonomy import tooling
- delivery event diagnostics
- implementation status tooling
- production readiness telemetry

## Verdict

`PASS`

Default admin users get a simplified operational sidebar; technical tooling is isolated to SuperAdmin mode.
