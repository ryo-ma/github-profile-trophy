import {
  Trophy,
  TotalStarTrophy,
  TotalCommitTrophy,
  TotalFollowerTrophy,
  TotalIssueTrophy,
  TotalPullRequestTrophy,
  TotalRepositoryTrophy,
} from "./trophies.ts";
import {UserInfo} from "./github_api_client.ts";

export class Card {
  private width = 0;
  private height = 0;
  constructor(
    private panelSize = 110,
    private maxPanelWidthCount = 6,
    private maxPanelHeightCount = 2,
  ) {
    this.width = panelSize * this.maxPanelWidthCount;
    this.height = panelSize * this.maxPanelHeightCount;
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
    const renderdTrophy = trophyList.reduce(
      (sum: string, trophy: Trophy, i: number) => {
        let x = (this.panelSize * i);
        let y = 0;
        if (i >= this.maxPanelWidthCount) {
          x = (this.panelSize * (i - this.maxPanelWidthCount));
          y = this.panelSize;
        }
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
