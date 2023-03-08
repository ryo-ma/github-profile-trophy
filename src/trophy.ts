import { getTrophyIcon, getNextRankBar } from "./icons.ts";
import { CONSTANTS, RANK, abridgeScore, RANK_ORDER } from "./utils.ts";
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
  topMessage = "?";
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
  render(theme: Theme,
    x = 0,
    y = 0,
    panelSize = CONSTANTS.DEFAULT_PANEL_SIZE,
    noBackground = CONSTANTS.DEFAULT_NO_BACKGROUND,
    noFrame = CONSTANTS.DEFAULT_NO_FRAME,
  ): string {
    const { BACKGROUND: PRIMARY, TITLE: SECONDARY, TEXT, NEXT_RANK_BAR } = theme;
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
            stroke-opacity="${noFrame ? '0' : '1'}"
            fill-opacity="${noBackground ? '0' : '1'}"
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

export class MultipleLangTrophy extends Trophy{
  constructor(score: number){
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Rainbow Lang",
        10,
      ),
    ];
    super(score, rankConditions);
    this.title = "MultiLanguage";
    this.filterTitles = ["MultiLang", "MultiLanguage"];
    this.hidden = true;
  }
}

export class AllSuperRankTrophy extends Trophy{
  constructor(score: number){
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
    this.bottomMessage = "All S Ranked Trophies"
    this.hidden = true;
  }
}


export class AccountYearTrophy extends Trophy{
  constructor(score: number){
    const rankConditions = [ 
      new RankCondition(
        RANK.SECRET,
        "How many years since you've joined.",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "AccountYear";
    this.filterTitles = ["AccountAge", "AccountYear", "Years"];
    this.bottomMessage = "TBD years on GitHub." // TBD = number of years, if above a certain amount of years, the message changes. (such as joining in 2008)
    this.hidden = true;
  }
}



// TODO: Change this.
export class Joined2020Trophy extends Trophy{
  constructor(score: number){
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
    this.bottomMessage = "Joined in 2020"
    this.hidden = true;
    // question, why are you only awarded for making an account in 2020? i made an account in 2017~ so shouldn't it be based on how many years?
    // example: milestone every 2-3 years 
  }
}
export class AncientAccountTrophy extends Trophy{
  constructor(score: number){
    const rankConditions = [
      new RankCondition(
        RANK.SECRET,
        "Veteran",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "AncientUser";
    this.filterTitles = ["AncientUser", "Veteran"];
    this.bottomMessage = "Joined GitHub Before 2010"
    this.hidden = true;
  }
}

// There is no description on how to get this trophy?
export class LongTimeAccountTrophy extends Trophy{
  constructor(score: number){
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
export class MultipleOrganizationsTrophy extends Trophy{
  constructor(score: number){
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

export class OGAccountTrophy extends Trophy{
  constructor(score: number){
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
    this.bottomMessage = "Joined GitHub in 2008"
    this.hidden = true;
  }
}

export class TotalStarTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Stargazer",
        2000,
      ),
      new RankCondition(
        RANK.SS,
        "Senior Stargazer",
        700,
      ),
      new RankCondition(
        RANK.S,
        "Stargazer",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Junior Stargazer", // Junior < Stargazer < Senior Stargazer
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Star Collector",
        50,
      ),
      new RankCondition(
        RANK.A,
        "Star Spotter",  // confused on this? since the theme is about collecting stars / stargazing, star spotter means you "spot" stars in the sky
        30,
      ),
      new RankCondition(
        RANK.B,
        "Novice Stargazer", // Novice: a person new to or inexperienced in a field or situation.
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

// NOTE: I feel like that commiting can be easy if you dedicate yourself enough, so this shouldn't have as many tiers.
// Because of this I balanced out how many commits you need to advance.
// C -> B: 99
// B -> A: 350
// A -> S: 3550
// S -> SSS: 6000 (Might be too extreme?)
export class TotalCommitTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      
      new RankCondition(
        RANK.SSS,
        "Commiting King",
        10000,
      ),
      
      /*
      new RankCondition(
        RANK.SS,
        "",
        2000,
      ),
      */
      
      new RankCondition(
        RANK.S,
        "Expert Committer",
        4000,
      ),
      /*
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
      */
      new RankCondition(
        RANK.A,
        "Pro Committer",
        450,
      ),
      new RankCondition(
        RANK.B,
        "Novice Commiter",
        100,
      ),
      new RankCondition(
        RANK.C,
        "First Commits",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Commits";
    this.filterTitles = ["Commit", "Commits"];
  }
}

// Instead of calling them a "user", we can drop the title to make it easier.
// Decided to make more balances
export class TotalFollowerTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Famous Celebrity", // might be counterintuitive
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Celebrity",
        400,
      ),
      new RankCondition(
        RANK.S,
        "Well Known",
        200,
      ),
      /*
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
      */
      new RankCondition(
        RANK.A,
        "NAME TBD",  //TODO: Think of a name.
        30,
      ),
      new RankCondition(
        RANK.B,
        "NAME TBD", //TODO: Think of a name.
        10,
      ),
      new RankCondition(
        RANK.C,
        "First Follower",
        1,
      ),
    ];
    super(score, rankConditions);
    this.title = "Followers";
    this.filterTitles = ["Follower", "Followers"];
  }
}

// TODO: Think of a better gramatical term for this.
export class TotalIssueTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Reporter",
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Omega Reporter",
        500,
      ),
      new RankCondition(
        RANK.S,
        "Super Reporter",
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Reporter",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Reporter",
        50,
      ),
      new RankCondition(
        RANK.A,
        "Advanced Reporter",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Novice Reporting",
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
    this.filterTitles = ["Issue", "Issues", "Reports"];
  }
}

export class TotalPullRequestTrophy extends Trophy {
  constructor(score: number) {
    const rankConditions = [
      new RankCondition(
        RANK.SSS,
        "Godly Puller", //TODO: Think of a name
        1000,
      ),
      new RankCondition(
        RANK.SS,
        "Omega Puller",  //TODO: Think of a name.
        500,
      ),
      new RankCondition(
        RANK.S,
        "Super Puller",  //TODO: Think of a name.
        200,
      ),
      new RankCondition(
        RANK.AAA,
        "Experienced Puller",
        100,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Puller",  //TODO: Think of a name.
        50,
      ),
      new RankCondition(
        RANK.A,
        "Advanced Puller",
        20,
      ),
      new RankCondition(
        RANK.B,
        "Novice Puller",
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
        "Expert Repo Creator",
        100,
      ),
      new RankCondition(
        RANK.SS,
        "Deep Repo Creator",  //TODO: Think of a name.
        90,
      ),
      new RankCondition(
        RANK.S,
        "Super Repo Creator",  //TODO: Think of a name.
        80,
      ),
      new RankCondition(
        RANK.AAA,
        "Ultra Repo Creator",  //TODO: Think of a name.
        50,
      ),
      new RankCondition(
        RANK.AA,
        "Hyper Repo Creator",
        30,
      ),
      new RankCondition(
        RANK.A,
        "Advanced Repo Creator",  //TODO: Think of a name.
        20,
      ),
      new RankCondition(
        RANK.B,
        "Repo Creator",
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
