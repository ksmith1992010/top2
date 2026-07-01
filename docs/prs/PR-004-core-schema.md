# PR-004: Core data model foundation

| | |
|-|-|
| **Goal** | Add CRM backbone tables without UI complexity |
| **Branch** | `feat/crm-foundation` (includes PR-005–008 in stacked delivery) |

## Scope

- Migration `drizzle/0002_core_domain.sql` — customers, properties, jobs, job_participants, enums
- Migration `drizzle/0003_activity_events.sql` — activity_events (used by PR-008 transitions)
- Drizzle schema under `src/lib/db/schema/`
- Vitest: job transition rules + optional DB integration test
- BLUEPRINT §6 build sequence + 12-status job lifecycle

## Must NOT touch

- v1 data import
- Invoices, payments, claims, production automation
- Netlify seed gating code

## Acceptance test

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
npm run db:migrate
npm run test
```

Confirm `customers`, `properties`, `jobs` tables exist and FK chain inserts work.

## Automated tests

- `tests/job-transitions.test.ts`
- `tests/core-schema.test.ts` (runs when `DATABASE_URL` is set)

## Rollback

Revert commit; run down migration manually if deployed (drop tables in reverse FK order).

## Redundancy / data safety

- Duplicate mutation paths introduced: No
- Existing data or migrations touched: Yes (additive migrations only)
- Risk level: Low
- Notes: New tables only; no changes to auth migrations.
