# PR-003: App shell and navigation

**Branch:** `feat/pr-003-app-shell`  
**Depends on:** PR-002  
**Blocks:** PR-004 (customers)

## Goal

Authenticated mobile-first layout with navigation to placeholder pages — proves the UX skeleton before domain work.

## Scope

### Create

```
src/
├── app/
│   ├── (app)/                       # authenticated layout group
│   │   ├── layout.tsx               # shell: nav + header
│   │   ├── page.tsx                 # dashboard placeholder
│   │   ├── customers/page.tsx
│   │   ├── jobs/page.tsx
│   │   ├── jobs/[id]/page.tsx       # empty state
│   │   ├── calendar/page.tsx
│   │   ├── production/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── bottom-nav.tsx           # mobile
│   │   ├── sidebar.tsx              # md+ only
│   │   └── user-menu.tsx
│   └── ui/                          # shadcn primitives as needed
└── lib/
    └── nav-config.ts                # single source for nav items
```

### Nav items (from blueprint)

| Label | Path | Icon |
|-------|------|------|
| Home | `/` | home |
| Jobs | `/jobs` | briefcase |
| Customers | `/customers` | users |
| Calendar | `/calendar` | calendar |
| More | sheet/menu | menu |

Production, Reports, Settings accessible from More menu or sidebar on desktop.

### Mobile requirements

- Bottom nav fixed, 5 items max on phone
- Viewport meta: `width=device-width`
- Touch targets ≥ 44px
- No horizontal scroll on 375px width
- Active route highlighted

### Pages (placeholders)

Each page shows: title, one-line purpose from blueprint, "Coming in PR-N" note. No API calls to domain.

## Must NOT touch

- Database schema (except none)
- Domain API routes
- Job/customer components with real data

## Acceptance test

1. Log in as admin
2. Navigate every section via bottom nav (mobile 375px)
3. Navigate via sidebar (1280px)
4. Logout from user menu
5. Unauthenticated access to `/jobs` redirects to `/login`

## Automated tests

- Playwright `navigation.spec.ts`:
  - Mobile viewport: tap each nav item, assert URL + heading
  - Desktop viewport: sidebar links work
  - Logout redirects to login

## Rollback

- UI-only revert; no migration

## Review checklist

- [ ] Nav config is single file — no duplicate route lists
- [ ] Layout works on iPhone SE and iPad widths
- [ ] No fetch calls to unbuilt APIs
- [ ] shadcn components minimal count (button, sheet, avatar only if needed)
