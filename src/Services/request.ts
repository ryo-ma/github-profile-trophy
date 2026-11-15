import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { githubApiUrl, githubJson } from "../security/github.ts";

type GithubResponse<T> = {
  data?: { user?: T | null };
  errors?: { type?: string; message?: string }[];
  message?: string;
};

export async function requestGithubData<T = unknown>(
  query: string,
  variables: { [key: string]: string },
  token = "",
) {
  const response = await githubJson<GithubResponse<T>>(githubApiUrl(), token, {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });
  const errors = Array.isArray(response.errors) ? response.errors : [];
  if (
    errors.some((error) => error.type === EServiceKindError.RATE_LIMIT) ||
    response.message?.toLowerCase().includes("rate limit")
  ) {
    throw new ServiceError(
      "GitHub rate limit exceeded.",
      EServiceKindError.RATE_LIMIT,
    );
  }
  if (errors.some((error) => error.type === EServiceKindError.NOT_FOUND)) {
    throw new ServiceError(
      "GitHub account not found.",
      EServiceKindError.NOT_FOUND,
    );
  }
  if (errors.length || !response.data?.user) {
    throw new ServiceError(
      "GitHub returned an incomplete response.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  return response.data.user;
}
