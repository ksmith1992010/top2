# RoofRun Roadmap

Product-level plan, PR-sized. This is the working roadmap; [BLUEPRINT.md](./BLUEPRINT.md) remains the architecture and data-model reference. Where the two disagree on **sequencing**, this file wins. Where they disagree on **data model**, the blueprint wins until an ADR says otherwise.

The standing rule: small clean PRs, no AI bulk, no hidden writes, no fake data, no broad refactors.

## Current state

| Area | Status |
|------|--------|
| Auth / login | Built |
| Invite-only access | Built |
| Request-access page | Built |
| App shell / navigation | Built |
| Leads | Built |
| Customers | Built |
| Properties | Built |
| Jobs list / detail | Built |
| Job read security | Hardened (PR-006) |
| Job status transitions | Built (PR-007) |
| Activity event logging | Built |
| Job activity timeline | **Merged** on `main` (PR-008, commit `1050ef4`) |

Everything through PR-008 is on `main`. Production, calendar, documents, reports, materials, and payments are still placeholders.

## PR numbering

Shipped PR numbers drifted from the blueprint's original Phase 1 table. The shipped numbers are authoritative:

| Shipped | Landed as | Blueprint's original number |
|---------|-----------|------------------------------|
| PR-001–003 | Scaffold, auth, app shell | PRs 1–3 (match) |
| — | Invite-only registration, request-access, lead intake (GitHub #8–#10) | part of PR 4 |
| PR-005 | Jobs list + detail foundation | PR 5 |
| PR-006 | Jobs read-layer hardening + pagination | *(not in blueprint)* |
| PR-007 | Job status transition foundation | PR 6 |
| PR-008 | Job activity timeline foundation | PR 7 |

The blueprint's "PR 8 — KU/CI job events + reports stub" was never scheduled as its own PR. KU/CI events fold into the activity timeline already shipped; reporting moves to PR-017 below.

From PR-009 onward, the numbers in this file are the only ones that matter.

## Roadmap

### PR-009 — Pipeline board foundation

**Purpose:** show all jobs grouped by status.

Read-only first. Columns follow the existing `job_status` enum, rendered with the `JOB_STATUS_LABELS` field-friendly names already in `src/lib/db/schema/enums.ts`:

```text
Lead
Inspection Scheduled
Inspection Complete
Claim Filed
Adjuster Meeting
Approved
Contract Signed
Material Ordered
Production Scheduled
Installed
Invoiced
Paid
Closed
```

Scope:

```text
Board grouped by job status
Counts per column
Click into job detail
No drag/drop yet unless very small
No new status write path — reuse PATCH /api/jobs/[id]/status if any write lands
```

Status: draft PR open (GitHub #17, `feat/pr-009-pipeline-board`).

### PR-010 — Roofing job fields

**Purpose:** add real insurance/restoration fields to the job record.

Spec: [prs/PR-010-roofing-job-fields.md](./prs/PR-010-roofing-job-fields.md).

Scoped down from the original field list — two of the requested fields already exist on `jobs` under different names, and the insurance-claim fields belong in the blueprint's `claims` table rather than denormalized onto `jobs`:

| Requested field | Where it lands |
|-----------------|----------------|
| Roof type | New `jobs` column (PR-010) |
| Mortgage company involved | New `jobs` column (PR-010) |
| Job source | Already exists — `jobs.lead_source`, surface in UI (PR-010) |
| Date of loss | Already exists — `jobs.storm_date`, surface in UI (PR-010) |
| Claim number, insurance carrier, deductible amount | `claims` table (PR-010b) |
| Sales rep, closer | `job_participants` table (PR-011) |

### PR-010b — Claims foundation

**Purpose:** hold insurance claim facts where supplements can live later.

Creates the blueprint's `claims` table (`claim_number`, `carrier`, `policy_number`, `date_of_loss`, `deductible_cents`, adjuster contact, claim status) with one primary claim per job. Split out of PR-010 because it is a new table with its own migration and write path, not a column addition.

### PR-011 — Job assignment foundation

**Purpose:** assign ownership.

```text
Who owns this job?
Who is the sales rep?
Who is the closer?
Who handles production?
```

Reuses the existing, currently-unwritten `job_participants` table rather than adding people columns to `jobs`. Note: the `job_participant_role` enum today is `sales_owner | knocker | production_manager | office_admin` — "closer" needs to be added, which is a migration.

Feeds accountability and rep-performance reporting in PR-017.

### PR-012 — Transition rules / reason notes

**Purpose:** prevent sloppy status movement.

Free jumps are allowed today. This adds the expected forward path:

```text
Lead → Inspection Scheduled
Inspection Complete → Claim Filed
Approved → Contract Signed
Installed → Invoiced
Invoiced → Paid
```

Possible add-on:

```text
If skipping stages, require a reason.
```

Reason notes write to the activity timeline. Enforcement belongs in the existing `updateJobStatusCommand`, not in the route or the UI.

### PR-013 — Production foundation

**Purpose:** turn approved jobs into install work.

```text
Work order
Install date
Crew/sub
Production manager
Material status
Dumpster status
Permit notes
Production notes
```

No ABC/AccuLynx automation. Manual first.

### PR-014 — Materials foundation

**Purpose:** track what needs ordered and delivered.

```text
Supplier
PO number
Shingle color
Delivery date
Order status
Missing items
```

Still manual. Integrations come later.

### PR-015 — Documents / photos foundation

**Purpose:** attach important job files.

```text
Roof photos
Insurance scope
Contract
Estimate
Supplement
Invoice
Completion photos
```

Matters a lot for insurance claims. Needs a storage decision (ADR) before it starts.

### PR-016 — Payments / collections foundation

**Purpose:** track money.

```text
Deductible due
ACV received
Depreciation invoice sent
Final payment collected
Balance remaining
```

Becomes the collections dashboard.

### PR-017 — Reporting dashboard

**Purpose:** owner/operator view.

```text
Leads created
Inspections scheduled
Claims filed
Jobs approved
Jobs installed
Revenue pending
Money outstanding
Jobs stuck by stage
Rep performance
```

Depends on PR-011 for rep attribution and PR-016 for money figures.

### Later — Integrations and automation

Only after the manual workflow is solid.

```text
ABC Supply
AccuLynx
GroupMe
Email/SMS
Calendar
File storage
AI follow-up summaries
```

The open MCP hub draft (GitHub #11) sits in this bucket — it is off the critical path and should not merge ahead of the manual screens.

## Recommended next five

| Order | PR | What it does |
|-------|----|--------------|
| 1 | PR-009 | Pipeline board foundation |
| 2 | PR-010 | Roofing job fields |
| 3 | PR-010b | Claims foundation |
| 4 | PR-011 | Job assignment foundation |
| 5 | PR-012 | Transition rules / reason notes |

PR-008 has already merged, so it drops off the list and PR-010b takes the open slot.

## Decisions currently locked

| Decision | Current default |
|----------|-----------------|
| Stage labels | Keep DB enums, use field-friendly labels (`JOB_STATUS_LABELS`) |
| Status jumps | Free for now — rules land in PR-012 |
| Transition permission | Keep broad `jobs:transition` |
| Integrations | Manual screens first |
| Pipeline board | Next major UI step |
| Insurance claim data | Own table (`claims`), not columns on `jobs` |
| Job assignment | `job_participants` rows, not columns on `jobs` |
| Roof type | Enum-backed (`shingle`, `metal`, `tile`, `flat_tpo`, `flat_epdm`, `other`), not free text |
