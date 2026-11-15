import {
  LimitDecision,
  RedisRestRateLimiter,
  SharedRateLimitError,
} from "./rate_limit.ts";

type Environment = (key: string) => string | undefined;

function ipAddress(value?: string | null): string | undefined {
  if (!value || value.length > 64 || value.includes(",")) return undefined;
  const address = value.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) {
    const parts = address.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255)
      ? parts.join(".")
      : undefined;
  }
  if (!/^[a-f\d:]+$/i.test(address) || !address.includes(":")) return undefined;
  try {
    return new URL(`http://[${address}]/`).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/** Vercel overwrites X-Forwarded-For; other servers must use the socket peer. */
export function trustedClientAddress(
  request: Request,
  onVercel: boolean,
  socketPeer?: string,
): string | undefined {
  if (socketPeer) return ipAddress(socketPeer);
  return onVercel
    ? ipAddress(request.headers.get("x-forwarded-for"))
    : undefined;
}

/** Vercel deployments fail closed until the shared budget has been configured. */
export function deploymentBudget(
  env: Environment = (key) => Deno.env.get(key),
  requireShared = false,
) {
  let cachedKey = "";
  let limiter: RedisRestRateLimiter | undefined;
  return (clientKey?: string): Promise<LimitDecision> => {
    const url = env("RATE_LIMIT_REDIS_URL")?.trim();
    const token = env("RATE_LIMIT_REDIS_TOKEN")?.trim();
    const required = requireShared || env("VERCEL") === "1" ||
      env("REQUIRE_SHARED_RATE_LIMIT") === "true";
    if (!url && !token && !required) {
      return Promise.resolve({ allowed: true, remaining: 0, retryAfter: 0 });
    }
    if (!url || !token) return Promise.reject(new SharedRateLimitError());
    if (
      /^(?:github_pat_|gh[pousr]_)/.test(token) ||
      [env("GITHUB_TOKEN1"), env("GITHUB_TOKEN2")].some((value) =>
        value?.trim() === token
      )
    ) {
      return Promise.reject(new SharedRateLimitError());
    }
    const key = JSON.stringify([url, token]);
    try {
      if (key !== cachedKey || !limiter) {
        limiter = new RedisRestRateLimiter({
          url,
          token,
          limit: 300,
          clientLimit: 60,
        });
        cachedKey = key;
      }
      return limiter.consume(clientKey);
    } catch {
      return Promise.reject(new SharedRateLimitError());
    }
  };
}
