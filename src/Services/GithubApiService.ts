import { GithubRepository } from "../Repository/GithubRepository.ts";
import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  isIncludedRepository,
  PublicIssue,
  PublicPullRequest,
  PublicReview,
  Repository,
  UserInfo,
} from "../user_info.ts";
import {
  queryUserActivity,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
  queryUserReview,
} from "../Schemas/index.ts";
import { CONSTANTS } from "../utils.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { requestGithubData } from "./request.ts";
import {
  configuredTokens,
  githubApiUrl,
  githubJson,
  githubPublicJson,
} from "../security/github.ts";

export const TOKENS = configuredTokens();

// Bound cold-cache work. Larger accounts receive conservative counts.
export const MAX_PUBLIC_PAGES = 3;
type Connection<T> = {
  nodes: (T | null)[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};
type Variables = { [key: string]: string | null };

function unavailable(): ServiceError {
  return new ServiceError(
    "GitHub public user data is unavailable.",
    EServiceKindError.UNAVAILABLE,
  );
}

function validUsername(username: string): boolean {
  return typeof username === "string" &&
    /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username);
}

function validConnection<T>(value: Connection<T>): boolean {
  return !!value && Array.isArray(value.nodes) && value.nodes.length <= 100 &&
    typeof value.pageInfo?.hasNextPage === "boolean" &&
    (!value.pageInfo.hasNextPage ||
      (typeof value.pageInfo.endCursor === "string" &&
        value.pageInfo.endCursor.length > 0));
}

function restUrl(path: string): URL {
  const url = new URL(githubApiUrl());
  url.pathname = (url.pathname === "/api/graphql" ? "/api/v3" : "") + path;
  return url;
}

export class GithubApiService extends GithubRepository {
  constructor(
    private tokens: string[] = TOKENS,
    private signal?: AbortSignal,
    private includePrivate = false,
  ) {
    super();
  }

  async requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | ServiceError> {
    if (!validUsername(username)) return unavailable();
    const nodes: Repository[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PUBLIC_PAGES; page++) {
      const result: { repositories: Connection<Repository> } | ServiceError =
        await this.executeQuery<{ repositories: Connection<Repository> }>(
          queryUserRepository,
          { username, cursor, privacy: this.includePrivate ? null : "PUBLIC" },
        );
      if (result instanceof ServiceError) return result;
      const connection: Connection<Repository> = result.repositories;
      if (!validConnection(connection)) return unavailable();
      nodes.push(
        ...connection.nodes.filter((node): node is Repository =>
          !!node && typeof node.id === "string" &&
          isIncludedRepository(node, this.includePrivate)
        ),
      );
      if (!connection.pageInfo.hasNextPage) break;
      if (connection.pageInfo.endCursor === cursor) return unavailable();
      cursor = connection.pageInfo.endCursor;
    }
    const unique = [...new Map(nodes.map((node) => [node.id, node])).values()];
    return { repositories: { totalCount: unique.length, nodes: unique } };
  }

  async requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | ServiceError> {
    if (
      !validUsername(username) || !this.tokens.length || this.signal?.aborted
    ) {
      return unavailable();
    }
    const [activity, profile, organizations, reviews] = await Promise.all([
      this.executeQuery<Pick<GitHubUserActivity, "contributionsCollection">>(
        queryUserActivity,
        { username },
      ),
      this.requestPublicProfile(username),
      this.requestPublicOrganizations(username),
      this.requestPublicReviews(username),
    ]);
    if (activity instanceof ServiceError) return activity;
    if (profile instanceof ServiceError) return profile;
    if (organizations instanceof ServiceError) return organizations;
    if (reviews instanceof ServiceError) return reviews;
    const collection = activity.contributionsCollection;
    if (
      !Array.isArray(collection?.commitContributionsByRepository)
    ) return unavailable();
    return {
      createdAt: profile.created_at,
      login: profile.login,
      followers: { totalCount: profile.followers },
      organizations,
      publicReviews: reviews,
      contributionsCollection: {
        commitContributionsByRepository: collection
          .commitContributionsByRepository
          .filter((group) =>
            isIncludedRepository(group?.repository, this.includePrivate)
          ),
      },
    };
  }

  async requestUserIssue(
    username: string,
  ): Promise<GitHubUserIssue | ServiceError> {
    const nodes = await this.publicSearch<PublicIssue>(
      username,
      queryUserIssue,
      "is:issue",
    );
    if (nodes instanceof ServiceError) return nodes;
    const open = nodes.filter((node) => node.state === "OPEN");
    const closed = nodes.filter((node) => node.state === "CLOSED");
    return {
      openIssues: { totalCount: open.length, nodes: open },
      closedIssues: { totalCount: closed.length, nodes: closed },
    };
  }

  async requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | ServiceError> {
    const nodes = await this.publicSearch<PublicPullRequest>(
      username,
      queryUserPullRequest,
      // Archived pull requests can be visible only to privileged viewers.
      "is:pr -is:archived",
    );
    if (nodes instanceof ServiceError) return nodes;
    return { pullRequests: { totalCount: nodes.length, nodes } };
  }

