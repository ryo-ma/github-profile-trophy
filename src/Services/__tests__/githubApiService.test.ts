import { GithubApiService } from "../GithubApiService.ts";
import { assertEquals, returnsNext, soxa, stub } from "../../../deps.ts";
import { GitHubUserRepository } from "../../user_info.ts";

const rateLimitMock = await import("../__mocks__/rateLimitMock.json", {
  with: { type: "json" },
});

const successGithubResponseMock = await import(
  "../__mocks__/successGithubResponse.json",
  { with: { type: "json" } }
);

const notFoundGithubResponseMock = await import(
  "../__mocks__/notFoundUserMock.json",
  { with: { type: "json" } }
);

import { ServiceError } from "../../Types/index.ts";

// Unfortunatelly, The spy is a global instance
// We can't reset mock as Jest does.
stub(
  soxa,
  "post",
  returnsNext([
    // Should get data in first try
    new Promise((resolve) => {
      resolve(successGithubResponseMock.default);
    }),
    // // Should get data in second Retry
    new Promise((resolve) => {
      resolve(rateLimitMock.default.rate_limit);
    }),
    new Promise((resolve) => {
      resolve(successGithubResponseMock.default);
    }),
    // Should throw NOT FOUND
    new Promise((resolve) => {
      resolve(notFoundGithubResponseMock.default);
    }),
    new Promise((resolve) => {
      resolve(notFoundGithubResponseMock.default);
    }),
    // Should throw NOT FOUND even if request the user only
    new Promise((resolve) => {
      resolve(notFoundGithubResponseMock.default);
    }),
    new Promise((resolve) => {
      resolve(notFoundGithubResponseMock.default);
    }),
    // Should throw RATE LIMIT
    new Promise((resolve) => {
      resolve(rateLimitMock.default.rate_limit);
    }),
    new Promise((resolve) => {
      resolve(rateLimitMock.default.rate_limit);
    }),
    // Should throw RATE LIMIT Exceed
    new Promise((resolve) => {
      resolve(rateLimitMock.default.rate_limit);
    }),
    new Promise((resolve) => {
      resolve(rateLimitMock.default.exceeded);
    }),
  ]),
);

Deno.test("Should get data in first try", async () => {
  const provider = new GithubApiService();

  const data = await provider.requestUserRepository(
    "test",
  ) as GitHubUserRepository;

  assertEquals(data.repositories.totalCount, 128);
});

Deno.test("Should get data in second Retry", async () => {
  const provider = new GithubApiService();

  const data = await provider.requestUserRepository(
    "test",
  ) as GitHubUserRepository;

  assertEquals(data.repositories.totalCount, 128);
});

Deno.test("Should throw NOT FOUND", async () => {
  const provider = new GithubApiService();
  let error = null;

  try {
    error = await provider.requestUserInfo("test");
  } catch (e) {
    error = e;
  }

  assertEquals(error.code, 404);
  assertEquals(error instanceof ServiceError, true);
});
Deno.test("Should throw NOT FOUND even if request the user only", async () => {
  const provider = new GithubApiService();
  let error = null;

  try {
    error = await provider.requestUserRepository("test");
  } catch (e) {
    error = e;
  }

  assertEquals(error.code, 404);
  assertEquals(error instanceof ServiceError, true);
});

// The assertRejects() assertion is a little more complicated
// mainly because it deals with Promises.
// https://docs.deno.com/runtime/manual/basics/testing/assertions#throws
Deno.test("Should throw RATE LIMIT", async () => {
  const provider = new GithubApiService();
  let error = null;

  try {
    error = await provider.requestUserRepository("test");
  } catch (e) {
    error = e;
  }

  assertEquals(error.code, 419);
  assertEquals(error instanceof ServiceError, true);
});

Deno.test("Should throw RATE LIMIT Exceed", async () => {
  const provider = new GithubApiService();
  let error = null;

  try {
    error = await provider.requestUserRepository("test");
  } catch (e) {
    error = e;
  }

  assertEquals(error.code, 419);
  assertEquals(error instanceof ServiceError, true);
});
