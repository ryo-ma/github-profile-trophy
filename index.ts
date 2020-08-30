import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import { parseParams, CONSTANTS } from "./src/utils.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const params = parseParams(req);
  const username = params.get("username");
  let row = CONSTANTS.DEFAULT_MAX_ROW;
  let column = CONSTANTS.DEFAULT_MAX_COLUMN;
  let titles: Array<string> = params.getAll("title").flatMap((r) =>
    r.split(",")
  ).map((r) => r.trim());
  let ranks: Array<string> = params.getAll("rank").flatMap((r) => r.split(","))
    .map((r) => r.trim());
  if (params.has("row")) {
    const param = params.get("row");
    if (param != null) {
      row = parseInt(param);
    }
  }

  if (params.has("column")) {
    const param = params.get("column");
    if (param != null) {
      column = parseInt(param);
    }
  }

  if (username != null) {
    const userInfo = await client.requestUserInfo(username);
    if (userInfo !== null) {
      req.respond(
        {
          body: new Card(titles, ranks, column, row).render(userInfo),
          headers: new Headers(
            {
              "Content-Type": "image/svg+xml",
              "Cache-Control": `public, max-age: ${CONSTANTS.CACHE_MAX_AGE}`,
            },
          ),
        },
      );
    } else {
      req.respond(
        {
          body: "Can not find a user",
          status: 404,
          headers: new Headers({ "Content-Type": "text" }),
        },
      );
    }
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
