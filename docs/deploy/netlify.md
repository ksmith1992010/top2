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

Preview deploys do **not** run migrations or seed automatically. Before testing login on a preview:

1. Point `DATABASE_URL` at the preview database (dedicated Neon branch recommended).
2. Run migrations from your **local dev shell** (not on Netlify):
   ```bash
   export DATABASE_URL=postgresql://...
   npm run db:migrate
   ```
3. Run seed from the same local shell:
   ```bash
   npm run db:seed
   ```
4. Set `BETTER_AUTH_URL` to the preview hostname in Netlify env vars and redeploy if it changed.

### Seed gating on Netlify (important)

Netlify builds run with `NODE_ENV=production`. The seed script's dev-admin gate ([`src/lib/db/seed-dev-admin.ts`](../../src/lib/db/seed-dev-admin.ts)) currently checks `VERCEL_ENV` for preview bypass — **Netlify `CONTEXT=deploy-preview` is not wired yet**.

| How you seed | Dev admin created? | Default password allowed? |
|--------------|-------------------|---------------------------|
| Local shell (default `NODE_ENV=development`) against preview `DATABASE_URL` | Yes | Yes (`password12345`) |
| `NODE_ENV=production` on Netlify (no `VERCEL_ENV`) | **No** — org + roles only | N/A |
| `NODE_ENV=production` + `SEED_DEV_ADMIN=true` | Yes | **No** — requires non-default `SEED_ADMIN_PASSWORD` |

**Recommended path:** always migrate + seed from your local dev machine pointed at the preview database. Do not rely on Netlify build hooks for seeding.

### Preview login

After migrate + seed (from local dev shell):

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password12345` |

These credentials are for development/preview review only. **Never use the default password in production.**

If login fails, confirm migrations ran, the seed completed (check logs for `admin@example.com`), `BETTER_AUTH_URL` matches the preview URL, and the user exists in the preview database.

## Local parity

Use the same build command locally before opening a PR:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```
