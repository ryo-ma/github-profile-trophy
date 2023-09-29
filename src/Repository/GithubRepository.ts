import { ServiceError } from "../Types/index.ts";
import {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
  UserInfo,
} from "../user_info.ts";

export abstract class GithubRepository {
  abstract requestUserInfo(username: string): Promise<UserInfo | ServiceError>;
  abstract requestUserActivity(
    username: string,
  ): Promise<GitHubUserActivity | ServiceError>;
  abstract requestUserIssue(
    username: string,
  ): Promise<GitHubUserIssue | ServiceError>;
  abstract requestUserPullRequest(
    username: string,
  ): Promise<GitHubUserPullRequest | ServiceError>;
  abstract requestUserRepository(
    username: string,
  ): Promise<GitHubUserRepository | ServiceError>;
}

export class GithubRepositoryService {
  constructor(public repository: GithubRepository) {}
}
