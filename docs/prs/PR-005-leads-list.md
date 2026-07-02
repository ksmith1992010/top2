# PR-005: Leads list read layer

| | |
|-|-|
| **Goal** | Wire `/leads` to real customer data (read-only) |
| **Branch** | `feat/leads-list-read-layer` |
| **Depends on** | PR-004 core CRM schema (#7) |

## Scope

- Server-rendered `/leads` page with customer list
- Search via query param
- Empty state
- Role check: `customers:read`
- Read-only query reuse from `listCustomers`

## Intentionally deferred

- Customer detail page
- Create/edit mutations
- API routes (server component reads DB directly)
- Bulk import

## Redundancy / data safety

- Duplicate mutation paths introduced: No
- Existing data or migrations touched: No
- Risk level: Low
- Notes: Read-only UI layer; no schema changes.
