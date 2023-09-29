import { Soxa as ServiceProvider } from "https://deno.land/x/soxa@1.4/src/core/Soxa.ts";
import { defaults } from "https://deno.land/x/soxa@1.4/src/defaults.ts";
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.203.0/assert/mod.ts";
import {
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.203.0/testing/mock.ts";

const api = new Map([
  ["github", Deno.env.get("GITHUB_API")],
  ["azure", Deno.env.get("AZURE_API_URL")],
]);

const DEFAULT_PROVIDER = Deno.env.get("provider") ?? "github";

const baseURL = api.get(DEFAULT_PROVIDER);

const soxa = new ServiceProvider({
  ...defaults,
  baseURL,
});

export { assertEquals, assertRejects, assertSpyCalls, soxa, spy };