  private async publicSearch<T extends PublicPullRequest>(
    username: string,
    query: string,
    kind: string,
    authorQualifier = "author",
  ): Promise<T[] | ServiceError> {
    if (!validUsername(username)) return unavailable();
    const nodes: T[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PUBLIC_PAGES; page++) {
      const result: Connection<T> | ServiceError = await this.executeQuery<
        Connection<T>
      >(
        query,
        {
          search: `${authorQualifier}:${username}${
            this.includePrivate ? "" : " is:public"
          } ${kind}`,
          username,
          cursor,
        },
        "search",
      );
      if (result instanceof ServiceError) return result;
      if (!validConnection(result)) return unavailable();
      nodes.push(
        ...result.nodes.filter((node): node is T =>
          !!node && typeof node.id === "string" &&
          isIncludedRepository(node.repository, this.includePrivate)
        ),
      );
      if (!result.pageInfo.hasNextPage) break;
      if (result.pageInfo.endCursor === cursor) return unavailable();
      cursor = result.pageInfo.endCursor;
    }
    return [...new Map(nodes.map((node) => [node.id, node])).values()];
  }

  private async requestPublicReviews(
    username: string,
  ): Promise<PublicReview[] | ServiceError> {
    const reviewedPullRequests = await this.publicSearch<
      PublicPullRequest & {
        reviews: { nodes: Omit<PublicReview, "repository">[] };
      }
    >(
      username,
      queryUserReview,
      "is:pr -is:archived sort:updated-desc",
      "reviewed-by",
    );
    if (reviewedPullRequests instanceof ServiceError) {
      return reviewedPullRequests;
    }
    const reviews: PublicReview[] = [];
    for (const pullRequest of reviewedPullRequests) {
      if (
        !Array.isArray(pullRequest.reviews?.nodes) ||
        pullRequest.reviews.nodes.length > 100
      ) return unavailable();
      for (const review of pullRequest.reviews.nodes) {
        if (
          review && typeof review.id === "string" &&
          typeof review.author?.login === "string" &&
          review.author.login.toLowerCase() === username.toLowerCase()
        ) {
          reviews.push({ ...review, repository: pullRequest.repository });
        }
      }
    }
    return [...new Map(reviews.map((review) => [review.id, review])).values()];
  }

  private async requestPublicProfile(username: string) {
    try {
      // GET /users/{username} without Authorization is the public profile view.
      const profile = await githubPublicJson<{
        login: string;
        created_at: string;
        followers: number;
      }>(restUrl(`/users/${encodeURIComponent(username)}`).href, {
        signal: this.signal,
      });
      if (
        profile?.login?.toLowerCase() !== username.toLowerCase() ||
        typeof profile.created_at !== "string" ||
        !Number.isFinite(Date.parse(profile.created_at)) ||
        !Number.isSafeInteger(profile.followers) || profile.followers < 0
      ) return unavailable();
      return profile;
    } catch (error) {
      return error instanceof ServiceError ? error : unavailable();
    }
  }

  private async requestPublicOrganizations(
    username: string,
  ): Promise<GitHubUserActivity["organizations"] | ServiceError> {
    const logins = new Set<string>();
    for (let page = 1; page <= MAX_PUBLIC_PAGES; page++) {
      // This endpoint explicitly lists public memberships, including when authenticated.
      const url = restUrl(`/users/${encodeURIComponent(username)}/orgs`);
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));
      const organizations = await this.executeRequest((token) =>
        githubJson<{ login: string; id: number }[]>(url.href, token, {
          signal: this.signal,
        })
      );
      if (organizations instanceof ServiceError) return organizations;
      if (
        !Array.isArray(organizations) || organizations.length > 100 ||
        organizations.some((organization) =>
          !organization || !validUsername(organization.login) ||
          !Number.isSafeInteger(organization.id) || organization.id <= 0
        )
      ) return unavailable();
      for (const organization of organizations) {
        logins.add(organization.login.toLowerCase());
      }
      if (organizations.length < 100) break;
    }
    const nodes = [...logins].map((login) => ({
      login,
      publicMembership: true as const,
    }));
    return { totalCount: nodes.length, nodes };
  }

  async requestUserInfo(username: string): Promise<UserInfo | ServiceError> {
    if (!this.tokens.length || this.signal?.aborted) return unavailable();
    try {
      const [repository, activity, issue, pullRequest] = await Promise.all([
        this.requestUserRepository(username),
        this.requestUserActivity(username),
        this.requestUserIssue(username),
        this.requestUserPullRequest(username),
      ]);
      if (repository instanceof ServiceError) return repository;
      if (activity instanceof ServiceError) return activity;
      if (issue instanceof ServiceError) return issue;
      if (pullRequest instanceof ServiceError) return pullRequest;
      return new UserInfo(
        activity,
        issue,
        pullRequest,
        repository,
        this.includePrivate,
      );
    } catch {
      return unavailable();
    }
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: Variables,
    root = "user",
  ): Promise<T | ServiceError> {
    return await this.executeRequest((token) =>
      requestGithubData<T>(query, variables, token, root, this.signal)
    );
  }

  private async executeRequest<T>(
    request: (token: string) => Promise<T>,
  ): Promise<T | ServiceError> {
    if (!this.tokens.length || this.signal?.aborted) return unavailable();
    let lastError = unavailable();
    for (let attempt = 0; attempt < this.tokens.length; attempt++) {
      if (this.signal?.aborted) return unavailable();
      try {
        return await request(this.tokens[attempt]);
      } catch (error) {
        if (error instanceof ServiceError) lastError = error;
        if (this.signal?.aborted) return unavailable();
        if (attempt + 1 < this.tokens.length) {
          await this.waitBeforeRetry();
        }
      }
    }
    return lastError;
  }

  private waitBeforeRetry(): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        this.signal?.removeEventListener("abort", finish);
        resolve();
      };
      const timer = setTimeout(finish, CONSTANTS.DEFAULT_GITHUB_RETRY_DELAY);
      this.signal?.addEventListener("abort", finish, { once: true });
      if (this.signal?.aborted) finish();
    });
  }
}
