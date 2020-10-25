import { ServerRequest } from "./deps.ts";
import { GithubAPIClient } from "./src/github_api_client.ts";
import { Card } from "./src/card.ts";
import { CONSTANTS, parseParams } from "./src/utils.ts";
import { COLORS, Theme } from "./src/theme.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const client = new GithubAPIClient();

export default async (req: ServerRequest) => {
  const params = parseParams(req);
  const username = params.get("username");
  const row = params.getNumberValue("row", CONSTANTS.DEFAULT_MAX_ROW);
  const column = params.getNumberValue("column", CONSTANTS.DEFAULT_MAX_COLUMN);
  const themeParam: string = params.getStringValue("theme", "default");
  let theme: Theme = COLORS.default;
  if (Object.keys(COLORS).includes(themeParam)) {
    theme = COLORS[themeParam];
  }
  const marginWidth = params.getNumberValue(
    "margin-w",
    CONSTANTS.DEFAULT_MARGIN_W,
  );
  const paddingHeight = params.getNumberValue(
    "margin-h",
    CONSTANTS.DEFAULT_MARGIN_H,
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
        body: "Can not find a user with userID: " + username,
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
        column,
        row,
        CONSTANTS.DEFAULT_PANEL_SIZE,
        marginWidth,
        paddingHeight,
      ).render(userInfo, theme),
      headers: new Headers(
        {
          "Content-Type": "image/svg+xml",
          "Cache-Control": `public, max-age=${CONSTANTS.CACHE_MAX_AGE}`,
        },
      ),
    },
  );
};
