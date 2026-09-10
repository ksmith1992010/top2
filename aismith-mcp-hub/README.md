# AIsmith MCP HUB

Production-ready **remote Model Context Protocol (MCP)** connector/tool gateway for Cloudflare Workers.

This project is a **tool gateway only**. It does **not** call OpenAI, Anthropic, or any other model provider. AI clients (Cursor, Claude Desktop, ChatGPT, etc.) connect to `/mcp` and invoke GitHub tools through this hub.

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | None | JSON health/status |
| `/mcp` (GET/POST/DELETE) | Bearer token | Streamable HTTP MCP |

---

## Features

- Official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) Streamable HTTP transport
- Stateless Cloudflare Worker (free-tier friendly; no Durable Objects required)
- Bearer token authentication on `/mcp`
- GitHub repository allowlist (reject anything not configured)
- Max file / response size limits and request timeouts
- Structured error responses (`{ error: { code, message } }`)
- Secrets never logged (redaction helpers)
- Read-only tools by default; `create_github_issue` behind an explicit env flag
- Best-effort in-memory rate limiting (per Worker isolate)

### Initial GitHub tools

| Tool | Default | Description |
|------|---------|-------------|
| `list_allowed_repositories` | On | Lists allowlisted repositories |
| `read_repository_file` | On | Reads one file from an allowlisted repo |
| `search_repository_code` | On | Searches code in one allowlisted repo |
| `create_github_issue` | **Off** | Creates an issue (requires `ENABLE_CREATE_GITHUB_ISSUE=true`) |

---

## Prerequisites

- Node.js 20+
- npm
- Cloudflare account (free tier is enough)
- Fine-grained GitHub personal access token (see below)

---

## Local setup

```bash
cd aismith-mcp-hub
npm install
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```bash
MCP_BEARER_TOKEN=replace-with-a-long-random-bearer-token
GITHUB_TOKEN=github_pat_your_fine_grained_token
```

Configure allowlisted repos in `wrangler.toml` `[vars]` (or override in `.dev.vars`):

```toml
GITHUB_OWNER = "ksmith1992010"
GITHUB_ALLOWED_REPOS = "my-repo,another-repo"
ENABLE_CREATE_GITHUB_ISSUE = "false"
```

Start the local Worker:

```bash
npm run dev
```

Wrangler prints a local URL (typically `http://127.0.0.1:8787`).

Smoke checks:

```bash
# Health (no auth)
curl -s http://127.0.0.1:8787/health | jq .

# MCP without token → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8787/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

# MCP initialize with token
curl -s http://127.0.0.1:8787/mcp \
  -H "authorization: Bearer $MCP_BEARER_TOKEN" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local Wrangler dev server |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest unit/integration tests |
| `npm run lint` | ESLint |
| `npm run deploy` | Deploy to Cloudflare Workers |

---

## Configuration

### Secrets (Cloudflare Worker secrets / `.dev.vars`)

| Name | Required | Description |
|------|----------|-------------|
| `MCP_BEARER_TOKEN` | Yes | Shared secret clients send as `Authorization: Bearer …` |
| `GITHUB_TOKEN` | Yes | Fine-grained GitHub PAT used for API calls |

Set production secrets:

```bash
npx wrangler secret put MCP_BEARER_TOKEN
npx wrangler secret put GITHUB_TOKEN
```

### Vars (`wrangler.toml` `[vars]` or `.dev.vars`)

| Name | Default | Description |
|------|---------|-------------|
| `GITHUB_OWNER` | `ksmith1992010` | Default owner when allowlist entries are bare names |
| `GITHUB_ALLOWED_REPOS` | _(empty)_ | Comma-separated `repo` or `owner/repo` allowlist |
| `ENABLE_CREATE_GITHUB_ISSUE` | `false` | Must be `true` to expose `create_github_issue` |
| `MAX_FILE_SIZE_BYTES` | `102400` | Max decoded file size (100 KiB) |
| `MAX_RESPONSE_SIZE_BYTES` | `204800` | Max tool/upstream JSON response size (200 KiB) |
| `REQUEST_TIMEOUT_MS` | `15000` | GitHub HTTP timeout |
| `RATE_LIMIT_MAX_REQUESTS` | `60` | Max `/mcp` requests per window per client IP (per isolate) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |

Repositories are **never hardcoded** in application logic. Configure them via `GITHUB_ALLOWED_REPOS`.

---

## Create a fine-grained GitHub token

1. Open [GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens).
2. Click **Generate new token**.
3. Set an expiration and resource owner (your user or org).
4. Under **Repository access**, choose **Only select repositories** and pick the same repos you will put in `GITHUB_ALLOWED_REPOS`.
5. Permissions:
   - **Contents**: Read-only (required for `read_repository_file` and `search_repository_code`)
   - **Metadata**: Read-only (required)
   - **Issues**: Read and write — **only** if you set `ENABLE_CREATE_GITHUB_ISSUE=true`
6. Generate the token and store it as the `GITHUB_TOKEN` Worker secret.
7. Never commit the token. Rotate it if it leaks.

Code search may also require the token to have access to the repositories being searched; private-repo search needs appropriate access.

---

## Cloudflare deployment

1. Authenticate Wrangler (once):

   ```bash
   npx wrangler login
   ```

2. Set allowlisted repos in `wrangler.toml`.

3. Deploy the Worker:

   ```bash
   npm run deploy
   ```

4. Set secrets on the deployed Worker:

   ```bash
   npx wrangler secret put MCP_BEARER_TOKEN
   npx wrangler secret put GITHUB_TOKEN
   ```

5. Confirm:

   ```bash
   curl -s https://aismith-mcp-hub.<your-subdomain>.workers.dev/health
   ```

Your MCP URL will be:

```text
https://aismith-mcp-hub.<your-subdomain>.workers.dev/mcp
```

### Free-tier notes

- This Worker is **stateless** and does not require Durable Objects or KV.
- In-memory rate limits are **per isolate** (best-effort), not a global distributed limiter.
- Stay within [Workers free-tier](https://developers.cloudflare.com/workers/platform/pricing/) request and CPU limits.
- GitHub API rate limits still apply to `GITHUB_TOKEN`.

---

## Client configuration

Replace placeholders:

- `https://aismith-mcp-hub.YOUR_SUBDOMAIN.workers.dev/mcp`
- `YOUR_MCP_BEARER_TOKEN`

