import { getTropyIcon } from "./icons.ts";

abstract class Trophy {
  rank: string = "?";
  topMessage = "Unknown";
  bottomMessage = "+0";
  title = "";
  abstract setRank(): void;
  render(x = 0, y = 0): string {
    return `
        <svg
          x="${x}"
          y="${y}"
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            data-testid="card-bg"
            x="0.5"
            y="0.5"
            rx="4.5"
            width="99"
            height="99"
            stroke="#E4E2E2"
            fill="#fff"
            stroke-opacity="1"
          />
          ${getTropyIcon(this.rank)}
          <text x="50%" y="18" text-anchor="middle" font-family="Courier, Monospace" font-weight="bold" font-size="12" fill="#000">${this.title}</text>
          <text x="50%" y="85" text-anchor="middle" font-family="Courier, Monospace" font-weight="bold" font-size="10" fill="#000">${this.topMessage}</text>
          <text x="50%" y="95" text-anchor="middle" font-family="Courier, Monospace" font-weight="bold" font-size="10" fill="#000">${this.bottomMessage}</text>
        </svg>
        `;
  }
}

export class TotalStarTrophy extends Trophy {
  constructor(private totalStartgazer: Number) {
    super();
    this.title = "TOTAL STAR";
    this.setRank();
  }
  setRank() {
    if (this.totalStartgazer >= 1000) {
      this.rank = "S";
      this.topMessage = "Super Star +1000";
    } else if (this.totalStartgazer >= 500) {
      this.rank = "A";
      this.topMessage = "High Star +500";
    } else if (this.totalStartgazer >= 100) {
      this.rank = "B";
      this.topMessage = "Middle Star +100";
    } else if (this.totalStartgazer >= 1) {
      this.rank = "C";
      this.topMessage = "First Star";
    }
  }
}

export class TotalCommitTrophy extends Trophy {
  constructor(private totalStartgazer: Number) {
    super();
    this.title = "TOTAL COMMIT";
    this.setRank();
  }
  setRank() {
    if (this.totalStartgazer >= 5000) {
      this.rank = "S";
      this.topMessage = "Super commiter";
      this.bottomMessage = "+5000";
    } else if (this.totalStartgazer >= 1000) {
      this.rank = "A";
      this.topMessage = "High commiter";
      this.bottomMessage = "+1000";
    } else if (this.totalStartgazer >= 200) {
      this.rank = "B";
      this.topMessage = "Middle commiter";
      this.bottomMessage = "+200";
    } else if (this.totalStartgazer >= 1) {
      this.rank = "C";
      this.topMessage = "First commit";
      this.bottomMessage = "+1";
    }
  }
}
