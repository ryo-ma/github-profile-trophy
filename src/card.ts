import {
  Trophy,
  TotalStarTrophy,
  TotalCommitTrophy,
  TotalFollowerTrophy,
} from "./trophies.ts";

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
  render(): string {
    const trophy1 = new TotalStarTrophy(0);
    const trophy2 = new TotalStarTrophy(100);
    const trophy3 = new TotalStarTrophy(500);
    const trophy4 = new TotalStarTrophy(1000);
    const trophy5 = new TotalCommitTrophy(1);
    const trophy6 = new TotalCommitTrophy(200);
    const trophy7 = new TotalCommitTrophy(1000);
    const trophy8 = new TotalCommitTrophy(5000);
    const trophy9 = new TotalFollowerTrophy(1);
    const trophy10 = new TotalFollowerTrophy(50);
    const trophy11 = new TotalFollowerTrophy(200);
    const trophy12 = new TotalFollowerTrophy(500);
    const trophyList = new Array<Trophy>();
    trophyList.push(trophy1);
    trophyList.push(trophy2);
    trophyList.push(trophy3);
    trophyList.push(trophy4);
    trophyList.push(trophy5);
    trophyList.push(trophy6);
    trophyList.push(trophy7);
    trophyList.push(trophy8);
    trophyList.push(trophy9);
    trophyList.push(trophy10);
    trophyList.push(trophy11);
    trophyList.push(trophy12);
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
