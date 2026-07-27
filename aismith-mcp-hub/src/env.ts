/**
 * Cloudflare Worker environment bindings for AIsmith MCP HUB.
 * Secrets are set with `wrangler secret put` (or `.dev.vars` locally).
 */
export interface Env {
  /** Bearer token required for /mcp (secret). */
  MCP_BEARER_TOKEN: string;
  /** Fine-grained GitHub PAT (secret). */
  GITHUB_TOKEN: string;

  /** Default GitHub owner/org. Defaults to ksmith1992010. */
  GITHUB_OWNER?: string;
  /** Comma-separated allowlist: "repo" or "owner/repo". */
  GITHUB_ALLOWED_REPOS?: string;
  /** When "true", registers create_github_issue. Default false. */
  ENABLE_CREATE_GITHUB_ISSUE?: string;
  /** Max bytes for a single file read. Default 102400 (100 KiB). */
  MAX_FILE_SIZE_BYTES?: string;
  /** Max bytes for any tool response payload. Default 204800 (200 KiB). */
  MAX_RESPONSE_SIZE_BYTES?: string;
  /** Upstream GitHub request timeout in ms. Default 15000. */
  REQUEST_TIMEOUT_MS?: string;
  /** Max authenticated /mcp requests per window per client key. Default 60. */
  RATE_LIMIT_MAX_REQUESTS?: string;
  /** Rate-limit window in ms. Default 60000. */
  RATE_LIMIT_WINDOW_MS?: string;
}

export const SERVER_NAME = "AIsmith MCP HUB";
export const SERVER_VERSION = "1.0.0";
