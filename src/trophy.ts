import { getNextRankBar, getTrophyIcon } from "./icons.ts";
import { abridgeScore, CONSTANTS, RANK, RANK_ORDER } from "./utils.ts";
import { Theme } from "./theme.ts";

class RankCondition {
  constructor(
    readonly rank: RANK,
    readonly message: string,
    readonly requiredScore: number,
  ) {}
}

export class Trophy {
  rankCondition: RankCondition | null = null;
  rank: RANK = RANK.UNKNOWN;
  topMessage = "Unknown";
  bottomMessage = "0";
  title = "";
  filterTitles: Array<string> = [];
  hidden = false;
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
      this.score >= r.requiredScore
    );
    if (rankCondition != null) {
      this.rank = rankCondition.rank;
      this.rankCondition = rankCondition;
      this.topMessage = rankCondition.message;
    }
  }
  private calculateNextRankPercentage() {
    if (this.rank === RANK.UNKNOWN) {
      return 0;
    }
    const nextRankIndex = RANK_ORDER.indexOf(this.rank) - 1;
    // When got the max rank
    if (nextRankIndex < 0 || this.rank === RANK.SSS) {
      return 1;
    }
    const nextRank = RANK_ORDER[nextRankIndex];
    const nextRankCondition = this.rankConditions.find((r) =>
      r.rank == nextRank
    );
    const distance = nextRankCondition!.requiredScore -
      this.rankCondition!.requiredScore;
    const progress = this.score - this.rankCondition!.requiredScore;
    const result = progress / distance;
    return result;
  }
  render(
    theme: Theme,
    x = 0,
    y = 0,
    panelSize = CONSTANTS.DEFAULT_PANEL_SIZE,
    noBackground = CONSTANTS.DEFAULT_NO_BACKGROUND,
    noFrame = CONSTANTS.DEFAULT_NO_FRAME,
  ): string {
    const { BACKGROUND: PRIMARY, TITLE: SECONDARY, TEXT, NEXT_RANK_BAR } =
      theme;
    const nextRankBar = getNextRankBar(
      this.title,
      this.calculateNextRankPercentage(),
      NEXT_RANK_BAR,
    );
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
            fill="${PRIMARY}"
            stroke-opacity="${noFrame ? "0" : "1"}"
            fill-opacity="${noBackground ? "0" : "1"}"
          />
          ${getTrophyIcon(theme, this.rank)}
          <text x="50%" y="18" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji" font-weight="bold" font-size="13" fill="${SECONDARY}">${this.title}</text>
          <text x="50%" y="85" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji" font-weight="bold" font-size="10.5" fill="${TEXT}">${this.topMessage}</text>
          <text x="50%" y="97" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji" font-weight="bold" font-size="10" fill="${TEXT}">${this.bottomMessage}</text>
          ${nextRankBar}
        </svg>
        `;
  }
}

export class MultipleLangTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Rainbow Lang User",
        10,
      ),
    ];
    super(score, rankConditions);
    this.title = "MultiLanguage";
    this.filterTitles = ["MultipleLang", "MultiLanguage"];
    this.hidden = true;
  }
}

export class AllSuperRankTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "S Rank Hacker",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "AllSuperRank";
    this.filterTitles = ["AllSuperRank"];
    this.bottomMessage = "All S Rank";
    this.hidden = true;
  }
}
export class Joined2020Trophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Everything started...",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Joined2020";
    this.filterTitles = ["Joined2020"];
    this.bottomMessage = "Joined 2020";
    this.hidden = true;
  }
}
export class AncientAccountTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Ancient User",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "AncientUser";
    this.filterTitles = ["AncientUser"];
    this.bottomMessage = "Before 2010";
    this.hidden = true;
  }
}
export class LongTimeAccountTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Village Elder",
        10,
      ),
    ];
    super(score, rankConditions);
    this.title = "LongTimeUser";
    this.filterTitles = ["LongTimeUser"];
    this.hidden = true;
  }
}
export class MultipleOrganizationsTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        // or if this doesn't render well: "Factorum"
        "Jack of all Trades",
        3,
      ),
    ];
    super(score, rankConditions);
    this.title = "Organizations";
    this.filterTitles = ["Organizations", "Orgs", "Teams"];
    this.hidden = true;
  }
}

// The following code was used to assign a Chinese Zodiac animal based on the user's join year.
// It mapped every year to its corresponding Zodiac animal in a 12-year cycle.
// For example:
// 2008 or 2020 was the Year of the Rat,
// 2009 or 2021 was the Year of the Ox,
// 2010 or 2022 was the Year of the Tiger,
// 2011 or 2023 was the Year of the Rabbit,
// 2012 or 2024 was the Year of the Dragon,
// 2013 or 2025 was the Year of the Snake,
// 2014 or 2026 was the Year of the Horse,
// 2015 or 2027 was the Year of the Goat,
// 2016 or 2028 was the Year of the Monkey,
// 2017 or 2029 was the Year of the Rooster,
// 2018 or 2030 was the Year of the Dog,
// 2019 or 2031 was the Year of the Pig.

export class ChineseZodiacAnimalTrophy extends Trophy {
  constructor(year: number) {
    const rankConditions = [
      new RankCondition(RANK.SECRET, "Year of the Pig", 2031),
      new RankCondition(RANK.SECRET, "Year of the Dog", 2030),
      new RankCondition(RANK.SECRET, "Year of the Rooster", 2029),
      new RankCondition(RANK.SECRET, "Year of the Monkey", 2028),
      new RankCondition(RANK.SECRET, "Year of the Goat", 2027),
      new RankCondition(RANK.SECRET, "Year of the Horse", 2026),
      new RankCondition(RANK.SECRET, "Year of the Snake", 2025),
      new RankCondition(RANK.SECRET, "Year of the Dragon", 2024),
      new RankCondition(RANK.SECRET, "Year of the Rabbit", 2023),
      new RankCondition(RANK.SECRET, "Year of the Tiger", 2022),
      new RankCondition(RANK.SECRET, "Year of the Ox", 2021),
      new RankCondition(RANK.SECRET, "Year of the Rat", 2020),
      new RankCondition(RANK.SECRET, "Year of the Pig", 2019),
      new RankCondition(RANK.SECRET, "Year of the Dog", 2018),
      new RankCondition(RANK.SECRET, "Year of the Rooster", 2017),
      new RankCondition(RANK.SECRET, "Year of the Monkey", 2016),
      new RankCondition(RANK.SECRET, "Year of the Goat", 2015),
      new RankCondition(RANK.SECRET, "Year of the Horse", 2014),
      new RankCondition(RANK.SECRET, "Year of the Snake", 2013),
      new RankCondition(RANK.SECRET, "Year of the Dragon", 2012),
      new RankCondition(RANK.SECRET, "Year of the Rabbit", 2011),
      new RankCondition(RANK.SECRET, "Year of the Tiger", 2010),
      new RankCondition(RANK.SECRET, "Year of the Ox", 2009),
      new RankCondition(RANK.SECRET, "Year of the Rat", 2008),
    ];
    super(year, rankConditions);
    this.title = "Zodiac";
    this.filterTitles = [
      "Zodiac",
      "Chinese",
      "Animal",
      "Calendar",
      "ChineseZodiacAnimal",
    ];
    this.bottomMessage = `Joined ${year}`;
    this.hidden = true;
  }
}

export class OGAccountTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "OG User",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "OGUser";
    this.filterTitles = ["OGUser"];
    this.bottomMessage = "Joined 2008";
    this.hidden = true;
  }
}

export class TotalReviewsTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Reviewer",
        70,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Reviewer",
        57,
      ),
      new RankCondition(
        RANK.S,
        "Super Reviewer",
        45,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Reviewer",
        30,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Reviewer",
        20,
      ),
      new RankCondition(
        RANK.A,
        "Active Reviewer",
        8,
      ),
      new RankCondition(
        RANK.B,
        "Intermediate Reviewer",
        3,
      ),
      new RankCondition(
        RANK.C,
        "New Reviewer",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Reviews";
    this.filterTitles = ["Review", "Reviews"];
  }
}

export class AccountDurationTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Seasoned Veteran",
        70, // 20 years
      ),
      new RankCondition(
        RANK.SS,
        "Grandmaster",
        55, // 15 years
      ),
      new RankCondition(
        RANK.S,
        "Master Dev",
        40, // 10 years
      ),
      new RankCondition(
        RANK.AAA,
        "Expert Dev",
        28, // 7.5 years
      ),
      new RankCondition(
        RANK.AA,
        "Experienced Dev",
        18, // 5 years
      ),
      new RankCondition(
        RANK.A,
        "Intermediate Dev",
        11, // 3 years
      ),
      new RankCondition(
        RANK.B,
        "Junior Dev",
        6, // 1.5 years
      ),
      new RankCondition(
        RANK.C,
        "Newbie",
        2, // 0.5 year
      ),
    ];
    super(score, rankConditions);
    this.title = "Experience";
    this.filterTitles = ["Experience", "Duration", "Since"];
    // this.hidden = true;
  }
}

export class TotalStarTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Super Stargazer",
        2000,
      ),
      new RankCondition(
        RANK.SS,
        "High Stargazer",
        700,
      ),
      new RankCondition(
        RANK.S,
        "Stargazer",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Super Star",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "High Star",
        50,
      ),
      new RankCondition(
        RANK.A,
        "You are a Star",
        30,
      ),
      new RankCondition(
        RANK.B,
        "Middle Star",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Star",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Stars";
    this.filterTitles = ["Star", "Stars"];
  }
}

export class TotalCommitTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Committer",
        4000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Committer",
        2000,
      ),
      new RankCondition(
        RANK.S,
        "Super Committer",
        1000,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Committer",
        500,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Committer",
        200,
      ),
      new RankCondition(
        RANK.A,
        "High Committer",
        100,
      ),
      new RankCondition(
        RANK.B,
        "Middle Committer",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Commit",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Commits";
    this.filterTitles = ["Commit", "Commits"];
  }
}

export class TotalFollowerTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Super Celebrity",
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Ultra Celebrity",
        400,
      ),
      new RankCondition(
        RANK.S,
        "Hyper Celebrity",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Famous User",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Active User",
        50,
      ),
      new RankCondition(
        RANK.A,
        "Dynamic User",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Many Friends",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Friend",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Followers";
    this.filterTitles = ["Follower", "Followers"];
  }
}

export class TotalIssueTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Issuer",
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Issuer",
        500,
      ),
      new RankCondition(
        RANK.S,
        "Super Issuer",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Issuer",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Issuer",
        50,
      ),
      new RankCondition(
        RANK.A,
        "High Issuer",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Middle Issuer",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Issue",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Issues";
    this.filterTitles = ["Issue", "Issues"];
  }
}

export class TotalPullRequestTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Puller",
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Puller",
        500,
      ),
      new RankCondition(
        RANK.S,
        "Super Puller",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Puller",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Puller",
        50,
      ),
      new RankCondition(
        RANK.A,
        "High Puller",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Middle Puller",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Pull",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "PullRequest";
    this.filterTitles = ["PR", "PullRequest", "Pulls", "Puller"];
  }
}

export class TotalRepositoryTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "God Repo Creator",
        100,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Repo Creator",
        90,
      ),
      new RankCondition(
        RANK.S,
        "Super Repo Creator",
        80,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Repo Creator",
        50,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Repo Creator",
        30,
      ),
      new RankCondition(
        RANK.A,
        "High Repo Creator",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Middle Repo Creator",
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Repository",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Repositories";
    this.filterTitles = ["Repo", "Repository", "Repositories"];
  }
}
