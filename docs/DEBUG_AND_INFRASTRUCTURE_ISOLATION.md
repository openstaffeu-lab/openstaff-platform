# Debug And Infrastructure Isolation

Date: 2026-05-26

## Removed Or Isolated

Removed from normal visible workflows:

- `API connected for local testing` copy
- raw project JSON output
- raw RELU input/output JSON panes
- raw storage path display in media moderation
- raw taxonomy JSON editor as the main workflow
- dashboard shortcuts to prompt/config/queue tools
- automatic route/environment console reporter from app layout

Isolated to SuperAdmin technical mode:

- prompts and policies
- AI agent configuration
- AI queue diagnostics
- delivery events
- taxonomy imports
- production readiness telemetry
- UI configuration
- implementation status

## Remaining Technical Surfaces

Technical pages still exist for SuperAdmin recovery and platform governance, but they are not visible to normal operational admins and direct access renders an isolation state unless the user is SuperAdmin.

## Verdict

`PASS`

Operational admins no longer see debug/developer surfaces in the ordinary backoffice workspace.
