import { ServiceError } from "../Types/index.ts";

export class SharedSourceCacheError extends Error {
  constructor() {
    super("Shared source caching is unavailable.");
    this.name = "SharedSourceCacheError";
  }
}

type Options = {
  url: string;
  token: string;
  fetcher?: typeof fetch;
  now?: () => number;
};

const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_VALUE_BYTES = 4096;
const LOCK_MS = 10_000;
const POLL_BUDGET_MS = 2000;

// Both keys retain the same hash tag. A worker whose lease expired cannot publish.
const PUBLISH_SCRIPT = `
if redis.call("GET", KEYS[1]) ~= ARGV[1] then return 0 end
redis.call("SET", KEYS[2], ARGV[2], "EX", ARGV[3])
return 1
`;

const RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

/** Only validated source data is cached; callers must supply server-generated keys. */
export class RedisSourceCache {
  private readonly url: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;

  constructor(options: Options) {
    try {
      const url = new URL(options.url);
      if (
        url.protocol !== "https:" || url.username || url.password ||
        url.search || url.hash || url.pathname !== "/" ||
        !options.token || /\s/.test(options.token) ||
        options.token.length > 4096
      ) throw new SharedSourceCacheError();
      this.url = url.href;
      this.token = options.token;
      this.fetcher = options.fetcher ?? fetch;
      this.now = options.now ?? (() => performance.now());
    } catch {
      throw new SharedSourceCacheError();
    }
  }

  async getOrLoad<T>(
    key: string,
    ttlSeconds: number,
    valid: (value: unknown) => value is T,
    load: () => Promise<T>,
  ): Promise<T> {
    try {
      if (
        key.length > 256 ||
        !/^[A-Za-z0-9:_-]*\{[A-Za-z0-9:_-]+\}[A-Za-z0-9:_-]*$/.test(key) ||
        !Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 3600
      ) throw new SharedSourceCacheError();
      const cached = await this.read(key, valid);
      if (cached.hit) return cached.value;

      const lockKey = `${key}:lock`;
      const lockToken = crypto.randomUUID();
      const acquired = await this.command([
        "SET",
        lockKey,
        lockToken,
        "NX",
        "PX",
        String(LOCK_MS),
      ]);
      if (acquired !== null && acquired !== "OK") {
        throw new SharedSourceCacheError();
      }
      if (acquired === null) {
        const deadline = this.now() + POLL_BUDGET_MS;
        for (let attempt = 0; attempt < 10; attempt++) {
          if (attempt > 0) {
            const wait = Math.min(200, deadline - this.now());
            if (wait <= 0) break;
            await new Promise<void>((resolve) => setTimeout(resolve, wait));
          }
          const remaining = deadline - this.now();
          if (remaining <= 0) break;
          const result = await this.read(key, valid, remaining);
          if (result.hit) return result.value;
        }
        throw new SharedSourceCacheError();
      }

      try {
        // A previous worker may have published between the first GET and SET NX.
        const secondRead = await this.read(key, valid);
        if (secondRead.hit) return secondRead.value;
        const loaded = await load();
        if (!valid(loaded)) throw new SharedSourceCacheError();
        const encoded = JSON.stringify({ version: 1, value: loaded });
        const normalized = this.decode(encoded, valid);
        const published = await this.command([
          "EVAL",
          PUBLISH_SCRIPT,
          "2",
          lockKey,
          key,
          lockToken,
          encoded,
          String(ttlSeconds),
        ]);
        if (published !== 1) throw new SharedSourceCacheError();
        return normalized;
      } finally {
        // The compare-and-delete cannot remove a newer worker's lease.
        await this.release(lockKey, lockToken);
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new SharedSourceCacheError();
    }
  }

  private async release(lockKey: string, lockToken: string): Promise<void> {
    const released = await this.command([
      "EVAL",
      RELEASE_SCRIPT,
      "1",
      lockKey,
      lockToken,
    ]);
    if (released !== 0 && released !== 1) throw new SharedSourceCacheError();
  }

  private decode<T>(encoded: string, valid: (value: unknown) => value is T): T {
    if (new TextEncoder().encode(encoded).byteLength > MAX_VALUE_BYTES) {
      throw new SharedSourceCacheError();
    }
    const envelope = JSON.parse(encoded);
    if (
      !envelope || typeof envelope !== "object" || Array.isArray(envelope) ||
      Object.keys(envelope).length !== 2 || envelope.version !== 1 ||
      !Object.hasOwn(envelope, "value") || !valid(envelope.value)
    ) throw new SharedSourceCacheError();
    return envelope.value;
  }

  private async read<T>(
    key: string,
    valid: (value: unknown) => value is T,
    budgetMs?: number,
  ): Promise<{ hit: true; value: T } | { hit: false }> {
    const result = await this.command(["GET", key], budgetMs);
    if (result === null) return { hit: false };
    if (typeof result !== "string") throw new SharedSourceCacheError();
    return { hit: true, value: this.decode(result, valid) };
  }

  private async command(command: string[], budgetMs = 1000): Promise<unknown> {
    const controller = new AbortController();
    const timeout = Math.max(1, Math.min(1000, Math.floor(budgetMs)));
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const fetcher = this.fetcher;
      const response = await fetcher(this.url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });
      if (
        !response.ok || !response.body ||
        Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES
      ) {
        controller.abort();
        void response.body?.cancel().catch(() => {});
        throw new SharedSourceCacheError();
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
            throw new SharedSourceCacheError();
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
      const result = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
      if (
        !result || typeof result !== "object" || Array.isArray(result) ||
        result.error !== undefined || !Object.hasOwn(result, "result")
      ) throw new SharedSourceCacheError();
      return result.result;
    } catch {
      throw new SharedSourceCacheError();
    } finally {
      clearTimeout(timer);
    }
  }
}
