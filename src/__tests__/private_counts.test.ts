import { assertEquals, stub } from "../../deps.ts";
import { Card } from "../card.ts";
import { COLORS } from "../theme.ts";
import {
  GithubApiService,
  MAX_PUBLIC_PAGES,
} from "../Services/GithubApiService.ts";
import {
  queryUserActivity,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
  queryUserReview,
} from "../Schemas/index.ts";
import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  isIncludedRepository,
  PublicReview,
  Repository,
  RepositoryVisibility,
  UserInfo,
} from "../user_info.ts";
import { ServiceError } from "../Types/index.ts";

const owner = "fixture-user";
const PUBLIC = { visibility: "PUBLIC", isPrivate: false };
const PRIVATE = { visibility: "PRIVATE", isPrivate: true };
const INTERNAL = { visibility: "INTERNAL", isPrivate: false };
const UNKNOWN = { isPrivate: false };
const INCONSISTENT_PUBLIC = { visibility: "PUBLIC", isPrivate: true };
const INCONSISTENT_PRIVATE = { visibility: "PRIVATE", isPrivate: false };
const MARKER = "PRIVATE_METADATA_NOT_FOR_SVG";
const pageInfo = { hasNextPage: false, endCursor: null };

function repository(
  id: string,
  visibility: RepositoryVisibility,
  stars: number,
  language: string,
): Repository {
  return {
    id,
    ...visibility,
    stargazers: { totalCount: stars },
    languages: { nodes: [{ name: language }] },
    createdAt: "2021-01-01T00:00:00Z",
  };
}

function fixtures() {
  const submittedAt = new Date(Date.now() - 1000).toISOString();
  const review = (
    id: string,
    visibility: RepositoryVisibility,
  ): PublicReview => ({
    id,
    state: "APPROVED",
    submittedAt,
    author: { login: owner },
    repository: visibility,
  });
  const privateReview = review(MARKER + "-review", PRIVATE);
  const privateRepository = repository(MARKER + "-repo", PRIVATE, 11, "Python");
  const repositories: GitHubUserRepository = {
    repositories: {
      totalCount: 900001,
      nodes: [
        repository("public", PUBLIC, 7, "TypeScript"),
        privateRepository,
        repository("internal", INTERNAL, 13, "Go"),
        privateRepository,
        repository("unknown", UNKNOWN, 900002, MARKER),
        repository("inconsistent-public", INCONSISTENT_PUBLIC, 900003, MARKER),
        repository(
          "inconsistent-private",
          INCONSISTENT_PRIVATE,
          900004,
          MARKER,
        ),
      ],
    },
  };
  const activity: GitHubUserActivity = {
    createdAt: "2020-01-01T00:00:00Z",
    login: owner,
    followers: { totalCount: 6 },
    organizations: {
      totalCount: 900005,
      nodes: [{ login: "public-org", publicMembership: true }],
    },
    contributionsCollection: {
      commitContributionsByRepository: [
        { repository: PUBLIC, contributions: { nodes: [{ commitCount: 5 }] } },
        {
          repository: PRIVATE,
          contributions: { nodes: [{ commitCount: 11 }] },
        },
        {
          repository: INTERNAL,
          contributions: { nodes: [{ commitCount: 17 }] },
        },
        {
          repository: UNKNOWN,
          contributions: { nodes: [{ commitCount: 900006 }] },
        },
        {
          repository: INCONSISTENT_PUBLIC,
          contributions: { nodes: [{ commitCount: 900007 }] },
        },
        {
          repository: INCONSISTENT_PRIVATE,
          contributions: { nodes: [{ commitCount: 900008 }] },
        },
      ],
    },
    publicReviews: [
      review("public-review", PUBLIC),
      privateReview,
      review("internal-review", INTERNAL),
      privateReview,
      { ...review("pending", PRIVATE), state: "PENDING", submittedAt: null },
      { ...review("other-author", PRIVATE), author: { login: "someone-else" } },
      { ...review("old", PRIVATE), submittedAt: "2001-01-01T00:00:00Z" },
      review("unknown-review", UNKNOWN),
    ],
  };
  const issues: GitHubUserIssue = {
    openIssues: {
      totalCount: 900009,
      nodes: [
        { id: "public-open", state: "OPEN", repository: PUBLIC },
        { id: MARKER + "-issue", state: "OPEN", repository: PRIVATE },
        { id: "unknown-issue", state: "OPEN", repository: UNKNOWN },
      ],
    },
    closedIssues: {
      totalCount: 900010,
      nodes: [
        { id: "public-closed", state: "CLOSED", repository: PUBLIC },
        { id: "internal-closed", state: "CLOSED", repository: INTERNAL },
      ],
    },
  };
  const privatePr = { id: MARKER + "-pr", repository: PRIVATE };
  const pullRequests: GitHubUserPullRequest = {
    pullRequests: {
      totalCount: 900011,
      nodes: [
        { id: "public-pr", repository: PUBLIC },
        privatePr,
        { id: "internal-pr", repository: INTERNAL },
        privatePr,
        { id: "unknown-pr", repository: UNKNOWN },
      ],
    },
  };
  return { activity, issues, pullRequests, repositories };
}

