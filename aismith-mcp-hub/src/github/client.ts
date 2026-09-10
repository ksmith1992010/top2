import type { HubConfig } from "../config.js";
import { AppError, safeLog } from "../errors.js";

export interface GitHubClientOptions {
  token: string;
  timeoutMs: number;
  maxResponseSizeBytes: number;
  userAgent?: string;
}

export interface GitHubFileContent {
  path: string;
  sha: string;
  size: number;
  encoding: string;
  content: string;
  htmlUrl?: string;
}

export interface GitHubCodeSearchItem {
  name: string;
  path: string;
  htmlUrl?: string;
  repository: string;
  score?: number;
}

export interface GitHubIssue {
  number: number;
  htmlUrl: string;
  title: string;
  state: string;
}

function decodeBase64Utf8(encoded: string): string {
  const normalized = encoded.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(bytes);
}

export class GitHubClient {
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly maxResponseSizeBytes: number;
  private readonly userAgent: string;

  constructor(options: GitHubClientOptions) {
    if (!options.token || options.token.trim() === "") {
      throw new AppError(
        "INTERNAL_ERROR",
        "GITHUB_TOKEN is not configured",
        500,
      );
    }
    this.token = options.token;
    this.timeoutMs = options.timeoutMs;
    this.maxResponseSizeBytes = options.maxResponseSizeBytes;
    this.userAgent = options.userAgent ?? "AIsmith-MCP-HUB/1.0";
  }

  async readFile(
    owner: string,
    repo: string,
    path: string,
    ref: string | undefined,
    maxFileSizeBytes: number,
  ): Promise<GitHubFileContent> {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    );
    if (ref) {
      url.searchParams.set("ref", ref);
    }

    const data = await this.requestJson<Record<string, unknown>>(url, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (data.type !== "file") {
      throw new AppError(
        "VALIDATION_ERROR",
        `Path is not a file (type=${String(data.type)})`,
        400,
        { path },
      );
    }

    const size = typeof data.size === "number" ? data.size : 0;
    if (size > maxFileSizeBytes) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        `File exceeds max size of ${maxFileSizeBytes} bytes`,
        413,
        { size, maxFileSizeBytes },
      );
    }

    const encoding = typeof data.encoding === "string" ? data.encoding : "";
    const rawContent = typeof data.content === "string" ? data.content : "";

    let content: string;
    if (encoding === "base64") {
      content = decodeBase64Utf8(rawContent);
    } else {
      content = rawContent;
    }

    const contentBytes = new TextEncoder().encode(content).byteLength;
    if (contentBytes > maxFileSizeBytes) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        `Decoded file exceeds max size of ${maxFileSizeBytes} bytes`,
        413,
        { contentBytes, maxFileSizeBytes },
      );
    }

    return {
      path: typeof data.path === "string" ? data.path : path,
      sha: typeof data.sha === "string" ? data.sha : "",
      size,
      encoding,
      content,
      htmlUrl: typeof data.html_url === "string" ? data.html_url : undefined,
    };
  }

  async searchCode(
    owner: string,
    repo: string,
    query: string,
    perPage: number,
  ): Promise<{ totalCount: number; items: GitHubCodeSearchItem[] }> {
    const q = `${query} repo:${owner}/${repo}`;
    const url = new URL("https://api.github.com/search/code");
    url.searchParams.set("q", q);
    url.searchParams.set("per_page", String(perPage));

    const data = await this.requestJson<{
      total_count?: number;
      items?: Array<Record<string, unknown>>;
    }>(url, {
      headers: {
        Accept: "application/vnd.github.text-match+json",
      },
    });

    const items = (data.items ?? []).map((item) => {
      const repository = item.repository as Record<string, unknown> | undefined;
      return {
        name: typeof item.name === "string" ? item.name : "",
        path: typeof item.path === "string" ? item.path : "",
        htmlUrl: typeof item.html_url === "string" ? item.html_url : undefined,
        repository:
          typeof repository?.full_name === "string"
            ? repository.full_name
            : `${owner}/${repo}`,
        score: typeof item.score === "number" ? item.score : undefined,
      };
    });

    return {
      totalCount: typeof data.total_count === "number" ? data.total_count : items.length,
      items,
    };
  }

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[],
  ): Promise<GitHubIssue> {
    const url = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
    );

    const data = await this.requestJson<Record<string, unknown>>(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        ...(body !== undefined ? { body } : {}),
        ...(labels && labels.length > 0 ? { labels } : {}),
      }),
    });

    return {
      number: typeof data.number === "number" ? data.number : 0,
      htmlUrl: typeof data.html_url === "string" ? data.html_url : "",
      title: typeof data.title === "string" ? data.title : title,
      state: typeof data.state === "string" ? data.state : "open",
    };
  }

  private async requestJson<T>(
    url: URL,
    init: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": this.userAgent,
          ...(init.headers ?? {}),
        },
      });

      const raw = await response.text();
      const bytes = new TextEncoder().encode(raw).byteLength;
      if (bytes > this.maxResponseSizeBytes) {
        throw new AppError(
          "PAYLOAD_TOO_LARGE",
          `Upstream response exceeds max size of ${this.maxResponseSizeBytes} bytes`,
          413,
          { bytes, maxResponseSizeBytes: this.maxResponseSizeBytes },
        );
      }

      let parsed: unknown = undefined;
      if (raw.length > 0) {
        try {
          parsed = JSON.parse(raw) as unknown;
        } catch {
          parsed = undefined;
        }
      }

      if (!response.ok) {
        const message =
          parsed &&
          typeof parsed === "object" &&
          parsed !== null &&
          "message" in parsed &&
          typeof (parsed as { message: unknown }).message === "string"
            ? (parsed as { message: string }).message
            : `GitHub API error (${response.status})`;

        if (response.status === 404) {
          throw new AppError("NOT_FOUND", message, 404);
        }
        if (response.status === 403) {
          throw new AppError("FORBIDDEN", message, 403);
        }
        if (response.status === 401) {
          throw new AppError("UNAUTHORIZED", "GitHub authentication failed", 502);
        }
        if (response.status === 422) {
          throw new AppError("VALIDATION_ERROR", message, 400);
        }

        throw new AppError("UPSTREAM_ERROR", message, 502, {
          status: response.status,
        });
      }

      return (parsed ?? {}) as T;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          "TIMEOUT",
          `GitHub request timed out after ${this.timeoutMs}ms`,
          504,
        );
      }
      safeLog("error", "GitHub request failed", {
        host: url.host,
        path: url.pathname,
        name: error instanceof Error ? error.name : "unknown",
      });
      throw new AppError("UPSTREAM_ERROR", "GitHub request failed", 502);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createGitHubClient(
  token: string,
  config: HubConfig,
): GitHubClient {
  return new GitHubClient({
    token,
    timeoutMs: config.requestTimeoutMs,
    maxResponseSizeBytes: config.maxResponseSizeBytes,
  });
}

export function enforceResponseSize(
  payload: unknown,
  maxResponseSizeBytes: number,
): string {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > maxResponseSizeBytes) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      `Response exceeds max size of ${maxResponseSizeBytes} bytes`,
      413,
      { bytes, maxResponseSizeBytes },
    );
  }
  return text;
}
