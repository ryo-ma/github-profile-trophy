export class CustomURLSearchParams extends URLSearchParams {
  getStringValue(key: string, defaultValue: string): string {
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        return param.toString();
      }
    }
    return defaultValue.toString();
  }
  getNumberValue(key: string, defaultValue: number): number {
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        const parsedValue = parseInt(param);
        if (isNaN(parsedValue)) {
          return defaultValue;
        }
        return parsedValue;
      }
    }
    return defaultValue;
  }
  getBooleanValue(key: string, defaultValue: boolean): boolean {
    if (super.has(key)) {
      const param = super.get(key);
      return param !== null && param.toString() === "true";
    }
    return defaultValue;
  }
}

export function parseParams(req: Request): CustomURLSearchParams {
  const splittedURL = req.url.split("?");
  if (splittedURL.length < 2) {
    return new CustomURLSearchParams();
  }
  return new CustomURLSearchParams(splittedURL[1]);
}

export function abridgeScore(score: number): string {
  if (Math.abs(score) < 1) {
    return "0pt";
  }
  if (Math.abs(score) > 999) {
    return (Math.sign(score) * (Math.abs(score) / 1000)).toFixed(1) + "kpt";
  }
  return (Math.sign(score) * Math.abs(score)).toString() + "pt";
}

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

export const CONSTANTS = {
  CACHE_MAX_AGE: 18800,
  DEFAULT_PANEL_SIZE: 110,
  DEFAULT_MAX_COLUMN: 8,
  DEFAULT_MAX_ROW: 3,
  DEFAULT_MARGIN_W: 0,
  DEFAULT_MARGIN_H: 0,
  DEFAULT_NO_BACKGROUND: false,
  DEFAULT_NO_FRAME: false,
  DEFAULT_GITHUB_API: "https://api.github.com/graphql",
  DEFAULT_GITHUB_RETRY_DELAY: 1000,
  REVALIDATE_TIME: HOUR_IN_MILLISECONDS,
  REDIS_TTL: HOUR_IN_MILLISECONDS * 4,
};

export enum RANK {
  SECRET = "SECRET",
  SSS = "SSS",
  SS = "SS",
  S = "S",
  AAA = "AAA",
  AA = "AA",
  A = "A",
  B = "B",
  C = "C",
  UNKNOWN = "?",
}

export const RANK_ORDER = Object.values(RANK);
