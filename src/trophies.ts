import { getTropyIcon } from "./icons.ts";
import { CONSTANTS, RANK, abridgeScore } from "./utils.ts";

export abstract class Trophy {
  rank: RANK = RANK.UNKNOWN;
  topMessage = "Unknown";
  bottomMessage = "+0";
  title = "";
  abstract setRank(): void;
  render(x = 0, y = 0, panelSize = CONSTANTS.DEFALT_PANEL_SIZE): string {
    return `
        <svg
          x="${x}"
          y="${y}"
          width="${panelSize}"
          height="${panelSize}"
          viewBox="0 0 ${panelSize} ${panelSize}"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.5"
            y="0.5"
            rx="4.5"
            width="${panelSize - 1}"
            height="${panelSize - 1}"
            stroke="#e1e4e8"
            fill="#fff"
            stroke-opacity="1"
          />
          ${getTropyIcon(this.rank)}
          <text x="50%" y="18" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="12" fill="#000">${this.title}</text>
          <text x="50%" y="85" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="9.5" fill="#666">${this.topMessage}</text>
          <text x="50%" y="99" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="9" fill="#666">${this.bottomMessage}</text>
        </svg>
        `;
  }
}

export class TotalStarTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "Star";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 200) {
      this.rank = RANK.S;
      this.topMessage = "Super Star";
    } else if (this.score >= 100) {
      this.rank = RANK.A;
      this.topMessage = "High Star";
    } else if (this.score >= 10) {
      this.rank = RANK.B;
      this.topMessage = "Middle Star";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First Star";
    }
  }
}

export class TotalCommitTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "Commit";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 1000) {
      this.rank = RANK.S;
      this.topMessage = "Super Commiter";
    } else if (this.score >= 500) {
      this.rank = RANK.A;
      this.topMessage = "High Commiter";
    } else if (this.score >= 100) {
      this.rank = RANK.B;
      this.topMessage = "Middle Commiter";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First Commit";
    }
  }
}

export class TotalFollowerTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "Follower";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 100) {
      this.rank = RANK.S;
      this.topMessage = "Celebrity";
    } else if (this.score >= 20) {
      this.rank = RANK.A;
      this.topMessage = "Famous User";
    } else if (this.score >= 10) {
      this.rank = RANK.B;
      this.topMessage = "Many Friends";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First Friend";
    }
  }
}
export class TotalIssueTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "Issue";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 100) {
      this.rank = RANK.S;
      this.topMessage = "Super Issuer";
    } else if (this.score >= 20) {
      this.rank = RANK.A;
      this.topMessage = "High Issuer";
    } else if (this.score >= 10) {
      this.rank = RANK.B;
      this.topMessage = "Middle Issuer";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First Issue";
    }
  }
}

export class TotalPullRequestTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "PR";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 100) {
      this.rank = RANK.S;
      this.topMessage = "God PR User";
    } else if (this.score >= 20) {
      this.rank = RANK.A;
      this.topMessage = "High PR User";
    } else if (this.score >= 10) {
      this.rank = RANK.B;
      this.topMessage = "Many PRs";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First PR";
    }
  }
}

export class TotalRepositoryTrophy extends Trophy {
  constructor(private score: number) {
    super();
    this.title = "Repo";
    this.setRank();
  }
  setRank() {
    this.bottomMessage = abridgeScore(this.score);
    if (this.score >= 100) {
      this.rank = RANK.S;
      this.topMessage = "God Repo Creator";
    } else if (this.score >= 20) {
      this.rank = RANK.A;
      this.topMessage = "High Repo Creator";
    } else if (this.score >= 10) {
      this.rank = RANK.B;
      this.topMessage = "Many Repo";
    } else if (this.score >= 1) {
      this.rank = RANK.C;
      this.topMessage = "First Repository";
    }
  }
}
