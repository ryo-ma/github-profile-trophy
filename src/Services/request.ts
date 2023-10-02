import { soxa } from "../../deps.ts";
import {
  EServiceKindError,
  GithubErrorResponse,
  GithubExceedError,
  QueryDefaultResponse,
  ServiceError,
} from "../Types/index.ts";

export async function requestGithubData<T = unknown>(
  query: string,
  variables: { [key: string]: string },
  token = "",
) {
  const response = await soxa.post("", {}, {
    data: { query, variables },
    headers: {
      Authorization: `bearer ${token}`,
    },
  }) as QueryDefaultResponse<{ user: T }>;
  const responseData = response.data;

  if (responseData?.data?.user) {
    return responseData.data.user;
  }

  throw handleError(
    responseData as unknown as GithubErrorResponse | GithubExceedError,
  );
}

function handleError(
  reponseErrors: GithubErrorResponse | GithubExceedError,
): ServiceError {
  let isRateLimitExceeded = false;
  const arrayErrors = (reponseErrors as GithubErrorResponse)?.errors || [];
  const objectError = (reponseErrors as GithubExceedError) || {};

  if (Array.isArray(arrayErrors)) {
    isRateLimitExceeded = arrayErrors.some((error) =>
      error.type.includes(EServiceKindError.RATE_LIMIT)
    );
  }

  if (objectError?.message) {
    isRateLimitExceeded = objectError?.message.includes(
      "rate limit",
    );
  }

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
