type Language = { name: string };
type Repository = {
  languages: { nodes: Language[] };
  stargazerCount: number;
  createdAt: string;
};
export type GitHubUserRepository = {
  repositories: {
    totalCount: number;
    nodes: Repository[];
  };
};

export type GitHubUserIssue = {
  openIssues: {
    totalCount: number;
  };
  closedIssues: {
    totalCount: number;
  };
};

export type GitHubUserPullRequest = {
  pullRequests: {
    totalCount: number;
  };
};

export type GitHubUserActivity = {
  createdAt: string;
  contributionsCollection: {
    totalCommitContributions: number;
    restrictedContributionsCount: number;
    totalPullRequestReviewContributions: number;
  };
  organizations: {
    totalCount: number;
  };
  followers: {
    totalCount: number;
  };
};

export type GitHubUserAll =
  & GitHubUserActivity
  & GitHubUserIssue
  & GitHubUserPullRequest
  & GitHubUserRepository;
export class UserInfo {
  public readonly totalCommits: number;
  public readonly totalFollowers: number;
  public readonly totalIssues: number;
  public readonly totalOrganizations: number;
  public readonly totalPullRequests: number;
  public readonly totalReviews: number;
  public readonly totalStargazers: number;
  public readonly totalRepositories: number;
  public readonly languageCount: number;
  public readonly durationYear: number;
  public readonly durationDays: number;
  public readonly ancientAccount: number;
  public readonly joined2020: number;
  public readonly ogAccount: number;

  static fromCombined(data: GitHubUserAll): UserInfo {
    return new UserInfo(data, data, data, data);
  }

  constructor(
    userActivity: GitHubUserActivity,
    userIssue: GitHubUserIssue,
    userPullRequest: GitHubUserPullRequest,
    userRepository: GitHubUserRepository,
  ) {
    const repoNodes = (userRepository.repositories?.nodes ?? []).filter(
      (node): node is Repository => node != undefined,
    );

    const totalCommits =
      (userActivity.contributionsCollection?.restrictedContributionsCount ?? 0) +
      (userActivity.contributionsCollection?.totalCommitContributions ?? 0);
    const totalStargazers = repoNodes.reduce(
      (prev: number, node: Repository) => {
        return prev + (node.stargazerCount ?? 0);
      },
      0,
    );

    const languages = new Set<string>();
    repoNodes.forEach((node: Repository) => {
      if (node.languages?.nodes != undefined) {
        node.languages.nodes.forEach((node: Language) => {
          if (node != undefined) {
            languages.add(node.name);
          }
        });
      }
    });

    // Find the earliest repository creation date
    let earliestRepoDate = userActivity.createdAt; // start with the oldest possible

    earliestRepoDate = repoNodes.reduce(
      (earliest, node) => {
        return new Date(node.createdAt).getTime() < new Date(earliest).getTime()
          ? node.createdAt
          : earliest;
      },
      earliestRepoDate,
    );

    const durationTime = new Date().getTime() -
      new Date(earliestRepoDate).getTime();
    const durationYear = new Date(durationTime).getUTCFullYear() - 1970;
    const durationDays = Math.floor(
      durationTime / (1000 * 60 * 60 * 24) / 100,
    );
    const ancientAccount = new Date(earliestRepoDate).getFullYear() <= 2010
      ? 1
      : 0;
    const joined2020 = new Date(earliestRepoDate).getFullYear() == 2020 ? 1 : 0;
    const ogAccount = new Date(earliestRepoDate).getFullYear() <= 2008 ? 1 : 0;

    this.totalCommits = totalCommits;
    this.totalFollowers = userActivity.followers?.totalCount ?? 0;
    this.totalIssues = (userIssue.openIssues?.totalCount ?? 0) +
      (userIssue.closedIssues?.totalCount ?? 0);
    this.totalOrganizations = userActivity.organizations?.totalCount ?? 0;
    this.totalPullRequests = userPullRequest.pullRequests?.totalCount ?? 0;
    this.totalReviews =
      userActivity.contributionsCollection?.totalPullRequestReviewContributions ?? 0;
    this.totalStargazers = totalStargazers;
    this.totalRepositories = userRepository.repositories?.totalCount ?? 0;
    this.languageCount = languages.size;
    this.durationYear = durationYear;
    this.durationDays = durationDays;
    this.ancientAccount = ancientAccount;
    this.joined2020 = joined2020;
    this.ogAccount = ogAccount;
  }
}
