import { assertEquals, assertRejects, soxa, stub } from "../../../deps.ts";
import { EServiceKindError, ServiceError } from "../../Types/index.ts";
import { requestGithubData } from "../request.ts";

Deno.test("requestGithubData sends query and variables as the POST body", async () => {
  const post = stub(soxa, "post", () => {
    return Promise.resolve({
      data: { data: { user: { login: "test" } } },
    });
  });

  try {
    await requestGithubData(
      "query { viewer { login } }",
      { username: "test" },
      "tok",
    );

    assertEquals(post.calls.length, 1);
    const [, data] = post.calls[0].args;
    // Regression check: soxa.post(url, data, config) uses the explicit
    // `data` argument over `config.data` when merging, so the actual
    // request body must be passed as the 2nd argument, not nested
    // inside the 3rd (config) argument.
    assertEquals(data, {
      query: "query { viewer { login } }",
      variables: { username: "test" },
    });
  } finally {
    post.restore();
  }
});

Deno.test("requestGithubData rejects partial GraphQL responses", async () => {
  const post = stub(soxa, "post", () => {
    return Promise.resolve({
      data: {
        data: { user: { login: "test" } },
        errors: [{ message: "Field access failed", type: "FORBIDDEN" }],
      },
    });
  });

  try {
    const error = await assertRejects(
      () => requestGithubData("query { viewer { login } }", {}),
      ServiceError,
      "Field access failed",
    ) as ServiceError;

    assertEquals(error.cause, EServiceKindError.UPSTREAM);
    assertEquals(error.code, 502);
  } finally {
    post.restore();
  }
});
