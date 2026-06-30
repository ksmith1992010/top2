# T.O.P. CRM v2

Clean rebuild of the Over The Top Restoration CRM — roofing and storm-restoration lifecycle from lead to closeout.

**Status:** Foundation design only. No application code yet.

## Documents

| Document | Purpose |
|----------|---------|
| [docs/BLUEPRINT.md](./docs/BLUEPRINT.md) | Stack, data model, API, UI, build sequence, risks |
| [docs/API.md](./docs/API.md) | API route reference |
| [docs/schema.sql](./docs/schema.sql) | Reference PostgreSQL schema |
| [docs/prs/PR-001-scaffold.md](./docs/prs/PR-001-scaffold.md) | First PR spec |
| [docs/prs/PR-002-auth.md](./docs/prs/PR-002-auth.md) | Second PR spec |
| [docs/prs/PR-003-app-shell.md](./docs/prs/PR-003-app-shell.md) | Third PR spec |
| [AGENTS.md](./AGENTS.md) | Rules for humans and AI agents working in this repo |

## Principles

- **Job-centric.** Every workflow orbits the job lifecycle.
- **One mutation path.** No duplicate ways to update the same business object.
- **Events over hacks.** KU, CI, and lifecycle changes are logged on the activity timeline.
- **Small PRs.** Each change is reviewable, testable, and reversible.

## Job lifecycle

Lead → Inspection Scheduled → Inspection Complete → Claim Filed → Adjuster Meeting Scheduled → Approved → Contract Signed → Material Ordered → Production Scheduled → Installed → Invoiced → Paid → Closed

## First 3 PRs

See [docs/BLUEPRINT.md#first-3-prs](./docs/BLUEPRINT.md#first-3-prs).
