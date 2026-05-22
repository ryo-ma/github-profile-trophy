import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { parse } from "https://deno.land/std@0.203.0/flags/mod.ts";

import { GithubApiService } from "./src/Services/GithubApiService.ts";
import { Card } from "./src/card.ts";
import { COLORS } from "./src/theme.ts";
import { CONSTANTS } from "./src/utils.ts";

const flags = parse(Deno.args, {
  string: ["username", "output", "theme"],
  boolean: ["no-bg", "no-frame", "help"],
  collect: ["title", "rank"],
  default: {
    output: "./assets/trophy.svg",
    theme: "default",
    column: CONSTANTS.DEFAULT_MAX_COLUMN,
    row: CONSTANTS.DEFAULT_MAX_ROW,
    "margin-w": CONSTANTS.DEFAULT_MARGIN_W,
    "margin-h": CONSTANTS.DEFAULT_MARGIN_H,
    "no-bg": CONSTANTS.DEFAULT_NO_BACKGROUND,
    "no-frame": CONSTANTS.DEFAULT_NO_FRAME,
    title: [],
    rank: [],
  },
  alias: {
    u: "username",
    o: "output",
    t: "theme",
    c: "column",
    r: "row",
    h: "help",
  },
});

const username: string = flags.username ?? (flags._[0] as string);

if (flags.help || !username) {
  console.error(
    [
      "Usage: deno run --allow-net --allow-env --allow-read --allow-write ./render_svg.ts [options]",
      "",
      "Options:",
      "  --username, -u   GitHub username (required)",
      `  --output, -o     Output path for the SVG (default: ./assets/trophy.svg)`,
      `  --theme, -t      Theme name (default: default)`,
      `  --column, -c     Number of columns, -1 for auto (default: ${CONSTANTS.DEFAULT_MAX_COLUMN})`,
      `  --row, -r        Maximum number of rows (default: ${CONSTANTS.DEFAULT_MAX_ROW})`,
      `  --margin-w       Horizontal margin between trophies (default: ${CONSTANTS.DEFAULT_MARGIN_W})`,
      `  --margin-h       Vertical margin between trophies (default: ${CONSTANTS.DEFAULT_MARGIN_H})`,
      "  --no-bg          Disable card background",
      "  --no-frame       Disable card frame",
      "  --title          Filter by trophy title (can be specified multiple times or comma-separated)",
      "  --rank           Filter by rank (can be specified multiple times or comma-separated)",
    ].join("\n"),
  );
  if (!username) Deno.exit(1);
}

function parseIntFlag(name: string, raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    console.error(
      `Invalid value for --${name}: "${raw}" is not a valid number`,
    );
    Deno.exit(1);
  }
  return value;
}

async function main() {
  const outputPath: string = flags.output;
  const themeName: string = flags.theme;
  const maxColumn: number = parseIntFlag("column", flags.column);
  const maxRow: number = parseIntFlag("row", flags.row);
  const marginWidth: number = parseIntFlag("margin-w", flags["margin-w"]);
  const marginHeight: number = parseIntFlag("margin-h", flags["margin-h"]);
  const noBackground: boolean = flags["no-bg"];
  const noFrame: boolean = flags["no-frame"];
  const titles: string[] = (flags.title as string[])
    .flatMap((t) => t.split(","))
    .map((t) => t.trim())
    .filter(Boolean);
  const ranks: string[] = (flags.rank as string[])
    .flatMap((r) => r.split(","))
    .map((r) => r.trim())
    .filter(Boolean);

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
  const theme = (COLORS as any)[themeName] ?? (COLORS as any).default;

  const card = new Card(
    titles,
    ranks,
    maxColumn,
    maxRow,
    CONSTANTS.DEFAULT_PANEL_SIZE,
    marginWidth,
    marginHeight,
    noBackground,
    noFrame,
  );
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
