import { AppError } from "./errors.js";

/**
 * Constant-time string comparison to reduce timing side-channels
 * when validating bearer tokens.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  const maxLen = Math.max(left.byteLength, right.byteLength);
  let mismatch = left.byteLength === right.byteLength ? 0 : 1;

  for (let i = 0; i < maxLen; i++) {
    const l = i < left.byteLength ? left[i]! : 0;
    const r = i < right.byteLength ? right[i]! : 0;
    mismatch |= l ^ r;
  }

  return mismatch === 0;
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    return null;
  }

  return match[1].trim();
}

export function assertBearerAuth(
  request: Request,
  expectedToken: string | undefined,
): void {
  if (!expectedToken || expectedToken.trim() === "") {
    throw new AppError(
      "INTERNAL_ERROR",
      "MCP_BEARER_TOKEN is not configured",
      500,
    );
  }

  const provided = extractBearerToken(request);
  if (!provided || !timingSafeEqual(provided, expectedToken)) {
    throw new AppError(
      "UNAUTHORIZED",
      "Missing or invalid Bearer token",
      401,
    );
  }
}
