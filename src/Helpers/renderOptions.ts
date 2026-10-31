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

function readNumber(get: EnvGetter, name: string, fallback: number): number {
  const value = get(name)?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    panelSize: readNumber(get, "TROPHY_PANEL_SIZE", 115),
    maxRow: readNumber(get, "TROPHY_MAX_ROWS", 10),
    maxColumn: readNumber(get, "TROPHY_MAX_COLS", -1), // -1 = auto
    marginWidth: readNumber(get, "TROPHY_MARGIN_WIDTH", 10),
    marginHeight: readNumber(get, "TROPHY_MARGIN_HEIGHT", 10),
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
