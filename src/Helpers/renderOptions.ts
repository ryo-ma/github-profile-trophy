import { posix } from "https://deno.land/std@0.203.0/path/mod.ts";

export interface RenderOptions {
  panelSize: number;
  maxRow: number;
  maxColumn: number;
  marginWidth: number;
  marginHeight: number;
  noBackground: boolean;
  noFrame: boolean;
  titles: Array<string>;
  ranks: Array<string>;
}

type EnvGetter = (name: string) => string | undefined;

// Reads an integer in [min, max]. Anything else (non-numeric, fractional,
// out of range) falls back, since values like 0 columns or negative sizes
// break the layout math in Card.
function readInteger(
  get: EnvGetter,
  name: string,
  fallback: number,
  min: number,
  max: number,
  allowed: Array<number> = [],
): number {
  const value = get(name)?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (
    Number.isInteger(parsed) &&
    ((parsed >= min && parsed <= max) || allowed.includes(parsed))
  ) {
    return parsed;
  }
  console.warn(
    `Ignoring invalid ${name}="${value}"; using default ${fallback}.`,
  );
  return fallback;
}

function readBoolean(get: EnvGetter, name: string): boolean {
  return get(name)?.trim().toLowerCase() === "true";
}

function readList(get: EnvGetter, name: string): Array<string> {
  return (get(name) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

// Reads the TROPHY_* variables set by action.yml. Unset or invalid values
// fall back to the defaults the CLI has always used.
export function readRenderOptions(
  get: EnvGetter = (name) => Deno.env.get(name),
): RenderOptions {
  return {
    panelSize: readInteger(get, "TROPHY_PANEL_SIZE", 115, 1, 1000),
    maxRow: readInteger(get, "TROPHY_MAX_ROWS", 10, 1, 100),
    // -1 = auto (one row with every trophy)
    maxColumn: readInteger(get, "TROPHY_MAX_COLS", -1, 1, 100, [-1]),
    marginWidth: readInteger(get, "TROPHY_MARGIN_WIDTH", 10, 0, 500),
    marginHeight: readInteger(get, "TROPHY_MARGIN_HEIGHT", 10, 0, 500),
    noBackground: readBoolean(get, "TROPHY_NO_BG"),
    noFrame: readBoolean(get, "TROPHY_NO_FRAME"),
    titles: readList(get, "TROPHY_TITLE"),
    ranks: readList(get, "TROPHY_RANK"),
  };
}

// Directory that must exist before writing outputPath, or null when the file
// goes in the current directory (e.g. "trophy.svg").
export function outputDirectory(outputPath: string): string | null {
  const dir = posix.dirname(outputPath);
  return dir === "." ? null : dir;
}
