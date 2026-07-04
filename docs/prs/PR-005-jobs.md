# PR-005: Jobs list + detail

**Branch:** `feat/pr-005-jobs`  
**Depends on:** PR-004  
**Blocks:** PR-006 (transitions), PR-007 (timeline)

## Goal

A working Jobs hub: searchable, status-filterable job list and a job detail page
with non-status field editing. Status stays read-only until PR-006.

## Scope

### Create / modify

```
src/
├── app/
│   ├── (app)/jobs/page.tsx          # list (search + status filter)
│   ├── (app)/jobs/[id]/page.tsx     # detail + edit details
│   └── api/jobs/                    # GET list; GET/PATCH by id
├── components/jobs/
│   ├── jobs-filter.tsx
│   ├── status-badge.tsx
│   └── job-details-form.tsx
├── domain/
│   ├── commands/update-job.ts       # notes/leadSource/stormDate/jobType only
│   ├── queries/list-jobs.ts
│   ├── queries/get-job-detail.ts
│   └── schemas/job.ts
tests/job-schemas.test.ts
```

### Permissions

| Route | Permission |
|-------|------------|
| GET /api/jobs, GET /api/jobs/:id, /jobs pages | `jobs:read` |
| PATCH /api/jobs/:id | `jobs:update` |

All queries and the update command are scoped by `organizationId`.

## Must NOT touch

- `jobs.status` — no transition logic (PR-006: `TransitionJobCommand`)
- Schema/migrations — read + update of existing columns only
- Participants, appointments, claims, financials

## Acceptance test

1. Log in, open `/jobs`: jobs created via lead intake are listed with status badges.
2. Search by job number, customer name, or address; filter by status.
3. Open a job: details, customer (links to lead), property shown.
4. Edit details: change notes/lead source/storm date/type — saves via
   `PATCH /api/jobs/:id`, writes a `job.updated` activity event.
5. Status cannot be changed anywhere in this PR.

## Rollback

Revert the merge commit. No schema changes; no data at risk.
