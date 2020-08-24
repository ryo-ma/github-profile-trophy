import {soxa} from "../deps.ts";
export class UserInfo {
  constructor(
    public totalCommits: number,
    public totalFollowers: number,
    public totalIssues: number,
    public totalPullRequests: number,
    public totalStargazers: number,
    public totalRepositories: number,
    public totalContributed: number,
  ) {
  }
}

export class GithubAPIClient {
  constructor() {
  }
  async requestUserInfo(username: string): Promise<UserInfo> {
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
    const response = await soxa.post(
      "https://api.github.com/graphql",
      {},
      {
        data: { query: query, variables },
        headers: { Authorization: `bearer ${token}` },
      },
    );
    const userData = response.data.data.user;
    const totalCommits = userData.contributionsCollection.restrictedContributionsCount + userData.contributionsCollection.totalCommitContributions;
    const totalStargazers = userData.repositories.nodes.reduce((prev: number, node: any) => {
        return prev + node.stargazers.totalCount;
      }, 0);
    const userInfo = new UserInfo(
        totalCommits,
        userData.followers.totalCount,
        userData.issues.totalCount,
        userData.pullRequests.totalCount,
        totalStargazers,
        userData.repositories.totalCount,
        userData.repositoriesContributedTo.totalCount,
        )
    return userInfo;
  }
}