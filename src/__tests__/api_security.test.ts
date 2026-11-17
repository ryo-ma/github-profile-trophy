import { assertEquals, assertRejects, stub } from "../../deps.ts";
import hostedHandler, { createLocalRequestHandler } from "../../api/index.ts";
import { PERSONAL_USERNAME } from "../security/github.ts";
import { isPublicStatistics, publicSource } from "../security/public_source.ts";
import { ServiceError } from "../Types/index.ts";
import { UserInfo } from "../user_info.ts";

const envNames = [
  "GITHUB_TOKEN1",
  "GITHUB_TOKEN2",
  "GITHUB_API",
  "VERCEL",
  "RATE_LIMIT_REDIS_URL",
  "RATE_LIMIT_REDIS_TOKEN",
  "REQUIRE_SHARED_RATE_LIMIT",
];
function environment(settings: Record<string, string>) {
  const previous = envNames.map((key) => Deno.env.get(key));
  for (const key of envNames) {
    if (Object.hasOwn(settings, key)) Deno.env.set(key, settings[key]);
    else Deno.env.delete(key);
  }
  return () =>
    envNames.forEach((key, index) => {
      const value = previous[index];
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    });
}
const request = () => new Request("https://trophy.example/?theme=tokyonight");

Deno.test("Explicitly required shared limits fail closed before contacting GitHub", async () => {
  const restore = environment({
    GITHUB_TOKEN1: "github-test-token",
    REQUIRE_SHARED_RATE_LIMIT: "true",
  });
  const mock = stub(globalThis, "fetch", () => {
    throw new Error("No network request should be made");
  });
  try {
    const response = await hostedHandler(request());
    assertEquals(response.status, 503);
    assertEquals(mock.calls.length, 0);
    assertEquals((await response.text()).includes("github-test-token"), false);
  } finally {
    mock.restore();
    restore();
  }
});

