import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { createTrophyHandler } from "../src/server.ts";
import { configuredTokens, verifyTokenOwners } from "../src/security/github.ts";
import { GithubApiService } from "../src/Services/GithubApiService.ts";

export default createTrophyHandler({
  tokens: configuredTokens,
  verifyTokens: verifyTokenOwners,
  fetchUser: (owner, tokens) =>
    new GithubApiService(tokens).requestUserInfo(owner),
});
