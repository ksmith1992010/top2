import { describe, expect, it } from "vitest";
import { MAX_JOB_SEARCH_LENGTH, normalizeJobSearch } from "@/lib/job-search";
import { resolveJobStatus } from "@/lib/job-status";

describe("resolveJobStatus", () => {
  it("accepts known statuses and rejects unknown values", () => {
    expect(resolveJobStatus("lead")).toBe("lead");
    expect(resolveJobStatus("claim_filed")).toBe("claim_filed");
    expect(resolveJobStatus(undefined)).toBeUndefined();
    expect(resolveJobStatus("")).toBeUndefined();
    expect(resolveJobStatus("not_a_status")).toBeUndefined();
  });
});

describe("normalizeJobSearch", () => {
  it("trims blanks to no search", () => {
    expect(normalizeJobSearch(undefined)).toBeUndefined();
    expect(normalizeJobSearch("   ")).toBeUndefined();
    expect(normalizeJobSearch("  Dallas  ")).toBe("Dallas");
  });

  it("caps long search strings", () => {
    const long = `x${"a".repeat(MAX_JOB_SEARCH_LENGTH + 50)}`;
    const normalized = normalizeJobSearch(long);
    expect(normalized?.length).toBe(MAX_JOB_SEARCH_LENGTH);
  });
});
