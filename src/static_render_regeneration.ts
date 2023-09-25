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
        return new Response(Deno.readFileSync(cacheManager.cacheFilePath), {
            headers: options.headers ?? new Headers({}),
        });
    }
    
    const response = await render(request)
    await cacheManager.save(response)
    return response
}
