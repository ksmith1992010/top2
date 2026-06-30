# API reference (v1)

Base URL: `/api/v1`  
Auth: session cookie (Better Auth) on all routes except `/auth/login` and `/api/health`.

Response shape:

```json
{ "data": { ... } }
{ "error": { "code": "INVALID_TRANSITION", "message": "..." } }
```

Full design rationale: [BLUEPRINT.md](./BLUEPRINT.md#4-api-design).

---

## Auth

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/auth/login` | `{ email, password }` | Sets session cookie |
| POST | `/auth/logout` | — | Clears session |
| GET | `/auth/me` | — | User + permissions[] |

---

## Customers

| Method | Path | Permission |
|--------|------|------------|
| GET | `/customers?search=&page=` | `customers:read` |
| POST | `/customers` | `customers:create` |
| GET | `/customers/:id` | `customers:read` |
| PATCH | `/customers/:id` | `customers:update` |
| POST | `/customers/:id/properties` | `customers:update` |
| PATCH | `/properties/:id` | `customers:update` |

**POST /customers**

```json
{ "firstName": "Jane", "lastName": "Doe", "email": "...", "phone": "..." }
```

Activity: `customer.created`

---

## Jobs

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/jobs?status=&assignedTo=` | `jobs:read` | List |
| POST | `/jobs` | `jobs:create` | Creates with `status=lead` |
| GET | `/jobs/:id` | `jobs:read` | Detail + related summaries |
| PATCH | `/jobs/:id` | `jobs:update` | assignee, notes, leadSource — **not status** |
| POST | `/jobs/:id/transition` | `jobs:transition` | **Only status changes** |
| POST | `/jobs/:id/events` | `job_events:create` | KU, CI |
| GET | `/jobs/:id/timeline` | `jobs:read` | Activity feed |
| POST | `/jobs/:id/communications` | `jobs:update` | Manual comm log |

**POST /jobs**

```json
{ "propertyId": "uuid", "leadSource": "door_knock", "assignedTo": "uuid" }
```

**POST /jobs/:id/transition**

```json
{ "toStatus": "inspection_scheduled", "reason": "optional" }
```

Activity: `job.status_changed` with `{ from, to, reason }`

**POST /jobs/:id/events**

```json
{ "eventType": "ku", "occurredAt": "2026-06-29T12:00:00Z", "metadata": {} }
```

Activity: `job_event.ku` or `job_event.ci`

---

## Claims

| Method | Path | Permission |
|--------|------|------------|
| GET | `/jobs/:id/claim` | `jobs:read` |
| POST | `/jobs/:id/claim` | `claims:create` |
| PATCH | `/jobs/:id/claim` | `claims:update` |

One claim per job (409 if exists on POST).

---

## Appointments

| Method | Path | Permission |
|--------|------|------------|
| GET | `/appointments?from=&to=&assignedTo=` | `appointments:read` |
| POST | `/appointments` | `appointments:create` |
| PATCH | `/appointments/:id` | `appointments:update` |
| POST | `/appointments/:id/complete` | `appointments:update` |
| POST | `/appointments/:id/cancel` | `appointments:update` |

**POST /appointments**

```json
{
  "jobId": "uuid",
  "type": "inspection",
  "scheduledStart": "2026-07-01T09:00:00Z",
  "scheduledEnd": "2026-07-01T10:00:00Z",
  "assignedTo": "uuid"
}
```

Activity: `appointment.scheduled`, `appointment.completed`, `appointment.cancelled`

---

## Tasks

| Method | Path | Permission |
|--------|------|------------|
| GET | `/jobs/:id/tasks` | `jobs:read` |
| POST | `/jobs/:id/tasks` | `tasks:create` |
| PATCH | `/tasks/:id` | `tasks:update` |

---

## Production

| Method | Path | Permission |
|--------|------|------------|
| GET | `/jobs/:id/production` | `production:read` |
| PATCH | `/jobs/:id/production` | `production:update` |

Does **not** change `jobs.status` — use transition separately.

---

## Financial

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/jobs/:id/estimates` | `estimates:*` |
| GET/POST | `/jobs/:id/invoices` | `invoices:*` |
| POST | `/invoices/:id/send` | `invoices:send` |
| POST | `/invoices/:id/void` | `invoices:void` |
| POST | `/invoices/:id/payments` | `payments:create` |

**POST /invoices/:id/payments**

```json
{ "amountCents": 500000, "method": "check", "receivedAt": "...", "reference": "1234" }
```

Updates `invoices.status` to `partial` or `paid` in same transaction.

---

## Admin

| Method | Path | Permission |
|--------|------|------------|
| GET/POST/PATCH | `/admin/users` | `admin:users` |
| GET/POST/PATCH | `/admin/roles` | `admin:roles` |

---

## Health (PR-001)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | none |

---

## Mutation → activity event map

| Command | event_type |
|---------|------------|
| CreateCustomer | `customer.created` |
| CreateJob | `job.created` |
| TransitionJob | `job.status_changed` |
| RecordJobEvent (KU) | `job_event.ku` |
| RecordJobEvent (CI) | `job_event.ci` |
| ScheduleAppointment | `appointment.scheduled` |
| CompleteAppointment | `appointment.completed` |
| CreateClaim | `claim.created` |
| UpdateClaim | `claim.updated` |
| CreateInvoice | `invoice.created` |
| SendInvoice | `invoice.sent` |
| RecordPayment | `payment.received` |
| LogCommunication | `communication.logged` |

Every command writes exactly one primary activity event (updates may add `*.updated`).
