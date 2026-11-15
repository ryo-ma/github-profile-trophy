import { assertEquals } from "../../deps.ts";
import { TotalStarTrophy } from "../trophy.ts";
import { COLORS } from "../theme.ts";
import { renderBlueTrophy } from "../blue_trophy.ts";
import { RANK } from "../utils.ts";

Deno.test("Tokyo Night shows full ranks and progress without animation", () => {
  // 150 stars is halfway between AAA (100) and S (200).
  const svg = new TotalStarTrophy(150).render(COLORS.tokyonight);
  assertEquals(svg.includes(">AAA</text>"), true);
  assertEquals(svg.includes("Stars: AAA, Super Star, 150pt"), true);
  assertEquals(
    /width="39"[^>]*fill="url\(#blue-Stars-0-0-progress\)"/.test(svg),
    true,
  );
});

Deno.test("Tokyo Night respects transparent background and hidden frame", () => {
  const svg = new TotalStarTrophy(150).render(
    COLORS.tokyonight,
    0,
    0,
    110,
    true,
    true,
  );
  assertEquals(svg.includes('fill="url(#blue-Stars-0-0-surface)"'), false);
  assertEquals(svg.includes('fill="url(#blue-Stars-0-0-ambient)"'), false);
  assertEquals(svg.includes(`stroke="${COLORS.tokyonight.FRAME}"`), false);
  assertEquals(svg.includes('d="M15 1.5h24"'), false);
  assertEquals(svg.includes(">AAA</text>"), true);
});

Deno.test("Repeated Tokyo Night trophies have distinct SVG identifiers", () => {
  const trophy = new TotalStarTrophy(150);
  const svg = trophy.render(COLORS.tokyonight, 0, 0) +
    trophy.render(COLORS.tokyonight, 120, 0);
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assertEquals(ids.length > 0, true);
  assertEquals(new Set(ids).size, ids.length);
});

Deno.test("Tokyo Night gradient identifiers support labels with spaces", () => {
  const svg = renderBlueTrophy(COLORS.tokyonight, {
    title: "Rank SECRET",
    rank: RANK.SECRET,
    message: "Secret trophy",
    score: "13pt",
    progress: 1,
  }, { x: 0, y: 0, panelSize: 110, noBackground: false, noFrame: false });
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assertEquals(ids.every((id) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(id)), true);
  for (const match of svg.matchAll(/url\(#([^)]+)\)/g)) {
    assertEquals(ids.includes(match[1]), true);
  }
});
