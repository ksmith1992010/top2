import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "@/domain/activity-format";

describe("formatActivityEvent", () => {
  it("formats lead creation with job number", () => {
    expect(formatActivityEvent("customer.created", { jobNumber: "TOP-2026-0042" })).toEqual({
      title: "Lead created",
      detail: "Job TOP-2026-0042 opened",
    });
  });

  it("formats a plain status change", () => {
    expect(
      formatActivityEvent("job.status_changed", {
        from: "lead",
        to: "inspection_scheduled",
        reason: null,
        skippedStages: [],
      }),
    ).toEqual({
      title: "Status: New Lead → Inspection Scheduled",
      detail: null,
    });
  });

  it("formats a skip transition with reason and skipped stages", () => {
    expect(
      formatActivityEvent("job.status_changed", {
        from: "inspection_complete",
        to: "contract_signed",
        reason: "retail_cash_job",
        skippedStages: ["claim_filed", "adjuster_meeting_scheduled", "approved"],
      }),
    ).toEqual({
      title: "Status: Inspection Complete → Contract Signed",
      detail:
        "Reason: retail_cash_job · Skipped: Claim Filed, Adjuster Meeting Scheduled, Approved",
    });
  });

  it("formats job field updates", () => {
    expect(formatActivityEvent("job.updated", { fields: ["notes", "stormDate"] })).toEqual({
      title: "Job details updated",
      detail: "Changed: notes, stormDate",
    });
  });

  it("falls back to the raw event type for unknown events", () => {
    expect(formatActivityEvent("invoice.sent", {})).toEqual({
      title: "invoice.sent",
      detail: null,
    });
  });
});
