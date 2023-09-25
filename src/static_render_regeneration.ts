import { CacheManager, generateUUID } from "./cache_manager.ts";

interface StaticRegenerationOptions {
    // The number of milliseconds before the page should be revalidated
    revalidate?: number
    headers?: Headers
}

function getUrl(request: Request) {
    try {
        return new URL(request.url)
    } catch {
        return {
            pathname: request.url,
            search: request.url
        }
    }
}

function readCache(cacheFilePath: string): Uint8Array | null {
    try {
        return Deno.readFileSync(cacheFilePath)
    } catch {
        return null
    }
}

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
