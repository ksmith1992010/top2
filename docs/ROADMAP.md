# RoofRun Roadmap

Product-level plan, PR-sized. This is the working roadmap; [BLUEPRINT.md](./BLUEPRINT.md) remains the architecture and data-model reference. Where the two disagree on **sequencing**, this file wins. Where they disagree on **data model**, the blueprint wins until an ADR says otherwise.

## North star

```text
Systems simplicity followed by automation.
```

Make the workflow dead simple for a rep to follow by hand. Only then automate the parts that are repetitive, delayed, or easy to forget.

For a new rep the system should not feel like software. It should feel like:

```text
Put the lead in.
Move the job to the next box.
Upload what you have.
Do the next action.
```

The CRM does the thinking — this is stuck, this needs a call, this needs scope, this needs a contract, this needs materials, this needs a work order, this needs money collected.

The standing rule stays: small clean PRs, no AI bulk, no hidden writes, no fake data, no broad refactors.

## The pipeline

The company's real workflow is the pipeline:

```text
Lead → CI → ADJ MT → DR → CTR → MO → WO → $ → Closed
```

| Stage | Meaning | Rep should understand it as |
|---|---|---|
| Lead | Knocked / homeowner interested | "I found an opportunity" |
| CI | Called-in inspection / claim initiated | "Inspection happened and claim is started" |
| ADJ MT | Adjuster meeting | "Insurance adjuster appointment is scheduled or completed" |
| DR | Damage report / scope received | "Insurance paperwork came in" |
| CTR | Contract signed | "Homeowner signed with us" |
| MO | Material order | "Materials have been ordered" |
| WO | Work order | "Production is scheduled" |
| $ | Invoiced / money collection | "We're collecting ACV, depreciation, deductible, balance" |
| Closed | Done | "Job is complete and paid/closed" |

Reps do not think in the long internal software statuses. They think in field language. **The database keeps clean canonical values; the UI shows the field labels.** That split is the whole of PR-010a.

### Stage → internal status mapping

Nine field stages over the existing thirteen `job_status` enum values. No migration — this is a display mapping.

| Field stage | Internal `job_status` |
|---|---|
| Lead | `lead` |
| CI | `inspection_scheduled`, `inspection_complete` |
| ADJ MT | `claim_filed`, `adjuster_meeting_scheduled` |
| DR | `approved` |
| CTR | `contract_signed` |
| MO | `material_ordered` |
| WO | `production_scheduled`, `installed` |
| $ | `invoiced`, `paid` |
| Closed | `closed` |

