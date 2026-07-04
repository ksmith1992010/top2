import { describe, expect, it } from "vitest";
import { updateJobSchema } from "@/domain/schemas/job";
import { parseJobStatus } from "@/domain/queries/list-jobs";

describe("updateJobSchema", () => {
  it("accepts an empty patch", () => {
    expect(updateJobSchema.parse({})).toEqual({});
  });

  it("accepts valid fields", () => {
    expect(
      updateJobSchema.parse({
        notes: "  spoke with adjuster  ",
        leadSource: "door_knock",
        stormDate: "2026-06-15",
        jobType: "retail",
      }),
    ).toEqual({
      notes: "spoke with adjuster",
      leadSource: "door_knock",
      stormDate: "2026-06-15",
      jobType: "retail",
    });
  });

  it("accepts null stormDate to clear it", () => {
    expect(updateJobSchema.parse({ stormDate: null })).toEqual({ stormDate: null });
  });

  it("rejects malformed stormDate", () => {
    expect(() => updateJobSchema.parse({ stormDate: "06/15/2026" })).toThrow();
  });

  it("rejects unknown jobType", () => {
    expect(() => updateJobSchema.parse({ jobType: "commercial" })).toThrow();
  });
});

describe("parseJobStatus", () => {
  it("returns a known status", () => {
    expect(parseJobStatus("material_ordered")).toBe("material_ordered");
  });

  it("returns undefined for unknown or missing values", () => {
    expect(parseJobStatus("not_a_status")).toBeUndefined();
    expect(parseJobStatus(undefined)).toBeUndefined();
  });
});
