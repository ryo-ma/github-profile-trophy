// Per-repository nodes let the counting policy exclude private work when requested.
export const queryUserActivity = `
  query publicUserActivity($username: String!) {
    user(login: $username) {
      contributionsCollection {
        commitContributionsByRepository(maxRepositories: 100) {
          repository { visibility isPrivate }
          contributions(first: 100) { nodes { commitCount } }
        }
      }
    }
  }
`;

export const queryUserReview = `
  query publicUserReviews($search: String!, $username: String!, $cursor: String) {
    search(query: $search, type: ISSUE, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          id
          repository { visibility isPrivate }
          reviews(last: 100, author: $username, states: [APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED]) {
            nodes { id state submittedAt author { login } }
          }
        }
      }
    }
  }
`;

// The service applies is:public unless private repository counts are enabled.
export const queryUserIssue = `
  query publicUserIssues($search: String!, $cursor: String) {
    search(query: $search, type: ISSUE, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Issue {
          id
          state
          repository { visibility isPrivate }
        }
      }
    }
  }
`;

export const queryUserPullRequest = `
  query publicUserPullRequests($search: String!, $cursor: String) {
    search(query: $search, type: ISSUE, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          id
          repository { visibility isPrivate }
        }
      }
    }
  }
`;

export const queryUserRepository = `
  query publicUserRepositories($username: String!, $cursor: String, $privacy: RepositoryPrivacy = PUBLIC) {
    user(login: $username) {
      repositories(first: 100, after: $cursor, privacy: $privacy, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          visibility
          isPrivate
          languages(first: 3, orderBy: {direction:DESC, field: SIZE}) {
            nodes { name }
          }
          stargazers { totalCount }
          createdAt
        }
      }
    }
  }
`;
