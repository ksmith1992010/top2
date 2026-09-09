# PR-009: Pipeline board foundation

**Branch:** `feat/pr-009-pipeline-board`  
**Depends on:** PR-008 job activity timeline  
**Status:** Merged — GitHub #17, commit `9d1bcc9`

## Goal

Show jobs grouped by stage on `/jobs/board` using existing statuses and labels.

## Scope

- Org-scoped `listJobsBoard` query — every live job, grouped by status, no per-column cap
- Deterministic card order: `updated_at DESC`, `id DESC` as tie-breaker
- Horizontal pipeline board UI
- List / Board toggle on jobs pages
- Links into existing job detail (status changes stay on detail)

## Out of scope

- Drag/drop, new write paths, transition rules
- Production/materials/payments, claim fields, assignments
- Migrations, auth/invite, MCP hub, integrations
