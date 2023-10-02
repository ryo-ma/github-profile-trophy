import { Bulk, connect, Redis } from "../../deps.ts";
import { Logger } from "../Helpers/Logger.ts";
import { CONSTANTS } from "../utils.ts";

const enableCache = Deno.env.get("ENABLE_REDIS") || false;

// https://developer.redis.com/develop/deno/
class CacheProvider {
  private static instance: CacheProvider;
  public client: Redis | null = null;

  private constructor() {}

  static getInstance(): CacheProvider {
    if (!CacheProvider.instance) {
      CacheProvider.instance = new CacheProvider();
    }
    return CacheProvider.instance;
  }

  async connect(): Promise<void> {
    if (!enableCache) return;
    this.client = await connect({
      hostname: Deno.env.get("REDIS_HOST") || "",
      port: Number(Deno.env.get("REDIS_PORT")) || 6379,
      username: Deno.env.get("REDIS_USERNAME") || "",
      password: Deno.env.get("REDIS_PASSWORD") || "",
    });
  }

  async get(key: string): Promise<Bulk | undefined> {
    if (!enableCache) return undefined;

    try {
      if (!this.client) {
        await this.connect();
      }

      return await this.client?.get(key);
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!enableCache) return;

    try {
      if (!this.client) {
        await this.connect();
      }
      await this.client?.set(key, value, {
        px: CONSTANTS.REDIS_TTL,
      });
    } catch (e) {
      Logger.error(`Failed to set cache: ${e.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!enableCache) return;

    try {
      if (!this.client) {
        await this.connect();
      }
      await this.client?.del(key);
    } catch (e) {
      Logger.error(`Failed to delete cache: ${e.message}`);
    }
  }
}

export const cacheProvider = CacheProvider.getInstance();
