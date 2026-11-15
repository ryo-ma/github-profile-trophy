import { assertEquals, assertRejects } from "../../deps.ts";
import {
  deploymentBudget,
  trustedClientAddress,
} from "../security/deployment.ts";

Deno.test("Only trusted hosting or socket metadata supplies client identity", () => {
  const request = new Request("https://example.invalid/", {
    headers: { "x-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2" },
  });
  assertEquals(trustedClientAddress(request, false), undefined);
  assertEquals(trustedClientAddress(request, true), "198.51.100.1");
  assertEquals(trustedClientAddress(request, false, "192.0.2.1"), "192.0.2.1");
  assertEquals(trustedClientAddress(request, true, "192.0.2.1"), "192.0.2.1");
  const malformed = new Request("https://example.invalid/", {
    headers: { "x-forwarded-for": "198.51.100.1, 192.0.2.1" },
  });
  assertEquals(trustedClientAddress(malformed, true), undefined);
});

Deno.test("Public deployments require a configured shared request budget", async () => {
  const production = deploymentBudget((name) =>
    name === "VERCEL" ? "1" : undefined
  );
  await assertRejects(() => production("192.0.2.1"));
  const required = deploymentBudget((name) =>
    name === "REQUIRE_SHARED_RATE_LIMIT" ? "true" : undefined
  );
  await assertRejects(() => required());
  const local = deploymentBudget(() => undefined);
  assertEquals((await local()).allowed, true);
  const hosted = deploymentBudget(() => undefined, true);
  await assertRejects(() => hosted());
});

Deno.test("Incomplete or insecure shared-counter settings fail closed", async () => {
  for (
    const settings of [
      { RATE_LIMIT_REDIS_URL: "https://redis.example" },
      { RATE_LIMIT_REDIS_TOKEN: "example-token" },
      {
        RATE_LIMIT_REDIS_URL: "http://redis.example",
        RATE_LIMIT_REDIS_TOKEN: "example-token",
      },
    ]
  ) {
    const budget = deploymentBudget((name) =>
      settings[name as keyof typeof settings]
    );
    await assertRejects(() => budget());
  }
});

Deno.test("A GitHub token cannot accidentally be forwarded as a Redis credential", async () => {
  for (
    const token of ["github_pat_example", "ghp_example", "legacy-same-token"]
  ) {
    const settings: Record<string, string> = {
      RATE_LIMIT_REDIS_URL: "https://redis.example",
      RATE_LIMIT_REDIS_TOKEN: token,
      GITHUB_TOKEN1: "legacy-same-token",
    };
    await assertRejects(() => deploymentBudget((name) => settings[name])());
  }
});
