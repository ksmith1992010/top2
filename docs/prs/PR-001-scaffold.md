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
│               ├── users.ts
│               ├── roles.ts
│               └── index.ts
├── drizzle/
│   └── 0001_init_auth.sql      # generated migration
└── tests/
    └── health.test.ts
```

### Database tables (this PR only)

- `users`
- `roles`
- `role_permissions`
- `user_roles`
- Better Auth session/account tables (per Better Auth docs)

### Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Drizzle migration generate |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed roles (admin, sales, production, accounting) |

### CI

On push/PR to `main`:

1. Install deps (`pnpm install --frozen-lockfile`)
2. Lint
3. Typecheck
4. Test
5. Build

## Must NOT touch

- Customer, job, or business domain tables
- Auth login UI (PR-002)
- Navigation shell (PR-003)
- Any integration SDK
- Vercel/Neon production secrets in repo

## Acceptance test

1. Clone repo, copy `.env.example` → `.env.local`, set `DATABASE_URL`
2. Run `pnpm install && pnpm db:migrate && pnpm dev`
3. `GET http://localhost:3000/api/health` returns `{ "status": "ok", "db": "connected" }`
4. `pnpm test` passes
5. CI green on PR

## Automated tests

- `health.test.ts`: health route returns 200
- Optional: migration applies on empty Postgres (docker-compose in CI or testcontainers)

## Rollback

- Revert merge commit
- If deployed: drop database (greenfield; no production data yet)

## Review checklist

- [ ] No business domain code
- [ ] Drizzle schema matches [schema.sql](./schema.sql) auth section
- [ ] `.env.example` documents all required vars
- [ ] No secrets committed
