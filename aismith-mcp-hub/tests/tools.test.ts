import { describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../src/config.js";
import type { Env } from "../src/env.js";
import { AppError } from "../src/errors.js";
import type { GitHubClient } from "../src/github/client.js";
import { createMcpServer } from "../src/mcp.js";
import { registerTools } from "../src/tools/register.js";
import { sanitizeForLog } from "../src/errors.js";

function testEnv(overrides: Partial<Env> = {}): Env {
  return {
    MCP_BEARER_TOKEN: "test-bearer",
    GITHUB_TOKEN: "test-github",
    GITHUB_OWNER: "ksmith1992010",
    GITHUB_ALLOWED_REPOS: "demo-app",
    ENABLE_CREATE_GITHUB_ISSUE: "false",
    ...overrides,
  };
}

function mockGithub(partial: Partial<GitHubClient> = {}): GitHubClient {
  return {
    readFile: vi.fn(),
    searchCode: vi.fn(),
    createIssue: vi.fn(),
    ...partial,
  } as unknown as GitHubClient;
}

describe("tool registration", () => {
  it("registers read-only tools by default and omits create_github_issue", () => {
    const config = loadConfig(testEnv());
    const server = createMcpServer(config, mockGithub());
    const tools = server["_registeredTools"] as Record<string, unknown>;

    expect(Object.keys(tools).sort()).toEqual([
      "list_allowed_repositories",
      "read_repository_file",
      "search_repository_code",
    ]);
  });

  it("registers create_github_issue only when enabled", () => {
    const config = loadConfig(
      testEnv({ ENABLE_CREATE_GITHUB_ISSUE: "true" }),
    );
    const server = createMcpServer(config, mockGithub());
    const tools = server["_registeredTools"] as Record<string, unknown>;

    expect(Object.keys(tools)).toContain("create_github_issue");
  });
});

describe("read_repository_file validation", () => {
  it("rejects path traversal and absolute paths", async () => {
    const config = loadConfig(testEnv());
    const github = mockGithub({
      readFile: vi.fn(async () => {
        throw new Error("should not call github");
      }),
    });

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerTools(server, config, github);

    const tool = (
      server["_registeredTools"] as Record<
        string,
        { handler: (args: Record<string, unknown>) => Promise<unknown> }
      >
    ).read_repository_file;

    const result = (await tool!.handler({
      repo: "demo-app",
      path: "../secrets.txt",
    })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };

    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as {
      error: { code: string };
    };
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(github.readFile).not.toHaveBeenCalled();
  });

  it("rejects repositories outside the allowlist before calling GitHub", async () => {
    const config = loadConfig(testEnv());
    const github = mockGithub({
      readFile: vi.fn(async () => {
        throw new Error("should not call github");
      }),
    });

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerTools(server, config, github);
    const tool = (
      server["_registeredTools"] as Record<
        string,
        { handler: (args: Record<string, unknown>) => Promise<unknown> }
      >
    ).read_repository_file;

    const result = (await tool!.handler({
      repo: "not-allowed",
      path: "README.md",
    })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };

    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]!.text) as {
      error: { code: string };
    };
    expect(payload.error.code).toBe("REPO_NOT_ALLOWED");
    expect(github.readFile).not.toHaveBeenCalled();
  });

  it("returns file content for allowlisted repos", async () => {
    const config = loadConfig(testEnv());
    const github = mockGithub({
      readFile: vi.fn(async () => ({
        path: "README.md",
        sha: "abc",
        size: 12,
        encoding: "base64",
        content: "# Hello",
        htmlUrl: "https://github.com/ksmith1992010/demo-app/blob/main/README.md",
      })),
    });

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerTools(server, config, github);
    const tool = (
      server["_registeredTools"] as Record<
        string,
        { handler: (args: Record<string, unknown>) => Promise<unknown> }
      >
    ).read_repository_file;

    const result = (await tool!.handler({
      repo: "demo-app",
      path: "README.md",
    })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0]!.text) as {
      repository: string;
      content: string;
    };
    expect(payload.repository).toBe("ksmith1992010/demo-app");
    expect(payload.content).toBe("# Hello");
  });
});

describe("create_github_issue gating", () => {
  it("is not callable when the feature flag is off", () => {
    const config = loadConfig(testEnv({ ENABLE_CREATE_GITHUB_ISSUE: "false" }));
    expect(config.enableCreateGithubIssue).toBe(false);
    const server = createMcpServer(config, mockGithub());
    const tools = server["_registeredTools"] as Record<string, unknown>;
    expect(tools.create_github_issue).toBeUndefined();
  });
});

describe("sanitizeForLog", () => {
  it("redacts tokens and authorization values", () => {
    const sanitized = sanitizeForLog({
      authorization: "Bearer super-secret",
      nested: { githubToken: "github_pat_ABC123_secret" },
      message: "Authorization Bearer leaked-token-value failed",
    }) as Record<string, unknown>;

    expect(sanitized.authorization).toBe("[REDACTED]");
    expect((sanitized.nested as Record<string, unknown>).githubToken).toBe(
      "[REDACTED]",
    );
    expect(String(sanitized.message)).toContain("[REDACTED]");
    expect(String(sanitized.message)).not.toContain("leaked-token-value");
  });
});

describe("AppError structured shape", () => {
  it("preserves code and status", () => {
    const error = new AppError("REPO_NOT_ALLOWED", "nope", 403, {
      repository: "a/b",
    });
    expect(error.code).toBe("REPO_NOT_ALLOWED");
    expect(error.status).toBe(403);
    expect(error.details).toEqual({ repository: "a/b" });
  });
});