for (const shared of [false, true]) {
  Deno.test(
    shared
      ? "Shared cache isolates authenticated totals from anonymous public totals"
      : "Hosted API uses private totals with its token and anonymous public totals without it",
    async () => {
      const restore = environment({
        GITHUB_TOKEN1: "github-test-token",
        GITHUB_API: "https://api.github.com/graphql",
        VERCEL: "1",
        ...(shared
          ? {
            RATE_LIMIT_REDIS_URL: "https://redis.example",
            RATE_LIMIT_REDIS_TOKEN: "redis-test-token",
          }
          : {}),
      });
      let time = 0;
      let githubCalls = 0;
      let viewerCalls = 0;
      const stored = new Map<string, { value: string; expiry: number }>();
      const read = (key: string) => {
        const entry = stored.get(key);
        if (!entry || entry.expiry <= time) return null;
        return entry.value;
      };
      const pageInfo = { hasNextPage: false, endCursor: null };
      const publicRepo = { visibility: "PUBLIC", isPrivate: false };
      const privateRepo = { visibility: "PRIVATE", isPrivate: true };
      const mock = stub(
        globalThis,
        "fetch",
        (input: RequestInfo | URL, init?: RequestInit) => {
          const url = new URL(String(input));
          const auth = new Headers(init?.headers).get("Authorization");
          assertEquals(init?.redirect, "error");
          if (url.hostname === "redis.example") {
            assertEquals(auth, "Bearer redis-test-token");
            assertEquals(
              String(init?.body).includes("github-test-token"),
              false,
            );
            const command: string[] = JSON.parse(String(init?.body));
            let result: unknown;
            if (command[0] === "GET") result = read(command[1]);
            else if (command[0] === "SET") {
              if (read(command[1]) !== null) result = null;
              else {
                stored.set(command[1], {
                  value: command[2],
                  expiry: time + Number(command[5]),
                });
                result = "OK";
              }
            } else if (
              command[0] === "EVAL" && command[1].includes('redis.call("INCR"')
            ) {
              result = [1, 50, 0];
            } else if (command[0] === "EVAL" && command[2] === "2") {
              if (read(command[3]) !== command[5]) result = 0;
              else {
                stored.set(command[4], {
                  value: command[6],
                  expiry: time + Number(command[7]) * 1000,
                });
                result = 1;
              }
            } else if (command[0] === "EVAL" && command[2] === "1") {
              if (read(command[3]) === command[4]) {
                stored.delete(command[3]);
                result = 1;
              } else result = 0;
            } else throw new Error("Unexpected command");
            return Promise.resolve(Response.json({ result }));
          }
          assertEquals(url.hostname, "api.github.com");
          assertEquals(auth === "Bearer redis-test-token", false);
          githubCalls++;
          if (url.pathname === `/users/${PERSONAL_USERNAME}`) {
            assertEquals(auth, null);
            return Promise.resolve(Response.json({
              login: PERSONAL_USERNAME,
              created_at: "2020-01-01T00:00:00Z",
              followers: 5,
              email: "private-profile-marker@example.invalid",
              total_private_repos: 987654,
            }));
          }
          if (url.pathname === `/users/${PERSONAL_USERNAME}/repos`) {
            assertEquals(auth, null);
            return Promise.resolve(Response.json([{
              id: 1,
              private: false,
              visibility: "public",
              stargazers_count: 7,
              language: "TypeScript",
              created_at: "2020-01-01T00:00:00Z",
            }]));
          }
          if (
            url.pathname === "/search/issues" ||
            url.pathname === "/search/commits"
          ) {
            assertEquals(auth, null);
            return Promise.resolve(Response.json({
              total_count: url.pathname === "/search/commits" ? 9 : 1,
              incomplete_results: false,
              items: [],
            }));
          }
          if (url.pathname === `/users/${PERSONAL_USERNAME}/events/public`) {
            assertEquals(auth, null);
            return Promise.resolve(Response.json([]));
          }
          if (url.pathname.endsWith("/orgs")) {
            assertEquals(
              auth === null || auth === "Bearer github-test-token",
              true,
            );
            return Promise.resolve(
              Response.json([]),
            );
          }
          assertEquals(auth, "Bearer github-test-token");
          const { query, variables } = JSON.parse(String(init?.body));
          let data: unknown;
          if (query.includes("TrophyViewer")) {
            viewerCalls++;
            assertEquals(query, "query TrophyViewer { viewer { login } }");
            data = { viewer: { login: PERSONAL_USERNAME } };
          } else if (query.includes("publicUserRepositories")) {
            data = {
              user: {
                repositories: {
                  pageInfo,
                  nodes: [
                    {
                      ...publicRepo,
                      id: "public",
                      languages: { nodes: [{ name: "TypeScript" }] },
                      stargazers: { totalCount: 7 },
                      createdAt: "2020-01-01T00:00:00Z",
                    },
                    {
                      ...privateRepo,
                      id: "private-repository-marker",
                      stargazers: { totalCount: 987654 },
                    },
                  ],
                },
              },
            };
          } else if (query.includes("publicUserActivity")) {
            data = {
              user: {
                contributionsCollection: {
                  commitContributionsByRepository: [
                    {
                      repository: publicRepo,
                      contributions: { nodes: [{ commitCount: 9 }] },
                    },
                    {
                      repository: privateRepo,
                      contributions: { nodes: [{ commitCount: 987654 }] },
                    },
                  ],
                },
              },
            };
          } else {
            assertEquals(variables.search.includes("is:public"), false);
            data = { search: { pageInfo, nodes: [] } };
          }
          return Promise.resolve(Response.json({ data }));
        },
      );
      try {
        const first = shared
          ? createLocalRequestHandler()
          : (request: Request, _peer: string) => hostedHandler(request);
        const second = createLocalRequestHandler();
        const response = await first(request(), "192.0.2.1");
        assertEquals(response.status, 200);
        const svg = await response.text();
        assertEquals(
          /private-profile-marker|private-repository-marker|test-token/
            .test(
              svg,
            ),
          false,
        );
        assertEquals(githubCalls, 8);
        assertEquals((await second(request(), "192.0.2.2")).status, 200);
        assertEquals(githubCalls, shared ? 8 : 16);
        assertEquals(viewerCalls, shared ? 1 : 2);
        if (!shared) {
          assertEquals(stored.size, 0);
          assertEquals((await first(request(), "192.0.2.1")).status, 200);
          assertEquals(githubCalls, 16);
          assertEquals(
            (await first(
              new Request("https://trophy.example/?username=someone-else"),
              "192.0.2.1",
            )).status,
            403,
          );
          Deno.env.delete("GITHUB_TOKEN1");
          assertEquals((await first(request(), "192.0.2.1")).status, 200);
          assertEquals(githubCalls, 23);
          assertEquals(viewerCalls, 2);
          return;
        }
        for (const [key, entry] of stored) {
          assertEquals(/test-token/.test(key + entry.value), false);
          if (key.includes(":stats:")) {
            const value = JSON.parse(entry.value).value;
            assertEquals(isPublicStatistics(value), true);
            assertEquals(value.totalRepositories, 2);
            assertEquals(value.totalStargazers, 987661);
            assertEquals(value.totalCommits, 987663);
            assertEquals(value.totalFollowers, 5);
          }
        }
        // Even a warm process must revalidate when the shared proof expires.
        time = 300001;
        assertEquals((await first(request(), "192.0.2.1")).status, 200);
        assertEquals(viewerCalls, 2);
        assertEquals(githubCalls, 9);
        time = 900001;
        assertEquals((await first(request(), "192.0.2.1")).status, 200);
        assertEquals(viewerCalls, 3);
        assertEquals(githubCalls, 17);
        Deno.env.delete("GITHUB_TOKEN1");
        assertEquals((await first(request(), "192.0.2.1")).status, 200);
        assertEquals(githubCalls, 24);
        assertEquals(viewerCalls, 3);
        const statistics = [...stored].filter(([key]) =>
          key.includes(":stats:")
        ).map(([, entry]) => JSON.parse(entry.value).value);
        assertEquals(
          statistics.some((value) =>
            value.totalRepositories === 1 && value.totalStargazers === 7
          ),
          true,
        );
        assertEquals(
          statistics.some((value) =>
            value.totalRepositories === 2 && value.totalStargazers === 987661
          ),
          true,
        );
      } finally {
        mock.restore();
        restore();
      }
    },
  );
}

