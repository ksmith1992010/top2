# T.O.P. CRM v2 — Engineering Blueprint

**Version:** 0.2 (foundation design + product decisions)  
**Repo:** [ksmith1992010/top2](https://github.com/ksmith1992010/top2)  
**Scope:** Design only. No integrations. No v1 code reuse.

---

## Executive summary

T.O.P. CRM v2 is a **job-centric** roofing and storm-restoration CRM. The rebuild replaces an overpatched v1 with a small, explicit architecture: PostgreSQL as the single source of truth, a thin Next.js API layer with **one mutation path per business action**, and an append-only **activity timeline** for every important event.

**Job** is the hub. Customers own properties; properties have jobs; jobs move through a 13-stage lifecycle. KU (qualified inspection/opportunity) and CI (claim initiated) are **reportable business events**, not status hacks.

Foundation first: auth, roles, core schema, job CRUD, status transitions, activity logging, and a mobile-first shell. Integrations (Twilio, Gmail, DocuSign, QuickBooks, etc.) come later as adapters that write through the same mutation paths.

---

## 1. Stack recommendation

### Recommended stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | **TypeScript** (strict) | End-to-end types; fewer runtime surprises |
| App framework | **Next.js 15** (App Router) | One repo, mobile-first UI, API routes, easy deploy |
| Database | **PostgreSQL 16** | Relational integrity, reporting, audit trails |
| DB hosting | **Neon** or **Railway** | Managed Postgres, branching for preview envs |
| ORM | **Drizzle** | SQL-first, lightweight, excellent migrations |
| Validation | **Zod** | Shared schemas for API input and forms |
| Auth | **Better Auth** (email/password + sessions) | Self-hosted, no vendor lock-in; OAuth later |
| Styling | **Tailwind CSS** | Fast mobile UI, consistent spacing |
| UI components | **shadcn/ui** | Accessible primitives, owned source |
| Forms | **React Hook Form** + Zod | Standard pattern, minimal boilerplate |
| Unit/integration tests | **Vitest** | Fast, native ESM |
| E2E tests | **Playwright** | Mobile viewport testing |
| Deploy | **Vercel** (app) + **Neon** (db) | Simple CI/CD, preview deployments |

### What we deliberately avoid in v2 foundation

- Microservices, event buses, GraphQL
- JSONB blobs as primary storage for core entities
- Multiple ORMs or query layers
- Serverless functions outside Next.js (until needed)
- Third-party CRM SDKs in core domain logic
- Real-time websockets (polling/SWR is enough for v1)
- PWA / offline mode (mobile-first responsive web only for foundation)
- v1 data migration (clean foundation first; migration doc later)

### Product decisions (locked)

| Topic | Decision |
|-------|----------|
| **Job numbers** | Human-readable `TOP-YYYY-####` (e.g. `TOP-2026-0042`). UUID is the internal PK. Users search/display by job number. |
| **Status skipping** | Allowed only via `POST /jobs/:id/transition`. Skipped stages require a `reason`; logged on `activity_events` with `{ from, to, skippedStages, reason }`. |
| **Retail / cash jobs** | Supported. Insurance stages (`claim_filed` … `approved`) are optional — e.g. `inspection_complete → contract_signed` with reason. |
| **Job assignment** | `job_participants` table with roles: `sales_owner`, `knocker`, `production_manager`, `office_admin` (`subcontractor` later). No long-term reliance on a single `assigned_to` column. |
| **Claims** | One **primary** claim per job (`is_primary = true`). Supplements deferred; schema must not block multiple claims per job later. |
| **v1 migration** | Out of scope until foundation ships. |
| **PWA / offline** | Not in foundation. Web-only, mobile-first UI. |
| **File storage** | Provider-neutral `storage_key` on photos/documents. No storage implementation until dedicated PR. |
| **Multi-company** | Single company operationally. `organization_id` on tenant-scoped tables for a clean future without building multi-tenant UX now. |

### Future integration pattern (not built yet)

```
External service → Integration adapter → Core mutation command → DB + activity_events
```

Adapters never write directly to tables. They call the same commands the UI uses.

---

## 2. Data model

### Design conventions

- **Primary keys:** `uuid` (`gen_random_uuid()`)
- **Timestamps:** `created_at`, `updated_at` (auto-managed)
- **Audit:** `created_by`, `updated_by` (FK → users) on mutable business tables
- **Soft delete:** `deleted_at` on user-facing entities; hard delete only for join tables and drafts
- **Money:** `bigint` cents + `currency` (default `USD`)
- **Enums:** Postgres enums for fixed lifecycles; lookup tables only when user-configurable

### Entity relationship overview

```
organizations
users ──< user_roles >── roles ──< role_permissions
customers ──< properties ──< jobs ──┬──< job_participants >── users
                                    ├──< claims
                                    ├──< appointments
                                    ├──< job_events (KU, CI, etc.)
                                    ├──< tasks
                                    ├──< photos
                                    ├──< documents
                                    ├──< estimates
                                    ├──< invoices ──< payments
                                    ├──< production_records
                                    └──< activity_events (timeline)
```

### Tables

#### `organizations`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | e.g. Over The Top Restoration |
| created_at, updated_at | timestamptz | |

Foundation seeds one organization. All tenant-scoped rows reference `organization_id`.

#### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK → organizations NOT NULL | |
| email | text UNIQUE NOT NULL | |
| name | text NOT NULL | |
| phone | text | |
| is_active | boolean DEFAULT true | |
| deleted_at | timestamptz | soft delete |
| created_at, updated_at | timestamptz | |

#### `roles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text UNIQUE NOT NULL | e.g. admin, sales, production, accounting |
| description | text | |

#### `role_permissions`

| Column | Type | Notes |
|--------|------|-------|
| role_id | uuid FK → roles | PK part 1 |
| permission | text | PK part 2; e.g. `jobs:transition`, `invoices:create` |

#### `user_roles`

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid FK → users | PK part 1 |
| role_id | uuid FK → roles | PK part 2 |

#### `customers`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| first_name, last_name | text NOT NULL | |
| email, phone | text | |
| notes | text | |
| created_by, updated_by | uuid FK → users | |
| deleted_at | timestamptz | |
| created_at, updated_at | timestamptz | |

**Indexes:** `(last_name, first_name)`, `(phone)` where deleted_at IS NULL

#### `properties`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| customer_id | uuid FK → customers NOT NULL | |
| address_line1 | text NOT NULL | |
| address_line2 | text | |
| city, state, zip | text NOT NULL | |
| latitude, longitude | numeric | optional geocode |
| is_primary | boolean DEFAULT false | |
| created_by, updated_by | uuid | |
| deleted_at | timestamptz | |
| created_at, updated_at | timestamptz | |

**Indexes:** `(customer_id)`, `(city, state, zip)`

#### `jobs`

Central entity. Status lives here and only changes via transition commands.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | internal identifier |
| property_id | uuid FK → properties NOT NULL | |
| organization_id | uuid FK → organizations NOT NULL | |
| job_number | text UNIQUE NOT NULL | `TOP-YYYY-####`, server-generated, user-facing |
| status | job_status enum NOT NULL | see lifecycle below |
| job_type | job_type enum NOT NULL DEFAULT `insurance` | `insurance` or `retail` — controls allowed skip paths |
| lead_source | text | door_knock, referral, storm_list, etc. |
| storm_date | date | |
| notes | text | |
| closed_at | timestamptz | set when status → closed |
| created_by, updated_by | uuid | |
| deleted_at | timestamptz | |
| created_at, updated_at | timestamptz | |

**`job_type` enum:** `insurance` | `retail`

**`job_status` enum:**

`lead` | `inspection_scheduled` | `inspection_complete` | `claim_filed` | `adjuster_meeting_scheduled` | `approved` | `contract_signed` | `material_ordered` | `production_scheduled` | `installed` | `invoiced` | `paid` | `closed`

**Indexes:** `(organization_id, status)`, `(property_id)`, `(created_at DESC)`, `(job_number)` — job number is the primary user search key

#### `job_participants`

Replaces a single `assigned_to` field. Multiple users per job with explicit roles.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| user_id | uuid FK → users NOT NULL | |
| role | job_participant_role enum NOT NULL | see below |
| assigned_at | timestamptz NOT NULL DEFAULT now() | |
| assigned_by | uuid FK → users | |
| removed_at | timestamptz | soft unassign |

**`job_participant_role` enum:** `sales_owner` | `knocker` | `production_manager` | `office_admin` (`subcontractor` added later)

**Unique (active):** `(job_id, role)` WHERE `removed_at IS NULL` — one active holder per role per job

**Indexes:** `(job_id)`, `(user_id)`

#### `job_events`

KU, CI, and other reportable milestones. **Not** a substitute for status.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| event_type | job_event_type enum NOT NULL | `ku`, `ci`, custom later |
| occurred_at | timestamptz NOT NULL | business time |
| recorded_by | uuid FK → users NOT NULL | |
| metadata | jsonb | carrier ref, notes; keep small |
| created_at | timestamptz | |

**Unique:** `(job_id, event_type)` — one KU and one CI per job (business rule; adjust if duplicates needed later)

**Indexes:** `(job_id)`, `(event_type, occurred_at)`

#### `claims`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | multiple rows per job later (supplements) |
| is_primary | boolean NOT NULL DEFAULT true | exactly one primary claim per job |
| claim_number | text | |
| carrier | text NOT NULL | |
| policy_number | text | |
| date_of_loss | date | |
| deductible_cents | bigint | |
| adjuster_name, adjuster_phone, adjuster_email | text | |
| status | claim_status enum | `draft`, `filed`, `pending`, `approved`, `denied`, `supplement` |
| approved_amount_cents | bigint | |
| notes | text | |
| created_by, updated_by | uuid | |
| created_at, updated_at | timestamptz | |

**Partial unique:** `(job_id)` WHERE `is_primary = true`

#### `appointments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| type | appointment_type enum | `inspection`, `adjuster_meeting`, `production`, `other` |
| scheduled_start | timestamptz NOT NULL | |
| scheduled_end | timestamptz | |
| status | appointment_status enum | `scheduled`, `completed`, `cancelled`, `no_show` |
| assigned_to | uuid FK → users | |
| location_notes | text | |
| completed_at | timestamptz | |
| created_by, updated_by | uuid | |
| created_at, updated_at | timestamptz | |

**Indexes:** `(scheduled_start)`, `(job_id)`, `(assigned_to, scheduled_start)` where status = scheduled

#### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs | nullable for global tasks later |
| title | text NOT NULL | |
| due_at | timestamptz | |
| status | task_status enum | `open`, `done`, `cancelled` |
| assigned_to | uuid FK → users | |
| created_by | uuid | |
| completed_at | timestamptz | |
| created_at, updated_at | timestamptz | |

#### `photos`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| storage_key | text NOT NULL | provider-neutral path/key; storage adapter in later PR |
| caption | text | |
| taken_at | timestamptz | |
| uploaded_by | uuid FK → users | |
| created_at | timestamptz | |

#### `documents`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| doc_type | document_type enum | `contract`, `estimate`, `invoice`, `insurance`, `other` |
| storage_key | text NOT NULL | provider-neutral path/key; storage adapter in later PR |
| filename | text NOT NULL | |
| uploaded_by | uuid | |
| created_at | timestamptz | |

#### `estimates`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| version | int NOT NULL DEFAULT 1 | |
| status | estimate_status enum | `draft`, `sent`, `accepted`, `rejected` |
| total_cents | bigint NOT NULL | |
| line_items | jsonb NOT NULL | structured array; normalize later if needed |
| created_by | uuid | |
| created_at, updated_at | timestamptz | |

#### `invoices`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs NOT NULL | |
| invoice_number | text UNIQUE NOT NULL | |
| status | invoice_status enum | `draft`, `sent`, `partial`, `paid`, `void` |
| total_cents | bigint NOT NULL | |
| due_date | date | |
| sent_at | timestamptz | |
| created_by, updated_by | uuid | |
| created_at, updated_at | timestamptz | |

**Indexes:** `(job_id)`, `(status)`, `(due_date)`

#### `payments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| invoice_id | uuid FK → invoices NOT NULL | |
| amount_cents | bigint NOT NULL | CHECK > 0 |
| method | payment_method enum | `check`, `ach`, `card`, `cash`, `other` |
| received_at | timestamptz NOT NULL | |
| reference | text | check #, txn id |
| recorded_by | uuid FK → users | |
| created_at | timestamptz | |

Invoice `status` is **derived and persisted** by payment commands (not computed ad hoc in UI).

#### `production_records`

Production scheduling and install tracking — separate from job lifecycle status.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs UNIQUE NOT NULL | |
| status | production_status enum | `not_scheduled`, `scheduled`, `in_progress`, `complete` |
| scheduled_date | date | |
| crew_lead | uuid FK → users | |
| material_ordered_at | timestamptz | mirrors lifecycle event; logged on timeline too |
| installed_at | timestamptz | |
| notes | text | |
| updated_by | uuid | |
| created_at, updated_at | timestamptz | |

#### `activity_events` (timeline — append-only)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| job_id | uuid FK → jobs | nullable for customer-level events later |
| customer_id | uuid FK → customers | optional |
| actor_id | uuid FK → users | null for system |
| event_type | text NOT NULL | e.g. `job.status_changed`, `job_event.ku`, `appointment.scheduled` |
| subject_type | text | `job`, `claim`, `invoice`, etc. |
| subject_id | uuid | |
| payload | jsonb NOT NULL DEFAULT '{}' | `{ from, to, summary }` — display only |
| occurred_at | timestamptz NOT NULL DEFAULT now() | |

**Indexes:** `(job_id, occurred_at DESC)`, `(customer_id, occurred_at DESC)`, `(event_type)`

**Rule:** No UPDATE or DELETE on `activity_events`. Corrections are new events.

### Soft delete strategy

| Entity | Strategy |
|--------|----------|
| customers, properties, jobs | `deleted_at`; hidden from default queries |
| users | deactivate + soft delete |
| invoices (sent+) | never soft delete; void instead |
| activity_events | never delete |
| payments | never delete; reversal via adjustment event + new payment record |

### Required constraints summary

- `jobs.property_id` NOT NULL
- `job_events`: UNIQUE `(job_id, event_type)` for KU/CI
- `claims`: partial unique `(job_id) WHERE is_primary = true`
- `payments.amount_cents` > 0
- `invoices.total_cents` >= sum of payments (enforced in application layer + DB trigger optional in later PR)

---

## 3. Source-of-truth rules

| Concern | Source of truth | How it changes | What also happens |
|---------|-----------------|----------------|-------------------|
| **Job status** | `jobs.status` | `POST /api/jobs/:id/transition` only | `activity_events` row; optional side effects (e.g. create production_record) |
| **KU / CI tracking** | `job_events` table | `POST /api/jobs/:id/events` with type `ku` or `ci` | Timeline entry; may **suggest** status transition but never auto-patch status silently |
| **Appointment scheduling** | `appointments` table | `POST/PATCH /api/appointments` + `POST .../complete\|cancel` | Timeline entry; completing inspection may enable transition to `inspection_complete` via explicit transition |
| **Claim data** | `claims` table | `POST/PATCH /api/jobs/:id/claim` | Timeline on create and material field changes |
| **Invoice status** | `invoices.status` | `POST /api/invoices`, `POST .../send`, `POST .../void`; payment commands update status | Timeline per action: created, sent, voided |
| **Payment status** | `payments` rows + derived `invoices.status` | `POST /api/invoices/:id/payments` only | Timeline; recalculates invoice status in same transaction |
| **Production status** | `production_records.status` | `PATCH /api/jobs/:id/production` | Timeline; job status moves to `production_scheduled` / `installed` via **separate** transition command |
| **Job assignment** | `job_participants` | `POST /api/jobs/:id/participants`, `DELETE .../participants/:id` | Timeline on assign/unassign |
| **User permissions** | `roles` + `role_permissions` + `user_roles` | `POST/PATCH /api/admin/roles`, assign via settings | No business timeline |
| **Customer communication history** | `activity_events` where `event_type` LIKE `communication.%` | Manual log: `POST /api/jobs/:id/communications` (foundation: manual notes only) | Integrations later append same event type |
| **Activity timeline** | `activity_events` | Written inside every mutation command — never by UI directly | Read via `GET /api/jobs/:id/timeline` |

### Forbidden patterns

- UI writing `jobs.status` via generic `PATCH /jobs/:id`
- KU/CI stored as booleans on `jobs`
- Invoice paid status set without a payment row
- Duplicate endpoints (`/jobs/update-status` AND `/jobs/transition`)

---

## 4. API design

Base: `/api/v1`. JSON only. All mutations require auth. Responses: `{ data }` or `{ error: { code, message } }`.

### Auth

| Method | Route | Action |
|--------|-------|--------|
| POST | `/auth/login` | Session create |
| POST | `/auth/logout` | Session destroy |
| GET | `/auth/me` | Current user + permissions |

### Customers & properties

| Method | Route | Action |
|--------|-------|--------|
| GET | `/customers` | List (search, paginate) |
| POST | `/customers` | Create customer |
| GET | `/customers/:id` | Detail + properties |
| PATCH | `/customers/:id` | Update contact info |
| POST | `/customers/:id/properties` | Add property |
| PATCH | `/properties/:id` | Update property |

### Jobs (center)

| Method | Route | Action |
|--------|-------|--------|
| GET | `/jobs` | List/filter by status, assignee, date |
| POST | `/jobs` | Create job (status = `lead`) |
| GET | `/jobs/:id` | Full job detail |
| PATCH | `/jobs/:id` | Update assignee, notes, lead_source — **not status** |
| POST | `/jobs/:id/transition` | **Only** status change path |
| POST | `/jobs/:id/events` | Record KU, CI, etc. |
| GET | `/jobs/:id/timeline` | Activity feed |
| POST | `/jobs/:id/communications` | Manual comm log (foundation) |

**Transition body:** `{ "toStatus": "inspection_scheduled", "reason": "required when skipping stages" }`

When `toStatus` skips one or more intermediate stages, `reason` is **required**. The command logs `activity_events` with `{ from, to, skippedStages[], reason }`.

Server validates allowed transitions (config table or state machine module — one file).

### Claims, appointments, tasks

| Method | Route | Action |
|--------|-------|--------|
| GET/POST/PATCH | `/jobs/:id/claim` | Single claim resource |
| GET | `/appointments` | Calendar query (`from`, `to`, `assignee`) |
| POST | `/appointments` | Schedule |
| PATCH | `/appointments/:id` | Reschedule |
| POST | `/appointments/:id/complete` | Complete |
| POST | `/appointments/:id/cancel` | Cancel |
| GET/POST/PATCH | `/jobs/:id/tasks` | Job tasks |

### Production, financial

| Method | Route | Action |
|--------|-------|--------|
| GET/PATCH | `/jobs/:id/production` | Production record |
| GET/POST | `/jobs/:id/estimates` | Estimates |
| GET/POST | `/jobs/:id/invoices` | Invoices |
| POST | `/invoices/:id/send` | Mark sent |
| POST | `/invoices/:id/void` | Void |
| POST | `/invoices/:id/payments` | Record payment |

### Files (later PRs)

| Method | Route | Action |
|--------|-------|--------|
| POST | `/jobs/:id/photos/upload-url` | Presigned upload |
| POST | `/jobs/:id/documents/upload-url` | Presigned upload |

### Admin

| Method | Route | Action |
|--------|-------|--------|
| GET/POST/PATCH | `/admin/users` | User management |
| GET/POST/PATCH | `/admin/roles` | Roles and permissions |

### Mutation command pattern (internal)

Every write route delegates to one command function:

```
route handler → validate (Zod) → authorize → command.execute(tx) → activity.log(tx) → commit
```

Commands live in `src/domain/commands/`. No business logic in route files.

---

## 5. UI / page map

Mobile-first: bottom nav on phone; sidebar on `md+`. Touch targets ≥ 44px.

### Dashboard `/`

| | |
|-|-|
| **Purpose** | At-a-glance pipeline and today's work |
| **Primary actions** | Open job, create lead, view today's appointments |
| **Data** | Job counts by status, my open tasks, today's appointments, recent activity |
| **Mobile** | Single column cards; swipe-friendly job list |

### Customers `/customers`

| | |
|-|-|
| **Purpose** | Find and manage homeowners |
| **Primary actions** | Search, create customer, open customer detail |
| **Data** | Customer list with primary phone/address |
| **Mobile** | Sticky search; tap-to-call phone links |

### Customer detail `/customers/:id`

| | |
|-|-|
| **Purpose** | Customer profile and properties |
| **Primary actions** | Edit contact, add property, start job |
| **Data** | Customer fields, properties list, jobs per property |
| **Mobile** | Collapsible sections |

### Jobs `/jobs`

| | |
|-|-|
| **Purpose** | Pipeline list |
| **Primary actions** | Filter by status/assignee, create job, open job |
| **Data** | Job number, address, status badge, assignee, last activity |
| **Mobile** | Status filter chips; pull-to-refresh |

### Job detail `/jobs/:id`

| | |
|-|-|
| **Purpose** | Single job command center |
| **Primary actions** | Transition status, log KU/CI, schedule appointment, view timeline |
| **Data** | Job header, status stepper, claim summary, next appointment, timeline |
| **Mobile** | Sticky status + primary action FAB; tabs: Overview, Timeline, Financial, Files |

### Calendar `/calendar`

| | |
|-|-|
| **Purpose** | Team appointment view |
| **Primary actions** | Day/week toggle, create appointment, open job |
| **Data** | Appointments by assignee and type |
| **Mobile** | Default day view; agenda list |

### Production board `/production`

| | |
|-|-|
| **Purpose** | Installs and crew scheduling |
| **Primary actions** | Move production status, assign crew, set dates |
| **Data** | Jobs in production stages with `production_records` |
| **Mobile** | Kanban simplified to status-grouped list |

### Reports `/reports`

| | |
|-|-|
| **Purpose** | KU/CI counts, conversion, rep leaderboard |
| **Primary actions** | Date range filter, export CSV (later) |
| **Data** | Aggregates from `job_events`, transitions, payments |
| **Mobile** | Charts optional; table-first |

### Settings `/settings`

| | |
|-|-|
| **Purpose** | Profile, users, roles (admin) |
| **Primary actions** | Manage team, assign roles |
| **Data** | Users, roles, permissions matrix |
| **Mobile** | Simple list navigation |

---

## 6. Build sequence

Each PR is independently deployable, tested, and revertible.

### Phase 0 — Repo foundation (PRs 1–3, detailed below)

### Phase 1 — Core domain (PRs 4–8)

| PR | Goal |
|----|------|
| 4 | Customers + properties CRUD |
| 5 | Jobs CRUD + list/detail UI shell |
| 6 | Job status state machine + transitions API |
| 7 | Activity timeline (write on every mutation + read UI) |
| 8 | KU/CI job events + reports stub |

### Phase 2 — Operations (PRs 9–13)

| PR | Goal |
|----|------|
| 9 | Appointments + calendar page |
| 10 | Claims |
| 11 | Tasks |
| 12 | Production records + board |
| 13 | Estimates (manual entry) |

### Phase 3 — Financial (PRs 14–16)

| PR | Goal |
|----|------|
| 14 | Invoices |
| 15 | Payments + invoice status sync |
| 16 | Dashboard + reports v1 |

### Phase 4 — Files & polish (PRs 17+)

Photos, documents, search, performance, role hardening.

### PR template (every PR)

```markdown
## Goal
One sentence.

## Scope
- Files/modules touched

## Must NOT touch
- Explicit exclusions

## Acceptance test
Manual steps a reviewer can run in < 5 min.

## Automated tests
- Unit/integration/e2e added

## Rollback
How to revert safely (migration down, feature flag, etc.)
```

---

## First 3 PRs

### PR 1: Project scaffold and database foundation

| | |
|-|-|
| **Goal** | Runnable app with Postgres schema migrations and CI |
| **Scope** | Next.js app, Drizzle, env config, initial migration (users, roles, sessions), Vitest, GitHub Actions lint+test, README |
| **Must NOT touch** | Business routes, UI pages beyond health check, integrations |
| **Acceptance test** | `pnpm dev` serves `/api/health`; `pnpm db:migrate` applies cleanly; CI green |
| **Automated tests** | Health route test; migration smoke test |
| **Rollback** | Revert commit; drop database if first deploy |

### PR 2: Authentication and authorization shell

| | |
|-|-|
| **Goal** | Login/logout, session, role-based middleware, seed admin user |
| **Scope** | Better Auth setup, `user_roles`/`roles`/`role_permissions`, login page, auth middleware, permission helper |
| **Must NOT touch** | Jobs, customers, business mutations |
| **Acceptance test** | Admin logs in; unauthorized API returns 401; user without permission gets 403 |
| **Automated tests** | Auth middleware unit tests; login e2e smoke |
| **Rollback** | Revert; sessions invalidated on deploy (acceptable) |

### PR 3: App shell and navigation

| | |
|-|-|
| **Goal** | Mobile-first layout with authenticated navigation to empty pages |
| **Scope** | Root layout, bottom nav, sidebar, protected routes, placeholder pages (dashboard, jobs, customers, calendar, production, reports, settings) |
| **Must NOT touch** | Domain API, database schema beyond auth |
| **Acceptance test** | Logged-in user navigates all sections on mobile viewport; logout works |
| **Automated tests** | Playwright: nav smoke across viewports |
| **Rollback** | Revert UI-only commit |

---

## 7. Risks and open questions

### Risks

| Risk | Mitigation |
|------|------------|
| Status machine too rigid for real workflows | Document allowed transitions in one module; admin override permission with audit event |
| Duplicate mutation paths creep in | AGENTS.md + PR review checklist; no generic PATCH on status fields |
| Activity timeline volume | Index `(job_id, occurred_at)`; archive policy after 7 years if needed |
| Scope creep from integrations | Adapter boundary documented; integration PRs blocked until Phase 3 complete |
| AI-generated helper sprawl | AGENTS.md rules; max one new file per PR unless deleting another |

### Resolved decisions

See [Product decisions (locked)](#product-decisions-locked) above.

### Remaining open questions

1. **Job number sequence:** Per-organization counter table vs. `MAX(job_number)` per year?
2. **Supplement claims:** Add `parent_claim_id` when supplements ship, or rely on `is_primary` only?
3. **Subcontractor role:** Permissions model when external users are added?
4. **v1 export mapping:** Field mapping doc when migration phase starts

---

## Appendix: job transitions

All status changes go through `TransitionJobCommand` in `src/domain/job-transitions.ts` (single file).

### Default forward path (insurance jobs)

```
lead → inspection_scheduled → inspection_complete → claim_filed
  → adjuster_meeting_scheduled → approved → contract_signed
  → material_ordered → production_scheduled → installed
  → invoiced → paid → closed
```

### Retail / cash jobs

Insurance stages are **optional**. Example path:

```
lead → inspection_scheduled → inspection_complete → contract_signed → … → closed
```

Skip from `inspection_complete` to `contract_signed` requires `reason` (e.g. `"retail_cash_job"`).

### Skipping stages

- Any transition that skips intermediate stages requires a non-empty `reason`.
- Skipped stages are recorded in `activity_events.payload.skippedStages`.
- No silent auto-advance from KU/CI events.

### Backward transitions

Admin permission only (`jobs:transition:admin`). Always requires `reason`.

### Job numbers

Generated on job create: `TOP-{YYYY}-{####}` zero-padded sequence per calendar year per organization.
