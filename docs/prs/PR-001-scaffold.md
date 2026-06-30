# PR-001: Project scaffold and database foundation

**Branch:** `feat/pr-001-scaffold`  
**Depends on:** nothing  
**Blocks:** PR-002, PR-003

## Goal

Runnable Next.js app with PostgreSQL migrations, CI, and a health check — no business features.

## Scope

### Create

```
top2/
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx          # minimal root
│   │   ├── page.tsx            # redirect or placeholder
│   │   └── api/health/route.ts
│   └── lib/
│       └── db/
│           ├── index.ts        # drizzle client
│           └── schema/
│               ├── organizations.ts
│               ├── users.ts
│               ├── roles.ts
│               └── index.ts
├── drizzle/
│   └── 0000_init_auth.sql      # committed migration
└── tests/
    └── health.test.ts
```

### Database tables (this PR only)

- `organizations`
- `users` (with `organization_id`)
- `roles`
- `role_permissions`
- `user_roles`

Better Auth session/account tables ship in **PR-002**.

Applied schema changes come from Drizzle migrations in `drizzle/`. [docs/schema.sql](../schema.sql) is a forward-looking reference only — not applied directly.

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle migration generate |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed roles (admin, sales, production, accounting) |

### Local environment notes

- **Next.js** (`npm run dev`) loads `.env.local` automatically.
- **Drizzle CLI** (`npm run db:migrate`, `npm run db:seed`, `npm run db:generate`) reads `DATABASE_URL` from the shell environment. Either export it, copy vars to a root `.env` file, or run migrate with `DATABASE_URL` set inline. `.env.local` alone is not enough for Drizzle commands.
- **CI** sets `DATABASE_URL` directly in the workflow.

### CI

On push/PR to `main`:

1. `npm ci`
2. `npm run db:migrate`
3. `npm run lint`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`

## Must NOT touch

- Customer, job, or business domain tables
- Auth login UI (PR-002)
- Navigation shell (PR-003)
- Any integration SDK
- Vercel/Neon production secrets in repo

## Acceptance test

1. Clone repo, copy `.env.example` → `.env.local`, set `DATABASE_URL`
2. Export `DATABASE_URL` (or use a root `.env`) and run `npm install && npm run db:migrate`
3. Run `npm run dev`
4. `GET http://localhost:3000/api/health` returns `{ "status": "ok", "db": "connected" }`
5. `npm test` passes
6. CI green on PR (same command sequence as above, starting with `npm ci`)

## Automated tests

- `health.test.ts`: health route returns 200
- CI runs `npm run db:migrate` against Postgres 16 before lint/test/build

## Rollback

- Revert merge commit
- If deployed: drop database (greenfield; no production data yet)

See also [PR-001-rollback.md](./PR-001-rollback.md).

## Review checklist

- [ ] No business domain code
- [ ] Drizzle schema and `drizzle/0000_init_auth.sql` match for auth tables
- [ ] `.env.example` documents all required vars
- [ ] No secrets committed
