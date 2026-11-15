import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { CONSTANTS } from "../utils.ts";

export const PERSONAL_USERNAME = "BaranaNadil";

export function configuredTokens(): string[] {
  return [
    ...new Set([
      Deno.env.get("GITHUB_TOKEN1")?.trim(),
      Deno.env.get("GITHUB_TOKEN2")?.trim(),
    ].filter((token): token is string => !!token)),
  ];
}

export function githubApiUrl(): string {
  const url = new URL(
    Deno.env.get("GITHUB_API") || CONSTANTS.DEFAULT_GITHUB_API,
  );
  if (
    url.protocol !== "https:" || url.username || url.password || url.search ||
    url.hash
  ) {
    throw new ServiceError(
      "GitHub API must use HTTPS without URL credentials.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  if (url.pathname !== "/graphql" && url.pathname !== "/api/graphql") {
    throw new ServiceError(
      "Unsupported GitHub API endpoint.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  return url.href;
}

/** The timer covers both the connection and response body; redirects cannot forward the PAT. */
export async function githubJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
  timeoutMs = 2000,
): Promise<T> {
  if (!token || /\s/.test(token) || token.length > 256) {
    throw new ServiceError(
      "A GitHub token must be configured on the server.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      ...init,
      redirect: "error",
      signal: controller.signal,
      headers: {
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "personal-github-profile-trophy",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (
      response.status === 429 ||
      (response.status === 403 &&
        response.headers.get("x-ratelimit-remaining") === "0")
    ) {
      await response.body?.cancel();
      throw new ServiceError(
        "GitHub rate limit exceeded.",
        EServiceKindError.RATE_LIMIT,
      );
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ServiceError(
        "GitHub rejected the configured credentials or is unavailable.",
        EServiceKindError.UNAVAILABLE,
      );
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      "GitHub request failed or timed out.",
      EServiceKindError.UNAVAILABLE,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyTokenOwners(tokens: string[]): Promise<void> {
  const url = new URL(githubApiUrl());
  url.pathname = url.pathname === "/api/graphql" ? "/api/v3/user" : "/user";
  if (tokens.length === 0) {
    throw new ServiceError(
      "Configure a personal GitHub token before using this service.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  await Promise.all(tokens.map(async (token) => {
    const user = await githubJson<{ login?: string }>(url.href, token);
    if (user.login?.toLowerCase() !== PERSONAL_USERNAME.toLowerCase()) {
      throw new ServiceError(
        "Every configured token must belong to the personal account.",
        EServiceKindError.UNAVAILABLE,
      );
    }
  }));
}
