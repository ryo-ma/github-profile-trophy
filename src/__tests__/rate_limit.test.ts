import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.203.0/assert/mod.ts";
import {
  MemoryRateLimiter,
  RedisRestRateLimiter,
  SharedRateLimitError,
} from "../security/rate_limit.ts";

Deno.test("Client quotas are isolated and blocked requests do not extend the window", () => {
  let time = 0;
  const limiter = new MemoryRateLimiter({
    limit: 2,
    windowMs: 1000,
    now: () => time,
  });
  assertEquals(limiter.consume("192.0.2.1").allowed, true);
  assertEquals(limiter.consume("192.0.2.1").remaining, 0);
  time = 500;
  assertEquals(limiter.consume("192.0.2.1"), {
    allowed: false,
    remaining: 0,
    retryAfter: 1,
  });
  assertEquals(limiter.consume("192.0.2.2").allowed, true);
  time = 1000;
  assertEquals(limiter.consume("192.0.2.1").allowed, true);
});

Deno.test("Unknown or oversized client identifiers share one bounded bucket", () => {
  const limiter = new MemoryRateLimiter({ limit: 1 });
  assertEquals(limiter.consume().allowed, true);
  assertEquals(limiter.consume("").allowed, false);
  assertEquals(limiter.consume("x".repeat(129)).allowed, false);
  assertEquals(limiter.consume("192.0.2.1").allowed, true);
});

Deno.test("Capacity exhaustion does not evict active quotas and expired slots are reclaimed", () => {
  let time = 0;
  const limiter = new MemoryRateLimiter({
    limit: 1,
    maxClients: 2,
    windowMs: 1000,
    now: () => time,
  });
  assertEquals(limiter.consume("client-a").allowed, true);
  assertEquals(limiter.consume("client-b").allowed, true);
  assertEquals(limiter.consume("client-c").allowed, false);
  assertEquals(limiter.consume("client-a").allowed, false);
  time = 1000;
  assertEquals(limiter.consume("client-c").allowed, true);
});

Deno.test("Invalid in-memory quota settings are rejected", () => {
  assertThrows(() => new MemoryRateLimiter({ limit: 0 }), RangeError);
  assertThrows(() => new MemoryRateLimiter({ windowMs: Infinity }), RangeError);
  assertThrows(() => new MemoryRateLimiter({ maxClients: -1 }), RangeError);
});

Deno.test("Redis instances share hashed client and global keys without forwarding client identities", async () => {
  let calls = 0;
  const keys: string[] = [];
  const fetcher: typeof fetch = (input, init) => {
    calls++;
    const url = input instanceof Request ? input.url : String(input);
    assertEquals(url, "https://redis.example/");
    assertEquals(url.includes("test-redis-token"), false);
    assertEquals(init?.method, "POST");
    assertEquals(init?.redirect, "error");
    assertEquals(
      new Headers(init?.headers).get("Authorization"),
      "Bearer test-redis-token",
    );
    const command = JSON.parse(String(init?.body));
    assertEquals(command[0], "EVAL");
    assertEquals(command[1].includes('redis.call("INCR"'), true);
    assertEquals(command[1].includes('redis.call("PEXPIRE"'), true);
    assertEquals(command[2], "2");
    assertEquals(command[5], "60000");
    assertEquals(command[6], "1");
    assertEquals(command[7], "60");
    assertEquals(command[3], "github-profile-trophy:{requests-v3}:global");
    assertEquals(command[4].startsWith(command[3] + ":client:"), true);
    assertEquals(/[a-f0-9]{64}$/.test(command[4]), true);
    assertEquals(String(init?.body).includes("test-redis-token"), false);
    assertEquals(String(init?.body).includes("192.0.2.1"), false);
    keys.push(command[4]);
    return Promise.resolve(
      new Response(
        JSON.stringify({ result: calls === 1 ? [1, 0, 0] : [0, 0, 59_000] }),
      ),
    );
  };
  const first = new RedisRestRateLimiter({
    url: "https://redis.example",
    token: "test-redis-token",
    limit: 1,
    fetcher,
  });
  const second = new RedisRestRateLimiter({
    url: "https://redis.example",
    token: "test-redis-token",
    limit: 1,
    fetcher,
  });
  assertEquals(await first.consume("192.0.2.1"), {
    allowed: true,
    remaining: 0,
    retryAfter: 0,
  });
  assertEquals(await second.consume("192.0.2.1"), {
    allowed: false,
    remaining: 0,
    retryAfter: 59,
  });
  assertEquals(keys[0], keys[1]);
});

