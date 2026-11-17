import { Card } from "./card.ts";
import { COLORS } from "./theme.ts";
import { UserInfo } from "./user_info.ts";
import { RANK } from "./utils.ts";
import { ServiceError } from "./Types/index.ts";
import { PERSONAL_USERNAME } from "./security/github.ts";
import { LimitDecision, MemoryRateLimiter } from "./security/rate_limit.ts";

type Dependencies = {
  tokens: () => string[];
  verifyTokens: (tokens: string[]) => Promise<void>;
  fetchUser: (
    owner: string,
    tokens: string[],
  ) => Promise<UserInfo | ServiceError>;
  now?: () => number;
  maxRequests?: number;
  windowMs?: number;
  dataTtlMs?: number;
  verificationTtlMs?: number;
  cooldownMs?: number;
  sharedLimit?: (clientKey?: string) => Promise<LimitDecision>;
};

type State = {
  key: string;
  verifiedUntil: number;
  dataUntil: number;
  data?: UserInfo;
  inFlight?: Promise<UserInfo>;
  retryAt: number;
  errorStatus: number;
};

const allowedParameters = new Set([
  "username",
  "theme",
  "column",
  "row",
  "margin-w",
  "margin-h",
  "no-bg",
  "no-frame",
  "title",
  "rank",
]);

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; sandbox",
};

function reply(message: string, status: number, extra: HeadersInit = {}) {
  const responseHeaders = new Headers({
    ...headers,
    "Content-Type": "text/plain; charset=utf-8",
  });
  new Headers(extra).forEach((value, key) => responseHeaders.set(key, value));
  return new Response(message, { status, headers: responseHeaders });
}

function options(url: URL) {
  const p = url.searchParams;
  if ([...p].length > 24) throw new Error("Too many parameters.");
  for (const key of p.keys()) {
    if (!allowedParameters.has(key)) throw new Error("Unsupported parameter.");
    if (key !== "title" && key !== "rank" && p.getAll(key).length > 1) {
      throw new Error("Duplicate parameter.");
    }
  }
  const number = (
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
    adaptive = false,
  ) => {
    const raw = p.get(key);
    if (raw === null) return fallback;
    if (!/^-?\d{1,3}$/.test(raw)) throw new Error("Invalid layout value.");
    const value = Number(raw);
    if (adaptive && value === -1) return value;
    if (value < minimum || value > maximum) {
      throw new Error("Layout value is out of range.");
    }
    return value;
  };
  const boolean = (key: string) => {
    const raw = p.get(key);
    if (raw !== null && raw !== "true" && raw !== "false") {
      throw new Error("Invalid boolean.");
    }
    return raw === "true";
  };
  const list = (key: string) => {
    const values = p.getAll(key).flatMap((value) => value.split(",")).map((
      value,
    ) => value.trim());
    if (
      values.length > 30 || values.some((value) => !value || value.length > 32)
    ) throw new Error("Invalid filter.");
    return values;
  };
  const titles = list("title");
  if (titles.some((value) => !/^-?[A-Za-z][A-Za-z0-9]*$/.test(value))) {
    throw new Error("Invalid title.");
  }
  const ranks = list("rank");
  if (
    ranks.some((value) =>
      !Object.values(RANK).includes(value.replace(/^-/, "") as RANK)
    )
  ) throw new Error("Invalid rank.");
  const theme = p.get("theme") ?? "tokyonight";
  if (!Object.hasOwn(COLORS, theme)) throw new Error("Unknown theme.");
  return {
    titles,
    ranks,
    theme,
    column: number("column", 8, 1, 15, true),
    row: number("row", 3, 1, 15),
    marginWidth: number("margin-w", 0, 0, 30),
    marginHeight: number("margin-h", 0, 0, 30),
    noBackground: boolean("no-bg"),
    noFrame: boolean("no-frame"),
  };
}

