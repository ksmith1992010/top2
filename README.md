# T.O.P. CRM v2

Clean rebuild of the Over The Top Restoration CRM — roofing and storm-restoration lifecycle from lead to closeout.

## Status

**PR-002 auth** — Better Auth login, sessions, roles. See [docs/prs/PR-002-auth.md](./docs/prs/PR-002-auth.md).

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

Seed command (uses Better Auth sign-up — same password hashing as normal users):

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
npm run db:migrate
npm run db:seed
```

**Deploy preview database:** not seeded automatically on deploy. After pointing at a preview database, run `db:migrate` and `db:seed` manually (or via your preview pipeline). Vercel preview deploys with `VERCEL_ENV=preview` allow the dev admin seed; production deploys skip it unless `SEED_DEV_ADMIN=true`.

**If login fails in preview:**

1. Confirm migrations ran against the preview `DATABASE_URL`
2. Run `npm run db:seed` against that database
3. Set `BETTER_AUTH_URL` to the preview URL (e.g. `https://your-preview.vercel.app`)
4. Confirm the user exists: seed logs should mention `admin@example.com`

These credentials are for development/preview review only — not a production backdoor.

## Documents

| Document | Purpose |
|----------|---------|
| [docs/BLUEPRINT.md](./docs/BLUEPRINT.md) | Stack, data model, API, UI, build sequence, risks |
| [docs/API.md](./docs/API.md) | API route reference |
| [docs/schema.sql](./docs/schema.sql) | Forward-looking reference schema (applied changes ship via Drizzle migrations per PR) |
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