Deno.test("Shared client denials preserve global allowance and do not create denied-client keys", async () => {
  let globalUsed = 0;
  const clients = new Map<string, number>();
  const fetcher: typeof fetch = (_input, init) => {
    const command = JSON.parse(String(init?.body));
    const script: string = command[1];
    const clientKey: string = command[4];
    const globalLimit = Number(command[6]);
    const clientLimit = Number(command[7]);
    // Check the atomic script places both denial branches before any mutation.
    const clientDenial = script.indexOf("if clientCount >= clientLimit");
    const globalDenial = script.indexOf("if globalCount >= globalLimit");
    const firstMutation = script.indexOf('redis.call("SET"');
    assertEquals(clientDenial < globalDenial, true);
    assertEquals(globalDenial < firstMutation, true);
    assertEquals(
      script.includes('redis.call("PEXPIRE", KEYS[2], globalTtl)'),
      true,
    );
    const used = clients.get(clientKey) ?? 0;
    let result: number[];
    if (used >= clientLimit || globalUsed >= globalLimit) {
      result = [0, 0, 60_000];
    } else {
      globalUsed++;
      clients.set(clientKey, used + 1);
      result = [
        1,
        Math.min(globalLimit - globalUsed, clientLimit - used - 1),
        0,
      ];
    }
    return Promise.resolve(new Response(JSON.stringify({ result })));
  };
  const options = {
    url: "https://redis.example",
    token: "test-token",
    limit: 3,
    clientLimit: 1,
    fetcher,
  };
  const first = new RedisRestRateLimiter(options);
  const second = new RedisRestRateLimiter(options);
  assertEquals((await first.consume("attacker")).allowed, true);
  assertEquals((await second.consume("attacker")).allowed, false);
  assertEquals((await first.consume("attacker")).allowed, false);
  assertEquals(globalUsed, 1);
  assertEquals((await second.consume("visitor-a")).allowed, true);
  assertEquals((await first.consume("visitor-b")).allowed, true);
  assertEquals(globalUsed, 3);
  assertEquals((await second.consume("visitor-c")).allowed, false);
  assertEquals(clients.size, 3);
});

Deno.test("Unknown clients share one Redis fingerprint across instances", async () => {
  const keys: string[] = [];
  const options = {
    url: "https://redis.example",
    token: "test-token",
    limit: 3,
    clientLimit: 2,
    fetcher: ((_input, init) => {
      keys.push(JSON.parse(String(init?.body))[4]);
      return Promise.resolve(
        new Response(JSON.stringify({ result: [1, 1, 0] })),
      );
    }) as typeof fetch,
  };
  const first = new RedisRestRateLimiter(options);
  const second = new RedisRestRateLimiter(options);
  await first.consume();
  await second.consume("");
  await second.consume("x".repeat(129));
  assertEquals(new Set(keys).size, 1);
});

Deno.test("Redis rejects insecure or ambiguous endpoint configurations", () => {
  for (
    const url of [
      "http://redis.example",
      "https://user:password@redis.example",
      "https://redis.example/?token=value",
      "https://redis.example/#fragment",
      "https://redis.example/other-endpoint",
    ]
  ) {
    assertThrows(
      () => new RedisRestRateLimiter({ url, token: "test-token", limit: 1 }),
      SharedRateLimitError,
    );
  }
  assertThrows(
    () =>
      new RedisRestRateLimiter({
        url: "https://redis.example",
        token: "",
        limit: 1,
      }),
    SharedRateLimitError,
  );
  for (const key of ["unscoped-key", "empty:{}:tag", "two:{}:{valid}"]) {
    assertThrows(() =>
      new RedisRestRateLimiter({
        url: "https://redis.example",
        token: "test-token",
        limit: 1,
        key,
      }), SharedRateLimitError);
  }
});

Deno.test("Malformed Redis results fail closed without disclosing upstream errors", async () => {
  for (
    const payload of [
      null,
      { error: "test-redis-token must not be disclosed" },
      { result: [0, 1000] },
      { result: [1, 1, 0] },
      { result: [0, 0, 0] },
      { result: [0, 0, 60_001] },
      { result: ["1", 0, 0] },
      { result: [1, 0, 3] },
      { result: [0, 1, 1000] },
      { result: [Number.MAX_SAFE_INTEGER + 1, 0, 1000] },
    ]
  ) {
    const limiter = new RedisRestRateLimiter({
      url: "https://redis.example",
      token: "test-redis-token",
      limit: 1,
      fetcher: () => Promise.resolve(new Response(JSON.stringify(payload))),
    });
    const error = await assertRejects(
      () => limiter.consume(),
      SharedRateLimitError,
    );
    assertEquals(error.message.includes("test-redis-token"), false);
  }
});

Deno.test("Oversized Redis bodies and unsuccessful responses fail closed", async () => {
  for (
    const response of [
      new Response(" ".repeat(256 * 1024 + 1)),
      new Response("{}", { headers: { "Content-Length": "300000" } }),
      new Response("upstream failure", { status: 503 }),
    ]
  ) {
    const limiter = new RedisRestRateLimiter({
      url: "https://redis.example",
      token: "test-token",
      limit: 1,
      fetcher: () => Promise.resolve(response),
    });
    await assertRejects(() => limiter.consume(), SharedRateLimitError);
  }
});

Deno.test("Redis timeout aborts a pending connection", async () => {
  let signal: AbortSignal | undefined;
  const limiter = new RedisRestRateLimiter({
    url: "https://redis.example",
    token: "test-token",
    limit: 1,
    timeoutMs: 5,
    fetcher: (_input, init) =>
      new Promise((_resolve, reject) => {
        signal = init?.signal ?? undefined;
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  });
  await assertRejects(() => limiter.consume(), SharedRateLimitError);
  assertEquals(signal?.aborted, true);
});

Deno.test("Redis timeout covers stalled response bodies", async () => {
  let signal: AbortSignal | undefined;
  const limiter = new RedisRestRateLimiter({
    url: "https://redis.example",
    token: "test-token",
    limit: 1,
    timeoutMs: 5,
    fetcher: (_input, init) => {
      signal = init?.signal ?? undefined;
      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(controller) {
              signal?.addEventListener(
                "abort",
                () =>
                  controller.error(new DOMException("Aborted", "AbortError")),
                { once: true },
              );
            },
          }),
        ),
      );
    },
  });
  await assertRejects(() => limiter.consume(), SharedRateLimitError);
  assertEquals(signal?.aborted, true);
});
