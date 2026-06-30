# Code Redundancy and Data Preservation Checklist

Mandatory for **every PR** in T.O.P. CRM v2.

---

## 1. Purpose

T.O.P. CRM v2 is a clean rebuild partly to escape AI-generated patch bloat and data-risky architecture from v1.

This checklist ensures each PR is reviewed for:

- **Code redundancy** — duplicate logic, mutation paths, and unnecessary layers
- **Data preservation** — safe migrations and no accidental loss of business records

Agents and humans must complete both audits before marking a PR ready for review or merging.

Related: [AGENTS.md](../../AGENTS.md), [BLUEPRINT.md](../BLUEPRINT.md)

---

## 2. Redundancy checklist

Copy into PR review or use as a mental audit before opening a PR.

- [ ] **No duplicate mutation path** — one command/API route per business action
- [ ] **No duplicate business rule** — same validation not copy-pasted across files
- [ ] **No duplicate status logic** — job/invoice/claim status changes in one place only
- [ ] **No duplicate validation schema** — Zod schemas shared, not redefined
- [ ] **No duplicate DB connection path** — writes go through domain commands + single client pattern
- [ ] **No duplicate permission model** — authz checks use shared helpers, not ad hoc copies
- [ ] **No fallback/compatibility layer without reason** — no “just in case” shims
- [ ] **No unused/dead code** — removed or justified if kept
- [ ] **No generic utility created prematurely** — no `utils/` or single-use helpers
- [ ] **Existing source of truth reused or improved** — extended before adding parallel code

---

## 3. Data preservation checklist

Required for any PR touching schema, migrations, seeds, or business mutations.

- [ ] **No destructive migration** — no drops/renames without explicit approval
- [ ] **No unreviewed table/column drops**
- [ ] **No unsafe enum changes** — removed/changed enum values need migration plan
- [ ] **No unsafe nullable/not-null changes** — existing rows considered
- [ ] **No data overwrite without backup/plan** — backfills documented
- [ ] **No orphaned records** — FKs and cascades reviewed
- [ ] **Rollback path documented** — in PR description or rollback doc
- [ ] **Backfill plan documented if needed** — two-step migration when required
- [ ] **Customer/job/document/payment data preserved** — core entities not at risk
- [ ] **Activity/audit trail preserved where applicable** — `activity_events` append-only; no silent deletes

---

## 4. PR template block

Paste into every PR description:

```md
## Redundancy audit
- Duplicate mutation paths introduced: No / Yes
- Duplicate business logic introduced: No / Yes
- Existing source of truth reused: Yes / No
- New helpers/modules added: No / Yes — reason:
- Dead/unused code removed or left alone:

## Data preservation audit
- Migration included: No / Yes
- Destructive migration: No / Yes
- Data backfill needed: No / Yes
- Rollback plan included: No / Yes
- Existing business records at risk: No / Yes — explain:
- Activity/audit trail preserved: N/A / Yes / No
```

---

## 5. Merge rule

A PR must **not** be marked ready to merge until both audits are completed.

Any **Yes** on a risky item (duplicate paths, destructive migration, records at risk) must include a clear explanation and explicit approval in the PR thread.

When in doubt, split the PR or ask before merging.

---

## 6. Anti-AI-patch-bloat reminder

Do not fix bugs by layering fallback logic unless:

1. The root cause is documented in the PR, and
2. The fallback has a removal plan (TODO with owner and trigger)

**Deletion and consolidation beat new layers.** A 50-line removal is better than a 30-line patch.
