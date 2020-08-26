import { getTrophyIcon } from "./icons.ts";
import { CONSTANTS, RANK, abridgeScore, RANK_ORDER } from "./utils.ts";

class RankCondition {
  constructor(
    readonly rank: RANK,
    readonly message: string,
    readonly condition: (score: number) => boolean,
  ) {}
}

export class Trophy {
  rank: RANK = RANK.UNKNOWN;
  topMessage = "Unknown";
  bottomMessage = "0";
  title = "";
  constructor(
    private score: number,
    private rankConditions: Array<RankCondition>,
  ) {
    this.bottomMessage = abridgeScore(score);
    this.setRank();
  }
  setRank() {
    const sortedRankConditions = this.rankConditions.sort((a, b) =>
      RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
    );
    // Set the rank that hit the first condition
    const rankCondition = sortedRankConditions.find((r) =>
      r.condition(this.score)
    );
    if (rankCondition != null) {
      this.rank = rankCondition.rank;
      this.topMessage = rankCondition.message;
    }
  }
  render(x = 0, y = 0, panelSize = CONSTANTS.DEFAULT_PANEL_SIZE): string {
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
          ${getTrophyIcon(this.rank)}
          <text x="50%" y="18" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="12" fill="#000">${this.title}</text>
          <text x="50%" y="85" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="9.5" fill="#666">${this.topMessage}</text>
          <text x="50%" y="99" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;" font-weight="bold" font-size="9" fill="#666">${this.bottomMessage}</text>
        </svg>
        `;
  }
}

export class TotalStarTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Super Stargazer",
        (s) => s >= 2000,
      ),
      new RankCondition(
        RANK.SS,
        "High Stargazer",
        (s) => s >= 700,
      ),
      new RankCondition(
        RANK.S,
        "Stargazer",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.AAA,
        "Super Star",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.AA,
        "High Star",
        (s) => s >= 50,
      ),
      new RankCondition(
        RANK.A,
        "You are Star",
        (s) => s >= 30,
      ),
      new RankCondition(
        RANK.B,
        "Middle Star",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First Star",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Star";
  }
}

export class TotalCommitTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Committer",
        (s) => s >= 4000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Committer",
        (s) => s >= 2000,
      ),
      new RankCondition(
        RANK.S,
        "Super Committer",
        (s) => s >= 1000,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Committer",
        (s) => s >= 500,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Commiter",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.A,
        "High Committer",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.B,
        "Middle Committer",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First Commit",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Commit";
  }
}

export class TotalFollowerTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Super Celebrity",
        (s) => s >= 1000,
      ),
      new RankCondition(
        RANK.SS,
        "Ultra Celebrity",
        (s) => s >= 400,
      ),
      new RankCondition(
        RANK.S,
        "Hyper Celebrity",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.AAA,
        "Famous User",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.AA,
        "Active User",
        (s) => s >= 50,
      ),
      new RankCondition(
        RANK.A,
        "Dynamic User",
        (s) => s >= 20,
      ),
      new RankCondition(
        RANK.B,
        "Many Frieds",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First Friend",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Follower";
  }
}

export class TotalIssueTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Issuer",
        (s) => s >= 1000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Issuer",
        (s) => s >= 500,
      ),
      new RankCondition(
        RANK.S,
        "Super Issuer",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Isuuer",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Issuer",
        (s) => s >= 50,
      ),
      new RankCondition(
        RANK.A,
        "High Issuer",
        (s) => s >= 20,
      ),
      new RankCondition(
        RANK.B,
        "Middle Issuer",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First Issue",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Issue";
  }
}

export class TotalPullRequestTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God PR User",
        (s) => s >= 1000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep PR User",
        (s) => s >= 500,
      ),
      new RankCondition(
        RANK.S,
        "Super PR User",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra PR User",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper PR User",
        (s) => s >= 50,
      ),
      new RankCondition(
        RANK.A,
        "High PR User",
        (s) => s >= 20,
      ),
      new RankCondition(
        RANK.B,
        "Middle PR User",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First PR",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "PR";
  }
}

export class TotalRepositoryTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Repo Creator",
        (s) => s >= 200,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Repo Creator",
        (s) => s >= 100,
      ),
      new RankCondition(
        RANK.S,
        "Super Repo Creator",
        (s) => s >= 80,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Repo Creator",
        (s) => s >= 50,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Repo Creator",
        (s) => s >= 30,
      ),
      new RankCondition(
        RANK.A,
        "High Repo Creator",
        (s) => s >= 20,
      ),
      new RankCondition(
        RANK.B,
        "Middle Repo Creator",
        (s) => s >= 10,
      ),
      new RankCondition(
        RANK.C,
        "First Repository",
        (s) => s >= 1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Repo";
  }
}
