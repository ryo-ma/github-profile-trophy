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
  Joined2020Trophy,
  AllSuperRankTrophy,
} from "./trophies.ts";
import { UserInfo } from "./github_api_client.ts";
import { RANK_ORDER, RANK } from "./utils.ts";
import { Theme } from "./theme.ts";

export class Card {
  private width = 0;
  private height = 0;
  constructor(
    private titles: Array<string>,
    private ranks: Array<string>,
    private maxColumn: number,
    private maxRow: number,
    private panelSize: number,
    private marginWidth: number,
    private marginHight: number,
    private noBackground: boolean,
    private noFrame: boolean,
  ) {
    this.width = panelSize * this.maxColumn + this.marginWidth * (this.maxColumn - 1);
  }
  render(
    userInfo: UserInfo,
    theme: Theme,
  ): string {
    // Base trophies
    let trophyList = new Array<Trophy>(
      new TotalStarTrophy(userInfo.totalStargazers),
      new TotalCommitTrophy(userInfo.totalCommits),
      new TotalFollowerTrophy(userInfo.totalFollowers),
      new TotalIssueTrophy(userInfo.totalIssues),
      new TotalPullRequestTrophy(userInfo.totalPullRequests),
      new TotalRepositoryTrophy(userInfo.totalRepositories),
    );
    const isAllSRank =
      trophyList.every((trophy) => trophy.rank.slice(0, 1) == RANK.S) ? 1 : 0;
    // Secret trophies
    trophyList.push(
      new MultipleLangTrophy(userInfo.languageCount),
      new LongTimeAccountTrophy(userInfo.durationYear),
      new AncientAccountTrophy(userInfo.ancientAccount),
      new Joined2020Trophy(userInfo.joined2020),
      new AllSuperRankTrophy(isAllSRank),
    );

    // Filter by hidden
    trophyList = trophyList.filter((trophy) =>
      !trophy.hidden || trophy.rank !== RANK.UNKNOWN
    );

    // Filter by titles
    if (this.titles.length != 0) {
      trophyList = trophyList.filter((trophy) => {
        return trophy.filterTitles.some((title) => this.titles.includes(title));
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
    this.height = this.panelSize * row + this.marginHight * (row - 1);

    // Join all trophy
    const renderedTrophy = trophyList.reduce(
      (sum: string, trophy: Trophy, i: number) => {
        const currentColumn = i % this.maxColumn;
        const currentRow = Math.floor(i / this.maxColumn);
        const x = this.panelSize * currentColumn + this.marginWidth * currentColumn;
        const y = this.panelSize * currentRow + this.marginHight * currentRow;
        return sum + trophy.render(theme, x, y, this.panelSize, this.noBackground, this.noFrame);
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
