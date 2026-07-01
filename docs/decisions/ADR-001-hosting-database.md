# ADR-001: Hosting, Database, and Foundation Infrastructure

**Status:** Accepted  
**Date:** 2026-06-30  
**Scope:** v2 foundation (PR-002 onward)

---

## 1. Context

T.O.P. CRM v2 is a clean rebuild for a roofing and storm-restoration CRM. It uses Next.js, PostgreSQL, Drizzle, and a command-based domain architecture.

The system must avoid:

- Duplicate mutation paths
- Fallback spaghetti
- Overbuilt infrastructure

PR-001 established the app scaffold, Drizzle migrations, and CI. Before PR-002 (auth), we lock the initial hosting and database direction so feature PRs do not drift between platforms.

---

## 2. Decision

For the v2 foundation, use:

| Layer | Choice |
|-------|--------|
| App hosting | **Netlify** (Next.js via `@netlify/plugin-nextjs`) |
| Primary database | **Neon Postgres** |
| Schema / migrations | **Drizzle** (applied source of truth in `drizzle/`) |
| Auth / sessions | **Better Auth** |
| File storage (photos, documents, PDFs) | **Cloudflare R2 or AWS S3** — later PR, not foundation |
| Background jobs / workers | **Queue/worker system** — later, only when integrations require it |

`docs/schema.sql` remains a forward-looking design reference. Applied schema changes ship via Drizzle migrations per PR.

---

## 3. Why not Supabase for now

Supabase is a strong Postgres platform with auth, storage, and auto-generated APIs.

We are **not** using Supabase for the foundation because:

- Its generated REST/Realtime APIs would duplicate the chosen **command + API route** architecture.
- Supabase Auth would compete with **Better Auth**, creating two session/auth paths.
- Supabase Storage would tempt direct client uploads that bypass domain commands.

We may reconsider Supabase (or parts of it) later for storage or ancillary services. **PR-002 must not pivot to Supabase** for auth or database access.

---

## 4. Why not Railway / Render / VPS for now

Traditional servers (Railway, Render, VPS, Docker on a VM) are useful for:

- Long-running workers
- Scheduled cron jobs
- Heavy PDF generation
- Persistent background processes

They are **unnecessary for the early foundation**, which is a serverless Next.js app with Postgres and synchronous API commands.

Revisit Railway/Render/VPS when:

- Integrations need always-on workers
- PDF generation becomes CPU-heavy or batch-oriented
- Scheduled jobs (reminders, syncs) are required
- A dedicated worker tier is cheaper or simpler than serverless + queue

Until then, keep the app on Netlify and the database on Neon.

**Note:** Seed gating in [`src/lib/db/seed-dev-admin.ts`](../../src/lib/db/seed-dev-admin.ts) still checks `VERCEL_ENV` for preview bypass. Netlify `CONTEXT=deploy-preview` is not wired yet — preview databases must be seeded from a local dev shell. A follow-up PR will align seed gating with Netlify preview context.

---

## 5. Database rules

- **Postgres is the source of truth** for structured business data (jobs, customers, claims, invoices, etc.).
- **Files are not stored in Postgres.** No PDF blobs, photo bytes, or document content in table columns (use `storage_key` references only).
- **Photos, documents, and PDFs** go to R2/S3 in a dedicated storage PR, accessed via presigned URLs and domain commands.
- **Every mutation** goes through domain commands invoked from API routes — one path per business action.
- **No direct client-side writes** to the database. The browser calls API routes only.
- **No generated API** (Supabase client, PostgREST, etc.) that bypasses the domain command layer.

---

## 6. Environment rules

| Context | `DATABASE_URL` / secrets |
|---------|--------------------------|
| **Netlify (production/preview)** | Env vars in Netlify site settings per deploy context |
| **GitHub Actions (CI)** | `DATABASE_URL` set in workflow env (Postgres service or Neon branch) |
| **Local Next.js** | `.env.local` loaded automatically by `npm run dev` |
| **Local Drizzle CLI** | `DATABASE_URL` must be in the **shell** or a root **`.env`** file — Drizzle does not read `.env.local` |
| **Local seed/migrate** | Same as Drizzle CLI; export or use root `.env` |

Do not assume one env file works for all tools. See [README.md](../../README.md) and [PR-001-scaffold.md](../prs/PR-001-scaffold.md#local-environment-notes).

---

## 7. Revisit triggers

Revisit or supersede this ADR when:

- Background jobs become central to daily operations
- PDF generation becomes heavy or batch-oriented
- Photo/document uploads need advanced storage workflows (virus scan, versioning, CDN rules)
- Offline / PWA becomes a product requirement
- Database branching or staging workflow needs change (e.g. Neon branch-per-PR policy)
- Multi-company SaaS becomes a real product requirement (not just `organization_id` in schema)

A new ADR must be written before changing platforms or adding infrastructure tiers.

---

## 8. Anti-drift note

**Future agents and contributors must not switch database, hosting, or storage platforms inside feature PRs.**

Examples of forbidden drift in a feature PR:

- Replacing Neon with Supabase “for convenience”
- Moving auth from Better Auth to Clerk/Supabase Auth
- Adding S3/R2 upload logic before the storage ADR/PR
- Introducing BullMQ, Inngest, or a VPS worker “just in case”

Any platform change requires a **new ADR** and a dedicated infrastructure PR — not a drive-by change in PR-002, PR-003, or domain feature work.

---

## Related documents

- [BLUEPRINT.md](../BLUEPRINT.md) — stack and data model
- [AGENTS.md](../../AGENTS.md) — code addition/deletion rules
- [PR-002-auth.md](../prs/PR-002-auth.md) — next PR (Better Auth)
