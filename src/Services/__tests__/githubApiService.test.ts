import { GithubApiService } from "../GithubApiService.ts";
import { assertEquals, stub } from "../../../deps.ts";
import { GitHubUserRepository } from "../../user_info.ts";
import { ServiceError } from "../../Types/index.ts";

Deno.test("Repository service preserves a checked public repository", async () => {
  const mock = stub(globalThis, "fetch", () =>
    Promise.resolve(Response.json({
      data: {
        user: {
          repositories: {
            nodes: [{
              id: "public-repository",
              visibility: "PUBLIC",
              isPrivate: false,
              languages: { nodes: [{ name: "TypeScript" }] },
              stargazers: { totalCount: 23 },
              createdAt: "2020-01-01T00:00:00Z",
            }],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    })));
  try {
    const data = await new GithubApiService(["test-token"])
      .requestUserRepository("test") as GitHubUserRepository;
    assertEquals(data.repositories.totalCount, 1);
    assertEquals(data.repositories.nodes[0].stargazers.totalCount, 23);
  } finally {
    mock.restore();
  }
});

for (
  const [type, code] of [["NOT_FOUND", 404], ["RATE_LIMITED", 429]] as const
) {
  Deno.test(`Repository service preserves ${type} errors`, async () => {
    const mock = stub(globalThis, "fetch", () =>
      Promise.resolve(
        Response.json({ errors: [{ type, message: "Upstream detail" }] }),
      ));
    try {
      const result = await new GithubApiService(["test-token"])
        .requestUserRepository("test");
      assertEquals(result instanceof ServiceError, true);
      assertEquals((result as ServiceError).code, code);
      assertEquals(
        (result as ServiceError).message.includes("Upstream detail"),
        false,
      );
    } finally {
      mock.restore();
    }
  });
}
