import { assertBearerAuth } from "./auth.js";
import { loadConfig } from "./config.js";
import type { Env } from "./env.js";
import { SERVER_NAME, SERVER_VERSION } from "./env.js";
import {
  AppError,
  appErrorToResponse,
  jsonError,
  safeLog,
} from "./errors.js";
import { createGitHubClient } from "./github/client.js";
import { handleMcpRequest } from "./mcp.js";
import { enforceRateLimit } from "./rate-limit.js";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
    "Access-Control-Expose-Headers": "MCP-Session-Id, MCP-Protocol-Version",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function healthResponse(env: Env): Response {
  let configOk = true;
  let createIssueEnabled = false;
  let allowedRepoCount = 0;

  try {
    const config = loadConfig(env);
    createIssueEnabled = config.enableCreateGithubIssue;
    allowedRepoCount = config.allowedRepositories.length;
  } catch {
    configOk = false;
  }

  const status =
    configOk && Boolean(env.MCP_BEARER_TOKEN) && Boolean(env.GITHUB_TOKEN)
      ? "ok"
      : "degraded";

  return Response.json(
    {
      status,
      service: SERVER_NAME,
      version: SERVER_VERSION,
      timestamp: new Date().toISOString(),
      checks: {
        config: configOk,
        mcpBearerTokenConfigured: Boolean(env.MCP_BEARER_TOKEN),
        githubTokenConfigured: Boolean(env.GITHUB_TOKEN),
        allowedRepositoryCount: allowedRepoCount,
        createGithubIssueEnabled: createIssueEnabled,
      },
      endpoints: {
        health: "/health",
        mcp: "/mcp",
      },
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return withCors(healthResponse(env));
      }

      if (url.pathname === "/mcp") {
        if (!["GET", "POST", "DELETE"].includes(request.method)) {
          return withCors(
            jsonError(
              "VALIDATION_ERROR",
              "Method not allowed. Use GET, POST, or DELETE on /mcp.",
              405,
            ),
          );
        }

        const config = loadConfig(env);
        assertBearerAuth(request, env.MCP_BEARER_TOKEN);
        enforceRateLimit(
          request,
          config.rateLimitMaxRequests,
          config.rateLimitWindowMs,
        );

        const github = createGitHubClient(env.GITHUB_TOKEN, config);
        const response = await handleMcpRequest(request, config, github);
        return withCors(response);
      }

      return withCors(
        jsonError("NOT_FOUND", `No route for ${url.pathname}`, 404),
      );
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === "RATE_LIMITED") {
          const retryAfter =
            typeof error.details?.retryAfterSec === "number"
              ? String(error.details.retryAfterSec)
              : "60";
          const response = appErrorToResponse(error);
          const headers = new Headers(response.headers);
          headers.set("Retry-After", retryAfter);
          return withCors(
            new Response(response.body, {
              status: response.status,
              headers,
            }),
          );
        }
        return withCors(appErrorToResponse(error));
      }

      safeLog("error", "Unhandled worker error", {
        name: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : "unknown",
      });

      return withCors(
        jsonError("INTERNAL_ERROR", "Internal server error", 500),
      );
    }
  },
};
