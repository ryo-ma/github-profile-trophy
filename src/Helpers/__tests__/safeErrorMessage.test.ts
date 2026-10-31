import { assertEquals } from "../../../deps.ts";
import { safeErrorMessage } from "../safeErrorMessage.ts";

Deno.test("safeErrorMessage extracts only the message from an Error", () => {
  const error = new Error("boom");
  assertEquals(safeErrorMessage(error), "boom");
});

Deno.test("safeErrorMessage never surfaces extra properties attached to an Error", () => {
  // soxa attaches the full request config (including the Authorization
  // header) onto thrown errors. safeErrorMessage must only ever return
  // .message, never those extra properties.
  const error = new Error("request failed") as Error & { config: unknown };
  error.config = {
    headers: { Authorization: "bearer super-secret-token" },
  };

  const message = safeErrorMessage(error);

  assertEquals(message, "request failed");
  assertEquals(message.includes("super-secret-token"), false);
});

Deno.test("safeErrorMessage stringifies non-Error values", () => {
  assertEquals(safeErrorMessage("plain string"), "plain string");
  assertEquals(safeErrorMessage(null), "null");
});
