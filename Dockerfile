FROM denoland/deno:1.44.4@sha256:04336d5b695d51239b48d607987c6424b3201c3b037ad2a1de48cb0a3aa640d5

WORKDIR /app

COPY --chown=10001:10001 deno.json deno.lock main.ts ./
COPY --chown=10001:10001 api ./api
COPY --chown=10001:10001 src ./src

RUN deno cache --lock=deno.lock main.ts && chmod -R a+rX /deno-dir

ENV PORT=8080 DENO_DIR=/tmp/deno-cache
USER 10001:10001
EXPOSE 8080

CMD ["sh", "-c", "mkdir -p \"$DENO_DIR\" && cp -R /deno-dir/. \"$DENO_DIR\"/ && exec deno run --cached-only --lock=deno.lock --allow-env=PORT,GITHUB_TOKEN1,GITHUB_TOKEN2,GITHUB_API,ENV_TYPE,RATE_LIMIT_REDIS_URL,RATE_LIMIT_REDIS_TOKEN,REQUIRE_SHARED_RATE_LIMIT,VERCEL,VERCEL_ENV --allow-net=0.0.0.0:8080,api.github.com:443 --allow-read=/app/.env main.ts"]