### Cursor

Cursor supports remote MCP servers. Add to your MCP config (Cursor Settings → MCP, or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "aismith-mcp-hub": {
      "url": "https://aismith-mcp-hub.YOUR_SUBDOMAIN.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_BEARER_TOKEN"
      }
    }
  }
}
```

If your Cursor build only supports stdio MCP, use the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "aismith-mcp-hub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://aismith-mcp-hub.YOUR_SUBDOMAIN.workers.dev/mcp",
        "--header",
        "Authorization: Bearer YOUR_MCP_BEARER_TOKEN"
      ]
    }
  }
}
```

### Claude Desktop

Claude Desktop historically speaks stdio. Use `mcp-remote` as a local proxy to the remote Streamable HTTP endpoint.

Edit Claude Desktop config:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aismith-mcp-hub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://aismith-mcp-hub.YOUR_SUBDOMAIN.workers.dev/mcp",
        "--header",
        "Authorization: Bearer YOUR_MCP_BEARER_TOKEN"
      ]
    }
  }
}
```

Restart Claude Desktop after saving.

### ChatGPT (remote MCP)

ChatGPT custom / remote MCP connectors expect a public HTTPS Streamable HTTP endpoint.

1. Deploy this Worker and confirm `GET /health` returns JSON.
2. In ChatGPT (workspace/admin features that support remote MCP), add a connector with:
   - **URL**: `https://aismith-mcp-hub.YOUR_SUBDOMAIN.workers.dev/mcp`
   - **Authentication**: HTTP Bearer / header auth
   - **Token**: your `MCP_BEARER_TOKEN` value
3. Enable only the tools you need in the ChatGPT connector UI.
4. Keep `ENABLE_CREATE_GITHUB_ISSUE=false` unless you explicitly want write access from ChatGPT.

Exact admin UI labels vary by ChatGPT plan; the important contract is: Streamable HTTP at `/mcp` + `Authorization: Bearer <token>`.

---

## Security notes

- **Allowlist everything**: tools refuse repositories not listed in `GITHUB_ALLOWED_REPOS`.
- **Least privilege GitHub token**: select only the repos you need; prefer read-only Contents unless issue creation is enabled.
- **Write tools are opt-in**: `create_github_issue` is not registered unless `ENABLE_CREATE_GITHUB_ISSUE=true`.
- **Bearer auth on `/mcp`**: health checks are public; MCP requires a secret.
- **Size / timeout guards**: oversized files and slow upstream calls fail with structured errors.
- **No secrets in logs**: authorization headers and GitHub PATs are redacted by log helpers.
- **Do not commit** `.dev.vars`, PATs, or bearer tokens.
- **CORS** is enabled for browser-based MCP inspectors; still require Bearer auth for `/mcp`.

---

## Cost notes

- Cloudflare Workers free tier is typically sufficient for personal / light team use of this hub.
- Costs scale with request volume, not model tokens — this service makes **no** model API calls.
- GitHub API secondary rate limits and search rate limits can throttle heavy `search_repository_code` usage.
- If you later add Durable Objects, KV, or high-volume analytics, review Cloudflare pricing before enabling them. This default build avoids those products.

---

## Project layout

```text
aismith-mcp-hub/
  src/
    index.ts          Worker fetch router (/health, /mcp)
    mcp.ts            MCP server + Streamable HTTP handler
    auth.ts           Bearer token checks
    config.ts         Allowlist + limits
    rate-limit.ts     In-memory rate limiter
    errors.ts         Structured errors + log redaction
    github/client.ts  GitHub API client
    tools/register.ts MCP tool registration
  tests/              Auth, allowlist, tools, rate limit, worker tests
  wrangler.toml       Worker config + non-secret vars
  .dev.vars.example   Local secrets template
```

---

## Development checks

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run dev   # then curl /health and authenticated /mcp
```

---

## License

Private / internal use unless otherwise specified by the repository owner.
