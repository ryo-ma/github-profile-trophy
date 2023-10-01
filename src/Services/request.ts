import { soxa } from "../../deps.ts";
import {
  EServiceKindError,
  GithubError,
  QueryDefaultResponse,
  ServiceError,
} from "../Types/index.ts";

export async function requestGithubData<T = unknown>(
  query: string,
  variables: { [key: string]: string },
  token = "",
) {
  const data = await soxa.post("", {}, {
    data: { query, variables },
    headers: {
      Authorization: `bearer ${token}`,
    },
  }) as QueryDefaultResponse<{ user: T }>;

  if (data?.data?.errors) {
    throw handleError(data?.data?.errors);
  }

  if (data?.data?.data?.user) {
    return data.data.data.user;
  }

  throw new ServiceError("not found", EServiceKindError.NOT_FOUND);
}

function handleError(responseErrors: GithubError[]): ServiceError {
  const errors = responseErrors ?? [];

  const isRateLimitExceeded = errors.some((error) =>
    error.type.includes(EServiceKindError.RATE_LIMIT) ||
    error.message.includes("rate limit")
  );

  if (isRateLimitExceeded) {
    throw new ServiceError(
      "Rate limit exceeded",
      EServiceKindError.RATE_LIMIT,
    );
  }

  throw new ServiceError(
    "unknown error",
    EServiceKindError.NOT_FOUND,
  );
}
