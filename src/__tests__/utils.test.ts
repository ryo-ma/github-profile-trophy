import { assertEquals } from "../../deps.ts";
import { abridgeScore, CustomURLSearchParams, parseParams } from "../utils.ts";

Deno.test("abridgeScore returns 0pt for zero and fractional scores below 1", () => {
  assertEquals(abridgeScore(0), "0pt");
  assertEquals(abridgeScore(0.5), "0pt");
  assertEquals(abridgeScore(-0.5), "0pt");
});

Deno.test("abridgeScore keeps scores up to 999 in points", () => {
  assertEquals(abridgeScore(1), "1pt");
  assertEquals(abridgeScore(500), "500pt");
  assertEquals(abridgeScore(999), "999pt");
  assertEquals(abridgeScore(-42), "-42pt");
});

Deno.test("abridgeScore abridges scores above 999 to kpt with one decimal", () => {
  assertEquals(abridgeScore(1000), "1.0kpt");
  assertEquals(abridgeScore(1500), "1.5kpt");
  assertEquals(abridgeScore(12345), "12.3kpt");
  assertEquals(abridgeScore(-2500), "-2.5kpt");
});

Deno.test("CustomURLSearchParams getStringValue returns value or default", () => {
  const params = new CustomURLSearchParams("theme=dark&empty=");
  assertEquals(params.getStringValue("theme", "light"), "dark");
  assertEquals(params.getStringValue("missing", "light"), "light");
  assertEquals(params.getStringValue("empty", "default"), "");
});

Deno.test("CustomURLSearchParams getNumberValue parses integers or falls back", () => {
  const params = new CustomURLSearchParams("column=4&bad=abc&negative=-2");
  assertEquals(params.getNumberValue("column", 8), 4);
  assertEquals(params.getNumberValue("bad", 8), 8);
  assertEquals(params.getNumberValue("missing", 8), 8);
  assertEquals(params.getNumberValue("negative", 8), -2);
});

Deno.test("CustomURLSearchParams getBooleanValue is true only for 'true'", () => {
  const params = new CustomURLSearchParams("a=true&b=false&c=1");
  assertEquals(params.getBooleanValue("a", false), true);
  assertEquals(params.getBooleanValue("b", true), false);
  assertEquals(params.getBooleanValue("c", true), false);
  assertEquals(params.getBooleanValue("missing", true), true);
});

Deno.test("parseParams returns empty params when the URL has no query string", () => {
  const params = parseParams(new Request("https://example.com/api"));
  assertEquals(params.getStringValue("theme", "light"), "light");
});

Deno.test("parseParams parses the query string of a request URL", () => {
  const params = parseParams(
    new Request("https://example.com/api?username=ryo-ma&column=3"),
  );
  assertEquals(params.getStringValue("username", ""), "ryo-ma");
  assertEquals(params.getNumberValue("column", 8), 3);
});
