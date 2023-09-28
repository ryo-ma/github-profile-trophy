import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  UserInfo,
} from "../user_info.ts";

export abstract class GithubRepository {
  abstract requestUserInfo(username: string): Promise<UserInfo | null>;
  abstract requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | null>;
  abstract requestUserIssue(username: string): Promise<GitHubUserIssue | null>;
  abstract requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | null>;
  abstract requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | null>;
}

export class GithubRepositoryService {
  constructor(public repository: GithubRepository) {}
}
