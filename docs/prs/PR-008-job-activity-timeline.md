# PR-008: Job activity timeline foundation

**Branch:** `feat/pr-008-job-activity-timeline`  
**Depends on:** PR-007 status transitions  
**Status:** Read-only timeline UI

## Goal

Show job history from existing `activity_events` on `/jobs/[id]`.

## Scope

- Org-scoped `listJobActivity` query (bounded)
- Safe human-readable event summaries
- Activity section on job detail (replaces placeholder)
- Includes job-linked events + customer-level events (`jobId` null)

## Out of scope

- Pipeline board, new writes, transition rule changes
- REST timeline route (page reads via domain query)
- Production/materials/payments, migrations, auth, MCP hub
