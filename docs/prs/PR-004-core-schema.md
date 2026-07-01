# PR-004: Core CRM data model foundation

| | |
|-|-|
| **Goal** | Add CRM backbone tables (customers, properties, jobs) without UI or imports |
| **Branch** | `feat/core-crm-data-model` |
| **Depends on** | PR-003 app shell, PR #6 Netlify docs |

## Scope

- Migration `drizzle/0002_core_domain.sql`
- Drizzle schema: `customers`, `properties`, `jobs`, `job_participants`, enums
- Read-only query helpers: `src/domain/queries/customers.ts` (`listCustomers`, `getCustomerById`)
- Tests: enum contract + optional DB integration when `DATABASE_URL` is set

## Intentionally deferred

- Customer/job UI (`/leads` wiring)
- API routes and mutation commands
- Activity timeline, claims, invoices, payments
- Documents, photos, production workflows
- v1/AccuLynx import, GroupMe, material orders
- Seed changes

## Must NOT touch

- Auth/session tables or seed gating
- Existing migrations `0000` / `0001`

## Acceptance test

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
npm run db:migrate
npm run test
```

Confirm `customers`, `properties`, `jobs`, `job_participants` exist.

## Rollback

Revert commit. If deployed, drop new tables in reverse FK order.

## Redundancy / data safety

- Duplicate mutation paths introduced: No
- Existing data or migrations touched: No (additive migration only)
- Risk level: Medium
- Notes: New CRM foundation tables only. Does not alter auth data or import production CRM data.
