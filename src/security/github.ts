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

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Keep upstream responses bounded, including when Content-Length is missing. */
async function readJson<T>(response: Response): Promise<T> {
  if (!response.body) throw new Error("Missing GitHub response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("GitHub response exceeded its size limit");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as T;
  } finally {
    reader.releaseLock();
  }
}

/** The deadline covers the connection/body and respects a caller's overall deadline. */
async function requestJson<T>(
  url: string,
  token: string | undefined,
  init: RequestInit,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (controller.signal.aborted) throw new Error("Request aborted");
    const target = new URL(url);
    if (
      target.protocol !== "https:" || target.username || target.password ||
      target.hash
    ) {
      throw new Error("Invalid GitHub transport URL");
    }
    const requestHeaders: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "github-profile-trophy",
    };
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
    const response = await fetcher(target.href, {
      ...init,
      redirect: "error",
      signal: controller.signal,
      headers: requestHeaders,
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
    return await readJson<T>(response);
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      "GitHub request failed or timed out.",
      EServiceKindError.UNAVAILABLE,
    );
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}

export function githubJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
  timeoutMs = 2000,
): Promise<T> {
  if (!token || /\s/.test(token) || token.length > 256) {
    return Promise.reject(
      new ServiceError(
        "A GitHub token must be configured on the server.",
        EServiceKindError.UNAVAILABLE,
      ),
    );
  }
  return requestJson<T>(url, token, init, fetcher, timeoutMs);
}

/** Public profile fields must reflect an anonymous viewer, regardless of PAT permissions. */
export function githubPublicJson<T>(
  url: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
  timeoutMs = 2000,
): Promise<T> {
  return requestJson<T>(url, undefined, init, fetcher, timeoutMs);
}

export async function verifyTokenOwners(tokens: string[]): Promise<void> {
  if (tokens.length === 0) {
    throw new ServiceError(
      "Configure a personal GitHub token before using this service.",
      EServiceKindError.UNAVAILABLE,
    );
  }
  await Promise.all(tokens.map(async (token) => {
    const result = await githubJson<{
      data?: { viewer?: { login?: string } };
      errors?: unknown[];
    }>(githubApiUrl(), token, {
      method: "POST",
      body: JSON.stringify({
        query: "query TrophyViewer { viewer { login } }",
      }),
    });
    if (
      result.errors?.length ||
      result.data?.viewer?.login?.toLowerCase() !==
        PERSONAL_USERNAME.toLowerCase()
    ) {
      throw new ServiceError(
        "Every configured token must belong to the personal account.",
        EServiceKindError.UNAVAILABLE,
      );
    }
  }));
}
