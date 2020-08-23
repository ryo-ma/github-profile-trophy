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

export class Card {
  private width = 0;
  private height = 0;
  constructor(
    private panelSize = 110,
    private maxPanelWidthCount = 6,
    private maxPanelHeightCount = 3,
  ) {
    this.width = panelSize * this.maxPanelWidthCount;
  }
  render(userInfo: UserInfo): string {
    const trophyList = new Array<Trophy>(
      new TotalStarTrophy(userInfo.totalStargazers),
      new TotalCommitTrophy(userInfo.totalCommits),
      new TotalFollowerTrophy(userInfo.totalFollowers),
      new TotalIssueTrophy(userInfo.totalIssues),
      new TotalPullRequestTrophy(userInfo.totalPullRequests),
      new TotalRepositoryTrophy(userInfo.totalRepositories),
    );

    let panelHeightCount =
      Math.floor((trophyList.length - 1) / this.maxPanelWidthCount) + 1;
    if (panelHeightCount > this.maxPanelHeightCount) {
      panelHeightCount = this.maxPanelHeightCount;
    }
    this.height = this.panelSize * panelHeightCount;

    const renderdTrophy = trophyList.reduce(
      (sum: string, trophy: Trophy, i: number) => {
        const x = this.panelSize * (i % this.maxPanelWidthCount);
        const y = this.panelSize * Math.floor(i / this.maxPanelWidthCount);
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
      ${renderdTrophy}
    </svg>`;
  }
}
