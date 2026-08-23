# PR-010: Roofing job fields

**Branch:** `feat/pr-010-roofing-job-fields`
**Depends on:** PR-008 job activity timeline (merged)
**Status:** Draft spec — not started

## Goal

Add the roofing-specific fields that belong on the job record, and surface the two that already exist but are invisible in the UI.

## Field reconciliation

The original PR-010 field list mixed three different homes. Only rows marked **this PR** are in scope:

| Requested field | Reality today | Home |
|-----------------|---------------|------|
| Roof type | Does not exist | **This PR** — new `jobs.roof_type` |
| Mortgage company involved | Does not exist | **This PR** — new `jobs.mortgage_company_involved` |
| Job source | Exists as `jobs.lead_source` (written by lead intake, never displayed) | **This PR** — surface in UI, no migration |
| Date of loss | Exists as `jobs.storm_date` (nullable, never displayed) | **This PR** — surface in UI, no migration |
| Claim number | Does not exist | PR-010b `claims.claim_number` |
| Insurance carrier | Does not exist | PR-010b `claims.carrier` |
| Deductible amount | Does not exist | PR-010b `claims.deductible_cents` |
| Sales rep | `job_participants.role = 'sales_owner'` (table exists, unused) | PR-011 |
| Closer | No matching enum value | PR-011 (needs `job_participant_role` enum addition) |

Insurance claim facts stay out of `jobs` because [BLUEPRINT.md](../BLUEPRINT.md) models `claims` as its own table with supplements (multiple claims per job, one primary). Putting `claim_number` on `jobs` now would create a second source of truth to unwind later, against the repo's one-mutation-path rule.

## Scope

- Migration `0005_roofing_job_fields.sql`: add two nullable columns to `jobs`
  - `roof_type` — nullable, backed by a new `roof_type` enum (`shingle`, `metal`, `tile`, `flat_tpo`, `flat_epdm`, `other`)
  - `mortgage_company_involved` — `boolean NOT NULL DEFAULT false`
- Drizzle schema update in `src/lib/db/schema/jobs.ts`, with `roofTypeEnum` added to `enums.ts`
- Extend `getJobDetail` to return the new columns plus existing `leadSource` and `stormDate`
- Job detail page: render the four fields in a "Job details" block
- `ROOF_TYPE_LABELS` for display, matching the `JOB_STATUS_LABELS` pattern — display only, never stored

## Out of scope — must NOT touch

- `claims` table, claim number, carrier, deductible (PR-010b)
- `job_participants`, sales rep, closer, assignment (PR-011)
- Any **write** path for the new fields — read/display only in this PR, edit lands with the job-edit PR
- `updateJobStatusCommand`, transition rules, status enum
- Pipeline board (PR-009), production, materials, documents, payments
- Auth, invites, MCP hub, integrations
- Backfilling or inferring values for existing rows

## Settled decisions

- **`roof_type` is enum-backed** — a new `roof_type` Postgres enum (`shingle`, `metal`, `tile`, `flat_tpo`, `flat_epdm`, `other`), not free text. Chosen so the PR-017 reporting cut can group by roof type without normalizing strings after the fact. Adding a value later is an enum migration; `other` absorbs the tail in the meantime.
- **Scope reduction approved** — only `roof_type` and `mortgage_company_involved` are new columns; `lead_source` and `storm_date` are surfaced, not duplicated.
- **Claims split to PR-010b approved** — claim number, carrier, and deductible land in the `claims` table.
- **Assignments via `job_participants` approved** — sales rep and closer are PR-011, not columns on `jobs`.

## Acceptance test

1. `npm run db:migrate` against a local database — migration applies with no error
2. Open an existing job at `/jobs/[id]` — job details block renders, new fields show an empty state rather than blank or `null`
3. Create a lead via intake — job detail shows the captured job source
4. Confirm no new write path exists: the fields are read-only in the UI, and no route accepts them
5. Existing rows are untouched — `mortgage_company_involved` reads `false`, `roof_type` reads null

## Automated tests

- Migration smoke: schema has both columns with expected nullability and default
- `getJobDetail` returns the new fields and stays org-scoped and soft-delete aware (extend the existing PR-006 coverage rather than adding a parallel suite)
- Render test: job detail shows empty states for null roof type and null storm date

## Rollback

Revert the app commit; the migration is additive and safe to leave in place. To fully unwind, drop the two columns, then the `roof_type` enum type. No data loss — nothing writes these fields in this PR.
