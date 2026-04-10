import { GithubRepository } from "../Repository/GithubRepository.ts";
import {
  GitHubUserActivity,
  GitHubUserAll,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  UserInfo,
} from "../user_info.ts";
import {
  queryUserActivity,
  queryUserAll,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
} from "../Schemas/index.ts";
import { Retry } from "../Helpers/Retry.ts";
import { CONSTANTS } from "../utils.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Logger } from "../Helpers/Logger.ts";
import { requestGithubData } from "./request.ts";

// Need to be here - Exporting from another file makes array of null
export const TOKENS = [
  Deno.env.get("GITHUB_TOKEN1"),
  Deno.env.get("GITHUB_TOKEN2"),
];

export class GithubApiService extends GithubRepository {
  async requestUserAll(
    username: string,
  ): Promise<GitHubUserAll | ServiceError> {
    return await this.executeQuery<GitHubUserAll>(queryUserAll, {
      username,
    });
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
    // Use single combined query instead of 4 separate queries to reduce Function Duration
    try {
      const result = await this.requestUserAll(username);
      if (result instanceof ServiceError) {
        return result;
      }
      return UserInfo.fromCombined(result);
    } catch {
      Logger.error(`Error fetching user info for username: ${username}`);
      return new ServiceError("Not found", EServiceKindError.NOT_FOUND);
    }
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
      return await retry.fetch<Promise<T>>(async ({ attempt }) => {
        return await requestGithubData(
          query,
          variables,
          TOKENS[attempt],
        );
      });
    } catch (error) {
      if (error.cause instanceof ServiceError) {
        Logger.error(error.cause.message);
        return error.cause;
      }
      if (error instanceof Error && error.cause) {
        Logger.error(JSON.stringify(error.cause, null, 2));
      } else {
        Logger.error(error);
      }
      return new ServiceError("not found", EServiceKindError.NOT_FOUND);
    }
  }
}
