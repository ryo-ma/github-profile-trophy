export type GithubError = {
  message: string;
  type: string;
};

export type GithubErrorResponse = {
  errors: GithubError[];
};

export type GithubExceedError = {
  documentation_url: string;
  message: string;
};

export type QueryDefaultResponse<T = unknown> = {
  data: {
    data: T;
    errors?: GithubErrorResponse;
    message?: string;
  };
};
