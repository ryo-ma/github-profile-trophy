import { assertEquals } from "../../deps.ts";
import { Card } from "../card.ts";
import { COLORS } from "../theme.ts";
import { UserInfo } from "../user_info.ts";

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
  { repositories: { totalCount: 0, nodes: [] } },
);

const render = (
  titles: Array<string>,
  maxColumn: number,
  maxRow: number,
) =>
  new Card(titles, [], maxColumn, maxRow, 100, 10, 10, false, false)
    .render(userInfo, COLORS.default);

// Every trophy panel has exactly one title <text> at y="18".
const countTrophies = (svg: string) =>
  (svg.match(/<text x="50%" y="18"/g) ?? []).length;

Deno.test("Card renders an empty card when filters remove every trophy", () => {
  // Regression: an empty list gave maxColumn 0 in auto mode (and 0 rows with
  // a fixed column count), producing negative/NaN SVG dimensions.
  for (const maxColumn of [-1, 3]) {
    const svg = render(["NoSuchTrophy"], maxColumn, 3);
    assertEquals(svg.includes('width="0"'), true);
    assertEquals(svg.includes('height="0"'), true);
    assertEquals(countTrophies(svg), 0);
  }
});

Deno.test("Card only renders trophies that fit within max rows", () => {
  // Regression: getRow() capped the height but every trophy was still
  // rendered, so the overflow landed outside the viewport.
  const all = countTrophies(render([], 2, 100));
  const svg = render([], 2, 1);
  assertEquals(countTrophies(svg), Math.min(all, 2));
  assertEquals(svg.includes('height="100"'), true);
});