Two open questions on this mapping are recorded under [Open decisions](#open-decisions) — `paid` sitting in `$`, and `installed` sitting in `WO`.

Because the mapping is many-to-one, every stage also needs a designated **entry status** for the day writes land (moving a card to CI must resolve to exactly one status — `inspection_scheduled`). Entry statuses are defined in the PR-010a spec.

### What each card must answer

```text
Where is it?
Who owns it?
What is the next step?
How long has it been stuck?
What money is tied to it?
```

Examples:

```text
Smith — ADJ MT
Next: Attend adjuster meeting
Date: Friday 10:00 AM
Owner: Brandon
Stuck: 1 day
```

```text
Johnson — DR
Next: Get scope from homeowner
Stuck: 7 days
```

```text
Miller — $
Next: Collect depreciation + deductible
Balance: $8,400
Stuck: 12 days
```

### Stuck thresholds

Color and alert **only** when stuck. A calm board means nothing needs attention.

| Stage | Stuck warning |
|---|---|
| Lead | No action in 2 days |
| CI | No adjuster date after 2 days |
| ADJ MT | Meeting date passed, no result |
| DR | Approved but no scope after 12 days |
| CTR | Scope received but no contract after 2 days |
| MO | Contract signed but no material order after 1 day |
| WO | Materials ordered but no install date |
| $ | Installed but unpaid |

**Days in stage needs no new column.** `updateJobStatusCommand` already writes a `job.status_changed` activity event with `{from, to}` and `occurred_at` in the same transaction. The newest such event per job is the stage-entry timestamp; jobs with no transition yet fall back to `created_at`. Do not add an `entered_stage_at` column — that would be a second source of truth against the one-mutation-path rule.

## Homepage

### Company snapshot

```text
Total leads
Total CI
Total adjuster meetings
Total contracts
Total production jobs
Total money pending
```

### Rep pipeline boxes

One card per rep, across the pipeline:

| Rep | Lead | CI | ADJ | DR | CTR | MO | WO | $ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Brandon | 14 | 6 | 3 | 2 | 4 | 2 | 1 | $38k |
| Luis | 9 | 4 | 1 | 1 | 2 | 1 | 0 | $14k |
| Karson | 11 | 5 | 2 | 0 | 3 | 1 | 1 | $22k |

Every number is a link — clicking Brandon's DR shows Brandon's jobs waiting on damage reports.

This is the owner dashboard. It answers, at a glance:

```text
Who is creating leads?
Who is getting claims moving?
Who is stuck waiting on adjusters?
Who has scopes but no contracts?
Who has contracts but no material orders?
Who has installed jobs but no money collected?
```

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
| Job activity timeline | Built (PR-008) |
| Pipeline board (`/jobs/board`) | **Merged** on `main` (PR-009, GitHub #17, commit `9d1bcc9`) |
| Field-language stage labels | Not started (PR-010a) |
| Rep ownership / assignment | Not started (PR-011) — `job_participants` table exists, nothing writes it |
| Homepage rep cards | Not started (PR-012) — dashboard is placeholder cards |

Everything through PR-009 is on `main`. Production, calendar, documents, reports, materials, and payments are still placeholder routes.

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
| PR-009 | Pipeline board foundation | *(not in blueprint)* |

The blueprint's "PR 8 — KU/CI job events + reports stub" was never scheduled as its own PR. KU/CI events fold into the activity timeline already shipped; reporting moves to PR-019 below.

From PR-010 onward, the numbers in this file are the only ones that matter. Nothing past PR-009 has shipped, so the renumbering below costs nothing.

## Build order

| Order | PR | Purpose |
|---|---|---|
| 1 | PR-010 | Roofing job fields |
| 2 | PR-010a | Field-friendly pipeline labels |
| 3 | PR-011 | Job assignment foundation |
| 4 | PR-012 | Homepage rep pipeline cards |
| 5 | PR-013 | Days in stage, next action, stuck alerts |
| 6 | PR-010b | Claims foundation |
| 7 | PR-014 | Transition rules / reason notes |
| 8 | PR-015 | Production foundation |
| 9 | PR-016 | Materials foundation |
| 10 | PR-017 | Documents / photos foundation |
| 11 | PR-018 | Payments / collections |
| 12 | PR-019 | Reporting dashboard |

Rep cards sit at slot 4 rather than slot 3 because they cannot be built before assignment — see [Open decisions](#open-decisions).

---

### PR-010 — Roofing job fields

**Purpose:** add real insurance/restoration fields to the job record.

Spec: [prs/PR-010-roofing-job-fields.md](./prs/PR-010-roofing-job-fields.md).

| Requested field | Where it lands |
|-----------------|----------------|
| Roof type | New `jobs` column (PR-010) |
| Mortgage company involved | New `jobs` column (PR-010) |
| Job source | Already exists — `jobs.lead_source`, surface in UI (PR-010) |
| Date of loss | Already exists — `jobs.storm_date`, surface in UI (PR-010) |
| Claim number, insurance carrier, deductible amount | `claims` table (PR-010b) |
| Sales rep, closer | `job_participants` table (PR-011) |

### PR-010a — Field-friendly pipeline labels

**Purpose:** make the CRM speak the company's language without touching the database.

Spec: [prs/PR-010a-field-pipeline-labels.md](./prs/PR-010a-field-pipeline-labels.md).

Maps the thirteen internal statuses onto the nine field stages, defines each stage's entry status for future writes, and regroups the PR-009 board from thirteen columns to nine. Display layer only — no migration, no write path, no enum change.

### PR-011 — Job assignment foundation

**Purpose:** assign ownership. Nothing else on the roadmap works without it.

```text
Who owns this job?
Who is the sales rep?
Who is the closer?
Who handles production?
```

Reuses the existing, currently-unwritten `job_participants` table rather than adding people columns to `jobs`. The `job_participant_role` enum today is `sales_owner | knocker | production_manager | office_admin` — "closer" needs adding, which is a migration.

Needs a real write path: assignment must go through a single command that logs a `job.participant_assigned` activity event in the same transaction, matching `updateJobStatusCommand`.

### PR-012 — Homepage rep pipeline cards

**Purpose:** the morning owner dashboard — one box per rep across the pipeline.

Spec: [prs/PR-012-rep-pipeline-cards.md](./prs/PR-012-rep-pipeline-cards.md).

Replaces the four placeholder dashboard cards with the company snapshot plus per-rep stage counts. Every count links into a filtered job list. Read-only.

### PR-013 — Days in stage, next action, stuck alerts

**Purpose:** make each card answer "what now, and how late am I?"

Derives days-in-stage from the newest `job.status_changed` activity event, renders one next action per stage, and applies the stuck thresholds above. Alerts are computed at read time — no scheduled jobs, no notification sending. That is automation, and it comes later.

### PR-010b — Claims foundation

**Purpose:** hold insurance claim facts where supplements can live later.

Creates the blueprint's `claims` table (`claim_number`, `carrier`, `policy_number`, `date_of_loss`, `deductible_cents`, adjuster contact, claim status) with one primary claim per job. Split out of PR-010 because it is a new table with its own migration and write path, not a column addition.

Also home to the ADJ MT stage fields: adjuster date, adjuster time, adjuster name/phone.

### PR-014 — Transition rules / reason notes

**Purpose:** prevent sloppy status movement.

Free jumps are allowed today. This adds the expected forward path:

```text
Lead → CI
CI → ADJ MT
ADJ MT → DR
DR → CTR
CTR → MO
MO → WO
WO → $
$ → Closed
```

If skipping stages, require a reason. Reason notes write to the activity timeline. Enforcement belongs in the existing `updateJobStatusCommand`, not in the route or the UI.

### PR-015 — Production foundation

**Purpose:** turn approved jobs into install work. The WO stage.

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

### PR-016 — Materials foundation

**Purpose:** track what needs ordered and delivered. The MO stage.

```text
Supplier
PO number
Shingle color
Delivery date
Order status
Missing items
```

Still manual. Integrations come later.

### PR-017 — Documents / photos foundation

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

Matters a lot for insurance claims, and the DR stage depends on it — "scope received?" and "PDF/photo uploaded" are the DR stage's core fields, and DR is the roadmap's biggest stuck point. Needs a storage decision (ADR) before it starts.

### PR-018 — Payments / collections

**Purpose:** track money. The `$` stage.

```text
Deductible due
ACV received
Depreciation requested
Depreciation collected
Deductible collected
Final payment collected
Balance remaining
```

Becomes the collections dashboard, and supplies the `$` figure on the rep cards, which reads as a placeholder until this lands.

### PR-019 — Reporting dashboard

**Purpose:** owner/operator view beyond the homepage cards.

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

Depends on PR-011 for rep attribution and PR-018 for money figures.

### Later — Integrations and automation

Only after the manual workflow is proven. The trigger points, in stage order:

| Transition | Automation |
|---|---|
| Lead → CI | If a lead sits too long, remind the rep. If an inspection completes with damage, prompt the claim call-in. |
| CI → ADJ MT | If no adjuster date after 2 days, remind the rep to follow up with the homeowner. |
| ADJ MT → DR | After the adjuster meeting, start a 2–12 day scope watch. If no DR after 7 days, remind the rep. |
| DR → CTR | When the scope is uploaded, prompt contract creation. If no contract after 2 days, alert the manager. |
| CTR → MO | When the contract is signed, prompt the material order. |
| MO → WO | When materials are ordered or delivered, prompt the work order and install date. |
| WO → $ | When the work order is signed or the install completes, prompt the depreciation request and open the collection checklist. |

Then the integrations:

```text
ABC Supply
AccuLynx
GroupMe
Email/SMS
Calendar
File storage
```

The assistant layer — remind, summarize, nudge, draft texts, flag stuck jobs, build morning reports — comes after that. Not before.

The open MCP hub draft (GitHub #11) sits in this bucket — it is off the critical path and should not merge ahead of the manual screens.

## Decisions currently locked

| Decision | Current default |
|----------|-----------------|
| Rep-facing stage names | The nine field stages: Lead, CI, ADJ MT, DR, CTR, MO, WO, `$`, Closed |
| Internal statuses | Keep the thirteen `job_status` enum values unchanged — labels are a display mapping |
| Days in stage | Derived from `job.status_changed` activity events, not a new column |
| Stuck signalling | Color/alert only when stuck; a calm board means nothing needs attention |
| Status jumps | Free for now — rules land in PR-014 |
| Transition permission | Keep broad `jobs:transition` |
| Integrations | Manual screens first |
| Insurance claim data | Own table (`claims`), not columns on `jobs` |
| Job assignment | `job_participants` rows, not columns on `jobs` |
| Roof type | Enum-backed (`shingle`, `metal`, `tile`, `flat_tpo`, `flat_epdm`, `other`), not free text |

## Open decisions

Three items need a call. Each has a working default so nothing is blocked.

**1. Rep cards cannot precede assignment.** The revised order put homepage rep cards before job assignment, but there is no rep on a job today — `job_participants` exists and nothing writes it. The only per-user field on `jobs` is `created_by`, an audit field recording whoever entered the lead, which is wrong the moment office staff enter a lead on a rep's behalf. Building rep cards on `created_by` would ship a dashboard that quietly misattributes jobs.
*Default taken:* assignment (PR-011) moves ahead of rep cards (PR-012). Rep cards ship one PR later with real data.
*Alternative if the morning dashboard is urgent:* ship rep cards on `created_by` as an explicit stopgap, labelled "entered by" rather than "rep", and re-point at `job_participants` in PR-011. Not recommended.

**2. `paid` inside the `$` stage.** The mapping puts `invoiced` and `paid` both in `$`. That column then mixes "owes us money" with "fully collected", which works against its own stuck rule — installed but unpaid. A fully-paid job would sit in the collections column looking like work.
*Default taken:* mapping ships as specified, `$` renders paid jobs in a settled state so the column still reads correctly at a glance.
*Alternative:* map `paid` to Closed and let `$` mean strictly "money outstanding".

**3. `installed` inside the WO stage.** Same shape. `installed` is the trigger for collections, but it maps to WO, so the "installed but unpaid" alert fires on WO cards rather than `$` cards.
*Default taken:* the alert lives on WO cards where `status = 'installed'`.
*Alternative:* map `installed` to `$` so completed roofs move into the money column on install.

**Restored to the roadmap:** documents / photos (PR-017) dropped out of the revised build order, but the DR stage's core fields are "scope received?" and "PDF uploaded", and DR is called out as the biggest stuck point. It is kept, sequenced after production and materials.
