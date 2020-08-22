import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";
const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const userInfo = await client.requestUserData("ryo-ma")
  req.respond({ body: `Hello, from Deno v${Deno.version.deno}!` + userInfo });
};
