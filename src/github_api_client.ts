import { soxa } from "../deps.ts";
export class UserInfo {
  constructor(
    public totalCommits: number,
    public totalFollowers: number,
    public totalIssues: number,
    public totalPullRequests: number,
    public totalStargazers: number,
    public totalRepositories: number,
    public languageCount: number,
    public durationYear: number,
    public ancientAccount: number,
    public joined2020: number,
  ) {
  }
}
type Language = { name: string };
type Stargazers = { totalCount: number };

type Repository = {
  languages: { nodes: Language[] };
  stargazers: Stargazers;
};

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
                languages(first: 1, orderBy: {direction:DESC, field: SIZE}) {
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
    const userData = response.data.data.user;
    if (userData === null) {
      return null;
    }
    const totalCommits =
      userData.contributionsCollection.restrictedContributionsCount +
      userData.contributionsCollection.totalCommitContributions;
    const totalStargazers = userData.repositories.nodes.reduce(
      (prev: number, node: Repository) => {
        return prev + node.stargazers.totalCount;
      },
      0,
    );

    const languages = new Set<string>();
    userData.repositories.nodes.forEach((node: Repository) => {
      if (node.languages.nodes[0] != undefined) {
        languages.add(node.languages.nodes[0].name);
      }
    });
    const durationTime = new Date().getTime() -
      new Date(userData.createdAt).getTime();
    const durationYear = new Date(durationTime).getUTCFullYear() - 1970;
    const ancientAccount = new Date(userData.createdAt).getFullYear() <= 2010
      ? 1
      : 0;
    const joined2020 = new Date(userData.createdAt).getFullYear() == 2020
      ? 1
      : 0;
    const userInfo = new UserInfo(
      totalCommits,
      userData.followers.totalCount,
      userData.issues.totalCount,
      userData.pullRequests.totalCount,
      totalStargazers,
      userData.repositories.totalCount,
      languages.size,
      durationYear,
      ancientAccount,
      joined2020
    );
    return userInfo;
  }
}
