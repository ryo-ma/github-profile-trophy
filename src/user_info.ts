type Language = { name: string };
export type RepositoryVisibility = {
  visibility?: string;
  isPrivate?: boolean;
};

export type Repository = RepositoryVisibility & {
  id: string;
  languages: { nodes: Language[] };
  stargazers: { totalCount: number };
  createdAt: string;
};

export type PublicIssue = {
  id: string;
  state: string;
  repository: RepositoryVisibility;
};

export type PublicPullRequest = {
  id: string;
  repository: RepositoryVisibility;
};
export type PublicReview = {
  id: string;
  state: string;
  submittedAt: string | null;
  author: { login: string };
  repository: RepositoryVisibility;
};

export type GitHubUserRepository = {
  repositories: { totalCount: number; nodes: Repository[] };
};
export type GitHubUserIssue = {
  openIssues: { totalCount: number; nodes: PublicIssue[] };
  closedIssues: { totalCount: number; nodes: PublicIssue[] };
};
export type GitHubUserPullRequest = {
  pullRequests: { totalCount: number; nodes: PublicPullRequest[] };
};
export type RepositoryCommitContributions = {
  repository: RepositoryVisibility;
  contributions: { nodes: { commitCount: number }[] };
};
export type GitHubUserActivity = {
  // These two profile fields come from the unauthenticated public user endpoint.
  createdAt: string;
  followers: { totalCount: number };
  login: string;
  contributionsCollection: {
    commitContributionsByRepository: RepositoryCommitContributions[];
  };
  publicReviews: PublicReview[];
  // Only the documented public-membership REST listing may populate these nodes.
  organizations: {
    totalCount: number;
    nodes: { login: string; publicMembership: true }[];
  };
};

/** Missing, internal, or inconsistent visibility metadata always fails closed. */
export function isPublicRepository(
  repository: RepositoryVisibility | null | undefined,
): boolean {
  return repository?.visibility === "PUBLIC" && repository.isPrivate === false;
}

function publicNodes<
  T extends { repository: RepositoryVisibility; id: string },
>(
  nodes: T[] | undefined,
): T[] {
  const seen = new Set<string>();
  return (nodes ?? []).filter((node) => {
    if (
      !node || !node.id || seen.has(node.id) ||
      !isPublicRepository(node.repository)
    ) return false;
    seen.add(node.id);
    return true;
  });
}

function publicCommitCount(groups: RepositoryCommitContributions[]): number {
  return (groups ?? []).reduce((total, group) => {
    if (!isPublicRepository(group?.repository)) return total;
    return total +
      (group.contributions?.nodes ?? []).reduce((commits, node) => {
        const count = node?.commitCount;
        return commits +
          (Number.isSafeInteger(count) && count >= 0 ? count : 0);
      }, 0);
  }, 0);
}

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
    // Recheck here as well as at the API boundary. Never trust supplied aggregate totals.
    const seen = new Set<string>();
    const repositories = (userRepository.repositories.nodes ?? []).filter(
      (node) => {
        if (
          !node || !node.id || seen.has(node.id) || !isPublicRepository(node)
        ) {
          return false;
        }
        seen.add(node.id);
        return true;
      },
    );
    const totalStargazers = repositories.reduce(
      (total, node) => {
        const count = node.stargazers?.totalCount;
        return total +
          (Number.isSafeInteger(count) && count >= 0 ? count : 0);
      },
      0,
    );
    const languages = new Set<string>();
    for (const repository of repositories) {
      for (const language of repository.languages?.nodes ?? []) {
        if (typeof language?.name === "string") languages.add(language.name);
      }
    }

    let earliestRepoDate = userActivity.createdAt;
    for (const repository of repositories) {
      if (Date.parse(repository.createdAt) < Date.parse(earliestRepoDate)) {
        earliestRepoDate = repository.createdAt;
      }
    }
    const durationTime = Date.now() - Date.parse(earliestRepoDate);
    this.durationYear = new Date(durationTime).getUTCFullYear() - 1970;
    this.durationDays = Math.floor(durationTime / (1000 * 60 * 60 * 24) / 100);
    const joinedYear = new Date(earliestRepoDate).getUTCFullYear();
    this.ancientAccount = joinedYear <= 2010 ? 1 : 0;
    this.joined2020 = joinedYear === 2020 ? 1 : 0;
    this.ogAccount = joinedYear <= 2008 ? 1 : 0;

    this.totalCommits = publicCommitCount(
      userActivity.contributionsCollection.commitContributionsByRepository,
    );
    const reviewWindowEnd = Date.now();
    const reviewWindowStart = new Date(reviewWindowEnd);
    reviewWindowStart.setUTCFullYear(reviewWindowStart.getUTCFullYear() - 1);
    this.totalReviews =
      publicNodes(userActivity.publicReviews).filter((review) => {
        const submitted = Date.parse(review.submittedAt ?? "");
        return ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", "DISMISSED"]
          .includes(
            review.state,
          ) &&
          review.author?.login?.toLowerCase() ===
            userActivity.login.toLowerCase() &&
          submitted >= reviewWindowStart.getTime() &&
          submitted <= reviewWindowEnd;
      }).length;
    this.totalFollowers = userActivity.followers.totalCount;
    this.totalIssues = publicNodes(userIssue.openIssues.nodes).length +
      publicNodes(userIssue.closedIssues.nodes).length;
    this.totalOrganizations = new Set(
      (userActivity.organizations.nodes ?? []).filter((organization) =>
        organization?.publicMembership === true &&
        typeof organization.login === "string"
      ).map((organization) => organization.login.toLowerCase()),
    ).size;
    this.totalPullRequests =
      publicNodes(userPullRequest.pullRequests.nodes).length;
    this.totalStargazers = totalStargazers;
    this.totalRepositories = repositories.length;
    this.languageCount = languages.size;
  }
}
