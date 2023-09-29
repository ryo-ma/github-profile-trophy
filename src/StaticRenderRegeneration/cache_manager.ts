import { Logger } from "../Helpers/Logger.ts";
import { existsSync } from "./utils.ts";

export class CacheManager {
  constructor(private revalidateTime: number, private cacheFile: string) {}

  // Reason to use /tmp/:
  // https://github.com/orgs/vercel/discussions/314
  get cacheFilePath(): string {
    return `/tmp/${this.cacheFile}`;
  }
  get cacheFileExists(): boolean {
    return existsSync(this.cacheFilePath);
  }

  get cacheFileLastModified(): Date | null {
    if (!this.cacheFileExists) {
      return null;
    }
    const fileInfo = Deno.statSync(this.cacheFilePath);
    return fileInfo.mtime ?? null;
  }

  get cacheFileLastModifiedGetTime(): number | null {
    const lastModified = this.cacheFileLastModified;
    if (lastModified === null) {
      return null;
    }
    return lastModified.getTime();
  }

  get isCacheValid(): boolean {
    if (this.cacheFileLastModifiedGetTime === null) {
      return false;
    }
    const currentTime = new Date().getTime();
    return currentTime - this.cacheFileLastModifiedGetTime <
      this.revalidateTime;
  }

  async save(response: Response): Promise<void> {
    if (response === null) return;
    // Prevent TypeError: ReadableStream is locked
    const text = await response.clone().text();
    const data = new TextEncoder().encode(text);

    Deno.writeFile(this.cacheFilePath, data, { create: true }).catch(() => {
      Logger.warn("Failed to save cache file");
    });
  }
}
