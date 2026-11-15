# Deployment

## Vercel settings

1. Import the repository and select the intended branch. Use the repository root
   and the **Other** framework preset. Leave build/install overrides unset.
2. Confirm the account configured by `PERSONAL_USERNAME` in
   `src/security/github.ts`.
3. Add `GITHUB_TOKEN1` as an encrypted environment variable. It must be a
   personal access token for that account. `GITHUB_TOKEN2` is optional for the
   same account.
4. Configure an HTTPS Redis REST service supporting `GET`, `SET`, and `EVAL`,
   then add `RATE_LIMIT_REDIS_URL` and `RATE_LIMIT_REDIS_TOKEN`. Use the
   provider's REST URL and REST credential, not a `redis://` connection string
   or a GitHub token. These settings are required by the hosted API for shared
   limits and caching.
5. Apply the variables to Production and any intended Preview environment, then
   deploy. Redeploy after changing environment variables.

No service is provisioned by the repository. Choose the provider's plan and
usage limits before enabling the shared backend. Keep Redis access restricted to
this service and avoid sharing the database credential with browsers or
visitors.

[vercel.json](./vercel.json) builds the community Deno function and sets
`public/` as the static output directory. Do not override it with the repository
root. Only public assets belong there. Source files and local environment files
are not static assets. The function's maximum duration is 30 seconds to
accommodate bounded source/cache operations; the statistics fetch itself is
capped at six seconds. See the
[runtime documentation](https://github.com/vercel-community/deno).

The API returns HTTP 503 if shared protection is missing or unavailable. Local
memory limits are available through the local server entry point, not as a
fallback for a hosted public function. Provider system variables should remain
enabled so trusted client IP metadata is recognized.

## Verify a deployment

```text
https://YOUR_PROJECT.vercel.app/?theme=tokyonight&column=-1&margin-w=10
```

The `username` parameter is optional and must match the configured account if
provided. The result contains public-only, bounded statistics; private activity
is excluded and some large-account totals may be conservative.

Check normal requests, rather than running a load test against a live
deployment:

| Request                                               | Expected result                                           |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Owner image URL                                       | `200`, SVG content and `Cache-Control: private, no-store` |
| Another username                                      | `403`                                                     |
| Duplicate or invalid parameters                       | `400`                                                     |
| Unsupported method                                    | `405`                                                     |
| Exceeded request budget                               | `429` with `Retry-After`                                  |
| Missing GitHub/Redis settings or unavailable upstream | `503`                                                     |
| `/src/security/github.ts`, `/.env`, `/.git/config`    | `404`                                                     |

Cold concurrent requests may briefly receive `503` if a source refresh does not
finish within the bounded shared-lock wait. Retry after the returned delay.

Validate the selected commit and inspect Vercel's build/runtime logs if a check
fails. Clear old deployment or image-proxy caches when changing privacy policy.
Local tests do not replace a successful hosted build and runtime verification.

## Firewall and usage controls

Configure edge rate-limit rules before requests reach the function. Use the
provider's firewall, usage alerts, and spending controls. A starting point is 60
requests per minute per source IP, adjusted for legitimate image proxies. The
shared application budget does not eliminate volumetric DDoS traffic or all
function invocation charges. See [SECURITY.md](./SECURITY.md).

## Container deployment

Copy `env-example` to `.env`, supply runtime credentials, and run
`docker compose up --build`. Compose exposes only `127.0.0.1:8080`; use a
protected reverse proxy for public access. For any public container deployment
set `REQUIRE_SHARED_RATE_LIMIT=true` and configure the Redis REST settings.

The container restricts network access to its listener and GitHub.com by
default. To use Redis REST or GitHub Enterprise, explicitly add the
corresponding HTTPS host to the container command's Deno `--allow-net` list.
Keep the other permission restrictions. Environment files are supplied at
runtime and excluded from images.
