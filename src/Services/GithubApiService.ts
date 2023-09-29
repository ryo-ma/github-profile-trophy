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
import { QueryDefaultResponse } from "../Types/index.ts";
import { CONSTANTS } from "../utils.ts";

// Need to be here - Exporting from another file makes array of null
export const TOKENS = [
  Deno.env.get("GITHUB_TOKEN1"),
  Deno.env.get("GITHUB_TOKEN2"),
];

export class GithubApiService extends GithubRepository {
  async requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | null> {
    return await this.executeQuery<GitHubUserRepository>(queryUserRepository, {
      username,
    });
  }
  async requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | null> {
    return await this.executeQuery<GitHubUserActivity>(queryUserActivity, {
      username,
    });
  }
  async requestUserIssue(username: string): Promise<GitHubUserIssue | null> {
    return await this.executeQuery<GitHubUserIssue>(queryUserIssue, {
      username,
    });
  }
  async requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | null> {
    return await this.executeQuery<GitHubUserPullRequest>(
      queryUserPullRequest,
      { username },
    );
  }
  async requestUserInfo(username: string): Promise<UserInfo | null> {
    // Avoid to call others if one of them is null
    const repository = await this.requestUserRepository(username);
    if (repository === null) return null;

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
      console.error(`Can not find a user with username:' ${username}'`);
      return null;
    }

    return new UserInfo(
      (activity as PromiseFulfilledResult<GitHubUserActivity>).value,
      (issue as PromiseFulfilledResult<GitHubUserIssue>).value,
      (pullRequest as PromiseFulfilledResult<GitHubUserPullRequest>).value,
      repository,
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
      }) as QueryDefaultResponse<{ user: T; errors?: unknown[] }>;

      if (response.data.data.errors) {
        throw new Error("Error from Github API", {
          cause: response.data.data.errors,
        });
      }

      return response?.data?.data?.user ?? null;
    } catch (error) {
      // TODO: Move this to a logger instance later
      if (error instanceof Error && error.cause) {
        console.error(JSON.stringify(error.cause, null, 2));
      } else {
        console.error(error);
      }

      return null;
    }
  }
}
