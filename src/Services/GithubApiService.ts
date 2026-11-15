import { GithubRepository } from "../Repository/GithubRepository.ts";
import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  UserInfo,
} from "../user_info.ts";
import {
  queryUserActivity,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
} from "../Schemas/index.ts";
import { Retry } from "../Helpers/Retry.ts";
import { CONSTANTS } from "../utils.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Logger } from "../Helpers/Logger.ts";
import { requestGithubData } from "./request.ts";

import { configuredTokens } from "../security/github.ts";

export const TOKENS = configuredTokens();

export class GithubApiService extends GithubRepository {
  constructor(private tokens: string[] = TOKENS) {
    super();
  }
  async requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | ServiceError> {
    return await this.executeQuery<GitHubUserRepository>(queryUserRepository, {
      username,
    });
  }
  async requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | ServiceError> {
    return await this.executeQuery<GitHubUserActivity>(queryUserActivity, {
      username,
    });
  }
  async requestUserIssue(
    username: string,
  ): Promise<GitHubUserIssue | ServiceError> {
    return await this.executeQuery<GitHubUserIssue>(queryUserIssue, {
      username,
    });
  }
  async requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | ServiceError> {
    return await this.executeQuery<GitHubUserPullRequest>(
      queryUserPullRequest,
      { username },
    );
  }
  async requestUserInfo(username: string): Promise<UserInfo | ServiceError> {
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
      return new UserInfo(activity, issue, pullRequest, repository);
    } catch {
      return new ServiceError(
        "GitHub user data is unavailable.",
        EServiceKindError.UNAVAILABLE,
      );
    }
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: { [key: string]: string },
  ) {
    if (!this.tokens.length) {
      return new ServiceError(
        "Configure a GitHub token on the server.",
        EServiceKindError.UNAVAILABLE,
      );
    }
    try {
      const retry = new Retry(
        this.tokens.length,
        CONSTANTS.DEFAULT_GITHUB_RETRY_DELAY,
      );
      return await retry.fetch<Promise<T>>(async ({ attempt }) => {
        return await requestGithubData(
          query,
          variables,
          this.tokens[attempt],
        );
      });
    } catch (error) {
      if (error.cause instanceof ServiceError) {
        Logger.error(error.cause.message);
        return error.cause;
      }
      return new ServiceError(
        "GitHub is unavailable.",
        EServiceKindError.UNAVAILABLE,
      );
    }
  }
}
