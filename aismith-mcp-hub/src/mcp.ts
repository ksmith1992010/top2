import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { HubConfig } from "./config.js";
import { SERVER_NAME, SERVER_VERSION } from "./env.js";
import type { GitHubClient } from "./github/client.js";
import { registerTools } from "./tools/register.js";

export function createMcpServer(
  config: HubConfig,
  github: GitHubClient,
): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerTools(server, config, github);
  return server;
}

/**
 * Handle a single Streamable HTTP MCP request in stateless mode.
 * Creates a fresh transport + server per request (Cloudflare Workers pattern).
 */
export async function handleMcpRequest(
  request: Request,
  config: HubConfig,
  github: GitHubClient,
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createMcpServer(config, github);
  await server.connect(transport);
  return transport.handleRequest(request);
}
