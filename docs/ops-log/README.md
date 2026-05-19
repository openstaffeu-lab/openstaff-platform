# OpenStaff Operational Audit Trail

This directory is the durable operator-side audit structure for production operations.

Every significant production action should leave a short markdown entry in the relevant subdirectory:

1. `deploys/`
2. `incidents/`
3. `migrations/`
4. `restores/`
5. `security-changes/`
6. `iam-changes/`
7. `rollbacks/`

Recommended filename pattern:

1. `YYYY-MM-DD-short-description.md`

Minimum fields for every entry:

1. date/time
2. owner
3. environment
4. change or incident summary
5. affected systems
6. actions taken
7. validation performed
8. follow-up items
