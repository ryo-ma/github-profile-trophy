import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.203.0/assert/mod.ts";
import {
  RedisSourceCache,
  SharedSourceCacheError,
} from "../security/shared_cache.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";

type Stats = { score: number };
const key = "trophy:{cache-v4}:stats:0123456789abcdef";
const valid = (value: unknown): value is Stats =>
  !!value && typeof value === "object" &&
  Object.keys(value).length === 1 && "score" in value &&
  typeof value.score === "number" && Number.isSafeInteger(value.score) &&
  value.score >= 0;

function backend() {
  let time = 0;
  let publicationFails = false;
  const values = new Map<string, { value: string; expires: number }>();
  const commands: string[][] = [];
  let notifyDenied!: () => void;
  const denied = new Promise<void>((resolve) => notifyDenied = resolve);
  const get = (name: string) => {
    const entry = values.get(name);
    if (!entry) return null;
    if (entry.expires <= time) {
      values.delete(name);
      return null;
    }
    return entry.value;
  };
  const seed = (name: string, value: string, ttlMs = 60_000) => {
    values.set(name, { value, expires: time + ttlMs });
  };
  const fetcher: typeof fetch = (input, init) => {
    assertEquals(String(input), "https://redis.example/");
    assertEquals(String(input).includes("cache-test-secret"), false);
    assertEquals(
      new Headers(init?.headers).get("Authorization"),
      "Bearer cache-test-secret",
    );
    assertEquals(init?.redirect, "error");
    assertEquals(init?.method, "POST");
    assertEquals(String(init?.body).includes("cache-test-secret"), false);
    const command: string[] = JSON.parse(String(init?.body));
    commands.push(command);
    let result: unknown;
    if (command[0] === "GET") {
      result = get(command[1]);
    } else if (command[0] === "SET") {
      assertEquals(command.slice(3, 5), ["NX", "PX"]);
      assertEquals(command[5], "10000");
      if (get(command[1]) !== null) {
        result = null;
        notifyDenied();
      } else {
        seed(command[1], command[2], Number(command[5]));
        result = "OK";
      }
    } else if (command[0] === "EVAL" && command[2] === "2") {
      assertEquals(
        command[1].includes('redis.call("GET", KEYS[1]) ~= ARGV[1]'),
        true,
      );
      if (publicationFails) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "private-backend-detail" })),
        );
      }
      if (get(command[3]) !== command[5]) result = 0;
      else {
        seed(command[4], command[6], Number(command[7]) * 1000);
        result = 1;
      }
    } else if (command[0] === "EVAL" && command[2] === "1") {
      assertEquals(
        command[1].includes('redis.call("GET", KEYS[1]) == ARGV[1]'),
        true,
      );
      if (get(command[3]) === command[4]) {
        values.delete(command[3]);
        result = 1;
      } else result = 0;
    } else throw new Error("Unexpected Redis command");
    return Promise.resolve(new Response(JSON.stringify({ result })));
  };
  const create = (now?: () => number) =>
    new RedisSourceCache({
      url: "https://redis.example",
      token: "cache-test-secret",
      fetcher,
      now,
    });
  return {
    commands,
    get,
    seed,
    create,
    denied,
    setTime: (value: number) => time = value,
    failPublication: () => publicationFails = true,
  };
}

Deno.test("Cold cache instances share one source load and use only server-side credentials", async () => {
  const redis = backend();
  let loads = 0;
  let release!: (value: Stats) => void;
  let notifyStarted!: () => void;
  const gate = new Promise<Stats>((resolve) => release = resolve);
  const started = new Promise<void>((resolve) => notifyStarted = resolve);
  const first = redis.create().getOrLoad(key, 900, valid, () => {
    loads++;
    notifyStarted();
    return gate;
  });
  await started;
  const second = redis.create().getOrLoad(key, 900, valid, () => {
    loads++;
    return Promise.resolve({ score: 999 });
  });
  await redis.denied;
  release({ score: 7 });
  assertEquals(await Promise.all([first, second]), [{ score: 7 }, {
    score: 7,
  }]);
  assertEquals(loads, 1);
  assertEquals(redis.get(key + ":lock"), null);
  assertEquals(JSON.parse(redis.get(key)!), {
    version: 1,
    value: { score: 7 },
  });
});

