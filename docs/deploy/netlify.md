# Netlify deployment

T.O.P. CRM v2 deploys from [ksmith1992010/top2](https://github.com/ksmith1992010/top2) via Netlify as a Next.js app.

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

1. Point `DATABASE_URL` at the preview database.
2. Run migrations: `npm run db:migrate` (with `DATABASE_URL` exported or in root `.env`).
3. Run seed: `npm run db:seed`.
4. Set `BETTER_AUTH_URL` to the preview hostname and redeploy if it changed.

### Preview login

After migrate + seed:

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password12345` |

If login fails, confirm migrations ran, the seed completed, `BETTER_AUTH_URL` matches the preview URL, and `admin@example.com` exists in the preview database.

## Local parity

Use the same build command locally before opening a PR:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```
