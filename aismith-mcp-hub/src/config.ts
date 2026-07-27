import type { Env } from "./env.js";
import { AppError } from "./errors.js";

export interface AllowedRepository {
  owner: string;
  name: string;
  fullName: string;
}

export interface HubConfig {
  githubOwner: string;
  allowedRepositories: AllowedRepository[];
  enableCreateGithubIssue: boolean;
  maxFileSizeBytes: number;
  maxResponseSizeBytes: number;
  requestTimeoutMs: number;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
}

const DEFAULTS = {
  githubOwner: "ksmith1992010",
  maxFileSizeBytes: 102_400,
  maxResponseSizeBytes: 204_800,
  requestTimeoutMs: 15_000,
  rateLimitMaxRequests: 60,
  rateLimitWindowMs: 60_000,
} as const;

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  field: string,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Invalid ${field}: must be a positive integer`,
      500,
    );
  }
  return value;
}

function parseBool(raw: string | undefined, fallback = false): boolean {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  throw new AppError(
    "VALIDATION_ERROR",
    `Invalid boolean value: ${raw}`,
    500,
  );
}

export function parseAllowedRepositories(
  raw: string | undefined,
  defaultOwner: string,
): AllowedRepository[] {
  if (!raw || raw.trim() === "") {
    return [];
  }

  const seen = new Set<string>();
  const repos: AllowedRepository[] = [];

  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) {
      continue;
    }

    let owner: string;
    let name: string;

    if (token.includes("/")) {
      const segments = token.split("/");
      if (segments.length !== 2 || !segments[0] || !segments[1]) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Invalid repository entry "${token}". Use "repo" or "owner/repo".`,
          500,
        );
      }
      owner = segments[0];
      name = segments[1];
    } else {
      owner = defaultOwner;
      name = token;
    }

    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Invalid repository identifier "${owner}/${name}"`,
        500,
      );
    }

    const fullName = `${owner}/${name}`;
    const key = fullName.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    repos.push({ owner, name, fullName });
  }

  return repos;
}

export function loadConfig(env: Env): HubConfig {
  const githubOwner = (env.GITHUB_OWNER?.trim() || DEFAULTS.githubOwner).replace(
    /\/+$/,
    "",
  );

  if (!/^[A-Za-z0-9_.-]+$/.test(githubOwner)) {
    throw new AppError("VALIDATION_ERROR", "Invalid GITHUB_OWNER", 500);
  }

  return {
    githubOwner,
    allowedRepositories: parseAllowedRepositories(
      env.GITHUB_ALLOWED_REPOS,
      githubOwner,
    ),
    enableCreateGithubIssue: parseBool(env.ENABLE_CREATE_GITHUB_ISSUE, false),
    maxFileSizeBytes: parsePositiveInt(
      env.MAX_FILE_SIZE_BYTES,
      DEFAULTS.maxFileSizeBytes,
      "MAX_FILE_SIZE_BYTES",
    ),
    maxResponseSizeBytes: parsePositiveInt(
      env.MAX_RESPONSE_SIZE_BYTES,
      DEFAULTS.maxResponseSizeBytes,
      "MAX_RESPONSE_SIZE_BYTES",
    ),
    requestTimeoutMs: parsePositiveInt(
      env.REQUEST_TIMEOUT_MS,
      DEFAULTS.requestTimeoutMs,
      "REQUEST_TIMEOUT_MS",
    ),
    rateLimitMaxRequests: parsePositiveInt(
      env.RATE_LIMIT_MAX_REQUESTS,
      DEFAULTS.rateLimitMaxRequests,
      "RATE_LIMIT_MAX_REQUESTS",
    ),
    rateLimitWindowMs: parsePositiveInt(
      env.RATE_LIMIT_WINDOW_MS,
      DEFAULTS.rateLimitWindowMs,
      "RATE_LIMIT_WINDOW_MS",
    ),
  };
}

export function assertRepositoryAllowed(
  config: HubConfig,
  owner: string,
  repo: string,
): AllowedRepository {
  const fullName = `${owner}/${repo}`;
  const match = config.allowedRepositories.find(
    (entry) =>
      entry.owner.toLowerCase() === owner.toLowerCase() &&
      entry.name.toLowerCase() === repo.toLowerCase(),
  );

  if (!match) {
    throw new AppError(
      "REPO_NOT_ALLOWED",
      `Repository "${fullName}" is not on the allowlist`,
      403,
      { repository: fullName },
    );
  }

  return match;
}

export function resolveRepositoryRef(
  config: HubConfig,
  input: { owner?: string; repo: string },
): AllowedRepository {
  const owner = (input.owner?.trim() || config.githubOwner).replace(/\/+$/, "");
  const repo = input.repo.trim();

  if (!owner || !repo) {
    throw new AppError(
      "VALIDATION_ERROR",
      "owner and repo are required",
      400,
    );
  }

  return assertRepositoryAllowed(config, owner, repo);
}
