// Run with ENABLE_REDIS= deno test --no-check --allow-env --allow-read=.,/tmp --allow-write=/tmp test/cache_amplification.repro.ts.
// This test uses a mock GraphQL response. It does not use a GitHub token.
import handler from "../api/index.ts";
import { soxa, stub } from "../deps.ts";
import { getResponseCacheKey } from "../src/StaticRenderRegeneration/cache_key.ts";
import { hashString } from "../src/StaticRenderRegeneration/utils.ts";
import { cacheProvider } from "../src/config/cache.ts";
import { UserInfo } from "../src/user_info.ts";
import missing from "../src/Services/__mocks__/notFoundUserMock.json" with {
  type: "json",
};

const success = {
  data: {
    data: {
      user: {
        createdAt: "2020-01-01T00:00:00Z",
        contributionsCollection: {
          totalCommitContributions: 1,
          restrictedContributionsCount: 0,
          totalPullRequestReviewContributions: 0,
        },
        organizations: { totalCount: 0 },
        followers: { totalCount: 0 },
        openIssues: { totalCount: 0 },
        closedIssues: { totalCount: 0 },
        pullRequests: { totalCount: 0 },
        repositories: { totalCount: 0, nodes: [] },
      },
    },
  },
};

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

async function cachePath(url: string): Promise<string> {
  return `/tmp/${await hashString(getResponseCacheKey(new Request(url)))}`;
}

Deno.test("response cache key follows rendered parameters", () => {
  const key = (query: string) =>
    getResponseCacheKey(new Request(`https://example.test/?${query}`));
  const base = "username=Alice&theme=dark&title=Stars,Followers&rank=S,AAA";
  assertEqual(
    key(base),
    key("rank=S,AAA&title=Stars,Followers&theme=dark&username=alice&unused=1"),
    "parameter order and unused values",
  );
  assertEqual(
    key("username=alice"),
    key(
      "username=ALICE&row=3&column=8&theme=default&margin-w=0&margin-h=0&no-bg=false&no-frame=false",
    ),
    "explicit defaults",
  );
  assertEqual(
    key("username=alice&row=3junk"),
    key("username=alice"),
    "parsed number",
  );
  assertEqual(
    key("username=alice&row=2&row=4"),
    key("username=alice&row=2"),
    "first scalar value",
  );
  if (
    key(base) ===
      key("username=alice&theme=radical&title=Stars,Followers&rank=S,AAA")
  ) {
    throw new Error("Different themes must use different keys");
  }
  if (
    key(base) ===
      key("username=alice&theme=dark&title=Followers,Stars&rank=S,AAA")
  ) {
    throw new Error("Title order must affect the key");
  }
  if (
    key(base) ===
      key("username=alice&theme=dark&title=Stars,Followers&rank=AAA,S")
  ) {
    throw new Error("Rank order must affect the key");
  }
});

Deno.test("response cache ignores unused parameters", async () => {
  assertEqual(
    Deno.env.get("ENABLE_REDIS") === "true",
    false,
    "Redis must be off",
  );
  const username = `cache-repro-${crypto.randomUUID()}`;
  const base = `https://example.test/?username=${username}`;
  const unused = `${base}&unused=1`;
  const paths: string[] = [];
  let upstreamCalls = 0;
  const mock = stub(soxa, "post", () => {
    upstreamCalls++;
    return Promise.resolve(success);
  });

  try {
    const first = await handler(new Request(base));
    assertEqual(first.status, 200, "first status");
    const firstBody = await first.text();
    paths.push(await cachePath(base));
    await Deno.stat(paths[0]);
    assertEqual(upstreamCalls, 1, "first upstream calls");

    const repeat = await handler(new Request(base));
    assertEqual(repeat.status, 200, "repeat status");
    assertEqual(await repeat.text(), firstBody, "cached body");
    assertEqual(upstreamCalls, 1, "repeat upstream calls");

    const withUnused = await handler(new Request(unused));
    assertEqual(withUnused.status, 200, "unused status");
    assertEqual(await withUnused.text(), firstBody, "unused cached body");
    assertEqual(upstreamCalls, 1, "unused upstream calls");
    console.log("same URL: 2 requests, 1 GraphQL call");
    console.log("unused parameter: 1 request, 0 new GraphQL calls");
  } finally {
    mock.restore();
    for (const path of paths) await Deno.remove(path);
  }
});

