import { assertEquals } from "../../deps.ts";
import { createTrophyHandler } from "../server.ts";
import { UserInfo } from "../user_info.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";

const sample: UserInfo = {
  totalStargazers: 21,
  totalCommits: 543,
  totalFollowers: 71,
  totalIssues: 1,
  totalPullRequests: 160,
  totalRepositories: 70,
  totalReviews: 1,
  totalOrganizations: 0,
  languageCount: 13,
  durationYear: 2,
  durationDays: 9,
  ancientAccount: 0,
  joined2020: 0,
  ogAccount: 0,
};
type Options = Parameters<typeof createTrophyHandler>[0];
function setup(overrides: Partial<Options> = {}) {
  let tokens = ["token-a"];
  const verified: string[][] = [];
  const fetched: { owner: string; tokens: string[] }[] = [];
  const handler = createTrophyHandler({
    tokens: () => tokens,
    verifyTokens: (values) => {
      verified.push([...values]);
      return Promise.resolve();
    },
    fetchUser: (owner, values) => {
      fetched.push({ owner, tokens: [...values] });
      return Promise.resolve(sample);
    },
    maxRequests: 100,
    ...overrides,
  });
  return {
    handler,
    verified,
    fetched,
    setTokens: (values: string[]) => tokens = values,
  };
}
const request = (path = "/", init?: RequestInit) =>
  new Request(`https://trophy.example${path}`, init);
function assertPrivate(response: Response) {
  const cache = response.headers.get("Cache-Control") ?? "";
  assertEquals(cache.includes("private"), true);
  assertEquals(cache.includes("no-store"), true);
}

Deno.test("Missing or removed server tokens deny access despite cached data", async () => {
  const h = setup();
  h.setTokens([]);
  const missing = await h.handler(request());
  assertEquals(missing.status, 503);
  assertPrivate(missing);
  assertEquals(h.verified.length, 0);
  assertEquals(h.fetched.length, 0);
  h.setTokens(["token-a"]);
  const success = await h.handler(request());
  assertEquals(success.status, 200);
  assertPrivate(success);
  assertEquals(h.fetched[0].owner, "BaranaNadil");
  h.setTokens([]);
  const removed = await h.handler(request());
  assertEquals(removed.status, 503);
  assertPrivate(removed);
  assertEquals(h.verified.length, 1);
  assertEquals(h.fetched.length, 1);
});

Deno.test("Other usernames and abusive parameters never reach GitHub", async () => {
  const h = setup();
  for (
    const [path, status] of [
      ["/?username=someone-else", 403],
      ["/?username=BaranaNadil&username=someone-else", 400],
      ["/?cachebust=anything", 400],
      ["/?token=do-not-accept-tokens-in-urls", 400],
      ["/?column=999999999", 400],
      ["/?column=0", 400],
      ["/?row=0", 400],
      ["/?margin-w=-1", 400],
      ["/?theme=__proto__", 400],
      ["/?theme=unknown", 400],
      ["/?no-bg=1", 400],
      ["/?rank=malformed", 400],
      ["/?title=%3Cscript%3E", 400],
      ["/?column=8&column=8", 400],
    ] as const
  ) {
    const response = await h.handler(request(path));
    assertEquals(response.status, status);
    assertPrivate(response);
  }
  assertEquals(
    (await h.handler(request("/?title=" + "a".repeat(2100)))).status,
    414,
  );
  assertEquals(h.verified.length, 0);
  assertEquals(h.fetched.length, 0);
});

