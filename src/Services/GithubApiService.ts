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
import { soxa } from "../../deps.ts";
import { Retry } from "../Helpers/Retry.ts";
import { GithubError, QueryDefaultResponse } from "../Types/index.ts";
import { CONSTANTS } from "../utils.ts";
import { EServiceKindError } from "../Types/EServiceKindError.ts";
import { ServiceError } from "../Types/ServiceError.ts";
import { Logger } from "../Helpers/Logger.ts";

// Need to be here - Exporting from another file makes array of null
export const TOKENS = [
  Deno.env.get("GITHUB_TOKEN1"),
  Deno.env.get("GITHUB_TOKEN2"),
];

export class GithubApiService extends GithubRepository {
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
    // Avoid to call others if one of them is null
    const repository = await this.requestUserRepository(username);
    if (repository instanceof ServiceError) {
      Logger.error(repository);
      return repository;
    }

    const promises = Promise.allSettled([
      this.requestUserActivity(username),
      this.requestUserIssue(username),
      this.requestUserPullRequest(username),
    ]);
    const [activity, issue, pullRequest] = await promises;
    const status = [
      activity.status,
      issue.status,
      pullRequest.status,
    ];

    if (status.includes("rejected")) {
      Logger.error(`Can not find a user with username:' ${username}'`);
      return new ServiceError("not found", EServiceKindError.NOT_FOUND);
    }

    return new UserInfo(
      (activity as PromiseFulfilledResult<GitHubUserActivity>).value,
      (issue as PromiseFulfilledResult<GitHubUserIssue>).value,
      (pullRequest as PromiseFulfilledResult<GitHubUserPullRequest>).value,
      repository as GitHubUserRepository,
    );
  }

  private handleError(responseErrors: GithubError[]): ServiceError {
    const errors = responseErrors ?? [];
    const isRateLimitExceeded = (errors ?? []).some((error) => {
      error.type.includes(EServiceKindError.RATE_LIMIT);
    });

    if (isRateLimitExceeded) {
      throw new ServiceError(
        "Rate limit exceeded",
        EServiceKindError.RATE_LIMIT,
      );
    }

    throw new ServiceError(
      "unknown error",
      EServiceKindError.NOT_FOUND,
    );
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: { [key: string]: string },
  ) {
    try {
      const retry = new Retry(
        TOKENS.length,
        CONSTANTS.DEFAULT_GITHUB_RETRY_DELAY,
      );
      const response = await retry.fetch<Promise<T>>(async ({ attempt }) => {
        return await soxa.post("", {}, {
          data: { query: query, variables },
          headers: {
            Authorization: `bearer ${TOKENS[attempt]}`,
          },
        });
      }) as QueryDefaultResponse<{ user: T }>;

      if (response?.data?.errors) {
        return this.handleError(response?.data?.errors);
      }

      return response?.data?.data?.user ??
        new ServiceError("not found", EServiceKindError.NOT_FOUND);
    } catch (error) {
      // TODO: Move this to a logger instance later
      if (error instanceof Error && error.cause) {
        Logger.error(JSON.stringify(error.cause, null, 2));
      } else {
        Logger.error(error);
      }

      return new ServiceError("not found", EServiceKindError.NOT_FOUND);
    }
  }
}
