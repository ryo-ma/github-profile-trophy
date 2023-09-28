
import { assertRejects, assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";
import { Retry } from "../Retry.ts";
import {
  spy,
  assertSpyCalls,
} from "https://deno.land/std@0.203.0/testing/mock.ts";

type MockResponse = {
    value: number;
}


Deno.test("Retry.fetch", () => {
    const retryInstance = new Retry();
    const callback = spy(retryInstance, "fetch");
    
    retryInstance.fetch<MockResponse>(() => {
        return { value: 1 };
    })
    
    assertSpyCalls(callback, 1);
})

Deno.test("Should retry", async () => {
    let countErrors = 0;

    const callbackError = () => {
        countErrors++;
        throw new Error("Panic! Threw Error");
    }
    const retries = 3;
    const retryInstance = new Retry(retries);
    
    await assertRejects(
        () => {
          return retryInstance.fetch<MockResponse>(callbackError);
        },
        Error,
        `Max retries (${retries}) exceeded.`,
    );

    assertEquals(countErrors, 3);
})