Deno.test("Redis expiry refreshes source data rather than serving expired entries", async () => {
  const redis = backend();
  let loads = 0;
  const load = () => Promise.resolve({ score: ++loads });
  assertEquals(await redis.create().getOrLoad(key, 1, valid, load), {
    score: 1,
  });
  assertEquals(await redis.create().getOrLoad(key, 1, valid, load), {
    score: 1,
  });
  redis.setTime(1001);
  assertEquals(await redis.create().getOrLoad(key, 1, valid, load), {
    score: 2,
  });
  assertEquals(loads, 2);
});

Deno.test("Malformed cached data fails closed without invoking the source loader", async () => {
  for (
    const encoded of [
      "not json",
      JSON.stringify({ version: 1, value: { score: "private-value" } }),
      JSON.stringify({
        version: 1,
        value: { score: 1 },
        extra: "private-value",
      }),
      JSON.stringify({ version: 2, value: { score: 1 } }),
      " ".repeat(4097),
    ]
  ) {
    const redis = backend();
    redis.seed(key, encoded);
    let loads = 0;
    await assertRejects(() =>
      redis.create().getOrLoad(key, 900, valid, () => {
        loads++;
        return Promise.resolve({ score: 1 });
      }), SharedSourceCacheError);
    assertEquals(loads, 0);
    assertEquals(redis.commands.length, 1);
  }
});

Deno.test("Source failures are not cached and their private messages are suppressed", async () => {
  const redis = backend();
  const error = await assertRejects(
    () =>
      redis.create().getOrLoad(
        key,
        900,
        valid,
        () => Promise.reject(new Error("private-source-detail")),
      ),
    SharedSourceCacheError,
  );
  assertEquals(error.message.includes("private-source-detail"), false);
  assertEquals(redis.get(key), null);
  assertEquals(redis.get(key + ":lock"), null);
  assertEquals(
    await redis.create().getOrLoad(
      key,
      900,
      valid,
      () => Promise.resolve({ score: 1 }),
    ),
    { score: 1 },
  );
});

Deno.test("Invalid or oversized loaded values are never published", async () => {
  const redis = backend();
  await assertRejects(
    () =>
      redis.create().getOrLoad(
        key,
        900,
        valid,
        () => Promise.resolve({ score: "private-value" } as unknown as Stats),
      ),
    SharedSourceCacheError,
  );
  await assertRejects(
    () =>
      redis.create().getOrLoad(
        key,
        900,
        (value): value is string => typeof value === "string",
        () => Promise.resolve("x".repeat(4096)),
      ),
    SharedSourceCacheError,
  );
  assertEquals(redis.get(key), null);
  assertEquals(
    redis.commands.some((command) =>
      command[0] === "EVAL" && command[2] === "2"
    ),
    false,
  );
  assertEquals(JSON.stringify(redis.commands).includes("private-value"), false);
});

Deno.test("Controlled GitHub rate-limit errors retain their status and are not cached", async () => {
  const redis = backend();
  const rateLimit = new ServiceError(
    "GitHub rate limit exceeded.",
    EServiceKindError.RATE_LIMIT,
  );
  const error = await assertRejects(
    () =>
      redis.create().getOrLoad(
        key,
        900,
        valid,
        () => Promise.reject(rateLimit),
      ),
    ServiceError,
  );
  assertEquals(error, rateLimit);
  assertEquals((error as ServiceError).code, 429);
  assertEquals(redis.get(key), null);
  assertEquals(redis.get(key + ":lock"), null);
});

