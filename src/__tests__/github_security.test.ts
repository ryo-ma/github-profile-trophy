import { assertEquals, assertRejects, stub } from "../../deps.ts";
import { githubJson, verifyTokenOwners } from "../security/github.ts";
import { GithubApiService } from "../Services/GithubApiService.ts";
import { EServiceKindError, ServiceError } from "../Types/index.ts";

Deno.test("All configured tokens must authenticate as the personal owner", async () => {
  const called: string[] = [];
  const mock = stub(globalThis, "fetch", (_input, init) => {
    const headers = new Headers(init?.headers);
    called.push(headers.get("Authorization") ?? "");
    assertEquals(init?.redirect, "error");
    return Promise.resolve(
      new Response(
        JSON.stringify({
          login: called.length === 1 ? "BaranaNadil" : "another-user",
        }),
      ),
    );
  });
  try {
    await verifyTokenOwners(["owner-token"]);
    await assertRejects(
      () => verifyTokenOwners(["other-user-token"]),
      ServiceError,
    );
    assertEquals(called, ["Bearer owner-token", "Bearer other-user-token"]);
  } finally {
    mock.restore();
  }
});

Deno.test("A secondary token for another account fails closed", async () => {
  const mock = stub(
    globalThis,
    "fetch",
    (_input, init) =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            login: new Headers(init?.headers).get("Authorization") ===
                "Bearer owner-token"
              ? "BaranaNadil"
              : "another-user",
          }),
        ),
      ),
  );
  try {
    await assertRejects(
      () => verifyTokenOwners(["owner-token", "other-token"]),
      ServiceError,
    );
  } finally {
    mock.restore();
  }
});

Deno.test("GitHub timeout aborts an actual pending fetch", async () => {
  let signal: AbortSignal | undefined;
  const hanging: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      signal = init?.signal ?? undefined;
      signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });
  await assertRejects(
    () =>
      githubJson("https://api.github.com/user", "test-token", {}, hanging, 5),
    ServiceError,
  );
  assertEquals(signal?.aborted, true);
});

Deno.test("GitHub timeout also covers a stalled response body", async () => {
  let signal: AbortSignal | undefined;
  const hanging: typeof fetch = (_input, init) => {
    signal = init?.signal ?? undefined;
    return Promise.resolve(
      new Response(
        new ReadableStream({
          start(controller) {
            signal?.addEventListener(
              "abort",
              () => controller.error(new DOMException("Aborted", "AbortError")),
              {
                once: true,
              },
            );
          },
        }),
      ),
    );
  };
  await assertRejects(
    () =>
      githubJson("https://api.github.com/user", "test-token", {}, hanging, 5),
    ServiceError,
  );
  assertEquals(signal?.aborted, true);
});

Deno.test("No server token causes no GitHub calls and rate-limit errors are preserved", async () => {
  const mock = stub(globalThis, "fetch", () => {
    throw new Error("Must not fetch without tokens");
  });
  try {
    const missing = await new GithubApiService([]).requestUserInfo(
      "BaranaNadil",
    );
    assertEquals(missing instanceof ServiceError, true);
    assertEquals((missing as ServiceError).code, 503);
  } finally {
    mock.restore();
  }
  const provider = new GithubApiService(["test-token"]);
  const rate = new ServiceError("Rate limited", EServiceKindError.RATE_LIMIT);
  provider.requestUserRepository = () => Promise.resolve(rate);
  provider.requestUserActivity = () => Promise.resolve(rate);
  provider.requestUserIssue = () => Promise.resolve(rate);
  provider.requestUserPullRequest = () => Promise.resolve(rate);
  assertEquals(await provider.requestUserInfo("BaranaNadil"), rate);
  assertEquals(rate.code, 429);
});
