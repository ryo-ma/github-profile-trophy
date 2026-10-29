import { Soxa as ServiceProvider } from "@soxa";
import { defaults } from "@soxa/defaults";
import { assertEquals, assertRejects } from "@std/assert";
import { assertSpyCalls, returnsNext, spy, stub } from "@std/testing/mock";

export { type Bulk, connect, type Redis } from "@redis";

import { CONSTANTS } from "./src/utils.ts";

const baseURL = Deno.env.get("GITHUB_API") || CONSTANTS.DEFAULT_GITHUB_API;

const soxa = new ServiceProvider({
  ...defaults,
  baseURL,
});

export {
  assertEquals,
  assertRejects,
  assertSpyCalls,
  returnsNext,
  soxa,
  spy,
  stub,
};
