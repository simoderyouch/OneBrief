import { PUBLIC_RATE_LIMIT_PER_HOUR } from "./constants";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Optional Upstash Redis REST (same env vars as @upstash/redis).
 * Uses INCR + EXPIRE for a simple hourly window per token.
 */
async function rateLimitUpstashRest(identifier: string): Promise<boolean | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `onebrief:public:${identifier}`;
  const pipeline = [
    ["INCR", key],
    ["EXPIRE", key, "3600"],
  ];

  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { result?: unknown[] };
  const count = Number(data.result?.[0]);
  if (Number.isNaN(count)) return null;
  return count <= PUBLIC_RATE_LIMIT_PER_HOUR;
}

/**
 * Rate limit public client access by stored token (default 100 req/hour per token).
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set;
 * otherwise in-memory (single Node process only — not suitable for multi-instance without Redis).
 */
export async function rateLimitPublicByToken(storedToken: string): Promise<{
  success: boolean;
}> {
  const upstash = await rateLimitUpstashRest(storedToken);
  if (upstash !== null) {
    return { success: upstash };
  }

  const now = Date.now();
  const b = memoryBuckets.get(storedToken);
  if (!b || now > b.resetAt) {
    memoryBuckets.set(storedToken, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }
  if (b.count >= PUBLIC_RATE_LIMIT_PER_HOUR) {
    return { success: false };
  }
  b.count += 1;
  return { success: true };
}
