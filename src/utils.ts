import { ServerRequest } from ".././deps.ts";

export function parseParams(req: ServerRequest): URLSearchParams {
  const splitedURL = req.url.split("?")
  if (splitedURL.length < 2){
    return new URLSearchParams();
  }
  return new URLSearchParams(splitedURL[1]);
}

export const CONSTANTS = {
  CACHE_MAX_AGE: 7200,
  DEFALT_PANEL_SIZE: 110,
  DEFALT_MAX_COLUMN: 6,
  DEFALT_MAX_ROW: 3,
};

export enum RANK {
  S = "S",
  A = "A",
  B = "B",
  C = "C",
  UNKNOWN = "?",

}