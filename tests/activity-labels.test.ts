import { describe, expect, it } from "vitest";
import { formatActivitySummary } from "@/lib/activity-labels";

describe("formatActivitySummary", () => {
  it("formats known event types without dumping payload", () => {
    expect(formatActivitySummary("customer.created", { jobNumber: "TOP-2026-0001" })).toBe(
      "Lead created",
    );
    expect(formatActivitySummary("customer.updated", {})).toBe("Customer details updated");
    expect(
      formatActivitySummary("job.status_changed", {
        from: "lead",
        to: "inspection_scheduled",
      }),
    ).toBe("Status changed from New Lead to Inspection Scheduled");
  });

  it("uses a safe fallback for unknown event types", () => {
    expect(formatActivitySummary("mystery.event", { secret: "nope" })).toBe("Activity recorded");
  });
});
