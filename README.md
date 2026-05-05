# OpenStaff Platform

This repository is the active OpenStaff workspace.

## Active app layout

- Root folder: `openstaff-platform`
- Backoffice frontend: `apps/admin`
- Backend API: `apps/admin/api`
- Public OpenStaff frontend: `apps/admin/web`

## Environment

- Platform: `OpenStaff`
- GCP project: `openstaff-platform`
- Primary region: `europe-west1`
- Public domain: `openstaff.eu`
- Backoffice domain: `backoffice.openstaff.eu`
- API domain target: `api.openstaff.eu`

## Build commands

Backoffice:

```bash
cd apps/admin
npm.cmd run build
```

Backend:

```bash
cd apps/admin/api
npm.cmd run build
```

Public web:

```bash
cd apps/admin/web
npm.cmd run build
```

## Notes

- `apps/admin` is the active OpenStaff backoffice / Super Admin Panel.
- `apps/admin/api` is the active backend API.
- `apps/admin/web` is the active public OpenStaff frontend.
- Docker, Cloud Build, Artifact Registry, and Cloud Run are already part of the deployment workflow.
- Production configuration still depends on GCP secrets, Firebase admin claims, and Cloud SQL finalization.
