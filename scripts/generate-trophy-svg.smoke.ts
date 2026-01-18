import { run } from "./generate-trophy-svg.ts";

if (import.meta.main) {
  const code = await run(["--help"]);
  if (code !== 0) {
    console.error("Smoke test failed.");
    Deno.exit(code);
  }
  console.log("Smoke test passed.");
}
