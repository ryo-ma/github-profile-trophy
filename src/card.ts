import {
  Trophy,
  TotalStarTrophy,
  TotalCommitTrophy,
  TotalFollowerTrophy,
  TotalIssueTrophy,
  TotalPullRequestTrophy,
  TotalRepositoryTrophy,
  MultipleLangTrophy,
  LongTimeAccountTrophy,
  AncientAccountTrophy,
} from "./trophies.ts";
import { UserInfo } from "./github_api_client.ts";
import { CONSTANTS, RANK_ORDER, RANK } from "./utils.ts";

export class Card {
  private width = 0;
  private height = 0;
  constructor(
    private titles: Array<string>,
    private ranks: Array<string>,
    private maxColumn: number,
    private maxRow: number,
    private panelSize: number,
    private paddingWidth: number,
    private paddingHight: number,
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
      new MultipleLangTrophy(userInfo.languageCount),
      new LongTimeAccountTrophy(userInfo.durationYear),
      new AncientAccountTrophy(userInfo.acientAccount),
    );

    // Filter by hidden
    trophyList = trophyList.filter((trophy) =>
      !trophy.hidden || trophy.rank !== RANK.UNKNOWN
    );

    // Filter by titles
    if (this.titles.length != 0) {
      trophyList = trophyList.filter((trophy) => {
        return trophy.filterTitles.some((title) => this.titles.includes(title))
      });
    }

    // Filter by ranks
    if (this.ranks.length != 0) {
      trophyList = trophyList.filter((trophy) =>
        this.ranks.includes(trophy.rank)
      );
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
