export const queryUserActivity = `
    query userInfo($username: String!) {
      user(login: $username) {
        createdAt
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          totalPullRequestReviewContributions
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

export const queryUserIssue = `
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

export const queryUserPullRequest = `
  query userInfo($username: String!) {
    user(login: $username) {
      pullRequests(first: 1) {
        totalCount
      }
    }
  }
`;

export const queryUserRepository = `
  query userInfo($username: String!) {
    user(login: $username) {
      repositories(first: 50, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
        totalCount
        nodes {
          languages(first: 2, orderBy: {direction:DESC, field: SIZE}) {
            nodes {
              name
            }
          }
          stargazers {
            totalCount
          }
          createdAt
        }
      }
    }
  }
`;

export const queryUserAll = `
  query userInfo($username: String!) {
    user(login: $username) {
      createdAt
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
        totalPullRequestReviewContributions
      }
      organizations(first: 1) {
        totalCount
      }
      followers(first: 1) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      repositories(first: 50, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
        totalCount
        nodes {
          languages(first: 2, orderBy: {direction:DESC, field: SIZE}) {
            nodes {
              name
            }
          }
          stargazers {
            totalCount
          }
          createdAt
        }
      }
    }
  }
`;
