import { assertEquals, stub } from "../../deps.ts";
import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  Repository,
  UserInfo,
} from "../user_info.ts";
import {
  GithubApiService,
  MAX_PUBLIC_PAGES,
} from "../Services/GithubApiService.ts";
import { ServiceError } from "../Types/index.ts";
import {
  queryUserActivity,
  queryUserRepository,
  queryUserReview,
} from "../Schemas/index.ts";

const PUBLIC = { visibility: "PUBLIC", isPrivate: false };
const PRIVATE = { visibility: "PRIVATE", isPrivate: true };
const INTERNAL = { visibility: "INTERNAL", isPrivate: false };
const PII = "PRIVATE_PII_MARKER_not_for_public_output";
const pageInfo = { hasNextPage: false, endCursor: null };

function repository(id: string, visibility = PUBLIC): Repository {
  return {
    id,
    ...visibility,
    languages: { nodes: [{ name: "TypeScript" }] },
    stargazers: { totalCount: 7 },
    createdAt: "2021-01-01T00:00:00Z",
  };
}

function fixtures() {
  const publicRepository = repository("public-repository");
  const privateRepository = {
    ...repository(PII, PRIVATE),
    languages: { nodes: [{ name: PII }] },
    stargazers: { totalCount: 900000 },
    createdAt: "2001-01-01T00:00:00Z",
  };
  const groups = [
    { repository: PUBLIC, contributions: { totalCount: 43 } },
    { repository: PRIVATE, contributions: { totalCount: 900001 } },
    { repository: INTERNAL, contributions: { totalCount: 900002 } },
    { repository: {}, contributions: { totalCount: 900003 } },
    {
      repository: { visibility: "PUBLIC", isPrivate: true },
      contributions: { totalCount: 900021 },
    },
  ];
  const activity = {
    createdAt: "2020-01-01T00:00:00Z",
    login: "BaranaNadil",
    followers: { totalCount: 6 },
    organizations: {
      totalCount: 900004,
      nodes: [
        { login: "public-org", publicMembership: true },
        { login: PII, publicMembership: false },
        { login: "ambiguous-org" },
      ],
    },
    publicReviews: [
      ...Array.from({ length: 5 }, (_, index) => ({
        id: `public-review-${index}`,
        state: "APPROVED",
        submittedAt: new Date(Date.now() - 1000).toISOString(),
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      })),
      {
        id: PII,
        state: "APPROVED",
        submittedAt: new Date(Date.now() - 1000).toISOString(),
        author: { login: "BaranaNadil" },
        repository: PRIVATE,
      },
      {
        id: "pending",
        state: "PENDING",
        submittedAt: null,
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      },
      {
        id: "unknown-state",
        state: PII,
        submittedAt: new Date().toISOString(),
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      },
      {
        id: "other-author",
        state: "COMMENTED",
        submittedAt: new Date().toISOString(),
        author: { login: PII },
        repository: PUBLIC,
      },
      {
        id: "old-review",
        state: "COMMENTED",
        submittedAt: "2001-01-01T00:00:00Z",
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      },
      {
        id: "future-review",
        state: "COMMENTED",
        submittedAt: new Date(Date.now() + 86400000).toISOString(),
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      },
      {
        id: "public-review-0",
        state: "APPROVED",
        submittedAt: new Date(Date.now() - 1000).toISOString(),
        author: { login: "BaranaNadil" },
        repository: PUBLIC,
      },
    ],
    contributionsCollection: {
      commitContributionsByRepository: groups.map((group) => ({
        ...group,
        contributions: {
          totalCount: 900019,
          // One public day contains 40 commits; counting nodes would give two.
          nodes: group.repository === PUBLIC
            ? [{ commitCount: 40 }, { commitCount: 3 }]
            : [{ commitCount: 900020 }],
        },
      })),
      pullRequestReviewContributionsByRepository: groups.map((group) => ({
        ...group,
        contributions: { totalCount: group.repository === PUBLIC ? 5 : 900005 },
      })),
      // Obsolete aggregates are deliberately poisonous. None may affect a score.
      restrictedContributionsCount: 900006,
      totalCommitContributions: 900007,
      totalPullRequestReviewContributions: 900008,
    },
  } as unknown as GitHubUserActivity;
  const issues = {
    openIssues: {
      totalCount: 900009,
      nodes: [
        { id: "public-open", state: "OPEN", repository: PUBLIC },
        { id: PII, state: "OPEN", repository: PRIVATE },
        { id: "unknown-open", state: "OPEN", repository: {} },
      ],
    },
    closedIssues: {
      totalCount: 900010,
      nodes: [
        { id: "public-closed", state: "CLOSED", repository: PUBLIC },
        { id: PII, state: "CLOSED", repository: INTERNAL },
      ],
    },
  } as GitHubUserIssue;
  const pullRequests = {
    pullRequests: {
      totalCount: 900011,
      nodes: [
        { id: "public-pr", repository: PUBLIC },
        { id: PII, repository: PRIVATE },
        { id: "unknown-pr", repository: { isPrivate: false } },
      ],
    },
  } as GitHubUserPullRequest;
  const repositories: GitHubUserRepository = {
    repositories: {
      totalCount: 900012,
      nodes: [
        publicRepository,
        privateRepository,
        repository("internal", INTERNAL),
        { ...repository("unknown"), visibility: undefined },
        { ...repository("inconsistent"), isPrivate: true },
      ],
    },
  };
  return { activity, issues, pullRequests, repositories };
}

