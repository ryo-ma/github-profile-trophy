import { ServerRequest } from ".././deps.ts";

export function parseParams(req: ServerRequest): URLSearchParams {
  const splitedURL = req.url.split("?")
  if (splitedURL.length < 2){
    return new URLSearchParams();
  }
  return new URLSearchParams(splitedURL[1]);
}

export function abridgeScore(score: number): string {
  if (score < 1) {
    return "unknown";
  }
  if (score < 10) {
    return score.toString() + "+"
  }
  if (Math.abs(score) > 999){
    return (Math.sign(score) * (Math.abs(score) / 1000)).toFixed(1) + "k+"

  }
  return (Math.sign(score) * Math.abs(score)).toString().slice(0, -1) + "0+";

}

export const CONSTANTS = {
  CACHE_MAX_AGE: 7200,
  DEFALT_PANEL_SIZE: 110,
  DEFALT_MAX_COLUMN: 6,
  DEFALT_MAX_ROW: 3,
};

export enum RANK {
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