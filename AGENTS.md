# AGENTS.md — Rules for AI and Human Contributors

This repo is a **clean rebuild** of T.O.P. CRM. The goal is a small, respectable codebase — not an accumulation of AI patches.

Read [docs/BLUEPRINT.md](./docs/BLUEPRINT.md) before making structural changes.

---

## Core principles

1. **Job is the center.** If a feature does not connect to a job lifecycle, question it.
2. **One mutation path.** Each business action has exactly one API command that writes to the database.
3. **Timeline everything important.** Mutations create `activity_events` in the same transaction.
4. **KU/CI are events, not flags.** Store in `job_events`. Never bolt onto `jobs.status`.
5. **Small PRs.** If a PR is hard to review in 15 minutes, split it.

---

## When to add code

Add code when:

- A user-facing requirement from the blueprint is not yet implemented
- The same business rule appears **twice** and a shared function removes real duplication
- A test exposes a missing validation or authorization check
- A new table or command is specified in the blueprint

Do **not** add code when:

- You can extend an existing command with a few clear lines
- The change is a "just in case" fallback or defensive branch for impossible states
- A new helper wraps a single call site
- Anomaly integration logic belongs in core domain (use adapter layer later)

---

## When to delete code

Delete code when:

- Two functions/commands do the same thing — keep the one wired to the API
- A helper is only used once — inline it
- A fallback path duplicates the happy path — remove the fallback and fix the root cause
- An abstraction has only one implementation — collapse it
- Dead feature flags or unused env vars after a PR merge

**Deletion is preferred over layering.** Removing 50 lines beats adding 30.

---

## When to refactor

Refactor when:

- You are touching a file and the duplication is **in that PR's scope**
- A state machine or validation rule is scattered across 3+ files — consolidate into `src/domain/`
- A route handler contains business logic — move to a command

Do **not** refactor unrelated files "while you're here." Open a separate PR.

---

## Avoid duplicate logic

| Rule | Detail |
|------|--------|
| Commands own writes | All DB mutations go through `src/domain/commands/` |
| Routes are thin | Validate → authorize → command → respond |
| One status field | `jobs.status` changes only in `TransitionJobCommand` |
| One invoice paid path | Payments command updates invoice status |
| No parallel types | Use Drizzle inferred types + Zod input schemas |
| No copy-paste validation | Share Zod schemas between API and forms |

Before adding a function, search for an existing command or schema. Extend it.

---

## Validation

- **Input:** Zod schemas in `src/domain/schemas/` — one schema per command
- **Business rules:** in command `validate()` or domain module (e.g. `job-transitions.ts`)
- **DB constraints:** use NOT NULL, FK, UNIQUE, CHECK — do not rely on app-only validation
- **Reject early:** return 400 with `{ error: { code, message } }` — no silent coercion
- **Never trust the client:** re-validate on server even if the UI validated

---

## Error handling

- Use **transactional commands** — timeline + entity update in one `db.transaction()`
- On failure: roll back entire transaction; no partial writes
- Return structured errors: `{ code: 'INVALID_TRANSITION', message: '...' }`
- Log unexpected errors server-side; return generic 500 to client
- **Do not** catch-and-continue past mutation errors to "save partial state"
- No fallback retry loops that mask bugs (fix the root cause)

---

## Testing

| Layer | Tool | Required when |
|-------|------|----------------|
| Commands / domain | Vitest | Any new command or state rule change |
| API routes | Vitest integration | New route |
| Critical flows | Playwright | Auth, one happy path per PR |
| UI smoke | Playwright | New page or layout with user-visible change |

- **Do not** merge PRs without tests for new behavior
- Tests assert **outcomes**, not implementation details
- Prefer testing commands over mocking helpers

---

## Prevent AI patch bloat

These rules exist because v1 accumulated AI-generated layers. Do not repeat that.