Deno.test("Supported routes and case-insensitive owner work; HEAD has no body", async () => {
  const h = setup();
  for (
    const path of ["/", "/api", "/api/", "/api/index", "/?username=barananadil"]
  ) {
    const response = await h.handler(request(path));
    assertEquals(response.status, 200);
    assertPrivate(response);
  }
  const head = await h.handler(request("/", { method: "HEAD" }));
  assertEquals(head.status, 200);
  assertEquals(await head.text(), "");
  assertPrivate(head);
  const post = await h.handler(request("/", { method: "POST" }));
  assertEquals(post.status, 405);
  assertPrivate(post);
  assertEquals((await h.handler(request("/unexpected"))).status, 404);
  const svg =
    await (await h.handler(request("/?title=NoMatch&column=-1&margin-h=15")))
      .text();
  assertEquals(/NaN|Infinity|height="-/.test(svg), false);
});

Deno.test("Concurrent rendering variants share verification and one owner fetch", async () => {
  let release!: (value: UserInfo) => void;
  let entered!: () => void;
  const gate = new Promise<UserInfo>((resolve) => release = resolve);
  const started = new Promise<void>((resolve) => entered = resolve);
  let fetches = 0;
  const h = setup({
    fetchUser: async () => {
      fetches++;
      entered();
      return await gate;
    },
  });
  const pending = ["/?column=4", "/api?theme=tokyonight", "/api/?margin-w=10"]
    .map((path) => h.handler(request(path)));
  await started;
  release(sample);
  for (const response of await Promise.all(pending)) {
    assertEquals(response.status, 200);
    assertPrivate(response);
  }
  assertEquals((await h.handler(request("/?theme=flat"))).status, 200);
  assertEquals(h.verified.length, 1);
  assertEquals(fetches, 1);
});

Deno.test("Credential rotation and expired verification refresh cached state", async () => {
  let time = 0;
  const h = setup({
    now: () => time,
    dataTtlMs: 1000,
    verificationTtlMs: 2000,
  });
  assertEquals((await h.handler(request())).status, 200);
  assertEquals((await h.handler(request())).status, 200);
  assertEquals(h.verified.length, 1);
  assertEquals(h.fetched.length, 1);
  time = 1;
  h.setTokens(["token-b"]);
  assertEquals((await h.handler(request())).status, 200);
  assertEquals(h.verified, [["token-a"], ["token-b"]]);
  assertEquals(h.fetched.length, 2);
  time = 1002;
  assertEquals((await h.handler(request())).status, 200);
  assertEquals(h.verified.length, 2);
  assertEquals(h.fetched.length, 3);
  time = 2003;
  assertEquals((await h.handler(request())).status, 200);
  assertEquals(h.verified.length, 3);
  assertEquals(h.fetched.length, 4);
});

Deno.test("Failed token verification denies access without leaking errors", async () => {
  const h = setup({
    verifyTokens: () => Promise.reject(new Error("sensitive-token-value")),
  });
  const response = await h.handler(request());
  assertEquals(response.status, 503);
  assertPrivate(response);
  assertEquals(
    (await response.text()).includes("sensitive-token-value"),
    false,
  );
  assertEquals(h.fetched.length, 0);
});

Deno.test("Rejected requests do not consume valid clients' allowance", async () => {
  let time = 0;
  const h = setup({ now: () => time, maxRequests: 2, windowMs: 1000 });
  for (const ip of ["192.0.2.1", "192.0.2.2"]) {
    const response = await h.handler(
      request("/?username=someone-else", {
        headers: { "X-Forwarded-For": ip },
      }),
    );
    assertEquals(response.status, 403);
    assertPrivate(response);
  }
  const accepted = await h.handler(
    request("/", { headers: { "X-Forwarded-For": "192.0.2.3" } }),
  );
  assertEquals(accepted.status, 200);
  assertEquals((await h.handler(request("/"))).status, 200);
  const limited = await h.handler(
    request("/", { headers: { "X-Forwarded-For": "192.0.2.4" } }),
  );
  assertEquals(limited.status, 429);
  assertEquals(Number(limited.headers.get("Retry-After")) >= 1, true);
  assertPrivate(limited);
  time = 1000;
  assertEquals(
    (await h.handler(request("/?username=someone-else"))).status,
    403,
  );
  assertEquals(h.verified.length, 1);
  assertEquals(h.fetched.length, 1);
});

Deno.test("GitHub rate limits return 429 and cooldown cannot be extended by traffic", async () => {
  let time = 0;
  let fetches = 0;
  const h = setup({
    now: () => time,
    cooldownMs: 1000,
    fetchUser: () => {
      fetches++;
      return Promise.resolve(
        new ServiceError(
          "Rate limit exceeded",
          EServiceKindError.RATE_LIMIT,
        ),
      );
    },
  });
  const first = await h.handler(request());
  assertEquals(first.status, 429);
  assertPrivate(first);
  time = 500;
  const second = await h.handler(request());
  assertEquals(second.status, 429);
  assertEquals(Number(second.headers.get("Retry-After")) >= 1, true);
  assertEquals(fetches, 1);
  time = 1001;
  assertEquals((await h.handler(request())).status, 429);
  assertEquals(fetches, 2);
});

Deno.test("Expired owner verification cannot serve previously cached data", async () => {
  let time = 0;
  let verifications = 0;
  const h = setup({
    now: () => time,
    verificationTtlMs: 10,
    dataTtlMs: 10000,
    verifyTokens: () =>
      ++verifications === 1
        ? Promise.resolve()
        : Promise.reject(new Error("Token revoked")),
  });
  assertEquals((await h.handler(request())).status, 200);
  assertEquals(h.fetched.length, 1);
  time = 11;
  const response = await h.handler(request());
  assertEquals(response.status, 503);
  assertPrivate(response);
  assertEquals(h.fetched.length, 1);
  assertEquals((await response.text()).includes("<svg"), false);
});

Deno.test("A limited client does not exhaust another client's image allowance", async () => {
  const h = setup({ maxRequests: 1 });
  assertEquals((await h.handler(request(), "192.0.2.1")).status, 200);
  assertEquals((await h.handler(request(), "192.0.2.1")).status, 429);
  assertEquals((await h.handler(request(), "192.0.2.2")).status, 200);
});

Deno.test("Invalid requests do not consume the shared budget", async () => {
  let calls = 0;
  const h = setup({
    sharedLimit: () => {
      calls++;
      return Promise.resolve({ allowed: true, remaining: 100, retryAfter: 0 });
    },
  });
  for (let i = 0; i < 70; i++) {
    assertEquals(
      (await h.handler(request("/?username=someone-else"))).status,
      403,
    );
  }
  assertEquals(calls, 0);
  assertEquals((await h.handler(request(), "192.0.2.1")).status, 200);
  assertEquals(calls, 1);
});

Deno.test("Shared budget denial and outage stop requests before GitHub", async () => {
  const denied = setup({
    sharedLimit: () =>
      Promise.resolve({ allowed: false, remaining: 0, retryAfter: 17 }),
  });
  const response = await denied.handler(request());
  assertEquals(response.status, 429);
  assertEquals(response.headers.get("Retry-After"), "17");
  assertEquals(denied.fetched.length, 0);
  const unavailable = setup({
    sharedLimit: () => Promise.reject(new Error("private Redis credential")),
  });
  const failed = await unavailable.handler(request());
  assertEquals(failed.status, 503);
  assertEquals(
    (await failed.text()).includes("private Redis credential"),
    false,
  );
  assertEquals(unavailable.verified.length, 0);
});
