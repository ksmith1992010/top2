# Netlify deployment

T.O.P. CRM v2 deploys from [ksmith1992010/top2](https://github.com/ksmith1992010/top2) via Netlify as a Next.js app.

## First-time site setup

Link the GitHub repo in the [Netlify UI](https://app.netlify.com/):

| Setting | Value |
|---------|-------|
| Repository | `ksmith1992010/top2` |
| Production branch | `main` |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | 22 |
| Framework | Next.js |

After linking:

1. Set production env vars (see below) — use staging/preview DB only until production is ready.
2. Trigger a deploy from `main` and confirm the build succeeds.
3. Enable **Deploy previews** for pull requests.
4. For each preview: set `BETTER_AUTH_URL` to the preview hostname, migrate/seed the preview DB from local (see seed gating below), then test login.

Do **not** connect production customer data until domain PRs are stable.

## Build settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | 22 |
| Plugin | `@netlify/plugin-nextjs` |

Configuration lives in [`netlify.toml`](../../netlify.toml) at the repo root.

## Production environment variables

Set these in the Netlify site **Production** context:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon (or other) Postgres connection string |
| `NODE_ENV` | Yes | `production` |
| `BETTER_AUTH_SECRET` | Yes | At least 32 characters; generate a unique secret |
| `BETTER_AUTH_URL` | Yes | Public production URL (e.g. `https://app.example.com`) |

**Do not** set `SEED_DEV_ADMIN=true` in production unless an operator explicitly authorizes it and sets a non-default `SEED_ADMIN_PASSWORD`. The default preview password is never allowed in production.

## Deploy preview environment variables

Set these in the Netlify **Deploy previews** context (or per-branch overrides):

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres for the preview branch (dedicated Neon branch recommended) |
| `NODE_ENV` | Yes | `production` (Netlify builds run in production mode) |
| `BETTER_AUTH_SECRET` | Yes | Preview-specific secret (can match production for simplicity, but a separate value is safer) |
| `BETTER_AUTH_URL` | Yes | Preview deploy URL (e.g. `https://deploy-preview-123--top2.netlify.app`) |

### Preview database setup (manual only)

**Netlify deploy previews do not auto-migrate or auto-seed.** The build deploys the app only. Database setup is a separate, manual step.

Run migrate and seed from a **trusted local or admin shell** (your laptop or an operator-controlled environment with access to the preview `DATABASE_URL`). Do not run these steps inside the Netlify build or an untrusted CI job unless you fully control env vars and understand seed gating below.

1. Export the preview `DATABASE_URL` in that shell (or put it in a root `.env` for Drizzle CLI).
2. Run migrations:
   ```bash
   export DATABASE_URL=postgresql://...
   npm run db:migrate
   ```
3. Run seed **without** `NODE_ENV=production` (local shells default to development):
   ```bash
   npm run db:seed
   ```
4. Set `BETTER_AUTH_URL` in Netlify to the preview hostname and redeploy if it changed.

**Do not** run `npm run db:seed` with `NODE_ENV=production` for preview login unless you also set `SEED_DEV_ADMIN=true` **and** a non-default `SEED_ADMIN_PASSWORD`. The default preview password (`password12345`) is rejected in production-mode seed.

### Seed gating on Netlify (important)

Netlify sets `CONTEXT=deploy-preview` on preview deploys, but seed gating in [`src/lib/db/seed-dev-admin.ts`](../../src/lib/db/seed-dev-admin.ts) does **not** read Netlify `CONTEXT` today — it only checks `VERCEL_ENV` for preview bypass. **This PR does not change seed or auth code.** A future PR may add Netlify-aware seed gating.

Netlify **build/runtime** uses `NODE_ENV=production`. That affects seed behavior if you run seed with production env vars:

| How you seed | Dev admin created? | Default password (`password12345`) allowed? |
|--------------|-------------------|---------------------------------------------|
| Trusted local/admin shell (default `NODE_ENV=development`) against preview `DATABASE_URL` | Yes | Yes — preview/dev seeded environments only |
| `NODE_ENV=production` (no `VERCEL_ENV`, no Netlify `CONTEXT` handling) | **No** — organization + roles only | N/A |
| `NODE_ENV=production` + `SEED_DEV_ADMIN=true` | Yes | **No** — requires explicit non-default `SEED_ADMIN_PASSWORD` |

**Recommended path:** migrate + seed from a trusted local/admin shell pointed at the preview database. Do not rely on Netlify build hooks, deploy scripts, or production-mode seed for preview login.

### Preview login

After manual migrate + seed from a trusted local/admin shell (development seed context):

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password12345` |

These credentials apply **only** to preview/dev environments where seed ran in a context that allows the default dev admin. **Never use `password12345` in production** — production must not depend on the default preview password.

If login fails, confirm migrations ran, seed completed (logs should mention `admin@example.com`), `BETTER_AUTH_URL` matches the preview URL, and the user exists in the preview database.

## Local parity

Use the same build command locally before opening a PR:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```
