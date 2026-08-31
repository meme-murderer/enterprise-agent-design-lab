type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 15 * 60 * 1000,
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
  };
}

export function clientKey(request: Request) {
  const session = request.headers.get("x-workshop-session")?.trim();
  if (session && /^[a-zA-Z0-9-]{16,80}$/.test(session)) {
    return `session:${session}`;
  }
  return `network:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"}`;
}
