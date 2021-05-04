import { soxa } from "../deps.ts";
import { UserInfo } from "./user_info.ts"
import type { GitHubUserData } from "./user_info.ts";

export class GithubAPIClient {
  constructor() {
  }
  async requestUserInfo(username: string): Promise<UserInfo | null> {
    const token = Deno.env.get("GITHUB_TOKEN");
    const variables = { username: username };
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            createdAt
            contributionsCollection {
              totalCommitContributions
              restrictedContributionsCount
            }
            pullRequests(first: 1) {
              totalCount
            }
            issues(first: 1) {
              totalCount
            }
            followers(first: 1) {
              totalCount
            }
            repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {direction: DESC, field: STARGAZERS}) {
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
    const response = await soxa.post(
      "https://api.github.com/graphql",
      {},
      {
        data: { query: query, variables },
        headers: { Authorization: `bearer ${token}` },
      },
    );
    if (response.status != 200) {
      throw new Error(response)
    }
    const userData: GitHubUserData = response.data.data.user;
    return new UserInfo(userData);
  }
}
