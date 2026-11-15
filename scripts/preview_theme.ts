import { Card } from "../src/card.ts";
import { COLORS } from "../src/theme.ts";
import { UserInfo } from "../src/user_info.ts";

// Representative sample values, matching the reference profile screenshot.
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

const svg = new Card([], [], -1, 3, 110, 10, 10, false, false)
  .render(sample, COLORS.tokyonight);
await Deno.mkdir("assets", { recursive: true });
await Deno.writeTextFile(
  "assets/tokyonight.svg",
  svg.replace(/[ \t]+$/gm, "").trim() + "\n",
);
console.log("Wrote assets/tokyonight.svg (sample data)");
