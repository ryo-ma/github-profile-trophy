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
    try {
      const data = await callback({ attempt: i });
      yield data;
      return;
    } catch (e) {
      yield null;
      console.error(e);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export class Retry {
  constructor(private maxRetries = 2, private retryDelay = 1000) {}
  async fetch<T = unknown>(
    callback: callbackType<T>,
  ) {
    for await (
      const callbackResult of createAsyncIterable<T>(
        callback,
        this.maxRetries,
        this.retryDelay,
      )
    ) {
      if (callbackResult) {
        return callbackResult as T;
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded.`);
  }
}
