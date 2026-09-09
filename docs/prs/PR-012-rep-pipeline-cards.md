# PR-012: Homepage rep pipeline cards

**Branch:** `feat/pr-012-rep-pipeline-cards`
**Depends on:** PR-010a field pipeline labels, **PR-011 job assignment** (hard dependency)
**Status:** Draft spec — blocked until PR-011 lands

## Goal

Replace the placeholder dashboard with the view the company is run from every morning: a company snapshot, then one box per rep across the pipeline.

```text
Brandon

Lead: 12
CI: 6
ADJ MT: 3
DR: 2
CTR: 4
MO: 2
WO: 1
$: $42,500
```

## Why this is blocked on PR-011

There is no rep on a job today. `job_participants` exists in the schema and **nothing writes it** — no command, no route, no UI. The only per-user column on `jobs` is `created_by`, which records whoever entered the lead. That is an audit field, not ownership: the moment an office admin enters a lead for a rep, or a manager fixes a bad record, the attribution is wrong and the dashboard misreports quietly.

PR-011 must land the `sales_owner` write path first. Building this on `created_by` would ship a dashboard that looks authoritative and is not.

## Scope

### Company snapshot

A single row above the rep cards:

```text
Total leads
Total CI
Total adjuster meetings
Total contracts
Total production jobs
Total money pending
```

Counts are org-scoped, live jobs only, grouped by the PR-010a stage mapping.

### Rep cards

One card per user holding a `sales_owner` participant row on at least one live job, plus stage counts:

| Rep | Lead | CI | ADJ | DR | CTR | MO | WO | $ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Brandon | 14 | 6 | 3 | 2 | 4 | 2 | 1 | $38k |
| Luis | 9 | 4 | 1 | 1 | 2 | 1 | 0 | $14k |
| Karson | 11 | 5 | 2 | 0 | 3 | 1 | 1 | $22k |

- Short stage labels (`CI`, `ADJ MT`, `$`), not the expanded ones — the grid is tight
- Zero renders as `0`, not blank — a rep with nothing in DR is a signal, not missing data
- Reps with no live jobs are listed with zeros rather than hidden, so a rep who has stopped producing is visible

### Drill-down

Every count links to the jobs list filtered by rep and stage:

```text
/jobs?owner=<userId>&stage=<stage>
```

Clicking Brandon's DR shows Brandon's jobs waiting on damage reports. The jobs list gains `owner` and `stage` query filters, both validated against a Zod schema and both org-scoped.

### The `$` column

`$` is a **count** in this PR, matching the other columns, with money deferred.

The dollar figures in the sketch above need per-job amounts — contract amount, ACV, deductible, balance — and none of those columns exist yet; they land in PR-018. Rendering a currency figure now would mean either inventing it or summing nothing, and the roadmap's no-fake-data rule forbids both. The header carries a "money lands with collections" note so the gap is visible rather than looking broken.

## Out of scope — must NOT touch

- Any write path — this is a read-only dashboard
- `job_participants` schema or the assignment command (PR-011 owns both)
- Days in stage, next action, stuck colouring (PR-013)
- Money amounts, balances, collections (PR-018)
- The pipeline board itself
- Claims, production, materials, documents
- Auth, invites, roles, permissions

## Settled decisions

- **`sales_owner` is the rep.** The card is a sales-pipeline view. `knocker`, `production_manager`, and `office_admin` participants do not create a card, and PR-011's new `closer` role does not either — a closer view is reporting work for PR-019.
- **One query, not one per rep.** A single grouped query over `jobs × job_participants` returns every rep-stage pair; the page pivots in memory. N+1 across a growing roster is how this page gets slow.
- **Counts, not money, for now.** See above.

## Acceptance test

1. Dashboard shows the company snapshot and one card per rep with a live `sales_owner` assignment
2. Rep stage counts sum to that rep's live job total; company snapshot counts match `/jobs/board` column totals
3. A job with no `sales_owner` assigned appears in the company snapshot but on no rep card, and the unassigned total is shown rather than silently dropped
4. Clicking a count opens the jobs list filtered to that rep and stage, and the row count matches the number clicked
5. Soft-deleted jobs and other orgs' jobs appear nowhere
6. A rep with zero live jobs renders a card of zeros

## Automated tests

- Rep grouping is org-scoped and soft-delete aware, reusing the PR-006 fixture patterns
- A job with two participant rows (`sales_owner` plus `knocker`) counts once, on the sales owner's card only
- A job whose `sales_owner` row has `removed_at` set does not count
- Unassigned live jobs land in the snapshot totals and in the unassigned bucket, never on a rep card
- Stage counts follow the PR-010a mapping — a fixture spanning all thirteen statuses lands in the right nine buckets
- Query-filter validation rejects an unknown stage or a malformed owner id

## Rollback

Revert the commit; the previous placeholder dashboard returns. No migration, no writes, no data to unwind.
