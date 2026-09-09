# PR-010a: Field-friendly pipeline labels

**Branch:** `feat/pr-010a-field-pipeline-labels`
**Depends on:** PR-009 pipeline board (merged)
**Status:** Built

## Goal

Make the CRM speak the company's field language without touching the database. Reps see nine stages; Postgres keeps its thirteen canonical `job_status` values.

```text
Lead → CI → ADJ MT → DR → CTR → MO → WO → $ → Closed
```

This is a display layer. **No migration, no enum change, no write path.**

## Mapping

| Field stage | Label shown | Internal `job_status` | Entry status |
|---|---|---|---|
| Lead | Lead | `lead` | `lead` |
| CI | CI — Claim/Inspection Started | `inspection_scheduled`, `inspection_complete` | `inspection_scheduled` |
| ADJ MT | ADJ MT — Adjuster Meeting | `claim_filed`, `adjuster_meeting_scheduled` | `claim_filed` |
| DR | DR — Damage Report | `approved` | `approved` |
| CTR | CTR — Contract Signed | `contract_signed` | `contract_signed` |
| MO | MO — Material Order | `material_ordered` | `material_ordered` |
| WO | WO — Work Order | `production_scheduled`, `installed` | `production_scheduled` |
| $ | $ — Money / Collections | `invoiced`, `paid` | `invoiced` |
| Closed | Closed | `closed` | `closed` |

Two-word labels are for column headers and detail views, where a new rep needs the expansion. The bare abbreviation (`CI`, `ADJ MT`, `$`) is used in tight spots — rep cards, card chips, filter pills.

### Entry statuses

The mapping is many-to-one, so it does not invert on its own. Each stage declares the single status a job lands on when it **enters** that stage. Nothing in this PR writes a status — the entry status exists so that PR-014's transition rules and any future drag/drop have one obvious target, rather than each caller inventing its own.

Within-stage progression stays a normal status change and does not move the card: a job at `claim_filed` advances to `adjuster_meeting_scheduled` when the adjuster date is known, and stays in the ADJ MT column throughout.

## Scope

- `src/lib/pipeline-stages.ts` — new module, the single source of truth:
  - `PIPELINE_STAGES` — the nine stages in pipeline order
  - `STAGE_LABELS` and `STAGE_SHORT_LABELS`
  - `STATUS_TO_STAGE` — `Record<JobStatus, PipelineStage>`, exhaustive over `JOB_STATUSES`
  - `STAGE_ENTRY_STATUS` — `Record<PipelineStage, JobStatus>`
  - `STAGE_STATUSES` — `Record<PipelineStage, JobStatus[]>`, derived from `STATUS_TO_STAGE`, not hand-written
- `listJobsBoard` groups by stage instead of status — nine columns, counts are per-stage totals
- Board column headers use `STAGE_LABELS`
- Jobs list gains a Stage column (short label) ahead of the existing Status column; job detail shows Stage alongside Status
- Board cards carry their canonical status label. Nine columns collapse thirteen statuses, so without it a rep could not tell `production_scheduled` from `installed` inside WO — the regrouping would lose information the thirteen-column board showed
- `JOB_STATUS_LABELS` stays exactly as it is — it remains the canonical per-status name and is still what the status transition control shows

## Out of scope — must NOT touch

- The `job_status` enum, any migration, any new column
- `updateJobStatusCommand` and the transition route — no write path changes
- Transition rules and legal-move enforcement (PR-014)
- Days in stage, next action, stuck alerts (PR-013)
- Rep assignment and rep cards (PR-011, PR-012)
- Drag/drop
- Claims, production, materials, documents, payments

## Settled decisions

- **Display mapping, not a schema change.** Renaming the enum would rewrite shipped data, break `job.status_changed` payloads already in `activity_events`, and force a migration for every future label tweak. A mapping module costs nothing to change.
- **`JOB_STATUS_LABELS` survives.** Two label sets with different jobs: statuses name a precise database state (used by the transition control and the activity timeline), stages name a rep-facing bucket. Deleting the first would make the timeline read "moved to CI → CI".
- **`STAGE_STATUSES` is derived.** Hand-maintaining both directions is how the two drift apart.

## Resolved mapping questions

All three are settled and recorded in the roadmap's locked decisions.

- **`paid` stays in `$`.** The column is titled **Money / Collections** rather than "owed", so a fully-collected job reads correctly sitting there.
- **`installed` stays in `WO`.** The PR-013 stuck alert will read "installed but unpaid" on the WO card.
- **The adjuster-date stuck rule belongs to ADJ MT, not CI.** A job waiting on an adjuster date sits at `claim_filed`, which maps to ADJ MT. CI's own rule becomes "inspection complete but no claim filed after 2 days". Thresholds are implemented in PR-013, not here.

## Acceptance test

1. `/jobs/board` shows nine columns in pipeline order, not thirteen
2. A job at `inspection_complete` appears in the CI column; a job at `claim_filed` appears under ADJ MT
3. Column counts equal the sum of their member statuses, and the nine counts sum to the same total the thirteen-column board showed
4. Job detail still offers every one of the thirteen statuses in the transition control
5. The activity timeline still reads in per-status language

## Automated tests

- `STATUS_TO_STAGE` covers every value in `JOB_STATUSES` — a compile-time exhaustive check plus a runtime test, so adding an enum value fails loudly instead of silently dropping jobs off the board
- Every `STAGE_ENTRY_STATUS` value maps back to its own stage under `STATUS_TO_STAGE`
- `STAGE_STATUSES` partitions `JOB_STATUSES` — no status in two stages, none missing
- `listJobsBoard` groups a fixture spanning all thirteen statuses into the expected nine columns, keeping the PR-006 org-scoping and soft-delete coverage
- Extend `tests/list-jobs-board.test.ts` rather than adding a parallel suite

## Rollback

Revert the commit. No migration, no data written, nothing to unwind.