function assertPublicScores(info: UserInfo) {
  assertEquals(info.totalCommits, 43);
  assertEquals(info.totalReviews, 5);
  assertEquals(info.totalFollowers, 6);
  assertEquals(info.totalOrganizations, 1);
  assertEquals(info.totalIssues, 2);
  assertEquals(info.totalPullRequests, 1);
  assertEquals(info.totalRepositories, 1);
  assertEquals(info.totalStargazers, 7);
  assertEquals(info.languageCount, 1);
  assertEquals(info.ancientAccount, 0);
  assertEquals(info.ogAccount, 0);
  assertEquals(info.joined2020, 1);
  assertEquals(JSON.stringify(info).includes(PII), false);
}

Deno.test("Every score ignores private, internal, unknown and aggregate data", () => {
  const { activity, issues, pullRequests, repositories } = fixtures();
  const info = new UserInfo(activity, issues, pullRequests, repositories);
  assertPublicScores(info);
  const publicOnly = new UserInfo(
    {
      ...activity,
      publicReviews: activity.publicReviews.slice(0, 5),
      organizations: {
        totalCount: 1,
        nodes: [{ login: "public-org", publicMembership: true }],
      },
      contributionsCollection: {
        commitContributionsByRepository: activity.contributionsCollection
          .commitContributionsByRepository.slice(0, 1),
      },
    },
    {
      openIssues: { totalCount: 1, nodes: issues.openIssues.nodes.slice(0, 1) },
      closedIssues: {
        totalCount: 1,
        nodes: issues.closedIssues.nodes.slice(0, 1),
      },
    },
    {
      pullRequests: {
        totalCount: 1,
        nodes: pullRequests.pullRequests.nodes.slice(0, 1),
      },
    },
    {
      repositories: {
        totalCount: 1,
        nodes: repositories.repositories.nodes.slice(0, 1),
      },
    },
  );
  assertEquals(info, publicOnly);
});

Deno.test("Broad PAT responses cannot make private data affect public statistics", async () => {
  const { activity, issues, pullRequests, repositories } = fixtures();
  const calls: string[] = [];
  const mock = stub(globalThis, "fetch", (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    const authorization = new Headers(init?.headers).get("Authorization");
    assertEquals(init?.redirect, "error");
    if (url.pathname.endsWith("/users/BaranaNadil")) {
      assertEquals(authorization, null);
      return Promise.resolve(Response.json({
        login: "BaranaNadil",
        created_at: activity.createdAt,
        followers: 6,
        private_gists: 900013,
        email: PII,
      }));
    }
    assertEquals(authorization, "Bearer broad-private-token");
    if (url.pathname.endsWith("/users/BaranaNadil/orgs")) {
      return Promise.resolve(Response.json([{ id: 1, login: "public-org" }]));
    }
    const body = JSON.parse(String(init?.body));
    if (body.query === queryUserRepository) {
      assertEquals(body.query.includes("privacy: PUBLIC"), true);
      return Promise.resolve(Response.json({
        data: {
          user: { repositories: { ...repositories.repositories, pageInfo } },
        },
      }));
    }
    if (body.query === queryUserActivity) {
      assertEquals(body.query.includes("restrictedContributionsCount"), false);
      assertEquals(body.query.includes("totalCommitContributions"), false);
      return Promise.resolve(Response.json({
        data: {
          user: {
            ...activity,
            // Privileged profile and organization counts must not be used.
            createdAt: "2001-01-01T00:00:00Z",
            followers: { totalCount: 900014 },
            organizations: { totalCount: 900015 },
          },
        },
      }));
    }
    if (body.query === queryUserReview) {
      assertEquals(
        body.variables.search.startsWith("reviewed-by:BaranaNadil is:public "),
        true,
      );
      assertEquals(body.variables.search.includes("-is:archived"), true);
      assertEquals(body.query.includes("author: $username"), true);
      assertEquals(body.query.includes("submittedAt"), true);
      assertEquals(/\b(body|email|title|url)\b/.test(body.query), false);
      return Promise.resolve(Response.json({
        data: {
          search: {
            pageInfo,
            nodes: [
              {
                id: "public-reviewed-pr",
                repository: PUBLIC,
                reviews: {
                  nodes: activity.publicReviews.filter((review) =>
                    review.repository.visibility === "PUBLIC"
                  ),
                },
              },
              {
                id: PII,
                repository: PRIVATE,
                reviews: {
                  nodes: activity.publicReviews.filter((review) =>
                    review.repository.visibility === "PRIVATE"
                  ),
                },
              },
              // Model GitHub's documented archived-PR search filter. A missing
              // exclusion would make this privileged-only review affect the score.
              ...(body.variables.search.includes("-is:archived") ? [] : [{
                id: "ARCHIVED_PRIVATE_PR_PII",
                repository: PUBLIC,
                reviews: {
                  nodes: [{
                    id: "ARCHIVED_PRIVATE_REVIEW_PII",
                    state: "APPROVED",
                    submittedAt: new Date(Date.now() - 1000).toISOString(),
                    author: { login: "BaranaNadil" },
                  }],
                },
              }]),
            ],
          },
        },
      }));
    }
    assertEquals(
      body.variables.search.startsWith("author:BaranaNadil is:public "),
      true,
    );
    const nodes = body.variables.search.includes("is:issue")
      ? [...issues.openIssues.nodes, ...issues.closedIssues.nodes]
      : pullRequests.pullRequests.nodes;
    return Promise.resolve(Response.json({
      data: { search: { nodes, pageInfo, issueCount: 900016 } },
    }));
  });
  try {
    const info = await new GithubApiService(["broad-private-token"])
      .requestUserInfo("BaranaNadil");
    assertEquals(info instanceof UserInfo, true);
    assertPublicScores(info as UserInfo);
    assertEquals(calls.length, 7);
  } finally {
    mock.restore();
  }
});

