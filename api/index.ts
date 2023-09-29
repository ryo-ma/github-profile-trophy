import { Card } from "../src/card.ts";
import { CONSTANTS, parseParams } from "../src/utils.ts";
import { COLORS, Theme } from "../src/theme.ts";
import { Error400 } from "../src/error_page.ts";
import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { staticRenderRegeneration } from "../src/StaticRenderRegeneration/index.ts";
import { ServiceError } from "../src/Types/index.ts";
import { ErrorPage } from "../src/pages/Error.ts";
import { client } from "../src/Services/index.ts";

const defaultHeaders = new Headers(
  {
    "Content-Type": "image/svg+xml",
    "Cache-Control": `public, max-age=${CONSTANTS.CACHE_MAX_AGE}`,
  },
);

export default (request: Request) =>
  staticRenderRegeneration(request, {
    revalidate: CONSTANTS.REVALIDATE_TIME,
    headers: defaultHeaders,
  }, function (req: Request) {
    return app(req);
  });

async function app(req: Request): Promise<Response> {
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
  const noBackground = params.getBooleanValue(
    "no-bg",
    CONSTANTS.DEFAULT_NO_BACKGROUND,
  );
  const noFrame = params.getBooleanValue(
    "no-frame",
    CONSTANTS.DEFAULT_NO_FRAME,
  );
  const titles: Array<string> = params.getAll("title").flatMap((r) =>
    r.split(",")
  ).map((r) => r.trim());
  const ranks: Array<string> = params.getAll("rank").flatMap((r) =>
    r.split(",")
  ).map((r) => r.trim());

  if (username === null) {
    const [base] = req.url.split("?");
    const error = new Error400(
      `<h2>"username" is a required query parameter</h2>
<p>The URL should look like <code>${base}?username=USERNAME</code>, where
<code>USERNAME</code> is <em>your GitHub username.</em>`,
    );
    return new Response(
      error.render(),
      {
        status: error.status,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
  }
  const userInfo = await client.requestUserInfo(username);
  if (userInfo instanceof ServiceError) {
    return new Response(
      ErrorPage({ error: userInfo, username }).render(),
      {
        status: userInfo.code,
        headers: new Headers({ "Content-Type": "text" }),
      },
    );
  }

  // Success Response
  return new Response(
    new Card(
      titles,
      ranks,
      column,
      row,
      CONSTANTS.DEFAULT_PANEL_SIZE,
      marginWidth,
      paddingHeight,
      noBackground,
      noFrame,
    ).render(userInfo, theme),
    {
      headers: defaultHeaders,
    },
  );
}
