import { soxa } from "../deps.ts";
import { UserInfo } from "./user_info.ts";
import type {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
} from "./user_info.ts";

export class GithubAPIClient {
  constructor() {
  }
  async requestUserInfo(
    token: string | undefined,
    username: string,
  ): Promise<UserInfo | null> {
    // Avoid timeout for the Github API
    const results = await Promise.all([
      this.requestUserActivity(token, username),
      this.requestUserIssue(token, username),
      this.requestUserPullRequest(token, username),
      this.requestUserRepository(token, username),
    ]);
    if (results.some((r) => r == null)) {
      return null;
    }
    return new UserInfo(results[0]!, results[1]!, results[2]!, results[3]!);
  }
  private async requestUserActivity(
    token: string | undefined,
    username: string,
  ): Promise<GitHubUserActivity | null> {
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            createdAt
            contributionsCollection {
              totalCommitContributions
              restrictedContributionsCount
            }
            organizations(first: 1) {
              totalCount
            }
            followers(first: 1) {
              totalCount
            }
          }
        }
        `;
    return await this.request(query, token, username);
  }
  private async requestUserIssue(
    token: string | undefined,
    username: string,
  ): Promise<GitHubUserIssue | null> {
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            openIssues: issues(states: OPEN) {
              totalCount
            }
            closedIssues: issues(states: CLOSED) {
              totalCount
            }
          }
        }
        `;
    return await this.request(query, token, username);
  }
  private async requestUserPullRequest(
    token: string | undefined,
    username: string,
  ): Promise<GitHubUserPullRequest | null> {
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            pullRequests(first: 1) {
              totalCount
            }
          }
        }
        `;
    return await this.request(query, token, username);
  }
  private async requestUserRepository(
    token: string | undefined,
    username: string,
  ): Promise<GitHubUserRepository | null> {
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
              nodes {
                languages(first: 3, orderBy: {direction:DESC, field: SIZE}) {
                  nodes {
                    name
                  }
                }
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
        `;
    return await this.request(query, token, username);
  }
  private async request(
    query: string,
    token: string | undefined,
    username: string,
  ) {
    const variables = { username: username };
    const response = await soxa.post(
      "https://api.github.com/graphql",
      {},
      {
        data: { query: query, variables },
        headers: { Authorization: `bearer ${token}` },
      },
    ).catch((error) => {
      console.error(error.response.data.errors[0].message);
    });
    if (response.status != 200) {
      console.error(`Status code: ${response.status}`);
      console.error(response.data);
    }
    return response.data.data.user;
  }
}
