import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";
const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const userInfo = await client.requestUserInfo("ryo-ma")
  const cardSize = 110;
  req.respond(
    {
      body: new Card(cardSize).render(),
      headers: new Headers({ "Content-Type": "image/svg+xml" }),
    },
  )
};
