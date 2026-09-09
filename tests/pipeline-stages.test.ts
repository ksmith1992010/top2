import { describe, expect, it } from "vitest";
import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";
import {
  PIPELINE_STAGES,
  STAGE_ENTRY_STATUS,
  STAGE_LABELS,
  STAGE_SHORT_LABELS,
  STAGE_STATUSES,
  STATUS_TO_STAGE,
  stageForStatus,
} from "@/lib/pipeline-stages";

describe("pipeline stages", () => {
  it("maps every job status to a stage", () => {
    for (const status of JOB_STATUSES) {
      expect(PIPELINE_STAGES).toContain(STATUS_TO_STAGE[status]);
    }

    // Guards against a status being added to the enum and silently dropping off
    // the board, which the type system alone cannot catch at runtime.
    expect(Object.keys(STATUS_TO_STAGE).sort()).toEqual([...JOB_STATUSES].sort());
  });

  it("partitions the statuses — none missing, none in two stages", () => {
    const grouped = PIPELINE_STAGES.flatMap((stage) => STAGE_STATUSES[stage]);

    expect(grouped).toHaveLength(JOB_STATUSES.length);
    expect(new Set(grouped).size).toBe(JOB_STATUSES.length);
    expect([...grouped].sort()).toEqual([...JOB_STATUSES].sort());
  });

  it("gives every stage an entry status that maps back to itself", () => {
    for (const stage of PIPELINE_STAGES) {
      const entry = STAGE_ENTRY_STATUS[stage];
      expect(STATUS_TO_STAGE[entry]).toBe(stage);
      expect(STAGE_STATUSES[stage]).toContain(entry);
    }
  });

  it("labels every stage in both long and short form", () => {
    for (const stage of PIPELINE_STAGES) {
      expect(STAGE_LABELS[stage]).toBeTruthy();
      expect(STAGE_SHORT_LABELS[stage]).toBeTruthy();
    }

    expect(STAGE_SHORT_LABELS.money).toBe("$");
    expect(STAGE_LABELS.money).toBe("$ — Money / Collections");
  });

  it("keeps the pipeline in field order", () => {
    expect([...PIPELINE_STAGES]).toEqual([
      "lead",
      "ci",
      "adj_mt",
      "dr",
      "ctr",
      "mo",
      "wo",
      "money",
      "closed",
    ]);
  });

  it("collapses the thirteen statuses into the agreed nine stages", () => {
    const expected: Record<JobStatus, string> = {
      lead: "lead",
      inspection_scheduled: "ci",
      inspection_complete: "ci",
      claim_filed: "adj_mt",
      adjuster_meeting_scheduled: "adj_mt",
      approved: "dr",
      contract_signed: "ctr",
      material_ordered: "mo",
      production_scheduled: "wo",
      installed: "wo",
      invoiced: "money",
      paid: "money",
      closed: "closed",
    };

    for (const status of JOB_STATUSES) {
      expect(stageForStatus(status)).toBe(expected[status]);
    }
  });
});
