import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const username = Deno.args[0];
const outputPath = Deno.args[1] ?? "./assets/trophy.svg";
const themeName = Deno.args[2] ?? "default";

if (!username) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-read --allow-write ./render_svg.ts USERNAME [OUTPUT_PATH] [THEME]",
  );
  Deno.exit(1);
}

import { GithubApiService } from "./src/Services/GithubApiService.ts";
import { Card } from "./src/card.ts";
import { COLORS } from "./src/theme.ts";

async function main() {
  console.log("Starting trophy render...");
  console.log("Username:", username);
  console.log("Output path:", outputPath);
  console.log("Theme:", themeName);

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

  const panelSize = 115;
  const maxRow = 10;
  const maxColumn = -1; // auto
  const marginWidth = 10;
  const marginHeight = 10;
  const noBackground = false;
  const noFrame = false;

  const card = new Card(
    [],
    [],
    maxColumn,
    maxRow,
    panelSize,
    marginWidth,
    marginHeight,
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
