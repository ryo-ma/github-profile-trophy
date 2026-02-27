import "https://deno.land/x/dotenv@v0.5.0/load.ts";
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";
import { dirname } from "https://deno.land/std/path/mod.ts";

import { GithubApiService } from "./src/Services/GithubApiService.ts";
import { Card } from "./src/card.ts";
import { COLORS } from "./src/theme.ts";

if (!Deno.env.get("GITHUB_TOKEN1")) {
  console.error("Github Token is required!");
  console.error("Create .env file with: GITHUB_TOKEN1=ghp_xxx");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  boolean: ["help", "no-background", "no-frame"],
  string: [
    "file",
    "theme",
    "cols",
    "rows",
    "panel-size",
    "margin-width",
    "margin-height",
  ],
  default: {
    file: "./trophy.svg",
    theme: "default",
    cols: "-1",
    rows: "10",
    "panel-size": "115",
    "margin-width": "10",
    "margin-height": "10",
  },
  alias: {
    h: "help",
    f: "file",
    t: "theme",
    c: "cols",
    r: "rows",
    s: "panel-size",
    mw: "margin-width",
    mh: "margin-height",
  },
});

if (args.help || args._.length === 0) {
  console.log(`github-profile-trophy v0.0.0

Usage: deno run render_svg.ts USERNAME [options]

ENV: GITHUB_TOKEN1=ghp_xxx (required)

USERNAME: Github username

Options:
  -f,  --file FILE          Output file (default: ./trophy.svg)
  -t,  --theme THEME        Theme name (default: default)
  -c,  --cols N             Max Columns (-1=auto, default: -1)
  -r,  --rows N             Max Rows (default: 10)
  -s,  --panel-size N       Panel size (default: 115)
  -mw, --margin-width N     Margin Width size (default: 10)
  -mh, --margin-height N    Margin Height size (default: 10)
  --no-background           Disable background
  --no-frame                Disable frame
  -h,  --help               Show this help`);

  Deno.exit(0);
}

function parseIntSafe(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const val = value ?? String(fallback);
  const num = parseInt(val, 10);
  if (Number.isNaN(num)) {
    console.error(`Invalid ${name}: "${val}"; Must be a number!`);
    Deno.exit(2);
  }
  return num;
}

const [username] = args._ as string[];
const file = args.file as string;
const themeName = args.theme as string;
const maxColumn = parseIntSafe(args.cols, -1, "cols");
const maxRow = parseIntSafe(args.rows, 10, "rows");
const panelSize = parseIntSafe(args["panel-size"], 115, "panel-size");
const marginWidth = parseIntSafe(args["margin-width"], 10, "margin-width");
const marginHeight = parseIntSafe(args["margin-height"], 10, "margin-height");
const noBackground = args["no-background"] as boolean;
const noFrame = args["no-frame"] as boolean;

async function main() {
  console.log("Starting trophy render...");
  console.log("Username:", username);
  console.log("File:", file);
  console.log("Theme:", themeName);

  const svc = new GithubApiService();
  const userInfoOrError = await svc.requestUserInfo(username);

  if (
    !(userInfoOrError && (userInfoOrError as any).totalCommits !== undefined)
  ) {
    console.error(
      "Failed to fetch user info. Check token, username and rate limits.",
    );
    Deno.exit(3);
  }

  const userInfo = userInfoOrError as any;

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
    const dir = dirname(file);
    if (dir && dir !== ".") {
      await Deno.mkdir(dir, { recursive: true });
    }
  } catch {
    console.error("Failed to create directory. No permission?");
    Deno.exit(4);
  }

  try {
    await Deno.writeTextFile(file, svg);
    console.log(`Wrote ${file}`);
  } catch {
    console.error("Failed to write file. No permission?");
    Deno.exit(5);
  }
}

await main();
