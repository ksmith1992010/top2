import { describe, expect, it } from "vitest";
import { checkTransition, JOB_PIPELINE_ORDER } from "@/domain/job-transitions";

describe("checkTransition", () => {
  it("orders the pipeline lead → closed", () => {
    expect(JOB_PIPELINE_ORDER[0]).toBe("lead");
    expect(JOB_PIPELINE_ORDER[JOB_PIPELINE_ORDER.length - 1]).toBe("closed");
    expect(JOB_PIPELINE_ORDER).toHaveLength(13);
  });

  it("allows forward-by-one with no reason", () => {
    const check = checkTransition("lead", "inspection_scheduled");
    expect(check).toEqual({
      ok: true,
      direction: "forward",
      skippedStages: [],
      requiresReason: false,
      requiresAdmin: false,
    });
  });

  it("allows forward skips but requires a reason and reports skipped stages", () => {
    const check = checkTransition("inspection_complete", "contract_signed");
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.direction).toBe("forward");
      expect(check.requiresReason).toBe(true);
      expect(check.skippedStages).toEqual([
        "claim_filed",
        "adjuster_meeting_scheduled",
        "approved",
      ]);
    }
  });

  it("requires admin and a reason for backward moves", () => {
    const check = checkTransition("approved", "claim_filed");
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.direction).toBe("backward");
      expect(check.requiresAdmin).toBe(true);
      expect(check.requiresReason).toBe(true);
      expect(check.skippedStages).toEqual([]);
    }
  });

  it("treats reopening a closed job as a backward move", () => {
    const check = checkTransition("closed", "invoiced");
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.direction).toBe("backward");
      expect(check.requiresAdmin).toBe(true);
    }
  });

  it("rejects a no-op transition", () => {
    const check = checkTransition("lead", "lead");
    expect(check).toEqual({
      ok: false,
      code: "NO_CHANGE",
      message: "Job is already in that status",
    });
  });

  it("allows the full retail path lead → closed with reasons on skips", () => {
    const retailHops: Array<[string, string, boolean]> = [
      ["lead", "inspection_scheduled", false],
      ["inspection_scheduled", "inspection_complete", false],
      ["inspection_complete", "contract_signed", true],
      ["contract_signed", "material_ordered", false],
      ["material_ordered", "production_scheduled", false],
      ["production_scheduled", "installed", false],
      ["installed", "invoiced", false],
      ["invoiced", "paid", false],
      ["paid", "closed", false],
    ];

    for (const [from, to, needsReason] of retailHops) {
      const check = checkTransition(from as never, to as never);
      expect(check.ok).toBe(true);
      if (check.ok) {
        expect(check.requiresReason).toBe(needsReason);
      }
    }
  });
});
