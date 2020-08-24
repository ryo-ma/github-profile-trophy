import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import { parseParams } from "./src/utils.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const client = new GithubAPIClient();
const cacheMaxAge = 7200;

export default async (req: ServerRequest) => {
  const username = parseParams(req).get("username");

  if (username != null) {
    const userInfo = await client.requestUserInfo(username);
    req.respond(
      {
        body: new Card().render(userInfo),
        headers: new Headers(
          {
            "Content-Type": "image/svg+xml",
            "Cache-Control": `public, max-age: ${cacheMaxAge}`,
          },
        ),
      },
    );
  } else {
    req.respond(
      {
        body: "Can not find a query parameter: username",
        status: 404,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
  }
};
