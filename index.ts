import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import { parseParams, COLORS, CONSTANTS } from "./src/utils.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const params = parseParams(req);
  const username = params.get("username");
  const row = params.getNumberValue("row", CONSTANTS.DEFAULT_MAX_ROW);
  const column = params.getNumberValue("column", CONSTANTS.DEFAULT_MAX_COLUMN);
  const themeParam: string = params.has("theme") ? params.get("theme") || "default" : "default";
  let theme;
  switch (themeParam) {
    case "gruvbox":
      theme = COLORS.gruvbox;
      break;
    default:
      theme = COLORS.default;
  }
  const paddingWidth = params.getNumberValue(
    "padding-w",
    CONSTANTS.DEFAULT_PADDING_W,
  );
  const paddingHeight = params.getNumberValue(
    "padding-h",
    CONSTANTS.DEFAULT_PADDING_H,
  );
  const titles: Array<string> = params.getAll("title").flatMap((r) =>
    r.split(",")
  ).map((r) => r.trim());
  const ranks: Array<string> = params.getAll("rank").flatMap((r) =>
    r.split(",")
  ).map((r) => r.trim());

  if (username === null) {
    req.respond(
      {
        body: "Can not find a query parameter: username",
        status: 404,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
    return;
  }
  const userInfo = await client.requestUserInfo(username);
  if (userInfo === null) {
    req.respond(
      {
        body: "Can not find a user",
        status: 404,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
    return;
  }
  // Success Response
  req.respond(
    {
      body: new Card(
        titles,
        ranks,
        theme,
        column,
        row,
        CONSTANTS.DEFAULT_PANEL_SIZE,
        paddingWidth,
        paddingHeight,
      ).render(userInfo),
      headers: new Headers(
        {
          "Content-Type": "image/svg+xml",
          "Cache-Control": `public, max-age: ${CONSTANTS.CACHE_MAX_AGE}`,
        },
      ),
    },
  );
};
