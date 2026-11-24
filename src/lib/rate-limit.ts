/**
 * In-memory fixed-window rate limiter.
 *
 * Note: on serverless hosts (Vercel) each function instance has its own store,
 * so this is a best-effort brake against brute-force login guessing, not a
 * distributed guarantee. Combine with a WAF/CDN rate limit in production.
 */
interface Window {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Window>();

function cleanup() {
  const now = Date.now();
  for (const [key, w] of stores.entries()) {
    if (now >= w.resetAt) stores.delete(key);
  }
}
setInterval(cleanup, 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  let w = stores.get(key);
  if (!w || now >= w.resetAt) {
    w = { count: 0, resetAt: now + opts.windowMs };
    stores.set(key, w);
  }
  if (w.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: w.resetAt };
  }
  w.count += 1;
  return { allowed: true, remaining: opts.limit - w.count, resetAt: w.resetAt };
}

export function clientIp(headers: { get: (name: string) => string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
