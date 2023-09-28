export type RetryCallbackProps = {
  attempt: number;
}

export class Retry {
  constructor(private maxRetries = 2, private retryDelay = 1000) {}

  async fetch<T = unknown>(callback: (data: RetryCallbackProps) => Promise<T> | T) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const data = callback({ attempt });
          return data
        } catch {
            console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded.`);
  }
}