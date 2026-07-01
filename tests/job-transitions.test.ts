import { describe, expect, it } from "vitest";
import { canTransitionJob, requiresTransitionReason } from "@/domain/job-transitions";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/db/schema/enums";

describe("job transitions", () => {
  it("allows forward step transitions", () => {
    expect(canTransitionJob("lead", "inspection_scheduled")).toBe(true);
    expect(canTransitionJob("inspection_scheduled", "inspected")).toBe(true);
  });

  it("blocks backward transitions", () => {
    expect(canTransitionJob("inspected", "lead")).toBe(false);
  });

  it("allows lost from non-terminal statuses", () => {
    expect(canTransitionJob("approved", "lost")).toBe(true);
    expect(canTransitionJob("closed", "lost")).toBe(false);
  });

  it("requires closed only from collected", () => {
    expect(canTransitionJob("collected", "closed")).toBe(true);
    expect(canTransitionJob("installed", "closed")).toBe(false);
  });

  it("requires reason for lost", () => {
    expect(requiresTransitionReason("lead", "lost")).toBe(true);
  });

  it("defines labels for every status", () => {
    for (const status of JOB_STATUSES) {
      expect(JOB_STATUS_LABELS[status]).toBeTruthy();
    }
    expect(JOB_STATUSES).toHaveLength(12);
  });
});
