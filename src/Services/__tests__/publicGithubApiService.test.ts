import { assertEquals, stub } from "../../../deps.ts";
import {
  MAX_PUBLIC_REST_PAGES,
  PublicGithubApiService,
} from "../PublicGithubApiService.ts";
import { ServiceError } from "../../Types/index.ts";
import { UserInfo } from "../../user_info.ts";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const USER = "fixture-user";
const PII = "private-data-marker";

function repository(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    visibility: "public",
    private: false,
    stargazers_count: 7,
    language: "TypeScript",
    created_at: "2020-01-01T00:00:00Z",
    ...overrides,
  };
}

function review(id: number, overrides: Record<string, unknown> = {}) {
  return {
    public: true,
    type: "PullRequestReviewEvent",
    payload: {
      review: {
        id,
        state: "approved",
        submitted_at: "2026-11-16T12:00:00Z",
        user: { login: USER },
        body: PII,
        ...overrides,
      },
    },
  };
}

function response(url: URL): unknown {
  const path = url.pathname.replace(/^\/api\/v3/, "");
  if (path === `/users/${USER}`) {
    return {
      login: USER,
      created_at: "2020-01-01T00:00:00Z",
      followers: 6,
      email: PII,
      total_private_repos: 900001,
    };
  }
  if (path.endsWith("/repos")) {
    return [
      repository(1),
      repository(1),
      repository(2, { stargazers_count: 5, language: "Rust" }),
      repository(3, { private: true, visibility: "private", name: PII }),
      repository(4, { visibility: "internal", name: PII }),
      repository(5, { visibility: undefined, name: PII }),
      repository(6, { private: true, name: PII }),
    ];
  }
  if (path.endsWith("/orgs")) {
    return [{ id: 1, login: "public-org" }, { id: 1, login: "public-org" }];
  }
  if (path.endsWith("/events/public")) {
    return [
      review(1),
      review(1),
      { ...review(2), public: false },
      review(3, { state: "PENDING" }),
      review(4, { user: { login: "another-user" } }),
      review(5, { submitted_at: "2024-01-01T00:00:00Z" }),
      review(6, { submitted_at: "2099-01-01T00:00:00Z" }),
      review(7, { submitted_at: "2026-05-01T00:00:00Z" }),
    ];
  }
  if (path === "/search/commits") {
    assertEquals(url.searchParams.get("per_page"), "1");
    assertEquals(
      url.searchParams.get("q"),
      `author:${USER} is:public committer-date:2025-11-17..2026-11-17`,
    );
    return {
      total_count: 17,
      incomplete_results: false,
      items: [{ body: PII }],
    };
  }
  if (path === "/search/issues") {
    const query = url.searchParams.get("q") ?? "";
    assertEquals(query.includes(`author:${USER} is:public `), true);
    assertEquals(url.searchParams.get("per_page"), "1");
    if (query.includes("is:pr")) {
      assertEquals(query.includes("-is:archived"), true);
      return { total_count: 13, incomplete_results: false };
    }
    return { total_count: 11, incomplete_results: false };
  }
  throw new Error("Unexpected fixture URL");
}

function setup(
  transform: (url: URL, value: unknown) => unknown = (_url, value) => value,
) {
  const calls: URL[] = [];
  const mock = stub(globalThis, "fetch", (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    assertEquals(new Headers(init?.headers).has("Authorization"), false);
    assertEquals(init?.redirect, "error");
    const value = transform(url, response(url));
    return Promise.resolve(
      value instanceof Response ? value : Response.json(value),
    );
  });
  return { mock, calls };
}

Deno.test("Anonymous statistics use public REST only and return exactly numeric trophy fields", async () => {
  const h = setup();
  try {
    const result = await new PublicGithubApiService(undefined, () => NOW)
      .requestUserInfo(USER);
    assertEquals(result instanceof ServiceError, false);
    const info = result as UserInfo;
    assertEquals(Object.keys(info).length, 14);
    assertEquals(Object.values(info).every(Number.isSafeInteger), true);
    assertEquals(info.totalRepositories, 2);
    assertEquals(info.totalStargazers, 12);
    assertEquals(info.languageCount, 2);
    assertEquals(info.totalCommits, 17);
    assertEquals(info.totalIssues, 11);
    assertEquals(info.totalPullRequests, 13);
    assertEquals(info.totalFollowers, 6);
    assertEquals(info.totalOrganizations, 1);
    assertEquals(info.totalReviews, 1);
    assertEquals(info.durationYear, 6);
    assertEquals(info.joined2020, 1);
    assertEquals(JSON.stringify(info).includes(PII), false);
    assertEquals(JSON.stringify(info).includes("900001"), false);
    assertEquals(h.calls.length, 7);
    assertEquals(h.calls.every((url) => url.pathname !== "/graphql"), true);
  } finally {
    h.mock.restore();
  }
});

