import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

vi.mock("@/lib/db", () => ({
  checkDbConnection: vi.fn(),
}));

import { checkDbConnection } from "@/lib/db";

describe("GET /api/health", () => {
  it("returns ok when database is connected", async () => {
    vi.mocked(checkDbConnection).mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok", db: "connected" });
  });

  it("returns 503 when database is disconnected", async () => {
    vi.mocked(checkDbConnection).mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ status: "error", db: "disconnected" });
  });
});
