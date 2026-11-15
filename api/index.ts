import { createTrophyHandler } from "../src/server.ts";
import { configuredTokens, verifyTokenOwners } from "../src/security/github.ts";
import { GithubApiService } from "../src/Services/GithubApiService.ts";
import {
  deploymentBudget,
  trustedClientAddress,
} from "../src/security/deployment.ts";
import { publicSource } from "../src/security/public_source.ts";

function buildHandler(requireShared: boolean) {
  const usesSharedCache = requireShared ||
    !!Deno.env.get("RATE_LIMIT_REDIS_URL")?.trim() ||
    !!Deno.env.get("RATE_LIMIT_REDIS_TOKEN")?.trim() ||
    Deno.env.get("REQUIRE_SHARED_RATE_LIMIT") === "true";
  const source = publicSource({
    verify: verifyTokenOwners,
    fetch: async (owner, tokens) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        return await new GithubApiService(tokens, controller.signal)
          .requestUserInfo(owner);
      } finally {
        clearTimeout(timer);
      }
    },
  }, requireShared);
  return createTrophyHandler({
    tokens: configuredTokens,
    verifyTokens: source.verify,
    sharedLimit: deploymentBudget(undefined, requireShared),
    fetchUser: source.fetch,
    // Redis expiry is authoritative; a cache hit must not receive another local TTL.
    dataTtlMs: usesSharedCache ? 0 : 15 * 60_000,
    verificationTtlMs: usesSharedCache ? 0 : 5 * 60_000,
  });
}

const handler = buildHandler(false);

export function handleRequest(request: Request, socketPeer?: string) {
  return handler(
    request,
    trustedClientAddress(request, Deno.env.get("VERCEL") === "1", socketPeer),
  );
}

export default (request: Request) => handleRequest(request);

/** Local/socket-based servers may opt into shared limits through their environment. */
export function createLocalRequestHandler() {
  const local = buildHandler(false);
  return (request: Request, socketPeer: string) =>
    local(request, trustedClientAddress(request, false, socketPeer));
}
