import ky from "https://deno.land/x/ky/index.js";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

class UserInfo {
  constructor(
    public totalCommits: Number,
    public totalFollowers: Number,
    public totalIssues: Number,
    public totalPullRequests: Number,
    public totalStargazers: Number,
    public totalRepositories: Number,
    public totalContributed: Number,
  ) {
  }
}

export class GithubAPIClient {
  constructor() {
  }
  async requestUserData(username: string): Promise<UserInfo> {
    const token = Deno.env.get('GITHUB_TOKEN');
    const variables = { username: username };
    const query = `
        query userInfo($username: String!) {
          user(login: $username) {
            name
            login
            contributionsCollection {
              totalCommitContributions
              restrictedContributionsCount
            }
            repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
              totalCount
            }
            pullRequests(first: 1) {
              totalCount
            }
            issues(first: 1) {
              totalCount
            }
            followers {
              totalCount
            }
            repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
              nodes {
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
        `;
    const response = await ky.post(
      "https://api.github.com/graphql",
      {
        json: { query: query, variables },
        headers: { Authorization: `bearer ${token}` },
      },
    ).json();
    const totalCommits = response.data.user.contributionsCollection.restrictedContributionsCount + response.data.user.contributionsCollection.totalCommitContributions;
    const totalStargazers = response.data.user.repositories.nodes.reduce((prev: Number, node: any) => {
        return prev + node.stargazers.totalCount;
      }, 0);
    const userInfo = new UserInfo(
        totalCommits,
        response.data.user.followers.totalCount,
        response.data.user.issues.totalCount,
        response.data.user.pullRequests.totalCount,
        totalStargazers,
        response.data.user.repositories.totalCount,
        response.data.user.repositoriesContributedTo.totalCount,
        )
    return userInfo;
  }
}