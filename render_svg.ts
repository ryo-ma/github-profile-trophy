import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

if(!Deno.env.get("GITHUB_TOKEN1")) {
  console.error("Github Token is required!");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  boolean: ["help"],
  string: ["file", "theme", "cols", "rows"],
  default: { file: "./trophy.svg", theme: "default", cols: "-1", rows: "10" },
  alias: { help: "h", file: "f", theme: "t", cols: "c", rows: "r" },
});

if (args._.length == 0 || args.help) {
  console.log(`
Usage: deno run render_svg.ts USERNAME [options]

ENVIROMENT VARIABLES:
  GITHUB_TOKEN1: Github Token


USERNAME:
  Github username.


Options
  -f, --file Path to output file (default: ./trophy.svg)
  -t, --theme Theme-Name (default: default)
  -c, --cols Colums
  -r, --rows Rows
  -h, --help Shows this help
  `);

  Deno.exit(1);
}

const [username] = args._ as string[];
const outputPath = args.file as string;
const themeName  = args.theme as string;
const cols = parseInt(args.cols as string, 10);
const rows = parseInt(args.rows as string, 10);

if (Number.isNaN(cols) || Number.isNaN(rows)) {
  console.error("Cols and Rows need to be Integers!");
  Deno.exit(2);
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
  const maxRow = rows;
  const maxColumn = cols;
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
