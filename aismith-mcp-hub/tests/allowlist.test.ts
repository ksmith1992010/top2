import { describe, expect, it } from "vitest";
import {
  assertRepositoryAllowed,
  loadConfig,
  parseAllowedRepositories,
  resolveRepositoryRef,
} from "../src/config.js";
import type { Env } from "../src/env.js";
import { AppError } from "../src/errors.js";

describe("parseAllowedRepositories", () => {
  it("parses bare repo names with the default owner", () => {
    const repos = parseAllowedRepositories("alpha, beta", "ksmith1992010");
    expect(repos).toEqual([
      {
        owner: "ksmith1992010",
        name: "alpha",
        fullName: "ksmith1992010/alpha",
      },
      {
        owner: "ksmith1992010",
        name: "beta",
        fullName: "ksmith1992010/beta",
      },
    ]);
  });

  it("accepts owner/name pairs and deduplicates case-insensitively", () => {
    const repos = parseAllowedRepositories(
      "acme/one,ksmith1992010/two,ACME/one",
      "ksmith1992010",
    );
    expect(repos.map((r) => r.fullName)).toEqual([
      "acme/one",
      "ksmith1992010/two",
    ]);
  });

  it("returns an empty list when unset", () => {
    expect(parseAllowedRepositories(undefined, "ksmith1992010")).toEqual([]);
    expect(parseAllowedRepositories("  ", "ksmith1992010")).toEqual([]);
  });

  it("rejects malformed entries", () => {
    expect(() =>
      parseAllowedRepositories("acme/too/many", "ksmith1992010"),
    ).toThrow(AppError);
  });
});

describe("assertRepositoryAllowed / resolveRepositoryRef", () => {
  const config = loadConfig({
    MCP_BEARER_TOKEN: "test",
    GITHUB_TOKEN: "test",
    GITHUB_OWNER: "ksmith1992010",
    GITHUB_ALLOWED_REPOS: "demo-app,acme/other",
  } satisfies Env);

  it("allows an allowlisted repository", () => {
    const allowed = assertRepositoryAllowed(
      config,
      "ksmith1992010",
      "demo-app",
    );
    expect(allowed.fullName).toBe("ksmith1992010/demo-app");
  });

  it("rejects repositories outside the allowlist", () => {
    try {
      assertRepositoryAllowed(config, "ksmith1992010", "secret-repo");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("REPO_NOT_ALLOWED");
      expect((error as AppError).status).toBe(403);
    }
  });

  it("defaults owner from config when resolving refs", () => {
    const allowed = resolveRepositoryRef(config, { repo: "demo-app" });
    expect(allowed.owner).toBe("ksmith1992010");
    expect(allowed.name).toBe("demo-app");
  });

  it("resolves explicit owner/repo when allowlisted", () => {
    const allowed = resolveRepositoryRef(config, {
      owner: "acme",
      repo: "other",
    });
    expect(allowed.fullName).toBe("acme/other");
  });
});

describe("loadConfig", () => {
  it("applies defaults and parses flags", () => {
    const config = loadConfig({
      MCP_BEARER_TOKEN: "x",
      GITHUB_TOKEN: "y",
      GITHUB_ALLOWED_REPOS: "one",
      ENABLE_CREATE_GITHUB_ISSUE: "true",
    });

    expect(config.githubOwner).toBe("ksmith1992010");
    expect(config.enableCreateGithubIssue).toBe(true);
    expect(config.maxFileSizeBytes).toBe(102_400);
    expect(config.allowedRepositories).toHaveLength(1);
  });

  it("keeps create_github_issue disabled by default", () => {
    const config = loadConfig({
      MCP_BEARER_TOKEN: "x",
      GITHUB_TOKEN: "y",
    });
    expect(config.enableCreateGithubIssue).toBe(false);
  });
});
