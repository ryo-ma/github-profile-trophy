import { COLORS } from "../theme.ts";
import { CONSTANTS, parseParams } from "../utils.ts";
import { getUrl } from "./utils.ts";

export function getResponseCacheKey(request: Request): string {
  const params = parseParams(request);
  const theme = params.getStringValue("theme", "default");
  const titles = params.getAll("title").flatMap((value) => value.split(","))
    .map((value) => value.trim());
  const ranks = params.getAll("rank").flatMap((value) => value.split(","))
    .map((value) => value.trim());

  return JSON.stringify({
    path: getUrl(request).pathname,
    username: params.get("username")?.toLowerCase() ?? null,
    row: params.getNumberValue("row", CONSTANTS.DEFAULT_MAX_ROW),
    column: params.getNumberValue("column", CONSTANTS.DEFAULT_MAX_COLUMN),
    theme: Object.hasOwn(COLORS, theme) ? theme : "default",
    marginWidth: params.getNumberValue("margin-w", CONSTANTS.DEFAULT_MARGIN_W),
    marginHeight: params.getNumberValue("margin-h", CONSTANTS.DEFAULT_MARGIN_H),
    noBackground: params.getBooleanValue(
      "no-bg",
      CONSTANTS.DEFAULT_NO_BACKGROUND,
    ),
    noFrame: params.getBooleanValue("no-frame", CONSTANTS.DEFAULT_NO_FRAME),
    titles,
    ranks,
  });
}