Deno.test("Repository pagination counts only checked public nodes and stops at its cap", async () => {
  let calls = 0;
  const mock = stub(globalThis, "fetch", (_input, init) => {
    const variables = JSON.parse(String(init?.body)).variables;
    assertEquals(variables.cursor, calls === 0 ? null : `page-${calls}`);
    calls++;
    return Promise.resolve(Response.json({
      data: {
        user: {
          repositories: {
            totalCount: 900017,
            nodes: [
              repository(`public-${calls}`),
              repository(PII, PRIVATE),
              { ...repository("ambiguous"), isPrivate: undefined },
            ],
            pageInfo: { hasNextPage: true, endCursor: `page-${calls}` },
          },
        },
      },
    }));
  });
  try {
    const result = await new GithubApiService(["test-token"])
      .requestUserRepository("BaranaNadil") as GitHubUserRepository;
    assertEquals(calls, MAX_PUBLIC_PAGES);
    assertEquals(result.repositories.totalCount, MAX_PUBLIC_PAGES);
    assertEquals(JSON.stringify(result).includes(PII), false);
  } finally {
    mock.restore();
  }
});

Deno.test("Missing visibility excludes an otherwise populated repository", async () => {
  const mock = stub(globalThis, "fetch", () =>
    Promise.resolve(Response.json({
      data: {
        user: {
          repositories: {
            nodes: [{ ...repository(PII), visibility: undefined }],
            pageInfo,
          },
        },
      },
    })));
  try {
    const result = await new GithubApiService(["test-token"])
      .requestUserRepository("BaranaNadil") as GitHubUserRepository;
    assertEquals(result.repositories, { nodes: [], totalCount: 0 });
  } finally {
    mock.restore();
  }
});

Deno.test("Malformed public organization listing fails closed", async () => {
  const mock = stub(globalThis, "fetch", (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/orgs")) {
      return Promise.resolve(Response.json({ totalCount: 900018, login: PII }));
    }
    if (url.pathname.endsWith("/users/BaranaNadil")) {
      return Promise.resolve(Response.json({
        login: "BaranaNadil",
        created_at: "2020-01-01Z",
        followers: 6,
      }));
    }
    return Promise.resolve(Response.json({
      data: {
        user: {
          contributionsCollection: {
            commitContributionsByRepository: [],
            pullRequestReviewContributionsByRepository: [],
          },
        },
      },
    }));
  });
  try {
    const result = await new GithubApiService(["test-token"])
      .requestUserActivity("BaranaNadil");
    assertEquals(result instanceof ServiceError, true);
    assertEquals(JSON.stringify(result).includes(PII), false);
  } finally {
    mock.restore();
  }
});

Deno.test("Aborted public statistic request performs no fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  const mock = stub(globalThis, "fetch", () => {
    throw new Error("No calls allowed after cancellation");
  });
  try {
    const result = await new GithubApiService(["test-token"], controller.signal)
      .requestUserInfo("BaranaNadil");
    assertEquals(result instanceof ServiceError, true);
    assertEquals(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

Deno.test("Request cancellation aborts every in-flight GitHub statistic fetch", async () => {
  const controller = new AbortController();
  const signals: AbortSignal[] = [];
  const mock = stub(globalThis, "fetch", (_input, init) => {
    const signal = init?.signal;
    if (!signal) throw new Error("Every GitHub call needs the request signal");
    signals.push(signal);
    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });
  });
  try {
    const pending = new GithubApiService(
      ["test-token", "backup-token"],
      controller.signal,
    )
      .requestUserInfo("BaranaNadil");
    assertEquals(signals.length, 7);
    controller.abort();
    const result = await pending;
    assertEquals(result instanceof ServiceError, true);
    assertEquals(signals.every((signal) => signal.aborted), true);
  } finally {
    controller.abort();
    mock.restore();
  }
});
