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
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── api/auth/[...all]/route.ts   # Better Auth handler
│   └── middleware.ts                # protect /api/* and app routes
├── lib/
│   ├── auth/
│   │   ├── server.ts
│   │   └── client.ts
│   └── permissions.ts               # hasPermission(user, 'jobs:read')
└── domain/
    └── commands/                    # empty placeholder dir OK
drizzle/
└── seed.ts                          # admin user + roles
tests/
├── auth-middleware.test.ts
└── permissions.test.ts
e2e/
└── login.spec.ts
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

## Must NOT touch

- Jobs, customers, appointments tables or routes
- App navigation shell beyond login page
- OAuth providers (later)

## Acceptance test

1. Run seed: `pnpm db:seed`
2. Open `/login`, sign in as `admin@top.local` (password from seed docs)
3. `GET /api/auth/me` returns user with `admin` role
4. Hit protected route without session → 401
5. Create test user with `sales` role, verify 403 on `POST /api/admin/users` (route stub OK)

## Automated tests

- Unit: `hasPermission()` matrix
- Unit: middleware rejects unauthenticated requests
- E2E: login happy path (Playwright)

## Rollback

- Revert commit; existing sessions invalidated on redeploy (acceptable)
- No data migration rollback needed

## Review checklist

- [ ] Session httpOnly, secure in production
- [ ] Password hashing via Better Auth defaults (bcrypt/argon2)
- [ ] No hardcoded production credentials
- [ ] Permission helper is the only authz check pattern documented
