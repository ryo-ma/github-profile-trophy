import { soxa } from "../deps.ts";
import { UserInfo } from "./user_info.ts";
import { CONSTANTS } from "./utils.ts";
import type {
  GitHubUserActivity,
  GitHubUserIssue,
  GitHubUserPullRequest,
  GitHubUserRepository,
} from "./user_info.ts";

export class GithubAPIClient {
  constructor(
    private apiEndpoint: string = CONSTANTS.DEFAULT_GITHUB_API,
  ) {
  }
  async requestUserInfo(
    username: string,
  ): Promise<UserInfo | null> {
    // Avoid timeout for the Github API
    const results = await Promise.all([
      this.requestUserActivity(username),
      this.requestUserIssue(username),
      this.requestUserPullRequest(username),
      this.requestUserRepository(username),
    ]);
    if (results.some((r) => r == null)) {
      return null;
    }
    return new UserInfo(results[0]!, results[1]!, results[2]!, results[3]!);
  }
  private async requestUserActivity(
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
    return await this.request(query, username);
  }
  private async requestUserIssue(
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
    return await this.request(query, username);
  }
  private async requestUserPullRequest(
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
    return await this.request(query, username);
  }
  private async requestUserRepository(
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
    return await this.request(query, username);
  }
  private async request(
    query: string,
    username: string,
  ) {
    const tokens = [
      Deno.env.get("GITHUB_TOKEN1"),
      Deno.env.get("GITHUB_TOKEN2"),
    ];
    const variables = { username: username };
    let response;
    for (const token of tokens) {
      response = await soxa.post(
        this.apiEndpoint,
        {},
        {
          data: { query: query, variables },
          headers: { Authorization: `bearer ${token}` },
        },
      ).catch((error) => {
        console.error(error.response.data);
      });
      if (response.data.data !== undefined) {
        break;
      }
    }
    return response.data.data.user;
  }
}
