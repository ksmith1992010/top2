# PR-002: Authentication and authorization shell

**Branch:** `feat/pr-002-auth`  
**Depends on:** PR-001  
**Blocks:** PR-003, all domain PRs

## Goal

Email/password login, session cookies, role-based API protection, and a seed admin user.

## Scope

### Create / modify

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (app)/                 # protected shell
│   ├── api/auth/[...all]/     # Better Auth handler
│   ├── api/auth/me/           # current user + roles
│   └── api/admin/users/       # permission stub (501)
├── lib/
│   ├── auth/
│   │   ├── auth.ts
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── roles.ts
│   └── permissions.ts
├── middleware.ts
drizzle/
└── 0001_better_auth.sql       # additive auth tables + user columns
tests/
├── auth-middleware.test.ts
└── permissions.test.ts
```

### Permissions (seed)

| Role | Permissions |
|------|-------------|
| admin | `*` |
| sales | `customers:*`, `jobs:*`, `appointments:*`, `job_events:*` |
| production | `jobs:read`, `jobs:transition:production`, `production:*`, `appointments:*` |
| accounting | `jobs:read`, `invoices:*`, `payments:*` |

Permission format: `resource:action` or `resource:*`.

### API routes (this PR)

| Route | Purpose |
|-------|---------|
| `POST /api/auth/*` | Better Auth |
| `GET /api/auth/me` | Current user + role permissions |
| `POST /api/admin/users` | Permission stub (501 for admin, 403 for sales) |

## Must NOT touch

- Jobs, customers, appointments tables or routes
- App navigation shell beyond login + minimal header
- OAuth providers (later)

## Acceptance test

1. Set env (see `.env.example`). Drizzle CLI needs `DATABASE_URL` in the shell or root `.env` — not `.env.local` alone.
2. Run migrations and seed:

   ```bash
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/top2
   npm run db:migrate
   npm run db:seed
   ```

3. Start app: `npm run dev`
4. Open `/login`, sign in as `admin@top.local`
   - Default dev password: `top-local-admin` (override with `SEED_ADMIN_PASSWORD`)
5. `GET /api/auth/me` returns user with `admin` role
6. Hit protected route without session → 401 (API) or redirect to `/login` (pages)
7. Sales user without `users:create` gets 403 on `POST /api/admin/users` (stub)

## Automated tests

- Unit: `hasPermission()` matrix
- Unit: middleware public/protected behavior
- E2E login smoke deferred to PR-003 (Playwright not wired yet)

## Migration notes

**`0001_better_auth.sql`** (additive only):

- Adds `email_verified`, `image` to `users`
- Creates `session`, `account`, `verification` tables for Better Auth
- Does **not** edit `0000_init_auth.sql`

**Rollback:** revert PR commit; drop `session`, `account`, `verification`; remove added `users` columns if rolling back before dependent data exists. Existing sessions invalidated on redeploy (acceptable).

## Review checklist

- [ ] Session httpOnly, secure in production
- [ ] Password hashing via Better Auth defaults
- [ ] No hardcoded production credentials
- [ ] Permission helper is the only authz check pattern documented
- [ ] Redundancy / data safety short block in PR description
