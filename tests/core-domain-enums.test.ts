import { describe, expect, it } from "vitest";
import { JOB_STATUSES } from "@/lib/db/schema/enums";

describe("core domain enums", () => {
  it("defines the blueprint job_status lifecycle", () => {
    expect(JOB_STATUSES).toEqual([
      "lead",
      "inspection_scheduled",
      "inspection_complete",
      "claim_filed",
      "adjuster_meeting_scheduled",
      "approved",
      "contract_signed",
      "material_ordered",
      "production_scheduled",
      "installed",
      "invoiced",
      "paid",
      "closed",
    ]);
  });
});
