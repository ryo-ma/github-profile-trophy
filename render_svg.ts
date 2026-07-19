import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const username = Deno.args[0];
const outputPath = Deno.args[1] ?? "./assets/trophy.svg";
const themeName = Deno.args[2] ?? "default";
const titleArg = Deno.args[3] ?? "";
const columnArg = Deno.args[4] ?? "-1";
const noFrameArg = Deno.args[5] ?? "false";
const noBgArg = Deno.args[6] ?? "false";

if (!username) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-read --allow-write ./render_svg.ts USERNAME [OUTPUT_PATH] [THEME] [TITLE] [COLUMN] [NO_FRAME] [NO_BG]",
  );
  Deno.exit(1);
}

import { GithubApiService } from "./src/Services/GithubApiService.ts";
import { Card } from "./src/card.ts";
import { COLORS } from "./src/theme.ts";
import { CONSTANTS } from "./src/utils.ts";

async function main() {
  console.log("Starting trophy render...");
  console.log("Username:", username);
  console.log("Output path:", outputPath);
  console.log("Theme:", themeName);

  const titles: Array<string> = titleArg
    ? titleArg.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
    : [];
  const maxColumn = parseInt(columnArg);
  const noFrame = noFrameArg === "true";
  const noBackground = noBgArg === "true";

  const svc = new GithubApiService();

  const userInfoOrError = await svc.requestUserInfo(username);

  if (
    !(userInfoOrError && (userInfoOrError as any).totalCommits !== undefined)
  ) {
    console.error(
      "Failed to fetch user info. Check token, username and rate limits.",
    );
    Deno.exit(2);
  }

  const userInfo = userInfoOrError as any;

  const card = new Card(
    titles,
    [],
    isNaN(maxColumn) ? -1 : maxColumn,
    CONSTANTS.DEFAULT_MAX_ROW,
    CONSTANTS.DEFAULT_PANEL_SIZE,
    CONSTANTS.DEFAULT_MARGIN_W,
    CONSTANTS.DEFAULT_MARGIN_H,
    noBackground,
    noFrame,
  );
  const theme = (COLORS as any)[themeName] ?? (COLORS as any).default;
  const svg = card.render(userInfo, theme);

  try {
    const dir = outputPath.replace(/\/[^/]+$/, "");
    if (dir) await Deno.mkdir(dir, { recursive: true });
  } catch {
    console.error("Failed to create directory. No permission?");
    Deno.exit(3);
  }

  await Deno.writeTextFile(outputPath, svg);
  console.log(`Wrote ${outputPath}`);
}

await main();