1. **No new file without justification** in PR description
2. **No `utils` folder sprawl** — domain logic lives in `src/domain/`
3. **No generic `helpers/update*`, `fix*`, `handle*` names** — name by business action
4. **Max ~300 lines per file** — split by domain, not by abstraction layer
5. **One concern per PR** — if the PR title needs "and", split it
6. **No integrations** in foundation PRs (Twilio, Gmail, DocuSign, QuickBooks, etc.)
7. **No PDF/email/SMS** until core lifecycle works manually
8. **Ask before adding dependencies** — default stack in blueprint is sufficient
9. **Prefer deleting** over adding compatibility shims
10. **If unsure, read BLUEPRINT** — do not invent architecture

See also [docs/checklists/code-redundancy-data-preservation.md](./docs/checklists/code-redundancy-data-preservation.md).

---

## Redundancy and data safety (tiered)

Every PR must include the **short block** below. The [full checklist](./docs/checklists/code-redundancy-data-preservation.md) is required only when the PR touches schema, migrations, API routes, domain commands, auth, business data, storage, backfills, deletes, or integrations that write data.

**Short block (paste into every PR):**

```md
## Redundancy / data safety

- Duplicate mutation paths introduced: No / Yes
- Existing data or migrations touched: No / Yes
- Risk level: Low / Medium / High
- Notes:
```

**Low-risk PRs** (docs-only, style, copy, test-only with no schema/command changes): short block is enough when **Existing data or migrations touched: No** and **Risk level: Low**.

**Medium/high-risk PRs:** complete the full checklist in the doc and link it. Any **Yes** or **Medium/High** must include an explanation.

Do **not** paste the full checklist into every PR by default.

### Standing protections (always)

- No duplicate mutation paths; no direct client-side DB writes
- No hard deletes of business data; financial/audit records append-only
- Additive / expand-contract migrations; never edit committed migrations
- NOT NULL changes need backfill, default, or two-step plan
- Risky data changes require a rollback plan

### Redundancy audit (when full checklist applies)

Before merging risky PRs, confirm the change does not introduce:

- Duplicate business logic, API routes, DB paths, validation schemas, or permission checks
- Duplicate status transition or timeline/activity logging logic
- Generic helpers hiding business rules, fallback paths, or compatibility layers without reason
- Unused files, imports, dead functions, or stale code

**Required behavior:** Prefer fixing the existing source of truth. Prefer delete/consolidate over new helpers. New helpers need justification. Temporary duplication needs a TODO with owner and removal trigger.

### Data preservation audit (when full checklist applies)

Confirm whether the change could affect production data: drops, renames, nullability, defaults, enum/status changes, deletes, overwrites, backfills, orphaned records, or broken customer/job/claim/invoice/payment/document/photo/user/activity data.

**Required behavior:** Destructive migrations forbidden unless explicitly approved. Additive first, then backfill, then cleanup in a later PR. Mutations touching business data must preserve activity/audit trail once the domain layer exists.

---

## PR checklist (copy into every PR description)

- [ ] Single mutation path only
- [ ] Activity event logged in same transaction
- [ ] No duplicate helper or parallel update route
- [ ] Zod schema for input
- [ ] Permission check on route
- [ ] Tests added
- [ ] Rollback note in PR
- [ ] Did not touch unrelated files
- [ ] Redundancy / data safety short block in PR ([checklist](./docs/checklists/code-redundancy-data-preservation.md))
- [ ] Full redundancy/data checklist completed if PR touches risky areas

---

## File layout (target)

```
src/
  app/              # Next.js routes and pages only
  domain/
    commands/       # One file per business action
    schemas/        # Zod
    job-transitions.ts
    activity.ts
  lib/              # Auth, db client, permissions
  components/       # UI only
```

**Do not** add `src/utils`, `src/helpers`, or business logic in `src/hooks`. Do not put business logic in `components/` or `app/api/`.

---

## Questions

If the blueprint does not cover your case, **stop and ask** — do not guess and patch.