Deno.test("Anonymous list pagination is capped and duplicate records do not inflate totals", async () => {
  const h = setup((url, value) => {
    const page = Number(url.searchParams.get("page"));
    if (url.pathname.endsWith("/repos")) {
      return Array(100).fill(repository(page));
    }
    if (url.pathname.endsWith("/orgs")) {
      return Array(100).fill({ id: page, login: "public-org" });
    }
    if (url.pathname.endsWith("/events/public")) {
      return Array(100).fill(review(page));
    }
    return value;
  });
  try {
    const result = await new PublicGithubApiService(undefined, () => NOW)
      .requestUserInfo(USER) as UserInfo;
    assertEquals(result.totalRepositories, MAX_PUBLIC_REST_PAGES);
    assertEquals(result.totalOrganizations, MAX_PUBLIC_REST_PAGES);
    assertEquals(result.totalReviews, MAX_PUBLIC_REST_PAGES);
    for (const suffix of ["/repos", "/orgs", "/events/public"]) {
      assertEquals(
        h.calls.filter((url) => url.pathname.endsWith(suffix)).length,
        MAX_PUBLIC_REST_PAGES,
      );
    }
  } finally {
    h.mock.restore();
  }
});

Deno.test("Anonymous requests preserve the configured Enterprise REST base path", async () => {
  const previous = Deno.env.get("GITHUB_API");
  Deno.env.set("GITHUB_API", "https://github.example/api/graphql");
  const h = setup();
  try {
    const result = await new PublicGithubApiService(undefined, () => NOW)
      .requestUserInfo(USER);
    assertEquals(result instanceof ServiceError, false);
    assertEquals(
      h.calls.every((url) => url.origin === "https://github.example"),
      true,
    );
    assertEquals(
      h.calls.every((url) => url.pathname.startsWith("/api/v3/")),
      true,
    );
  } finally {
    h.mock.restore();
    if (previous === undefined) Deno.env.delete("GITHUB_API");
    else Deno.env.set("GITHUB_API", previous);
  }
});

Deno.test("Malformed or incomplete anonymous data fails closed without private error details", async () => {
  for (
    const [suffix, value] of [
      [`/users/${USER}`, {
        login: "wrong-account",
        created_at: "2020-01-01",
        followers: 1,
      }],
      ["/repos", { message: PII }],
      ["/orgs", [{ id: -1, login: PII }]],
      ["/events/public", { message: PII }],
      ["/search/commits", { total_count: 0.5, incomplete_results: false }],
      ["/search/issues", { total_count: 900000, incomplete_results: true }],
    ] as const
  ) {
    const h = setup((url, original) =>
      url.pathname.endsWith(suffix) ? value : original
    );
    try {
      const result = await new PublicGithubApiService(undefined, () => NOW)
        .requestUserInfo(USER);
      assertEquals(result instanceof ServiceError, true);
      assertEquals((result as ServiceError).code, 503);
      assertEquals((result as ServiceError).message.includes(PII), false);
    } finally {
      h.mock.restore();
    }
  }
});

Deno.test("Anonymous GitHub rate limits remain HTTP 429", async () => {
  const h = setup((url, original) =>
    url.pathname === "/search/commits"
      ? new Response(PII, { status: 429 })
      : original
  );
  try {
    const result = await new PublicGithubApiService(undefined, () => NOW)
      .requestUserInfo(USER);
    assertEquals(result instanceof ServiceError, true);
    assertEquals((result as ServiceError).code, 429);
    assertEquals((result as ServiceError).message.includes(PII), false);
  } finally {
    h.mock.restore();
  }
});

Deno.test("Invalid usernames and pre-aborted anonymous requests perform no fetch", async () => {
  const mock = stub(globalThis, "fetch", () => {
    throw new Error("No fetch expected");
  });
  try {
    const service = new PublicGithubApiService(undefined, () => NOW);
    assertEquals(
      await service.requestUserInfo("invalid/user") instanceof ServiceError,
      true,
    );
    const controller = new AbortController();
    controller.abort();
    assertEquals(
      await new PublicGithubApiService(controller.signal, () => NOW)
        .requestUserInfo(USER) instanceof ServiceError,
      true,
    );
    assertEquals(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

Deno.test("Parent cancellation aborts all anonymous requests", async () => {
  const controller = new AbortController();
  let started = 0;
  let aborted = 0;
  let notifyStarted!: () => void;
  const ready = new Promise<void>((resolve) => notifyStarted = resolve);
  const mock = stub(globalThis, "fetch", (_input, init) => {
    started++;
    if (started === 7) notifyStarted();
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        aborted++;
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
  });
  try {
    const pending = new PublicGithubApiService(controller.signal, () => NOW)
      .requestUserInfo(USER);
    await ready;
    controller.abort();
    assertEquals(await pending instanceof ServiceError, true);
    assertEquals(started, 7);
    assertEquals(aborted, 7);
  } finally {
    mock.restore();
  }
});
