import { UserInfo } from "../user_info.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { githubApiUrl, PERSONAL_USERNAME } from "./github.ts";
import { RedisSourceCache } from "./shared_cache.ts";

const statisticFields = [
  "totalCommits",
  "totalFollowers",
  "totalIssues",
  "totalOrganizations",
  "totalPullRequests",
  "totalReviews",
  "totalStargazers",
  "totalRepositories",
  "languageCount",
  "durationYear",
  "durationDays",
  "ancientAccount",
  "joined2020",
  "ogAccount",
] as const;

export function isPublicStatistics(value: unknown): value is UserInfo {
  if (!value || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return Object.keys(fields).length === statisticFields.length &&
    statisticFields.every((key) =>
      Object.hasOwn(fields, key) && Number.isSafeInteger(fields[key]) &&
      (fields[key] as number) >= 0
    );
}

type Environment = (key: string) => string | undefined;
type Loaders = {
  verify: (tokens: string[]) => Promise<void>;
  fetch: (owner: string, tokens: string[]) => Promise<UserInfo | ServiceError>;
};

/** Share only ownership proofs and a strict numeric public-data projection. */
export function publicSource(
  loaders: Loaders,
  requireShared: boolean,
  env: Environment = (key) => Deno.env.get(key),
) {
  let signature = "";
  let cache: RedisSourceCache | undefined;
  const store = () => {
    const url = env("RATE_LIMIT_REDIS_URL")?.trim();
    const token = env("RATE_LIMIT_REDIS_TOKEN")?.trim();
    if (
      !url && !token && !requireShared &&
      env("REQUIRE_SHARED_RATE_LIMIT") !== "true"
    ) {
      return undefined;
    }
    if (!url || !token) throw new Error("Shared public data is unavailable.");
    if (
      /^(?:github_pat_|gh[pousr]_)/.test(token) ||
      [env("GITHUB_TOKEN1"), env("GITHUB_TOKEN2")].some((value) =>
        value?.trim() === token
      )
    ) {
      throw new Error("Use a dedicated Redis credential.");
    }
    const next = JSON.stringify([url, token]);
    if (!cache || next !== signature) {
      cache = new RedisSourceCache({ url, token });
      signature = next;
    }
    return cache;
  };
  const key = async (kind: string, tokens: string[]) => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        ["public-v4", githubApiUrl(), PERSONAL_USERNAME, ...tokens].join("\0"),
      ),
    );
    const fingerprint = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, "0")).join("");
    return `trophy:{public-v4}:${kind}:${fingerprint}`;
  };
  return {
    verify: async (tokens: string[]) => {
      const shared = store();
      if (!shared) return await loaders.verify(tokens);
      await shared.getOrLoad(
        await key("proof", tokens),
        300,
        (value): value is true => value === true,
        async () => {
          await loaders.verify(tokens);
          return true as const;
        },
      );
    },
    fetch: async (
      owner: string,
      tokens: string[],
    ): Promise<UserInfo | ServiceError> => {
      const load = async () => {
        const result = await loaders.fetch(owner, tokens);
        if (result instanceof ServiceError) throw result;
        if (!isPublicStatistics(result)) {
          throw new Error("Invalid public statistics.");
        }
        return result;
      };
      try {
        const shared = store();
        return shared
          ? await shared.getOrLoad(
            await key("stats", tokens),
            900,
            isPublicStatistics,
            load,
          )
          : await load();
      } catch (error) {
        return error instanceof ServiceError ? error : new ServiceError(
          "Public statistics are unavailable.",
          EServiceKindError.UNAVAILABLE,
        );
      }
    },
  };
}
