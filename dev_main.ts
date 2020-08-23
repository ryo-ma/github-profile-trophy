import { serve } from "https://deno.land/std@0.66.0/http/server.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const s = serve({ port: 8080 });
const client = new GithubAPIClient();
for await (const req of s) {
  const username = new URLSearchParams(req.url.split("?")[1]).get("username")

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
}