/** One bounded data entry and one in-flight load per deployment credential set. */
export function createTrophyHandler(deps: Dependencies) {
  const now = deps.now ?? Date.now;
  const windowMs = deps.windowMs ?? 60_000;
  const maxRequests = deps.maxRequests ?? 60;
  const clientLimit = new MemoryRateLimiter({
    limit: maxRequests,
    windowMs,
    now,
  });
  let state: State | undefined;

  const load = (entry: State, tokens: string[]): Promise<UserInfo> => {
    if (entry.inFlight) return entry.inFlight;
    if (now() < entry.retryAt) {
      return Promise.reject(new Response(null, { status: entry.errorStatus }));
    }
    const promise = (async () => {
      if (tokens.length && now() >= entry.verifiedUntil) {
        await deps.verifyTokens(tokens);
        entry.verifiedUntil = now() + (deps.verificationTtlMs ?? 5 * 60_000);
      }
      if (entry.data && now() < entry.dataUntil) return entry.data;
      const result = await deps.fetchUser(PERSONAL_USERNAME, tokens);
      if (result instanceof ServiceError) throw result;
      entry.data = result;
      entry.dataUntil = now() + (deps.dataTtlMs ?? 15 * 60_000);
      return result;
    })();
    entry.inFlight = promise;
    void promise.catch((error) => {
      entry.data = undefined;
      entry.dataUntil = 0;
      entry.errorStatus = error instanceof ServiceError
        ? error.code
        : error instanceof Response
        ? error.status
        : 503;
      entry.retryAt = now() + (deps.cooldownMs ?? 30_000);
    }).finally(() => {
      entry.inFlight = undefined;
    });
    return promise;
  };

  return async (request: Request, clientKey?: string): Promise<Response> => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return reply("Method not allowed.", 405, { "Allow": "GET, HEAD" });
    }
    if (request.url.length > 2048) {
      return reply("Request URL is too long.", 414);
    }
    if (
      request.body !== null ||
      (request.headers.has("content-length") &&
        request.headers.get("content-length") !== "0")
    ) return reply("Request bodies are not accepted.", 413);
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return reply("Invalid URL.", 400);
    }
    if (!["/", "/api", "/api/", "/api/index"].includes(url.pathname)) {
      return reply("Not found.", 404);
    }
    if (url.searchParams.getAll("username").length > 1) {
      return reply("Duplicate username.", 400);
    }
    const username = url.searchParams.get("username") ?? PERSONAL_USERNAME;
    if (username.toLowerCase() !== PERSONAL_USERNAME.toLowerCase()) {
      return reply("This service only generates trophies for its owner.", 403);
    }
    let layout: ReturnType<typeof options>;
    try {
      layout = options(url);
    } catch {
      return reply("Invalid trophy parameters.", 400);
    }
    const tokens = deps.tokens().filter((token) => !!token);
    if (
      tokens.some((token) => /\s/.test(token) || token.length > 256)
    ) {
      state = undefined;
      return reply(
        "The configured GitHub token is invalid.",
        503,
      );
    }
    // Invalid requests never spend the owner's image allowance. The caller supplies
    // trusted hosting/socket metadata; raw forwarding headers are not read here.
    const localDecision = clientLimit.consume(clientKey);
    if (!localDecision.allowed) {
      return reply("Too many requests.", 429, {
        "Retry-After": String(localDecision.retryAfter),
      });
    }
    if (deps.sharedLimit) {
      try {
        const sharedDecision = await deps.sharedLimit(clientKey);
        if (!sharedDecision.allowed) {
          return reply("Too many requests.", 429, {
            "Retry-After": String(sharedDecision.retryAfter),
          });
        }
      } catch {
        return reply("Shared request limiting is unavailable.", 503, {
          "Retry-After": "30",
        });
      }
    }
    const key = [tokens.length ? "private" : "public", ...tokens].join("\0");
    if (state?.key !== key) {
      state = {
        key,
        verifiedUntil: 0,
        dataUntil: 0,
        retryAt: 0,
        errorStatus: 503,
      };
    }
    const entry = state;
    try {
      const info = await load(entry, tokens);
      const svg = new Card(
        layout.titles,
        layout.ranks,
        layout.column,
        layout.row,
        110,
        layout.marginWidth,
        layout.marginHeight,
        layout.noBackground,
        layout.noFrame,
      )
        .render(info, COLORS[layout.theme]);
      return new Response(request.method === "HEAD" ? null : svg, {
        headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" },
      });
    } catch (error) {
      const status = error instanceof ServiceError
        ? error.code
        : error instanceof Response
        ? error.status
        : 503;
      return reply(
        status === 429
          ? "GitHub request limit reached. Retry later."
          : "Personal trophy data is unavailable.",
        status,
        {
          "Retry-After": String(
            Math.max(1, Math.ceil((entry.retryAt - now()) / 1000)),
          ),
        },
      );
    }
  };
}
