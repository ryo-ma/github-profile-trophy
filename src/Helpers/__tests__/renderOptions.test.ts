import { assertEquals } from "../../../deps.ts";
import { outputDirectory, readRenderOptions } from "../renderOptions.ts";

const envOf = (vars: Record<string, string>) => (name: string) => vars[name];

Deno.test("outputDirectory returns null for a bare filename", () => {
  // Regression: "trophy.svg" used to be treated as its own directory, so the
  // script created a folder named trophy.svg and then failed to write to it.
  assertEquals(outputDirectory("trophy.svg"), null);
  assertEquals(outputDirectory("./trophy.svg"), null);
});

Deno.test("outputDirectory returns the parent directory of a nested path", () => {
  assertEquals(outputDirectory("profile/trophy.svg"), "profile");
  assertEquals(outputDirectory("a/b/trophy.svg"), "a/b");
  assertEquals(outputDirectory("/tmp/trophy.svg"), "/tmp");
});

Deno.test("readRenderOptions uses defaults when nothing is set", () => {
  assertEquals(readRenderOptions(envOf({})), {
    panelSize: 115,
    maxRow: 10,
    maxColumn: -1,
    marginWidth: 10,
    marginHeight: 10,
    noBackground: false,
    noFrame: false,
    titles: [],
    ranks: [],
  });
});

Deno.test("readRenderOptions treats empty action inputs as unset", () => {
  const options = readRenderOptions(envOf({
    TROPHY_MAX_COLS: "",
    TROPHY_MARGIN_WIDTH: "  ",
    TROPHY_TITLE: "",
  }));
  assertEquals(options.maxColumn, -1);
  assertEquals(options.marginWidth, 10);
  assertEquals(options.titles, []);
});

Deno.test("readRenderOptions parses provided values", () => {
  const options = readRenderOptions(envOf({
    TROPHY_PANEL_SIZE: "100",
    TROPHY_MAX_ROWS: "2",
    TROPHY_MAX_COLS: "6",
    TROPHY_MARGIN_WIDTH: "5",
    TROPHY_MARGIN_HEIGHT: "0",
    TROPHY_NO_BG: "TRUE",
    TROPHY_NO_FRAME: "true",
    TROPHY_TITLE: "Stars, -Followers",
    TROPHY_RANK: "-C,-B,",
  }));
  assertEquals(options, {
    panelSize: 100,
    maxRow: 2,
    maxColumn: 6,
    marginWidth: 5,
    marginHeight: 0,
    noBackground: true,
    noFrame: true,
    titles: ["Stars", "-Followers"],
    ranks: ["-C", "-B"],
  });
});

Deno.test("readRenderOptions falls back on non-numeric values", () => {
  const options = readRenderOptions(envOf({
    TROPHY_MAX_COLS: "six",
    TROPHY_NO_BG: "yes",
  }));
  assertEquals(options.maxColumn, -1);
  assertEquals(options.noBackground, false);
});
