# Code Redundancy and Data Preservation Checklist

Mandatory for **every PR** in T.O.P. CRM v2 — **tiered** so low-risk PRs stay lightweight.

Related: [AGENTS.md](../../AGENTS.md), [BLUEPRINT.md](../BLUEPRINT.md)

---

## 1. Purpose

T.O.P. CRM v2 is a clean rebuild partly to escape AI-generated patch bloat and data-risky architecture from v1.

Every PR must consider redundancy and data safety. **Routine PRs use a short block only.** The full checklist below is required when the PR touches risky areas.

**Do not paste the full checklist into every PR by default.**

- Use the **short block** for routine PRs.
- **Link to this doc** and complete the full checklist when applicable.
- Any **Yes** answer or **Medium/High** risk level must include an explanation.

---

## 2. Short block (every PR)

Paste into **every** PR description:

```md
## Redundancy / data safety

- Duplicate mutation paths introduced: No / Yes
- Existing data or migrations touched: No / Yes
- Risk level: Low / Medium / High
- Notes:
```

### Low-risk PRs (short block only)

If **all** of the following are true, the short block is enough:

- Docs-only, style-only, copy-only, or test-only (no production behavior change)
- **Existing data or migrations touched: No**
- **Risk level: Low**

Examples: README, ADR, AGENTS.md, comment fixes, pure test additions that do not change schema or commands.

### When full checklist is required

Complete **sections 3 and 4** below (and link this doc in the PR) when the PR touches **any** of:

- Database schema or Drizzle migrations
- API routes or domain command modules
- Auth / permissions
- Customer, property, job, claim, invoice, payment, photo, document, user, or activity data
- File / photo / document storage
- Imports, backfills, or seeds that write data
- Deletes, renames, or status changes
- Integrations that write data

Set **Risk level: Medium** for additive schema/API/command changes. Set **High** for destructive migrations, backfills, deletes, or financial/audit data changes.

---

## 3. Redundancy checklist (medium/high-risk PRs)

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

## 4. Data preservation checklist (medium/high-risk PRs)

- [ ] **No destructive migration** — no drops/renames without explicit approval
- [ ] **No unreviewed table/column drops**
- [ ] **No unsafe enum changes** — removed/changed enum values need migration plan
- [ ] **No unsafe nullable/not-null changes** — existing rows considered; backfill/default/two-step plan documented
- [ ] **No data overwrite without backup/plan** — backfills documented
- [ ] **No orphaned records** — FKs and cascades reviewed
- [ ] **Rollback path documented** — in PR description or rollback doc
- [ ] **Backfill plan documented if needed** — expand → backfill → contract pattern
- [ ] **Customer/job/document/payment data preserved** — core entities not at risk
- [ ] **Activity/audit trail preserved where applicable** — `activity_events` append-only; no silent deletes

---

## 5. Standing protections (always apply)

These apply to **all** PRs that touch code or schema — not only when the full checklist is pasted:

| Rule | Detail |
|------|--------|
| One mutation path | No duplicate API routes or commands updating the same entity |
| No client DB writes | Browser calls API routes only |
| No hard deletes of business data | Soft delete or void; financial/audit records append-only |
| Additive migrations first | Expand → backfill → contract; destructive changes in a later PR |
| Never edit committed migrations | New migration file instead |
| NOT NULL changes | Require backfill, default, or two-step plan |
| Risky data changes | Rollback plan required |

---

## 6. Merge rule

A PR must **not** be marked ready to merge until:

1. The **short block** is present, and
2. The **full checklist** is completed when the PR touches any risky area (section 2).

Any **Yes** or **Medium/High** risk without explanation blocks merge until clarified.

When in doubt, split the PR or ask before merging.

---

## 7. Anti-AI-patch-bloat reminder

Do not fix bugs by layering fallback logic unless:

1. The root cause is documented in the PR, and
2. The fallback has a removal plan (TODO with owner and trigger)

**Deletion and consolidation beat new layers.** A 50-line removal is better than a 30-line patch.
