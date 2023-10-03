import { ServiceError } from "../Types/index.ts";
import { Logger } from "./Logger.ts";

export type RetryCallbackProps = {
  attempt: number;
};

type callbackType<T = unknown> = (data: RetryCallbackProps) => Promise<T> | T;

async function* createAsyncIterable<T>(
  callback: callbackType<T>,
  retries: number,
  delay: number,
) {
  for (let i = 0; i < retries; i++) {
    const isLastAttempt = i === retries - 1;
    try {
      const data = await callback({ attempt: i });
      yield data;
      return;
    } catch (e) {
      if (e instanceof ServiceError && isLastAttempt) {
        yield e;
        return;
      }

      yield null;
      Logger.error(e);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export class Retry {
  constructor(private maxRetries = 2, private retryDelay = 1000) {}
  async fetch<T = unknown>(
    callback: callbackType<T>,
  ) {
    let lastError = null;
    for await (
      const callbackResult of createAsyncIterable<T>(
        callback,
        this.maxRetries,
        this.retryDelay,
      )
    ) {
      const isError = callbackResult instanceof Error;

      if (callbackResult && !isError) {
        return callbackResult as T;
      }

      if (isError) {
        lastError = callbackResult;
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded.`, {
      cause: lastError,
    });
  }
}
