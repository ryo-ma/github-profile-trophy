# Personal deployment security

This fork's live HTTP service is restricted to **BaranaNadil**. The SVG is
public so it can appear on the owner's GitHub profile. It does not authenticate
image viewers. It cannot be used to generate trophies for other usernames.

## Required deployment configuration

Set `GITHUB_TOKEN1` to a personal access token owned by **BaranaNadil**, using
your hosting provider's encrypted environment variables. `GITHUB_TOKEN2` is
optional; if configured, it must belong to the same account. No token means
HTTP 503.

The service authenticates each configured token using GitHub's `GET /user`
endpoint before fetching or serving owner data. An invalid token or a token for
another account fails closed. Successful ownership verification lasts at most
five minutes; token removal or rotation clears the in-process data state on the
next request. Revocation at GitHub is detected at the next verification or
upstream data refresh, rather than instantaneously.

The owner is pinned by `PERSONAL_USERNAME` in `src/security/github.ts`; request
parameters cannot change it. Missing `username` defaults to this owner. Other
usernames return HTTP 403, including when owner data is already cached.

The deployment does not accept GitHub tokens from visitors. Do not place a PAT
in query strings, README image URLs, source files, logs, or browser code. Keep
`.env` local and ignored by Git. Create a token with the minimum permissions
needed for the statistics you want to show; broad write permissions are not
required by this service. Rotate any token that has been exposed.

GitHub Actions' built-in `GITHUB_TOKEN` is an installation token, rather than a
personal user token. The live service requires a user PAT for the ownership
check. The existing offline SVG generator can still run inside a trusted
workflow with its supplied token; it is not an HTTP endpoint.

For GitHub Enterprise, set `GITHUB_API` to the HTTPS GraphQL endpoint, for
example `https://github.example.com/api/graphql`. The ownership check uses the
matching `/api/v3/user` endpoint. URL credentials, query strings, fragments, and
redirects are rejected. The default endpoint is GitHub.com's HTTPS API.

## Application protections

- A global budget allows 60 requests per minute **per running application
  instance**. Excess requests receive HTTP 429 and `Retry-After`. Forwarding
  headers cannot reset this budget, and no per-IP map can grow without bound.
- Only GET and HEAD on `/`, `/api`, and `/api/` are accepted. Oversized URLs,
  bodies, unknown parameters, duplicate scalar parameters, and malformed filters
  are rejected before contacting GitHub.
- Columns are limited to 1-15, or -1 for adaptive width; rows to 1-15; margins
  to 0-30. Title and rank lists, parameter counts, and URL length are bounded.
- There is one owner-data cache entry per instance, valid for 15 minutes. All
  rendering variants share that data. Simultaneous cache misses share one fetch.
  Requests cannot create arbitrary disk or Redis cache keys through this route.
- Upstream failures trigger a 30-second cooldown. Requests during cooldown
  cannot extend it. GitHub rate limits remain HTTP 429 instead of becoming a
  false 404.
- Each GitHub request has a real two-second abort deadline covering both the
  connection and response body. Up to two configured tokens may be tried.
- All HTTP responses use `private, no-store` caching and `nosniff`. The former
  public disk/CDN response-cache path is not used by the live endpoint.

These limits reduce application work and GitHub API consumption. They are not a
complete DDoS defense. Memory state resets on restart and is not shared between
serverless instances or regions.

## Hosting firewall: required for distributed attacks

On Vercel, automatic DDoS mitigation is provided by the platform. Additionally,
use your project's **Firewall** settings to apply a rate-limit rule before
requests reach the function. A reasonable starting point for this personal image
endpoint is 60 requests per minute per source IP, with a short block duration.
Check your plan's available rules and monitor actual image-proxy traffic before
making that rule stricter. Do not base access on a spoofable User-Agent or
Referer.

If you use another host, put equivalent edge protection in front of the origin
and prevent direct access around it. Configure a shared/edge request budget when
you need a limit across all application instances.

After deploying this change, purge any response caches left by the former public
version. Set usage alerts and spending controls available from your host. During
an incident, inspect firewall logs and use temporary blocking or challenge mode
as appropriate; a browser challenge can also prevent image proxies from fetching
the trophy SVG.

Firewall rules, cache purges, and account spending controls are hosting-account
settings. They are not enabled merely by pushing this repository. Do not treat a
successful test run as proof that the live hosting firewall is configured.

Sources:
[GitHub credential security](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure),
[GitHub authenticated user endpoint](https://docs.github.com/en/rest/users/users#get-the-authenticated-user),
[Vercel DDoS mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation),
[Vercel firewall rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Verification

Run `deno task test` for offline tests covering owner enforcement, wrong-account
and missing tokens, rotation, concurrent requests, cache behavior, spoofed
headers, cooldowns, and real upstream request cancellation. Tests use fake
tokens and mocked HTTP responses; they do not validate your deployment's real
PAT.
