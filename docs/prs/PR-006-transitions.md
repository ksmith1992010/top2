# PR-006: Job status state machine + transitions

**Branch:** `feat/pr-006-transitions` (stacked on `feat/pr-005-jobs`)  
**Depends on:** PR-005  
**Blocks:** PR-007 (timeline read UI), PR-008 (KU/CI events)

## Goal

`jobs.status` becomes mutable through exactly one path: `POST /api/jobs/:id/transition`
→ `transitionJobCommand` → `checkTransition` (single state-machine module), per the
BLUEPRINT appendix.

## Rules implemented

| Move | Allowed | Reason | Permission |
|------|---------|--------|------------|
| Forward one stage | Yes | Optional | `jobs:transition` |
| Forward with skips (retail/cash path) | Yes | **Required**; `skippedStages` logged | `jobs:transition` |
| Backward (incl. reopening closed) | Yes | **Required** | `jobs:transition:admin` |
| Same status | No | — | — |

- `closedAt` set when entering `closed`, cleared when leaving.
- Every transition writes `job.status_changed` to `activity_events` in the same
  transaction with `{ from, to, reason, skippedStages }`.
- No auto-advance from events, ever.

## Scope

```
src/domain/job-transitions.ts            # the state machine (one file)
src/domain/commands/transition-job.ts    # the only status write path
src/domain/schemas/job.ts                # + transitionJobSchema
src/app/api/jobs/[id]/transition/route.ts
src/components/jobs/job-pipeline.tsx     # stepper + advance + move-with-reason
src/app/(app)/jobs/[id]/page.tsx         # pipeline replaces PR-006 placeholder
tests/job-transitions.test.ts
```

## Must NOT touch

- Schema/migrations, participants, KU/CI events, financials
- `updateJobCommand` (still never touches status)

## Acceptance test

1. On a job detail page, click "Advance to Inspection Scheduled" — status moves,
   badge updates, timeline row written.
2. Move `inspection_complete → contract_signed` without a reason → 400
   REASON_REQUIRED; with a reason → succeeds, `skippedStages` recorded.
3. As a non-admin (production role), backward moves are hidden/403.
4. As admin, move a job backward with a reason → succeeds; reopening a closed
   job clears `closedAt`.

## Rollback

Revert the merge commit. No schema changes; activity rows remain (append-only).