function assertScores(info: UserInfo, includePrivate: boolean) {
  assertEquals(info.totalCommits, includePrivate ? 33 : 5);
  assertEquals(info.totalRepositories, includePrivate ? 3 : 1);
  assertEquals(info.totalStargazers, includePrivate ? 31 : 7);
  assertEquals(info.languageCount, includePrivate ? 3 : 1);
  assertEquals(info.totalIssues, includePrivate ? 4 : 2);
  assertEquals(info.totalPullRequests, includePrivate ? 3 : 1);
  assertEquals(info.totalReviews, includePrivate ? 3 : 1);
  assertEquals(info.totalFollowers, 6);
  assertEquals(info.totalOrganizations, 1);
  assertEquals(Object.keys(info).length, 14);
  assertEquals(
    Object.values(info).every((value) =>
      Number.isSafeInteger(value) && value >= 0
    ),
    true,
  );
  assertEquals(JSON.stringify(info).includes(MARKER), false);
  const svg = new Card([], [], -1, 10, 115, 10, 10, false, false)
    .render(info, COLORS.tokyonight);
  assertEquals(svg.includes(MARKER), false);
}

Deno.test("Private and internal records require explicit permission with known visibility", () => {
  for (
    const [visibility, expected] of [
      [PUBLIC, true],
      [PRIVATE, true],
      [INTERNAL, true],
      [{ visibility: "INTERNAL", isPrivate: true }, true],
      [UNKNOWN, false],
      [INCONSISTENT_PUBLIC, false],
      [INCONSISTENT_PRIVATE, false],
      [{ visibility: "PRIVATE" }, false],
      [{ visibility: "OTHER", isPrivate: true }, false],
    ] as const
  ) {
    assertEquals(isIncludedRepository(visibility, true), expected);
    assertEquals(isIncludedRepository(visibility), visibility === PUBLIC);
  }
});

Deno.test("The numeric projection counts authorized private activity without carrying metadata", () => {
  const { activity, issues, pullRequests, repositories } = fixtures();
  assertScores(
    new UserInfo(activity, issues, pullRequests, repositories),
    false,
  );
  assertScores(
    new UserInfo(activity, issues, pullRequests, repositories, true),
    true,
  );
});

