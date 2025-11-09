type Language = { name: string };
type Stargazers = { totalCount: number };
type Repository = {
  name: string;
  languages: { nodes: Language[] };
  stargazers: Stargazers;
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
  constructor(
    userActivity: GitHubUserActivity,
    userIssue: GitHubUserIssue,
    userPullRequest: GitHubUserPullRequest,
    userRepository: GitHubUserRepository,
  ) {
    const totalCommits =
      userActivity.contributionsCollection.restrictedContributionsCount +
      userActivity.contributionsCollection.totalCommitContributions;
    // Single-pass aggregation for stargazers, languages and earliest repo date.
    const languages = new Set<string>();
    let totalStargazers = 0;
    const nodes = userRepository.repositories.nodes || [];

    // Initialize earliest timestamp from first node or fallback to userActivity.createdAt
    let earliestTimestamp = nodes.length > 0 && nodes[0].createdAt
      ? Date.parse(nodes[0].createdAt)
      : Date.parse(userActivity.createdAt);

    for (const node of nodes) {
      if (!node) continue;

      totalStargazers += node.stargazers?.totalCount ?? 0;

      if (node.languages?.nodes) {
        for (const lang of node.languages.nodes) {
          if (lang && lang.name) languages.add(lang.name);
        }
      }

      const t = Date.parse(node.createdAt);
      if (!Number.isNaN(t) && t < earliestTimestamp) earliestTimestamp = t;
    }

    // Duration calculations using numeric timestamps and correct day formula
    const durationTime = Date.now() - earliestTimestamp;
    const durationYear = new Date(durationTime).getUTCFullYear() - 1970;
    const durationDays = Math.floor(durationTime / (1000 * 60 * 60 * 24));

    const earliestDate = new Date(earliestTimestamp);
    const ancientAccount = earliestDate.getFullYear() <= 2010 ? 1 : 0;
    const joined2020 = earliestDate.getFullYear() === 2020 ? 1 : 0;
    const ogAccount = earliestDate.getFullYear() <= 2008 ? 1 : 0;

    this.totalCommits = totalCommits;
    this.totalFollowers = userActivity.followers.totalCount;
    this.totalIssues = userIssue.openIssues.totalCount +
      userIssue.closedIssues.totalCount;
    this.totalOrganizations = userActivity.organizations.totalCount;
    this.totalPullRequests = userPullRequest.pullRequests.totalCount;
    this.totalReviews =
      userActivity.contributionsCollection.totalPullRequestReviewContributions;
    this.totalStargazers = totalStargazers;
    this.totalRepositories = userRepository.repositories.totalCount;
    this.languageCount = languages.size;
    this.durationYear = durationYear;
    this.durationDays = durationDays;
    this.ancientAccount = ancientAccount;
    this.joined2020 = joined2020;
    this.ogAccount = ogAccount;
  }
}