Deno.test("concurrent themes share one GraphQL request", async () => {
  assertEqual(
    Deno.env.get("ENABLE_REDIS") === "true",
    false,
    "Redis must be off",
  );
  const username = `cache-repro-${crypto.randomUUID()}`;
  const urls = ["dark", "radical", "onedark"].map((theme, index) =>
    `https://example.test/?username=${
      index === 1 ? username.toUpperCase() : username
    }&theme=${theme}`
  );
  const paths: string[] = [];
  let upstreamCalls = 0;
  const mock = stub(soxa, "post", async () => {
    upstreamCalls++;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return success;
  });
  try {
    const responses = await Promise.all(
      Array.from(
        { length: 10 },
        (_, index) => handler(new Request(urls[index % urls.length])),
      ),
    );
    for (const response of responses) {
      assertEqual(response.status, 200, "concurrent status");
    }
    assertEqual(upstreamCalls, 1, "concurrent upstream calls");
    for (const url of urls) {
      const path = await cachePath(url);
      await Deno.stat(path);
      paths.push(path);
    }
    console.log("cold concurrency: 10 requests, 1 GraphQL call");
  } finally {
    mock.restore();
    for (const path of paths) await Deno.remove(path);
  }
});

Deno.test("delayed cache misses stay inside singleflight", async () => {
  const username = `cache-repro-${crypto.randomUUID()}`;
  const urls = ["dark", "radical"].map((theme) =>
    `https://example.test/?username=${username}&theme=${theme}`
  );
  const paths = await Promise.all(urls.map(cachePath));
  let cacheReads = 0;
  let upstreamCalls = 0;
  const cacheMock = stub(cacheProvider, "get", async () => {
    cacheReads++;
    if (cacheReads === 2) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return undefined;
  });
  const graphqlMock = stub(soxa, "post", async () => {
    upstreamCalls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return success;
  });
  try {
    const responses = await Promise.all(
      urls.map((url) => handler(new Request(url))),
    );
    for (const response of responses) {
      assertEqual(response.status, 200, "delayed cache status");
    }
    assertEqual(cacheReads, 1, "shared cache read");
    assertEqual(upstreamCalls, 1, "shared GraphQL request");
    for (const path of paths) await Deno.stat(path);
  } finally {
    graphqlMock.restore();
    cacheMock.restore();
    for (const path of paths) await Deno.remove(path).catch(() => {});
  }
});

Deno.test("Redis cache hit skips GraphQL", async () => {
  const username = `cache-repro-${crypto.randomUUID()}`;
  const url = `https://example.test/?username=${username}`;
  const path = await cachePath(url);
  const user = UserInfo.fromCombined(success.data.data.user);
  let upstreamCalls = 0;
  const cacheMock = stub(
    cacheProvider,
    "get",
    () => Promise.resolve(JSON.stringify(user)),
  );
  const graphqlMock = stub(soxa, "post", () => {
    upstreamCalls++;
    return Promise.resolve(success);
  });
  try {
    assertEqual(
      (await handler(new Request(url))).status,
      200,
      "cache hit status",
    );
    assertEqual(upstreamCalls, 0, "cache hit GraphQL calls");
  } finally {
    graphqlMock.restore();
    cacheMock.restore();
    await Deno.remove(path).catch(() => {});
  }
});

Deno.test("missing user is not cached", async () => {
  assertEqual(
    Deno.env.get("ENABLE_REDIS") === "true",
    false,
    "Redis must be off",
  );
  const url =
    `https://example.test/?username=cache-repro-${crypto.randomUUID()}`;
  let upstreamCalls = 0;
  const mock = stub(soxa, "post", () => {
    upstreamCalls++;
    return Promise.resolve(missing);
  });
  try {
    assertEqual(
      (await handler(new Request(url))).status,
      404,
      "first missing status",
    );
    const firstCalls = upstreamCalls;
    assertEqual(
      (await handler(new Request(url))).status,
      404,
      "repeat missing status",
    );
    assertEqual(upstreamCalls, firstCalls * 2, "repeat missing upstream calls");
    console.log(`missing user: 2 requests, ${upstreamCalls} GraphQL calls`);
  } finally {
    mock.restore();
  }
});
