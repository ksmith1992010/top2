# PR-007: Activity timeline read UI

**Branch:** `feat/pr-007-timeline` (stacked on `feat/pr-006-transitions`)  
**Depends on:** PR-006  
**Blocks:** PR-008 (KU/CI events)

## Goal

Show the activity trail that every command already writes. Read-only — no new
event types, no changes to how events are written.

## Scope

```
src/domain/queries/list-activity.ts        # job + customer timelines
src/domain/activity-format.ts              # event → human-readable title/detail
src/components/activity/activity-timeline.tsx
src/app/api/jobs/[id]/timeline/route.ts    # GET, jobs:read, org-scoped
src/app/(app)/jobs/[id]/page.tsx           # Activity section (replaces placeholder)
src/app/(app)/leads/[id]/page.tsx          # Activity section (replaces placeholder)
tests/activity-format.test.ts
```

Formatted events: `customer.created`, `customer.updated`, `job.updated`,
`job.status_changed` (with reason + skipped stages), `user.seeded`; unknown
types fall back to the raw event name.

## Must NOT touch

- How events are written (commands stay the only writers)
- Schema/migrations

## Acceptance test

1. Create a lead → its page and the job page show "Lead created — Job TOP-… opened".
2. Advance/skip a job status → timeline shows "Status: A → B" with reason and
   skipped stages.
3. Edit job details → "Job details updated — Changed: …" appears.
4. `GET /api/jobs/:id/timeline` returns events for own-org jobs, 404 otherwise.

## Rollback

Revert the merge commit. Read-only feature; no data at risk.
