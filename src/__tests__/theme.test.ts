import { assertEquals } from "../../deps.ts";
import { COLORS } from "../theme.ts";

Deno.test("Theme aliases match corresponding base themes", () => {
  assertEquals(COLORS["one-dark"], COLORS.onedark);
  assertEquals(COLORS["one_dark"], COLORS.onedark);
  assertEquals(COLORS["tokyo-night"], COLORS.tokyonight);
  assertEquals(COLORS["tokyo_night"], COLORS.tokyonight);
  assertEquals(COLORS["dark-dimmed"], COLORS.dark_dimmed);
  assertEquals(COLORS["dark-lover"], COLORS.dark_lover);
  assertEquals(COLORS["kimbie-dark"], COLORS.kimbie_dark);
  assertEquals(COLORS["juicy-fresh"], COLORS.juicyfresh);
  assertEquals(COLORS["git-dimmed"], COLORS.gitdimmed);
});
