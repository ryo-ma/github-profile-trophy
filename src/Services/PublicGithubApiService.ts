import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { githubApiUrl, githubPublicJson } from "../security/github.ts";
import { UserInfo } from "../user_info.ts";

// Anonymous REST responses cannot include resources visible only to a token.
export const MAX_PUBLIC_REST_PAGES = 3;
const PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

type Profile = { login: string; created_at: string; followers: number };
type PublicRepository = {
  id: number;
  private: boolean;
  visibility: string;
  stargazers_count: number;
  language: string | null;
  created_at: string;
};
type PublicOrganization = { id: number; login: string };
type SearchResult = { total_count: number; incomplete_results: boolean };
type ReviewEvent = {
  public?: boolean;
  type?: string;
  payload?: {
    review?: {
      id?: number;
      state?: string;
      submitted_at?: string;
      user?: { login?: string };
    };
  };
};

function unavailable(): ServiceError {
  return new ServiceError(
    "GitHub public statistics are unavailable.",
    EServiceKindError.UNAVAILABLE,
  );
}

function usernameValid(value: string): boolean {
  return typeof value === "string" &&
    /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function restUrl(path: string): URL {
  const url = new URL(githubApiUrl());
  url.pathname = (url.pathname === "/api/graphql" ? "/api/v3" : "") + path;
  return url;
}

/** Public-only fallback for deployments that have no GitHub credential. */
export class PublicGithubApiService {
  constructor(
    private signal?: AbortSignal,
    private now: () => number = Date.now,
  ) {}

  async requestUserInfo(username: string): Promise<UserInfo | ServiceError> {
    if (!usernameValid(username) || this.signal?.aborted) return unavailable();
    const controller = new AbortController();
    const abort = () => controller.abort();
    this.signal?.addEventListener("abort", abort, { once: true });
    if (this.signal?.aborted) controller.abort();
    const end = this.now();
    const start = new Date(end);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    const dates = `${start.toISOString().slice(0, 10)}..${
      new Date(end).toISOString().slice(0, 10)
    }`;
    const signal = controller.signal;
    const pending = [
      this.profile(username, end, signal),
      this.repositories(username, end, signal),
      this.organizations(username, signal),
      this.searchCount(
        "issues",
        `author:${username} is:public is:issue`,
        signal,
      ),
      this.searchCount(
        "issues",
        `author:${username} is:public is:pr -is:archived`,
        signal,
      ),
      this.searchCount(
        "commits",
        `author:${username} is:public committer-date:${dates}`,
        signal,
      ),
      this.reviewCount(username, start.getTime(), end, signal),
    ] as const;
    try {
      const [
        profile,
        repositories,
        organizations,
        issues,
        pullRequests,
        commits,
        reviews,
      ] = await Promise.all(pending);
      const languages = new Set(
        repositories.flatMap((repository) =>
          repository.language ? [repository.language] : []
        ),
      );
      const earliest = Math.min(
        Date.parse(profile.created_at),
        ...repositories.map((repository) => Date.parse(repository.created_at)),
      );
      const duration = end - earliest;
      const joinedYear = new Date(earliest).getUTCFullYear();
      const result: UserInfo = {
        totalCommits: commits,
        totalFollowers: profile.followers,
        totalIssues: issues,
        totalOrganizations: organizations,
        totalPullRequests: pullRequests,
        totalReviews: reviews,
        totalStargazers: repositories.reduce(
          (total, repository) => total + repository.stargazers_count,
          0,
        ),
        totalRepositories: repositories.length,
        languageCount: languages.size,
        durationYear: new Date(duration).getUTCFullYear() - 1970,
        durationDays: Math.floor(duration / DAY_MS / 100),
        ancientAccount: joinedYear <= 2010 ? 1 : 0,
        joined2020: joinedYear === 2020 ? 1 : 0,
        ogAccount: joinedYear <= 2008 ? 1 : 0,
      };
      if (!Object.values(result).every(nonnegativeInteger)) throw unavailable();
      return result;
    } catch (error) {
      controller.abort();
      await Promise.allSettled(pending);
      return error instanceof ServiceError ? error : unavailable();
    } finally {
      this.signal?.removeEventListener("abort", abort);
    }
  }

  private async profile(
    username: string,
    end: number,
    signal: AbortSignal,
  ): Promise<Profile> {
    const profile = await githubPublicJson<Profile>(
      restUrl(`/users/${encodeURIComponent(username)}`).href,
      { signal },
    );
    const created = Date.parse(profile?.created_at);
    if (
      profile?.login?.toLowerCase() !== username.toLowerCase() ||
      !nonnegativeInteger(profile.followers) ||
      !Number.isFinite(created) || created < 0 || created > end
    ) throw unavailable();
    return profile;
  }

  private async page<T>(
    path: string,
    page: number,
    signal: AbortSignal,
    params: Record<string, string> = {},
  ): Promise<T[]> {
    const url = restUrl(path);
    url.searchParams.set("per_page", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }
    const rows = await githubPublicJson<T[]>(url.href, { signal });
    if (!Array.isArray(rows) || rows.length > PAGE_SIZE) throw unavailable();
    return rows;
  }

  private async repositories(
    username: string,
    end: number,
    signal: AbortSignal,
  ): Promise<PublicRepository[]> {
    const repositories = new Map<number, PublicRepository>();
    for (let page = 1; page <= MAX_PUBLIC_REST_PAGES; page++) {
      const rows = await this.page<PublicRepository>(
        `/users/${encodeURIComponent(username)}/repos`,
        page,
        signal,
        { type: "owner", sort: "updated" },
      );
      for (const repository of rows) {
        if (
          repository?.visibility !== "public" || repository.private !== false
        ) {
          continue;
        }
        const created = Date.parse(repository.created_at);
        if (
          !nonnegativeInteger(repository.id) || repository.id === 0 ||
          !nonnegativeInteger(repository.stargazers_count) ||
          !Number.isFinite(created) || created < 0 || created > end ||
          (repository.language !== null &&
            (typeof repository.language !== "string" ||
              repository.language.length < 1 ||
              repository.language.length > 128))
        ) throw unavailable();
        repositories.set(repository.id, repository);
      }
      if (rows.length < PAGE_SIZE) break;
    }
    return [...repositories.values()];
  }

  private async organizations(
    username: string,
    signal: AbortSignal,
  ): Promise<number> {
    const ids = new Set<number>();
    for (let page = 1; page <= MAX_PUBLIC_REST_PAGES; page++) {
      const rows = await this.page<PublicOrganization>(
        `/users/${encodeURIComponent(username)}/orgs`,
        page,
        signal,
      );
      for (const organization of rows) {
        if (
          !organization || !nonnegativeInteger(organization.id) ||
          organization.id === 0 || !usernameValid(organization.login)
        ) throw unavailable();
        ids.add(organization.id);
      }
      if (rows.length < PAGE_SIZE) break;
    }
    return ids.size;
  }

  private async searchCount(
    kind: "issues" | "commits",
    query: string,
    signal: AbortSignal,
  ): Promise<number> {
    const url = restUrl(`/search/${kind}`);
    url.searchParams.set("q", query);
    url.searchParams.set("per_page", "1");
    const result = await githubPublicJson<SearchResult>(url.href, { signal });
    if (
      !result || !nonnegativeInteger(result.total_count) ||
      result.incomplete_results !== false
    ) throw unavailable();
    return result.total_count;
  }

  private async reviewCount(
    username: string,
    start: number,
    end: number,
    signal: AbortSignal,
  ): Promise<number> {
    const ids = new Set<number>();
    // GitHub's public event timeline retains at most 30 days, not a full year.
    const reviewStart = Math.max(start, end - 30 * DAY_MS);
    for (let page = 1; page <= MAX_PUBLIC_REST_PAGES; page++) {
      const rows = await this.page<ReviewEvent>(
        `/users/${encodeURIComponent(username)}/events/public`,
        page,
        signal,
      );
      for (const event of rows) {
        const review = event?.payload?.review;
        const submitted = Date.parse(review?.submitted_at ?? "");
        if (
          event?.public === true && event.type === "PullRequestReviewEvent" &&
          review && nonnegativeInteger(review.id) && review.id > 0 &&
          typeof review.state === "string" &&
          ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", "DISMISSED"].includes(
            review.state.toUpperCase(),
          ) &&
          review.user?.login?.toLowerCase() === username.toLowerCase() &&
          submitted >= reviewStart && submitted <= end
        ) ids.add(review.id);
      }
      if (rows.length < PAGE_SIZE) break;
    }
    return ids.size;
  }
}
