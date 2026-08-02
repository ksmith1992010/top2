# T.O.P. CRM v2

Clean rebuild of the Over The Top Restoration CRM. Product UI name: **RoofRun** — run every roof from lead to paid.

## Status

**Live on main:** Better Auth login/sessions/roles, dark app shell, invite-only registration, public request-access page, and lead intake (customers / properties / jobs schema). Jobs board, production, calendar, documents, and reports are still placeholders.

Engineering history: [docs/prs/](./docs/prs/) · product plan: [docs/BLUEPRINT.md](./docs/BLUEPRINT.md).

## Local setup

```bash
cp .env.example .env.local
# Edit DATABASE_URL
npm install
# Drizzle CLI needs DATABASE_URL in the shell or a root .env (not .env.local alone):
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
npm run db:migrate
npm run db:seed
npm run dev
```

Sign in at `/login` with the seeded dev admin (see [Preview login](#preview-login) below).

**Environment notes:** Next.js loads `.env.local` for `npm run dev`. Drizzle commands (`db:migrate`, `db:seed`, `db:generate`) read `DATABASE_URL` from the process environment. CI sets `DATABASE_URL` directly in GitHub Actions.

Health check: `GET http://localhost:3000/api/health`

## Preview login

Auth protects the app, so deploy previews require login.

**Seeded dev admin** (development / preview / non-production only):

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password12345` |

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
npm run db:migrate
npm run db:seed
```

**Deploy preview database:** not seeded automatically on deploy. After pointing at a preview database, run `db:migrate` and `db:seed` manually from your local dev shell. See [docs/deploy/netlify.md](./docs/deploy/netlify.md). Production never uses the default preview password — set `SEED_DEV_ADMIN=true` and a non-default `SEED_ADMIN_PASSWORD` only when an operator intentionally seeds production.

**If login fails in preview:**

1. Confirm migrations ran against the preview `DATABASE_URL`
2. Run `npm run db:seed` against that database
3. Set `BETTER_AUTH_URL` to the preview URL
4. Confirm seed logs mention `admin@example.com`

These credentials are for development/preview review only — not a production backdoor.

## Documents

| Document | Purpose |
|----------|---------|
| [docs/BLUEPRINT.md](./docs/BLUEPRINT.md) | Stack, data model, API, UI, build sequence, risks |
| [docs/API.md](./docs/API.md) | API route reference (implemented + planned) |
| [docs/schema.sql](./docs/schema.sql) | Forward-looking reference schema (applied changes ship via Drizzle migrations) |
| [docs/prs/](./docs/prs/) | Historical PR specs (PR-001–003) |
| [docs/deploy/netlify.md](./docs/deploy/netlify.md) | Netlify deployment, preview env vars, seed caveats |
| [docs/decisions/ADR-001-hosting-database.md](./docs/decisions/ADR-001-hosting-database.md) | Hosting and database decisions |
| [AGENTS.md](./AGENTS.md) | Rules for humans and AI agents working in this repo |

## Principles

- **Job-centric.** Every workflow orbits the job lifecycle.
- **One mutation path.** No duplicate ways to update the same business object.
- **Events over hacks.** KU, CI, and lifecycle changes are logged on the activity timeline.
- **Small PRs.** Each change is reviewable, testable, and reversible.

## Job lifecycle

Lead → Inspection Scheduled → Inspection Complete → Claim Filed → Adjuster Meeting Scheduled → Approved → Contract Signed → Material Ordered → Production Scheduled → Installed → Invoiced → Paid → Closed

## Early PRs (landed)

Scaffold, auth, and app shell: [docs/BLUEPRINT.md#first-3-prs](./docs/BLUEPRINT.md#first-3-prs). Later merges on main added invite-only registration, request-access, and lead intake — see GitHub history for #8–#10.
