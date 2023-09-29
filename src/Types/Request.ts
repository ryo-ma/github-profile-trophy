export type GithubError = {
  message: string;
  type: string;
};

export type QueryDefaultResponse<T = unknown> = {
  data: {
    data: T;
    errors: GithubError[];
  };
};
