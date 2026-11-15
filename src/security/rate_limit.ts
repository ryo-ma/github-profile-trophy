export type LimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

type MemoryOptions = {
  limit?: number;
  windowMs?: number;
  maxClients?: number;
  now?: () => number;
};

type Bucket = { used: number; resetAt: number };

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
  return value;
}

/** Keys must come from trusted socket or hosting metadata, never raw headers. */
export class MemoryRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxClients: number;
  private readonly now: () => number;
  private readonly buckets = new Map<string, Bucket>();
  private nextSweepAt = 0;

  constructor(options: MemoryOptions = {}) {
    this.limit = positiveInteger(options.limit ?? 30, "limit");
    this.windowMs = positiveInteger(options.windowMs ?? 60_000, "windowMs");
    this.maxClients = positiveInteger(options.maxClients ?? 1000, "maxClients");
    this.now = options.now ?? Date.now;
  }

  consume(clientKey?: string): LimitDecision {
    const time = this.now();
    if (time >= this.nextSweepAt) {
      this.sweep(time);
      this.nextSweepAt = time + Math.min(this.windowMs, 10_000);
    }
    const normalized = clientKey?.trim().toLowerCase();
    const key = normalized && normalized.length <= 128
      ? `client:${normalized}`
      : "unknown";
    let bucket = this.buckets.get(key);
    if (bucket && time >= bucket.resetAt) {
      bucket.used = 0;
      bucket.resetAt = time + this.windowMs;
    }
    if (!bucket) {
      if (this.buckets.size >= this.maxClients) this.sweep(time);
      if (this.buckets.size >= this.maxClients) {
        let firstReset = time + this.windowMs;
        for (const active of this.buckets.values()) {
          firstReset = Math.min(firstReset, active.resetAt);
        }
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.max(1, Math.ceil((firstReset - time) / 1000)),
        };
      }
      bucket = { used: 0, resetAt: time + this.windowMs };
      this.buckets.set(key, bucket);
    }
    if (bucket.used >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, Math.ceil((bucket.resetAt - time) / 1000)),
      };
    }
    bucket.used++;
    return {
      allowed: true,
      remaining: this.limit - bucket.used,
      retryAfter: 0,
    };
  }

  private sweep(time: number) {
    for (const [key, bucket] of this.buckets) {
      if (time >= bucket.resetAt) this.buckets.delete(key);
    }
  }
}

export class SharedRateLimitError extends Error {
  constructor() {
    super("Shared request limiting is unavailable.");
    this.name = "SharedRateLimitError";
  }
}

type RedisOptions = {
  url: string;
  token: string;
  limit: number;
  clientLimit?: number;
  windowMs?: number;
  key?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

const GLOBAL_WINDOW_SCRIPT = `
local window = tonumber(ARGV[1])
local globalLimit = tonumber(ARGV[2])
local clientLimit = tonumber(ARGV[3])
local clientTtl = redis.call("PTTL", KEYS[2])
local clientCount = 0
if clientTtl > 0 then
  clientCount = tonumber(redis.call("GET", KEYS[2]) or "0")
end
if clientCount >= clientLimit then
  return {0, 0, clientTtl}
end
local globalTtl = redis.call("PTTL", KEYS[1])
local globalCount = 0
if globalTtl > 0 then
  globalCount = tonumber(redis.call("GET", KEYS[1]) or "0")
end
if globalCount >= globalLimit then
  return {0, 0, globalTtl}
end
if globalTtl < 1 then
  redis.call("SET", KEYS[1], 0)
  redis.call("PEXPIRE", KEYS[1], window)
  globalTtl = window
end
if clientTtl < 1 then
  redis.call("SET", KEYS[2], 0)
  redis.call("PEXPIRE", KEYS[2], globalTtl)
end
local globalUsed = redis.call("INCR", KEYS[1])
local clientUsed = redis.call("INCR", KEYS[2])
return {1, math.min(globalLimit - globalUsed, clientLimit - clientUsed), 0}
`;

const MAX_RESPONSE_BYTES = 256 * 1024;

/** Atomic client and global budgets; Lua returns [accepted, remaining, retryMs]. */
export class RedisRestRateLimiter {
  private readonly url: string;
  private readonly token: string;
  private readonly limit: number;
  private readonly clientLimit: number;
  private readonly windowMs: number;
  private readonly key: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: RedisOptions) {
    try {
      const url = new URL(options.url);
      if (
        url.protocol !== "https:" || url.username || url.password ||
        url.search || url.hash || url.pathname !== "/" ||
        !options.token || /\s/.test(options.token) ||
        options.token.length > 4096
      ) throw new Error("Invalid Redis REST configuration.");
      this.url = url.href;
      this.token = options.token;
      this.limit = positiveInteger(options.limit, "limit");
      this.clientLimit = positiveInteger(
        options.clientLimit ?? 60,
        "clientLimit",
      );
      this.windowMs = positiveInteger(options.windowMs ?? 60_000, "windowMs");
      this.timeoutMs = positiveInteger(options.timeoutMs ?? 1000, "timeoutMs");
      this.key = options.key ?? "github-profile-trophy:{requests-v3}:global";
      if (
        this.key.length > 128 ||
        !/^[A-Za-z0-9:_-]*\{[A-Za-z0-9:_-]+\}[A-Za-z0-9:_-]*$/.test(this.key)
      ) {
        throw new Error("Invalid Redis rate-limit key.");
      }
      this.fetcher = options.fetcher ?? fetch;
    } catch {
      throw new SharedRateLimitError();
    }
  }

  async consume(clientKey?: string): Promise<LimitDecision> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const normalized = clientKey?.trim().toLowerCase();
      const client = normalized && normalized.length <= 128
        ? normalized
        : "unknown";
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(client),
      );
      const hash = [...new Uint8Array(digest)]
        .map((value) => value.toString(16).padStart(2, "0")).join("");
      const fetcher = this.fetcher;
      const response = await fetcher(this.url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          "EVAL",
          GLOBAL_WINDOW_SCRIPT,
          "2",
          this.key,
          `${this.key}:client:${hash}`,
          String(this.windowMs),
          String(this.limit),
          String(this.clientLimit),
        ]),
      });
      if (
        !response.ok || !response.body ||
        Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES
      ) {
        controller.abort();
        void response.body?.cancel().catch(() => {});
        throw new SharedRateLimitError();
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_RESPONSE_BYTES) {
            controller.abort();
            void reader.cancel().catch(() => {});
            throw new SharedRateLimitError();
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const data = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
      if (
        !data || typeof data !== "object" || data.error !== undefined ||
        !Array.isArray(data.result) || data.result.length !== 3
      ) throw new SharedRateLimitError();
      const [accepted, remaining, retryMs] = data.result;
      if (
        (accepted !== 0 && accepted !== 1) ||
        !Number.isSafeInteger(remaining) || remaining < 0 ||
        remaining >= Math.min(this.limit, this.clientLimit) ||
        !Number.isSafeInteger(retryMs) ||
        (accepted === 1 && retryMs !== 0) ||
        (accepted === 0 &&
          (remaining !== 0 || retryMs < 1 || retryMs > this.windowMs))
      ) throw new SharedRateLimitError();
      return {
        allowed: accepted === 1,
        remaining,
        retryAfter: accepted === 1 ? 0 : Math.max(1, Math.ceil(retryMs / 1000)),
      };
    } catch {
      throw new SharedRateLimitError();
    } finally {
      clearTimeout(timer);
    }
  }
}
