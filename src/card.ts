import {
  Trophy,
  TotalStarTrophy,
  TotalCommitTrophy,
  TotalFollowerTrophy,
  TotalIssueTrophy,
  TotalPullRequestTrophy,
  TotalRepositoryTrophy,
} from "./trophies.ts";
import { UserInfo } from "./github_api_client.ts";
import { CONSTANTS, RANK_ORDER } from "./utils.ts";

export class Card {
  private width = 0;
  private height = 0;
  constructor(
    private ranks: Array<string>,
    private maxColumn = CONSTANTS.DEFAULT_MAX_COLUMN,
    private maxRow = CONSTANTS.DEFAULT_MAX_ROW,
    private panelSize = CONSTANTS.DEFAULT_PANEL_SIZE,
  ) {
    this.width = panelSize * this.maxColumn;
  }
  render(userInfo: UserInfo): string {
    let trophyList = new Array<Trophy>(
      new TotalStarTrophy(userInfo.totalStargazers),
      new TotalCommitTrophy(userInfo.totalCommits),
      new TotalFollowerTrophy(userInfo.totalFollowers),
      new TotalIssueTrophy(userInfo.totalIssues),
      new TotalPullRequestTrophy(userInfo.totalPullRequests),
      new TotalRepositoryTrophy(userInfo.totalRepositories),
    );

    // Filter by ranks
    if (this.ranks.length != 0) {
      trophyList = trophyList.filter((trophy) => this.ranks.includes(trophy.rank))
    }

    // Sort by rank
    trophyList = trophyList.sort((a: Trophy, b: Trophy) =>
      RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
    );

    // Calculate the height of card from turns
    let row = Math.floor((trophyList.length - 1) / this.maxColumn) + 1;
    if (row > this.maxRow) {
      row = this.maxRow;
    }
    this.height = this.panelSize * row;

    // Join all trophy
    const renderedTrophy = trophyList.reduce(
      (sum: string, trophy: Trophy, i: number) => {
        const x = this.panelSize * (i % this.maxColumn);
        const y = this.panelSize * Math.floor(i / this.maxColumn);
        return sum + trophy.render(x, y, this.panelSize);
      },
      "",
    );
    return `
    <svg
      width="${this.width}"
      height="${this.height}"
      viewBox="0 0 ${this.width} ${this.height}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${renderedTrophy}
    </svg>`;
  }
}
