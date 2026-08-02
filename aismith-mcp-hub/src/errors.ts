export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "REPO_NOT_ALLOWED"
  | "FEATURE_DISABLED"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function jsonError(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function appErrorToResponse(error: AppError): Response {
  return jsonError(error.code, error.message, error.status, error.details);
}

/** Tool-facing structured error payload (never includes secrets). */
export function toolErrorResult(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  if (error instanceof AppError) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: error.code,
              message: error.message,
              ...(error.details ? { details: error.details } : {}),
            },
          }),
        },
      ],
    };
  }

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        }),
      },
    ],
  };
}

/** Redact common secret patterns before logging. */
export function sanitizeForLog(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
      .replace(/github_pat_[A-Za-z0-9_]+/g, "github_pat_[REDACTED]")
      .replace(/ghp_[A-Za-z0-9]+/g, "ghp_[REDACTED]")
      .replace(/gho_[A-Za-z0-9]+/g, "gho_[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForLog);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (/token|secret|authorization|password|api[_-]?key/i.test(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = sanitizeForLog(nested);
      }
    }
    return out;
  }
  return value;
}

export function safeLog(level: "info" | "warn" | "error", message: string, meta?: unknown): void {
  const payload = meta === undefined ? message : `${message} ${JSON.stringify(sanitizeForLog(meta))}`;
  if (level === "info") {
    console.info(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.error(payload);
  }
}
