import { describe, expect, it, vi, afterEach } from "vitest";
import worker from "../src/index.js";
import type { Env } from "../src/env.js";
import { resetRateLimitersForTests } from "../src/rate-limit.js";

const env: Env = {
  MCP_BEARER_TOKEN: "test-bearer-token",
  GITHUB_TOKEN: "test-github-token",
  GITHUB_OWNER: "ksmith1992010",
  GITHUB_ALLOWED_REPOS: "demo-app",
  ENABLE_CREATE_GITHUB_ISSUE: "false",
  RATE_LIMIT_MAX_REQUESTS: "100",
  RATE_LIMIT_WINDOW_MS: "60000",
};

function makeCtx(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
    props: {},
  } as unknown as ExecutionContext;
}

describe("HTTP worker routes", () => {
  afterEach(() => {
    resetRateLimitersForTests();
    vi.restoreAllMocks();
  });

  it("GET /health returns JSON status without auth", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/health"),
      env,
      makeCtx(),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      service: string;
      endpoints: { mcp: string };
    };
    expect(body.service).toBe("AIsmith MCP HUB");
    expect(body.status).toBe("ok");
    expect(body.endpoints.mcp).toBe("/mcp");
  });

  it("rejects /mcp without a bearer token", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "0.0.0" },
          },
        }),
      }),
      env,
      makeCtx(),
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as {
      error: { code: string };
    };
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("accepts authenticated MCP initialize", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: "Bearer test-bearer-token",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "0.0.0" },
          },
        }),
      }),
      env,
      makeCtx(),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      result?: { serverInfo?: { name?: string } };
      error?: unknown;
    };
    expect(body.error).toBeUndefined();
    expect(body.result?.serverInfo?.name).toBe("AIsmith MCP HUB");
  });
});
