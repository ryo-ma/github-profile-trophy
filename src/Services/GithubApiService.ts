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

const tokens = [
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
    const promises = Promise.allSettled([
      this.requestUserRepository(username),
      this.requestUserActivity(username),
      this.requestUserIssue(username),
      this.requestUserPullRequest(username),
    ]);
    const [repository, activity, issue, pullRequest] = await promises;
    const status = [
      repository.status,
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
      (repository as PromiseFulfilledResult<GitHubUserRepository>).value,
    );
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: { [key: string]: string },
  ) {
    const retry = new Retry();
    const response = await retry.fetch<Promise<T>>(async ({ attempt }) => {
      return await soxa.post("", {}, {
        data: { query: query, variables },
        headers: {
          Authorization: `bearer ${tokens[attempt]}`,
        },
      });
    }) as QueryDefaultResponse<T>;

    return response?.data?.data?.user ?? null;
  }
}
