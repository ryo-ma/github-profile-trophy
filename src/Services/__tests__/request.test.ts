import { assertRejects, soxa, stub } from "../../../deps.ts";
import { ServiceError } from "../../Types/index.ts";
import { requestGithubData } from "../request.ts";

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
    await assertRejects(
      () => requestGithubData("query { viewer { login } }", {}),
      ServiceError,
      "Field access failed",
    );
  } finally {
    post.restore();
  }
});
