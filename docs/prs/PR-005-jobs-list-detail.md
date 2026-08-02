# PR-005: Jobs list and job detail foundation

**Branch:** `feat/pr-005-jobs-list-detail`  
**Depends on:** lead intake (customers / properties / jobs schema on `main`)  
**Status:** Read-only jobs UI

## Goal

Make `/jobs` and `/jobs/[id]` real using existing job rows from lead intake. No writes, transitions, or production workflows.

## Scope

- `listJobs` / `getJobDetail` domain queries (org-scoped, soft-delete aware)
- `/jobs` list with search + status filter
- `/jobs/[id]` detail with customer/property context
- Placeholder sections for pipeline, activity, documents, estimate, materials/production, payments
- Link from lead detail job number → job detail

## Out of scope

- Job create/edit, status transitions, participants mutations
- Claims/insurance carrier fields (not on current schema)
- Documents, photos, materials, production, payments
- Migrations, auth/invite changes, integrations

## Security

Every job read requires `organizationId` from `requirePagePermission("jobs:read")` and filters `jobs.organization_id`.
