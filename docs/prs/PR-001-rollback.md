# Rollback — PR-001

If this PR must be reverted after merge:

1. Revert the merge commit on `main`.
2. Drop the database (greenfield — no production data expected).
3. Remove Vercel/hosting env vars if a preview was deployed.

No feature flags. No data migration rollback required.

## Manual acceptance test

1. Clone `feat/pr-001-scaffold` and `cp .env.example .env.local`.
2. Start PostgreSQL and set `DATABASE_URL` in `.env.local`.
3. Export `DATABASE_URL` for Drizzle (see [PR-001-scaffold.md](./PR-001-scaffold.md#local-environment-notes)) — `.env.local` is loaded by Next.js only, not by `db:migrate`.
4. Run `npm ci` (or `npm install` locally).
5. Run `npm run db:migrate` — migration `0000_init_auth.sql` applies cleanly.
6. Run `npm run db:seed` — one organization and four roles exist.
7. Run `npm run dev` and open `http://localhost:3000/api/health`.
8. Expect `{"status":"ok","db":"connected"}`.
9. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` — all pass.

CI runs the same checks in order: `npm ci` → `db:migrate` → `lint` → `typecheck` → `test` → `build`.
