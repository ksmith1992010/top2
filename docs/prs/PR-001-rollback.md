# Rollback — PR-001

If this PR must be reverted after merge:

1. Revert the merge commit on `main`.
2. Drop the database (greenfield — no production data expected).
3. Remove Vercel/hosting env vars if a preview was deployed.

No feature flags. No data migration rollback required.

## Manual acceptance test

1. Clone `feat/pr-001-scaffold` and `cp .env.example .env.local`.
2. Start PostgreSQL and set `DATABASE_URL` in `.env.local`.
3. Run `npm install` (or `pnpm install`).
4. Run `npm run db:migrate` — migration `0000_init_auth` applies cleanly.
5. Run `npm run db:seed` — one organization and four roles exist.
6. Run `npm run dev` and open `http://localhost:3000/api/health`.
7. Expect `{"status":"ok","db":"connected"}`.
8. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` — all pass.
