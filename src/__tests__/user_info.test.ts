import { assertEquals } from "../../deps.ts";
import { UserInfo } from "../user_info.ts";

Deno.test("UserInfo calculates total stargazers", () => {
  const userInfo = new UserInfo(
    {
      createdAt: "2025-01-01T00:00:00Z",
      contributionsCollection: {
        restrictedContributionsCount: 0,
        totalCommitContributions: 0,
        totalPullRequestReviewContributions: 0,
      },
      organizations: { totalCount: 0 },
      followers: { totalCount: 0 },
    },
    {
      openIssues: { totalCount: 0 },
      closedIssues: { totalCount: 0 },
    },
    { pullRequests: { totalCount: 0 } },
    {
      repositories: {
        totalCount: 2,
        nodes: [
          {
            languages: { nodes: [] },
            stargazerCount: 3,
            createdAt: "2025-01-01T00:00:00Z",
          },
          {
            languages: { nodes: [] },
            stargazerCount: 5,
            createdAt: "2025-01-02T00:00:00Z",
          },
        ],
      },
    },
  );

  assertEquals(userInfo.totalStargazers, 8);
});

Deno.test("UserInfo defaults null/missing GraphQL sub-fields instead of throwing", () => {
  // GitHub's GraphQL API can return null for fields like `organizations`
  // when the token lacks the relevant scope, and null entries inside
  // `repositories.nodes` for repos it can't fully resolve for the given
  // token. UserInfo must degrade gracefully instead of throwing.
  const userInfo = new UserInfo(
    {
      createdAt: "2025-01-01T00:00:00Z",
      contributionsCollection: {
        restrictedContributionsCount: 0,
        totalCommitContributions: 0,
        totalPullRequestReviewContributions: 0,
      },
      organizations: null as unknown as { totalCount: number },
      followers: null as unknown as { totalCount: number },
    },
    {
      openIssues: { totalCount: 0 },
      closedIssues: { totalCount: 0 },
    },
    { pullRequests: { totalCount: 0 } },
    {
      repositories: {
        totalCount: 1,
        // deno-lint-ignore no-explicit-any
        nodes: [
          null as any,
          {
            languages: { nodes: [] },
            stargazerCount: 5,
            createdAt: "2025-01-02T00:00:00Z",
          },
        ],
      },
    },
  );

  assertEquals(userInfo.totalOrganizations, 0);
  assertEquals(userInfo.totalFollowers, 0);
  assertEquals(userInfo.totalStargazers, 5);
  assertEquals(userInfo.totalRepositories, 1);
});
