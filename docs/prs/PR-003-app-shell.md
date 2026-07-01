# PR-003: App shell and navigation

**Branch:** `feat/pr-003-app-shell`  
**Depends on:** PR-002 (landed on `main` at `a2867d3`)  
**Blocks:** PR-004 (customers / leads domain)

## Goal

Authenticated mobile-first layout with navigation to placeholder pages — proves the T.O.P. workspace skeleton before CRM domain work.

## Scope

### Create / modify

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx              # session gate + AppShell
│   │   ├── loading.tsx             # shell loading state
│   │   ├── page.tsx                # dashboard placeholder cards
│   │   ├── leads/page.tsx
│   │   ├── jobs/page.tsx
│   │   ├── production/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── reports/page.tsx
│   │   └── admin/page.tsx
│   ├── globals.css                 # Tailwind + shell tokens
│   └── layout.tsx                  # import globals, viewport
├── components/
│   └── layout/
│       ├── app-shell.tsx
│       ├── sidebar.tsx
│       ├── bottom-nav.tsx
│       ├── mobile-more-menu.tsx
│       └── user-menu.tsx
└── lib/
    └── nav-config.ts               # single source for nav items
```

### Nav items (placeholders only)

| Label | Path | Mobile bottom |
|-------|------|---------------|
| Dashboard | `/` | Yes |
| Leads | `/leads` | Yes |
| Jobs | `/jobs` | Yes |
| Calendar | `/calendar` | Yes |
| Production | `/production` | More menu |
| Documents | `/documents` | More menu |
| Reports | `/reports` | More menu |
| Admin | `/admin` | More menu |

Desktop: full sidebar with all items. Mobile: 4 primary tabs + **More** overflow (max 5 touch targets).

### Pages (placeholders)

Each section page shows title, one-line purpose, and “Coming in a later PR” note. **No domain API calls.**

Dashboard shows static placeholder metric cards (no data fetch).

### Mobile requirements

- Bottom nav fixed on `md` breakpoint and below
- Viewport meta: `width=device-width`
- Touch targets ≥ 44px
- No horizontal scroll at 375px
- Active route highlighted

## Must NOT touch

- Database schema or migrations
- Domain API routes or commands
- Job/customer/claim/invoice/production data models
- Integrations, PDF, AI, PWA, workers, v1 migration

## Acceptance test

1. Log in as admin
2. Navigate every section via bottom nav + More menu (375px)
3. Navigate via sidebar (1280px)
4. Log out from user menu
5. Unauthenticated `/jobs` redirects to `/login`

## Automated tests

- Vitest `nav-config.test.ts`: unique paths, expected labels, mobile split
- Vitest middleware tests (existing) still pass
- Playwright navigation E2E deferred until Playwright is wired in a later PR

## Rollback

UI-only revert; no migration.

## Review checklist

- [ ] Nav config is single file — no duplicate route lists
- [ ] Layout works on phone and desktop widths
- [ ] No fetch calls to unbuilt domain APIs
- [ ] Redundancy / data safety short block in PR description

## PR merge

Use `gh pr merge <N> --squash --delete-branch` or GitHub UI squash merge. Do not direct-push squash to `main` with `Closes #`.
