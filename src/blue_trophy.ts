import { Theme } from "./theme.ts";
import { RANK } from "./utils.ts";

type TrophyDetails = {
  title: string;
  rank: RANK;
  message: string;
  score: string;
  progress: number;
};

type TrophyOptions = {
  x: number;
  y: number;
  panelSize: number;
  noBackground: boolean;
  noFrame: boolean;
};

/** Compact, blue-only rendering for the custom Tokyo Night theme. */
export function renderBlueTrophy(
  theme: Theme,
  details: TrophyDetails,
  options: TrophyOptions,
): string {
  const { title, rank, message, score, progress } = details;
  const { x, y, panelSize, noBackground, noFrame } = options;
  const id = `blue-${title.replace(/[^a-zA-Z0-9_-]/g, "-")}-${x}-${y}`;
  const isSecret = rank === RANK.SECRET;
  const isSuper = !isSecret && rank.startsWith("S");
  const isAdvanced = rank.startsWith("A");
  const base = isSecret
    ? theme.SECRET_RANK_2
    : isSuper
    ? theme.S_RANK_BASE
    : isAdvanced
    ? theme.A_RANK_BASE
    : rank === RANK.B
    ? theme.B_RANK_BASE
    : theme.DEFAULT_RANK_BASE;
  const shadow = isSecret
    ? theme.SECRET_RANK_3
    : isSuper
    ? theme.S_RANK_SHADOW
    : isAdvanced
    ? theme.A_RANK_SHADOW
    : rank === RANK.B
    ? theme.B_RANK_SHADOW
    : theme.DEFAULT_RANK_SHADOW;
  const highlight = isSecret ? theme.SECRET_RANK_1 : theme.ICON_CIRCLE;
  const rankText = isSecret
    ? theme.SECRET_RANK_TEXT
    : isSuper
    ? theme.S_RANK_TEXT
    : isAdvanced
    ? theme.A_RANK_TEXT
    : rank === RANK.B
    ? theme.B_RANK_TEXT
    : theme.DEFAULT_RANK_TEXT;
  const percentage = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0;
  const laurels = isSuper || isAdvanced
    ? `<g fill="none" stroke="${theme.LAUREL}" stroke-width="1.2" stroke-linecap="round" opacity="0.75">
        <path d="M36 65C25 58 22 45 28 32M74 65C85 58 88 45 82 32"/>
        <path d="M31 60l-7-1m4-5-6-3m4-4-5-5m5-2-3-6m56 26 7-1m-4-5 6-3m-4-4 5-5m-5-2 3-6"/>
      </g>`
    : "";
  const rankMark = isSecret
    ? `<path d="m55 35 5 7-5 8-5-8z" fill="${rankText}"/>
       <path d="m28 25 1.3 3.7L33 30l-3.7 1.3L28 35l-1.3-3.7L23 30l3.7-1.3zM81 34l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="${theme.TITLE}" opacity="0.8"/>`
    : `<text x="55" y="46" text-anchor="middle" font-size="${
      rank.length > 2 ? 8.5 : rank.length > 1 ? 10 : 13
    }" font-weight="800" fill="${rankText}">${rank}</text>`;

  return `<svg x="${x}" y="${y}" width="${panelSize}" height="${panelSize}" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title">
    <title id="${id}-title">${title}: ${rank}, ${message}, ${score}</title>
    <defs>
      <linearGradient id="${id}-surface" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
        <stop stop-color="#101f32"/><stop offset="1" stop-color="${theme.BACKGROUND}"/>
      </linearGradient>
      <radialGradient id="${id}-ambient" cx="55" cy="42" r="47" gradientUnits="userSpaceOnUse">
        <stop stop-color="${base}" stop-opacity="0.12"/><stop offset="1" stop-color="${base}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id}-metal" x1="36" y1="29" x2="74" y2="66" gradientUnits="userSpaceOnUse">
        <stop stop-color="${highlight}"/><stop offset="0.35" stop-color="${base}"/><stop offset="1" stop-color="${shadow}"/>
      </linearGradient>
      <linearGradient id="${id}-progress" x1="16" y1="0" x2="94" y2="0" gradientUnits="userSpaceOnUse">
        <stop stop-color="${shadow}"/><stop offset="1" stop-color="${theme.NEXT_RANK_BAR}"/>
      </linearGradient>
    </defs>
    ${
    noBackground
      ? ""
      : `<rect x="1" y="1" width="108" height="108" rx="9" fill="url(#${id}-surface)"/>
         <rect x="2" y="2" width="106" height="106" rx="8" fill="url(#${id}-ambient)"/>`
  }
    ${
    noFrame
      ? ""
      : `<rect x="1" y="1" width="108" height="108" rx="9" stroke="${
        theme.FRAME ?? theme.DEFAULT_RANK_SHADOW
      }"/>
         <path d="M15 1.5h24" stroke="${theme.TITLE}" stroke-opacity="0.65" stroke-linecap="round"/>`
  }
    <g font-family="Segoe UI,Helvetica,Arial,sans-serif">
      <text x="55" y="17" text-anchor="middle" font-size="10.8" font-weight="700" fill="${theme.TITLE}">${title}</text>
      ${laurels}
      <ellipse cx="55" cy="71" rx="17" ry="2" fill="${base}" opacity="0.1"/>
      <g stroke="url(#${id}-metal)" stroke-width="2.8" stroke-linejoin="round">
        <path d="M39 34h-7c-8 0-5 15 11 16M71 34h7c8 0 5 15-11 16"/>
      </g>
      <g fill="url(#${id}-metal)">
        <path d="M38 29h34l-3 16c-1.6 8-6 13-14 13s-12.4-5-14-13z"/>
        <path d="M52 56h6v9h-6z"/>
        <path d="M47 64h16l4 5H43z"/>
        <rect x="41" y="69" width="28" height="3" rx="1.5"/>
      </g>
      <path d="M42 31h26" stroke="${highlight}" stroke-opacity="0.75" stroke-linecap="round"/>
      <circle cx="55" cy="42" r="10.3" fill="#071c2e" stroke="${highlight}" stroke-opacity="0.32" stroke-width="0.8"/>
      ${rankMark}
      <text x="55" y="83" text-anchor="middle" font-size="8.1" font-weight="500" fill="${theme.TEXT}">${message}</text>
      <text x="55" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="${theme.ICON_CIRCLE}">${score}</text>
    </g>
    <rect x="16" y="102" width="78" height="2.5" rx="1.25" fill="${theme.NEXT_RANK_BAR}" opacity="0.14"/>
    <rect x="16" y="102" width="${
    78 * percentage
  }" height="2.5" rx="1.25" fill="url(#${id}-progress)"/>
  </svg>`;
}