Deno.test("Public projection rejects extra personal fields and nonnumeric counts", async () => {
  const sample = Object.fromEntries([
    "totalCommits",
    "totalFollowers",
    "totalIssues",
    "totalOrganizations",
    "totalPullRequests",
    "totalReviews",
    "totalStargazers",
    "totalRepositories",
    "languageCount",
    "durationYear",
    "durationDays",
    "ancientAccount",
    "joined2020",
    "ogAccount",
  ].map((key) => [key, 0])) as unknown as UserInfo;
  assertEquals(isPublicStatistics(sample), true);
  for (
    const invalid of [
      { ...sample, email: "private@example.invalid" },
      { ...sample, totalCommits: "42" },
      { ...sample, totalIssues: -1 },
      { ...sample, totalFollowers: Infinity },
      { ...sample, totalRepositories: 0.5 },
    ]
  ) {
    assertEquals(isPublicStatistics(invalid), false);
    const source = publicSource(
      {
        verify: () => Promise.resolve(),
        fetch: () => Promise.resolve(invalid as unknown as UserInfo),
      },
      false,
      () => undefined,
    );
    const result = await source.fetch(PERSONAL_USERNAME, ["test-token"]);
    assertEquals(result instanceof ServiceError, true);
    assertEquals(
      JSON.stringify(result).includes("private@example.invalid"),
      false,
    );
  }
  const required = publicSource(
    {
      verify: () => Promise.resolve(),
      fetch: () => Promise.resolve(sample),
    },
    true,
    () => undefined,
  );
  await assertRejects(() => required.verify(["test-token"]));
  assertEquals(
    (await required.fetch(PERSONAL_USERNAME, ["test-token"])) instanceof
      ServiceError,
    true,
  );
});
