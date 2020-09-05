import { ServerRequest } from ".././deps.ts";


export class CustomURLSearchParams extends URLSearchParams {
  constructor(init?: string[][] | Record<string, string> | string | URLSearchParams,) {
    super(init);
  }
  getStringValue(key: string, defaultValue: string): string{
    let value: string = defaultValue;
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        return param.toString();
      }
    }
    return value.toString();
  }
  getNumberValue(key: string, defaultValue: number): number {
    let value: number = defaultValue;
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        return parseInt(param);
      }
    }
    return value;
  }
}

export function parseParams(req: ServerRequest): CustomURLSearchParams {
  const splitedURL = req.url.split("?");
  if (splitedURL.length < 2) {
    return new CustomURLSearchParams();
  }
  return new CustomURLSearchParams(splitedURL[1]);
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

export const CONSTANTS = {
  CACHE_MAX_AGE: 7200,
  DEFAULT_PANEL_SIZE: 110,
  DEFAULT_MAX_COLUMN: 6,
  DEFAULT_MAX_ROW: 3,
  DEFAULT_PADDING_W: 0,
  DEFAULT_PADDING_H: 0,
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

export const COLORS = {
  SECRET_RANK_1: "red",
  SECRET_RANK_2: "fuchsia",
  SECRET_RANK_3: "blue",
  SECRET_RANK_TEXT: "fuchsia",
  S_RANK_BASE: "#FAD200",
  S_RANK_SHADOW: "#C8A090",
  S_RANK_TEXT: "#886000",
  A_RANK_BASE: "#B0B0B0",
  A_RANK_SHADOW: "#9090C0",
  A_RAKN_TEXT: "#505050",
  B_RANK_BASE: "#A18D66",
  B_RANK_SHADOW: "#816D96",
  B_RANK_TEXT: "#412D06",
  DEFAULT_RANK_BASE: "#777",
  DEFAULT_RANK_SHADOW: "#333",
  DEFAULT_RANK_TEXT: "#333",
  NEXT_RANK_BAR: "#0366d6",
};

export const RANK_ORDER = Object.values(RANK);
