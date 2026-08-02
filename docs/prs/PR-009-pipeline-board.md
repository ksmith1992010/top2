# PR-009: Pipeline board foundation

**Branch:** `feat/pr-009-pipeline-board`  
**Depends on:** PR-008 job activity timeline  
**Status:** Read-only board UI

## Goal

Show jobs grouped by stage on `/jobs/board` using existing statuses and labels.

## Scope

- Org-scoped `listJobsBoard` query (counts + per-column newest jobs)
- Horizontal pipeline board UI
- List / Board toggle on jobs pages
- Links into existing job detail (status changes stay on detail)

## Out of scope

- Drag/drop, new write paths, transition rules
- Production/materials/payments, claim fields, assignments
- Migrations, auth/invite, MCP hub, integrations
