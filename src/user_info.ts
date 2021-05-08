type Language = { name: string };
type Stargazers = { totalCount: number };
type Repository = {
  languages: { nodes: Language[] };
  stargazers: Stargazers;
};
export type GitHubUserData = {
  createdAt: string;
  contributionsCollection: {
    totalCommitContributions: number;
    restrictedContributionsCount: number;
  };
  pullRequests: {
    totalCount: number;
  };
  issues: {
    totalCount: number;
  };
  organizations: {
    totalCount: number;
  };
  followers: {
    totalCount: number;
  };
  repositories: {
    totalCount: number;
    nodes: Repository[];
  };
};
export class UserInfo {
  public readonly totalCommits: number;
  public readonly totalFollowers: number;
  public readonly totalIssues: number;
  public readonly totalOrganizations: number;
  public readonly totalPullRequests: number;
  public readonly totalStargazers: number;
  public readonly totalRepositories: number;
  public readonly languageCount: number;
  public readonly durationYear: number;
  public readonly ancientAccount: number;
  public readonly joined2020: number;
  constructor(
    userData: GitHubUserData,
  ) {
    const totalCommits =
      userData.contributionsCollection.restrictedContributionsCount +
      userData.contributionsCollection.totalCommitContributions;
    const totalStargazers = userData.repositories.nodes.reduce(
      (prev: number, node: Repository) => {
        return prev + node.stargazers.totalCount;
      },
      0,
    );

    const languages = new Set<string>();
    userData.repositories.nodes.forEach((node: Repository) => {
      if (node.languages.nodes != undefined) {
        node.languages.nodes.forEach((node: Language) => {
          if (node != undefined) {
            languages.add(node.name);
          }
        });
      }
    });
    const durationTime = new Date().getTime() -
      new Date(userData.createdAt).getTime();
    const durationYear = new Date(durationTime).getUTCFullYear() - 1970;
    const ancientAccount = new Date(userData.createdAt).getFullYear() <= 2010
      ? 1
      : 0;
    const joined2020 = new Date(userData.createdAt).getFullYear() == 2020
      ? 1
      : 0;
    this.totalCommits = totalCommits;
    this.totalFollowers = userData.followers.totalCount;
    this.totalIssues = userData.issues.totalCount;
    this.totalOrganizations = userData.organizations.totalCount;
    this.totalPullRequests = userData.pullRequests.totalCount;
    this.totalStargazers = totalStargazers;
    this.totalRepositories = userData.repositories.totalCount;
    this.languageCount = languages.size;
    this.durationYear = durationYear;
    this.ancientAccount = ancientAccount;
    this.joined2020 = joined2020;
  }
}
