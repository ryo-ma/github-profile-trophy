import { dirname } from "https://deno.land/std@0.203.0/path/mod.ts";

type Options = {
  help: boolean;
  url?: string;
  username?: string;
  query?: string;
  output?: string;
  errors: string[];
};

function printHelp(): void {
  console.log(`Usage:
  deno run -A scripts/generate-trophy-svg.ts --url URL [--output PATH]
  deno run -A scripts/generate-trophy-svg.ts --username NAME [--query QUERY] [--output PATH]

Options:
  --url       Full request URL, including query string
  --username  GitHub username
  --query     Extra query string without the leading "?"
  --output    Output SVG path
  -h, --help  Show this help message
`);
}

function parseArgs(args: string[]): Options {
  const options: Options = { help: false, errors: [] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      options.errors.push(`Unknown argument: ${arg}`);
      continue;
    }
    const key = arg.slice(2);
    const value = args[i + 1];
    if (value === undefined) {
      options.errors.push(`Missing value for: ${arg}`);
      continue;
    }
    i += 1;
    switch (key) {
      case "url":
        options.url = value;
        break;
      case "username":
        options.username = value;
        break;
      case "query":
        options.query = value;
        break;
      case "output":
        options.output = value;
        break;
      default:
        options.errors.push(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function buildUrl(options: Options): string | null {
  if (options.url) {
    return options.url;
  }
  if (!options.username) {
    return null;
  }
  const url = new URL("http://localhost/");
  url.searchParams.set("username", options.username);
  if (options.query) {
    const queryString = options.query.replace(/^\?/, "");
    const extraParams = new URLSearchParams(queryString);
    for (const [key, value] of extraParams.entries()) {
      if (key === "username") {
        continue;
      }
      url.searchParams.append(key, value);
    }
  }
  return url.toString();
}

function resolveOutputPath(options: Options): string {
  if (options.output) {
    return options.output;
  }
  let username = options.username;
  if (!username && options.url) {
    try {
      username = new URL(options.url).searchParams.get("username") ?? undefined;
    } catch {
      username = undefined;
    }
  }
  if (username) {
    return `generated/${username}.svg`;
  }
  return "generated/trophy.svg";
}

async function loadHandler() {
  const module = await import("../api/index.ts");
  return module.default as (request: Request) => Promise<Response>;
}

export async function run(args: string[]): Promise<number> {
  const options = parseArgs(args);
  if (options.help) {
    printHelp();
    return 0;
  }
  if (options.url && options.username) {
    options.errors.push("Use either --url or --username, not both.");
  }
  if (!options.url && !options.username) {
    options.errors.push("Missing required --url or --username.");
  }
  if (options.errors.length > 0) {
    for (const error of options.errors) {
      console.error(error);
    }
    printHelp();
    return 1;
  }

  const url = buildUrl(options);
  if (!url) {
    console.error("Failed to build request URL.");
    return 1;
  }
  const outputPath = resolveOutputPath(options);

  const requestHandler = await loadHandler();
  const response = await requestHandler(new Request(url));
  if (!response.ok) {
    const body = await response.text();
    console.error(`Request failed with status ${response.status}.`);
    if (body) {
      console.error(body);
    }
    return 1;
  }

  const svg = await response.text();
  const outputDir = dirname(outputPath);
  if (outputDir !== ".") {
    await Deno.mkdir(outputDir, { recursive: true });
  }
  await Deno.writeTextFile(outputPath, svg);
  console.log(`Wrote ${outputPath}`);
  return 0;
}

if (import.meta.main) {
  const code = await run(Deno.args);
  Deno.exit(code);
}
