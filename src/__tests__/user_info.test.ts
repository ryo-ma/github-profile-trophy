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
