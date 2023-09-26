import { CacheManager } from "./cache_manager.ts";
import { StaticRegenerationOptions } from "./types.ts";
import { getUrl, readCache, generateUUID } from "./utils.ts";

export async function staticRenderRegeneration(request: Request, options: StaticRegenerationOptions, render: (request: Request) => Promise<Response>) {
    // avoid TypeError: Invalid URL at deno:core
    const url = getUrl(request)

    // if more conditions are added, make sure to create a variable to skipCache    
    if (url.pathname === "/favicon.ico") {
        return await render(request);
    }

    const cacheFile = await generateUUID(url.pathname + (url.search ?? ""));
    const cacheManager = new CacheManager(options.revalidate ?? 0, cacheFile);
    if (cacheManager.isCacheValid) {
        const cache = readCache(cacheManager.cacheFilePath)
        if(cache !== null) {
            return new Response(cache, {
                headers: options.headers ?? new Headers({}),
            });
        }
    }
    
    const response = await render(request)
    cacheManager.save(response)

    return response
}
