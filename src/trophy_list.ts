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
  MultipleOrganizationsTrophy,
} from "./trophy.ts";
import { UserInfo } from "./user_info.ts";
import { RANK_ORDER, RANK } from "./utils.ts";

export class TrophyList {
  private trophies = new Array<Trophy>();
  constructor(userInfo: UserInfo) {
    // Base trophies
    this.trophies.push(
      new TotalStarTrophy(userInfo.totalStargazers),
      new TotalCommitTrophy(userInfo.totalCommits),
      new TotalFollowerTrophy(userInfo.totalFollowers),
      new TotalIssueTrophy(userInfo.totalIssues),
      new TotalPullRequestTrophy(userInfo.totalPullRequests),
      new TotalRepositoryTrophy(userInfo.totalRepositories),
    );
    // Secret trophies
    this.trophies.push(
      new AllSuperRankTrophy(this.isAllSRank),
      new MultipleLangTrophy(userInfo.languageCount),
      new LongTimeAccountTrophy(userInfo.durationYear),
      new AncientAccountTrophy(userInfo.ancientAccount),
      new Joined2020Trophy(userInfo.joined2020),
      new MultipleOrganizationsTrophy(userInfo.totalOrganizations),
    );
  }
  get length() {
    return this.trophies.length;
  }
  get getArray() {
    return this.trophies;
  }
  private get isAllSRank() {
      return this.trophies.every((trophy) => trophy.rank.slice(0, 1) == RANK.S) ? 1 : 0;
  }
  filterByHideen() {
    this.trophies = this.trophies.filter((trophy) =>
      !trophy.hidden || trophy.rank !== RANK.UNKNOWN
    );
  }
  filterByTitles(titles: Array<string>) {
    this.trophies = this.trophies.filter((trophy) => {
      return trophy.filterTitles.some((title) => titles.includes(title));
    });
  }
  filterByRanks(ranks: Array<string>) {
    if (ranks.filter((rank) => rank.includes("-")).length !== 0) {
      this.trophies = this.trophies.filter((trophy) =>
        !ranks.map(rank => rank.substring(1)).includes(trophy.rank)
      )
      return
    }
    this.trophies = this.trophies.filter((trophy) =>
      ranks.includes(trophy.rank)
    );
  }
  sortByRank() {
    this.trophies = this.trophies.sort((a: Trophy, b: Trophy) =>
      RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
    );
  }
}

