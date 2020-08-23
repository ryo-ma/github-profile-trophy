import { TotalStarTrophy, TotalCommitTrophy, TotalFollowerTrophy } from "./trophies.ts";

export class Card {
  constructor(private width = 1000, private height = 200) {
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
    const trophy11 = new TotalFollowerTrophy(100);
    const trophy12 = new TotalFollowerTrophy(500);
    return `
    <svg
      width="${this.width}"
      height="${this.height}"
      viewBox="0 0 ${this.width} ${this.height}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        data-testid="card-bg"
        x="0.5"
        y="0.5"
        rx="4.5"
        height="99%"
        stroke="#E4E2E2"
        width="${this.width - 1}"
        fill="#fff"
        stroke-opacity="1"
      />
      ${trophy1.render()}
      ${trophy2.render(100, 0)}
      ${trophy3.render(0, 100)}
      ${trophy4.render(100, 100)}
      ${trophy5.render(200, 0)}
      ${trophy6.render(300, 0)}
      ${trophy7.render(200, 100)}
      ${trophy8.render(300, 100)}
      ${trophy9.render(400, 0)}
      ${trophy10.render(500, 0)}
      ${trophy11.render(400, 100)}
      ${trophy12.render(500, 100)}
    </svg>`;
  }
}