for (const includePrivate of [false, true]) {
  Deno.test(`GitHub service counts ${includePrivate ? "public and private" : "public-only"} nodes through both filter layers`, async () => {
    const { activity, issues, pullRequests, repositories } = fixtures();
    let calls = 0;
    const mock = stub(globalThis, "fetch", (input, init) => {
      calls++;
      const url = new URL(String(input));
      const auth = new Headers(init?.headers).get("Authorization");
      if (url.pathname === `/users/${owner}`) {
        assertEquals(auth, null);
        return Promise.resolve(Response.json({
          login: owner,
          created_at: activity.createdAt,
          followers: 6,
          email: MARKER,
          private_gists: 900012,
        }));
      }
      assertEquals(auth, "Bearer fixture-private-token");
      if (url.pathname === `/users/${owner}/orgs`) {
        return Promise.resolve(Response.json([{ id: 1, login: "public-org" }]));
      }
      const { query, variables } = JSON.parse(String(init?.body));
      assertEquals(
        /\b(nameWithOwner|email|body|message|description|contents|object)\b/
          .test(query),
        false,
      );
      if (query === queryUserRepository) {
        assertEquals(query.includes("privacy: $privacy"), true);
        assertEquals(variables.privacy, includePrivate ? null : "PUBLIC");
        return Promise.resolve(Response.json({
          data: {
            user: {
              repositories: { ...repositories.repositories, pageInfo },
            },
          },
        }));
      }
      if (query === queryUserActivity) {
        assertEquals(query.includes("totalCommitContributions"), false);
        return Promise.resolve(Response.json({ data: { user: activity } }));
      }
      assertEquals(
        variables.search.split(" ").includes("is:public"),
        !includePrivate,
      );
      if (query === queryUserReview) {
        assertEquals(variables.search.includes("-is:archived"), true);
        const nodes = [PUBLIC, PRIVATE, INTERNAL, UNKNOWN].map((
          visibility,
          index,
        ) => ({
          id: `reviewed-pr-${index}`,
          repository: visibility,
          reviews: {
            nodes: activity.publicReviews.filter((review) =>
              review.repository === visibility
            )
              .map(({ repository: _repository, ...review }) => review),
          },
        }));
        return Promise.resolve(
          Response.json({ data: { search: { nodes, pageInfo } } }),
        );
      }
      assertEquals(
        query === queryUserIssue || query === queryUserPullRequest,
        true,
      );
      const nodes = query === queryUserIssue
        ? [...issues.openIssues.nodes, ...issues.closedIssues.nodes]
        : pullRequests.pullRequests.nodes;
      return Promise.resolve(
        Response.json({
          data: { search: { nodes, pageInfo, issueCount: 900013 } },
        }),
      );
    });
    try {
      const result = await new GithubApiService(
        ["fixture-private-token"],
        undefined,
        includePrivate,
      )
        .requestUserInfo(owner);
      assertEquals(result instanceof UserInfo, true);
      assertScores(result as UserInfo, includePrivate);
      assertEquals(calls, 7);
    } finally {
      mock.restore();
    }
  });
}

Deno.test("Private repository counts stay bounded and ignore unverified aggregate totals", async () => {
  let calls = 0;
  const mock = stub(globalThis, "fetch", (_input, init) => {
    const { variables } = JSON.parse(String(init?.body));
    assertEquals(variables.privacy, null);
    assertEquals(variables.cursor, calls ? `page-${calls}` : null);
    calls++;
    return Promise.resolve(Response.json({
      data: {
        user: {
          repositories: {
            totalCount: 900014,
            nodes: [
              repository(`private-${calls}`, PRIVATE, 1, "TypeScript"),
              repository(MARKER, UNKNOWN, 900015, MARKER),
            ],
            pageInfo: { hasNextPage: true, endCursor: `page-${calls}` },
          },
        },
      },
    }));
  });
  try {
    const result = await new GithubApiService(
      ["fixture-private-token"],
      undefined,
      true,
    )
      .requestUserRepository(owner) as GitHubUserRepository;
    assertEquals(result.repositories.totalCount, MAX_PUBLIC_PAGES);
    assertEquals(calls, MAX_PUBLIC_PAGES);
    assertEquals(JSON.stringify(result).includes(MARKER), false);
  } finally {
    mock.restore();
  }
});

Deno.test("Enabling private counts cannot bypass the service's token requirement", async () => {
  const mock = stub(globalThis, "fetch", () => {
    throw new Error("No upstream call without a token");
  });
  try {
    const result = await new GithubApiService([], undefined, true)
      .requestUserInfo(owner);
    assertEquals(result instanceof ServiceError, true);
    assertEquals(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});
