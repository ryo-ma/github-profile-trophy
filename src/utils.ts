import { ServerRequest } from ".././deps.ts";

export function parseParams(req: ServerRequest): URLSearchParams {
  const splitedURL = req.url.split("?")
  if (splitedURL.length < 2){
    return new URLSearchParams();
  }
  return new URLSearchParams(splitedURL[1]);
}