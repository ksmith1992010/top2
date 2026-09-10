import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HubConfig } from "../config.js";
import { resolveRepositoryRef } from "../config.js";
import { AppError, toolErrorResult } from "../errors.js";
import {
  type GitHubClient,
  enforceResponseSize,
} from "../github/client.js";

const repoInput = {
  owner: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("GitHub owner/org. Defaults to configured GITHUB_OWNER."),
  repo: z
    .string()
    .min(1)
    .max(100)
    .describe("Repository name (must be on the allowlist)."),
};

function okText(payload: unknown, maxResponseSizeBytes: number) {
  const text = enforceResponseSize(payload, maxResponseSizeBytes);
  return {
    content: [{ type: "text" as const, text }],
  };
}

export function registerTools(
  server: McpServer,
  config: HubConfig,
  github: GitHubClient,
): void {
  server.registerTool(
    "list_allowed_repositories",
    {
      description:
        "List GitHub repositories this MCP hub is allowed to access. Read-only.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return okText(
          {
            defaultOwner: config.githubOwner,
            repositories: config.allowedRepositories.map((r) => ({
              owner: r.owner,
              name: r.name,
              fullName: r.fullName,
            })),
            createGithubIssueEnabled: config.enableCreateGithubIssue,
          },
          config.maxResponseSizeBytes,
        );
      } catch (error) {
        return toolErrorResult(error);
      }
    },
  );

  server.registerTool(
    "read_repository_file",
    {
      description:
        "Read a single text file from an allowlisted GitHub repository. Read-only. Rejects oversized files.",
      inputSchema: {
        ...repoInput,
        path: z
          .string()
          .min(1)
          .max(500)
          .describe("File path within the repository (e.g. src/index.ts)."),
        ref: z
          .string()
          .min(1)
          .max(200)
          .optional()
          .describe("Branch, tag, or commit SHA. Defaults to the repo default branch."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ owner, repo, path, ref }) => {
      try {
        if (path.includes("\\") || path.startsWith("/") || path.includes("..")) {
          throw new AppError(
            "VALIDATION_ERROR",
            "Invalid path: must be a relative POSIX path without '..'",
            400,
          );
        }

        const allowed = resolveRepositoryRef(config, { owner, repo });
        const file = await github.readFile(
          allowed.owner,
          allowed.name,
          path,
          ref,
          config.maxFileSizeBytes,
        );

        return okText(
          {
            repository: allowed.fullName,
            path: file.path,
            sha: file.sha,
            size: file.size,
            htmlUrl: file.htmlUrl,
            content: file.content,
          },
          config.maxResponseSizeBytes,
        );
      } catch (error) {
        return toolErrorResult(error);
      }
    },
  );

  server.registerTool(
    "search_repository_code",
    {
      description:
        "Search code within a single allowlisted GitHub repository using the GitHub code search API. Read-only.",
      inputSchema: {
        ...repoInput,
        query: z
          .string()
          .min(1)
          .max(256)
          .describe("GitHub code search query (repo: filter is applied automatically)."),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Max results to return (1-30). Default 10."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ owner, repo, query, perPage }) => {
      try {
        const allowed = resolveRepositoryRef(config, { owner, repo });
        const result = await github.searchCode(
          allowed.owner,
          allowed.name,
          query,
          perPage ?? 10,
        );

        return okText(
          {
            repository: allowed.fullName,
            query,
            totalCount: result.totalCount,
            items: result.items,
          },
          config.maxResponseSizeBytes,
        );
      } catch (error) {
        return toolErrorResult(error);
      }
    },
  );

  if (config.enableCreateGithubIssue) {
    server.registerTool(
      "create_github_issue",
      {
        description:
          "Create a GitHub issue in an allowlisted repository. Disabled unless ENABLE_CREATE_GITHUB_ISSUE=true.",
        inputSchema: {
          ...repoInput,
          title: z.string().min(1).max(256).describe("Issue title."),
          body: z
            .string()
            .max(20_000)
            .optional()
            .describe("Optional issue body (markdown)."),
          labels: z
            .array(z.string().min(1).max(50))
            .max(10)
            .optional()
            .describe("Optional labels (must already exist on the repo)."),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async ({ owner, repo, title, body, labels }) => {
        try {
          const allowed = resolveRepositoryRef(config, { owner, repo });
          const issue = await github.createIssue(
            allowed.owner,
            allowed.name,
            title,
            body,
            labels,
          );

          return okText(
            {
              repository: allowed.fullName,
              issue,
            },
            config.maxResponseSizeBytes,
          );
        } catch (error) {
          return toolErrorResult(error);
        }
      },
    );
  }
}