Deno.test("A cache publication failure denies the request instead of returning uncached source data", async () => {
  const redis = backend();
  redis.failPublication();
  const error = await assertRejects(
    () =>
      redis.create().getOrLoad(
        key,
        900,
        valid,
        () => Promise.resolve({ score: 1 }),
      ),
    SharedSourceCacheError,
  );
  assertEquals(error.message.includes("private-backend-detail"), false);
  assertEquals(redis.get(key), null);
  assertEquals(redis.get(key + ":lock"), null);
});

Deno.test("An expired lease cannot publish or delete a newer worker's lock", async () => {
  const redis = backend();
  await assertRejects(() =>
    redis.create().getOrLoad(key, 900, valid, () => {
      redis.setTime(10_001);
      redis.seed(key + ":lock", "new-worker-lease", 10_000);
      return Promise.resolve({ score: 1 });
    }), SharedSourceCacheError);
  assertEquals(redis.get(key), null);
  assertEquals(redis.get(key + ":lock"), "new-worker-lease");
});

Deno.test("Contending readers stop polling and never duplicate the source load", async () => {
  const redis = backend();
  redis.seed(key + ":lock", "active-worker", 10_000);
  let logical = 0;
  let loads = 0;
  await assertRejects(
    () =>
      redis.create(() => logical += 250).getOrLoad(key, 900, valid, () => {
        loads++;
        return Promise.resolve({ score: 1 });
      }),
    SharedSourceCacheError,
  );
  assertEquals(loads, 0);
  assertEquals(
    redis.commands.filter((command) => command[0] === "GET").length <= 11,
    true,
  );
  assertEquals(redis.commands.some((command) => command[0] === "EVAL"), false);
});

Deno.test("Shared cache rejects unscoped keys, invalid TTLs, and insecure endpoints", async () => {
  for (
    const url of [
      "http://redis.example",
      "https://user:secret@redis.example",
      "https://redis.example/?secret=value",
      "https://redis.example/#tag",
    ]
  ) {
    assertThrows(
      () => new RedisSourceCache({ url, token: "test-token" }),
      SharedSourceCacheError,
    );
  }
  const redis = backend();
  for (const ttl of [0, 3601, Infinity]) {
    await assertRejects(
      () =>
        redis.create().getOrLoad(
          key,
          ttl,
          valid,
          () => Promise.resolve({ score: 1 }),
        ),
      SharedSourceCacheError,
    );
  }
  await assertRejects(
    () =>
      redis.create().getOrLoad(
        "untagged-key",
        900,
        valid,
        () => Promise.resolve({ score: 1 }),
      ),
    SharedSourceCacheError,
  );
  assertEquals(redis.commands.length, 0);
});

Deno.test("Redis cache response size is bounded before JSON parsing", async () => {
  const cache = new RedisSourceCache({
    url: "https://redis.example",
    token: "test-token",
    fetcher: () => Promise.resolve(new Response(" ".repeat(256 * 1024 + 1))),
  });
  await assertRejects(
    () => cache.getOrLoad(key, 900, valid, () => Promise.resolve({ score: 1 })),
    SharedSourceCacheError,
  );
});

Deno.test("Redis source-cache timeout aborts stalled connection and body reads", async () => {
  for (const stallBody of [false, true]) {
    let signal: AbortSignal | undefined;
    const cache = new RedisSourceCache({
      url: "https://redis.example",
      token: "test-token",
      fetcher: (_input, init) => {
        signal = init?.signal ?? undefined;
        if (!stallBody) {
          return new Promise((_resolve, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              {
                once: true,
              },
            );
          });
        }
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                signal?.addEventListener(
                  "abort",
                  () =>
                    controller.error(new DOMException("Aborted", "AbortError")),
                  {
                    once: true,
                  },
                );
              },
            }),
          ),
        );
      },
    });
    await assertRejects(
      () =>
        cache.getOrLoad(key, 900, valid, () => Promise.resolve({ score: 1 })),
      SharedSourceCacheError,
    );
    assertEquals(signal?.aborted, true);
  }
});
