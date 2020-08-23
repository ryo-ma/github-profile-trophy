import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";
const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const username = new URLSearchParams(req.url.split("?")[1]).get("username");

  if (username != null) {
    const userInfo = await client.requestUserInfo(username);
    req.respond(
      {
        body: new Card().render(userInfo),
        headers: new Headers({ "Content-Type": "image/svg+xml" }),
      },
    );
  } else {
    req.respond(
      {
        body: "Can not find username",
        status: 404,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
  }
};
