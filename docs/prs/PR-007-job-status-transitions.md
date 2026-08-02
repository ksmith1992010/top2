# PR-007: Job status transition foundation

**Branch:** `feat/pr-007-job-status-transitions`  
**Depends on:** PR-006 jobs read-layer hardening  
**Status:** One write path — status only

## Goal

Add the first controlled job write after lead intake: update `jobs.status` through one command + thin API + simple job detail control.

## Scope

- `updateJobStatusCommand` (org-scoped, soft-delete aware, transactional activity)
- `PATCH /api/jobs/[id]/status` (`jobs:transition`)
- Job detail pipeline status control
- Zod validation for canonical statuses

## Out of scope

- Transition skip rules / reason engine
- Kanban, production, materials, documents, payments
- Job create/edit beyond status
- Migrations, auth/invite, MCP hub, integrations
